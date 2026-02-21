import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { productQueue } from '@/lib/queue/productQueue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatProduct(product: {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: { toNumber: () => number };
  compareAtPrice: { toNumber: () => number } | null;
  quantity: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: Array<{ url: string; isDefault: boolean; sortOrder: number }>;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    price: { toNumber: () => number } | null;
    quantity: number;
    attributes: unknown;
  }>;
  reviews: Array<{ rating: number }>;
}) {
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const mainImage = sortedImages.find((img) => img.isDefault)?.url || sortedImages[0]?.url || '';
  const imageUrls = sortedImages.map((img) => img.url);
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;
  const status = !product.isActive ? 'inactive' : product.quantity === 0 ? 'out_of_stock' : 'active';

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    price: product.price.toNumber(),
    originalPrice: product.compareAtPrice ? product.compareAtPrice.toNumber() : null,
    image: mainImage,
    images: imageUrls,
    sku: product.sku,
    stock: product.quantity,
    category: product.category?.name || '',
    categorySlug: product.category?.slug || '',
    brand: product.brand?.name || '',
    brandSlug: product.brand?.slug || '',
    rating: Math.round(avgRating * 10) / 10,
    reviews: product.reviews.length,
    inStock: product.quantity > 0 && product.isActive,
    status,
    featured: product.isFeatured,
    isNew: product.isNew,
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    tags: product.metaKeywords || '',
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price ? v.price.toNumber() : product.price.toNumber(),
      stock: v.quantity,
      attributes: v.attributes,
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        brand: true,
        variants: true,
        reviews: {
          select: {
            id: true, rating: true, title: true, comment: true,
            isVerified: true, createdAt: true,
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const relatedProducts = product.categoryId
      ? await prisma.product.findMany({
          where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: true, brand: true, variants: true,
            reviews: { select: { rating: true } },
          },
          take: 4,
        })
      : [];

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    product.reviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (star >= 1 && star <= 5) ratingDistribution[star]++;
    });

    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

    return NextResponse.json({
      product: formatProduct({ ...product, reviews: product.reviews.map((r) => ({ rating: r.rating })) }),
      relatedProducts: relatedProducts.map((p) =>
        formatProduct({ ...p, reviews: p.reviews.map((r) => ({ rating: r.rating })) })
      ),
      reviews: product.reviews.map((r) => ({
        id: r.id,
        userName: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || 'Anonymous',
        rating: r.rating,
        title: r.title || '',
        content: r.comment || '',
        verified: r.isVerified,
        createdAt: r.createdAt.toISOString(),
      })),
      rating: {
        average: Math.round(avgRating * 10) / 10,
        total: product.reviews.length,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    let categoryId: string | undefined = existing.categoryId ?? undefined;
    if (body.category?.trim()) {
      const categorySlug = toSlug(body.category);
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { name: body.category, slug: categorySlug, isActive: true },
      });
      categoryId = category.id;
    }

    let brandId: string | undefined = existing.brandId ?? undefined;
    if (body.brand?.trim()) {
      const brandSlug = toSlug(body.brand);
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: { name: body.brand, slug: brandSlug, isActive: true },
      });
      brandId = brand.id;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        description: body.description ?? existing.description,
        price: body.price ? parseFloat(body.price) : existing.price,
        compareAtPrice: body.originalPrice ? parseFloat(body.originalPrice) : existing.compareAtPrice,
        quantity: body.stock !== undefined ? parseInt(body.stock) : existing.quantity,
        lowStockThreshold: body.lowStockThreshold ? parseInt(body.lowStockThreshold) : existing.lowStockThreshold,
        isActive: body.status !== undefined ? body.status !== 'inactive' : existing.isActive,
        isFeatured: body.featured !== undefined ? body.featured === true || body.featured === 'true' : existing.isFeatured,
        // SEO
        metaTitle: body.metaTitle ?? existing.metaTitle,
        metaDescription: body.metaDescription ?? existing.metaDescription,
        metaKeywords: body.tags ?? existing.metaKeywords,
        bengaliName: body.bengaliProductName ?? body.bengaliName ?? existing.bengaliName,
        bengaliDescription: body.bengaliMetaDescription ?? body.bengaliDescription ?? existing.bengaliDescription,
        focusKeyword: body.focusKeyword ?? existing.focusKeyword,
        ogTitle: body.ogTitle ?? existing.ogTitle,
        ogImageUrl: body.ogImageUrl ?? body.ogImagePreview ?? existing.ogImageUrl,
        // Physical
        weight: body.weight !== undefined ? (body.weight ? parseFloat(body.weight) : null) : existing.weight,
        length: body.dimensions?.length !== undefined ? (body.dimensions.length ? parseFloat(body.dimensions.length) : null) : existing.length,
        width: body.dimensions?.width !== undefined ? (body.dimensions.width ? parseFloat(body.dimensions.width) : null) : existing.width,
        height: body.dimensions?.height !== undefined ? (body.dimensions.height ? parseFloat(body.dimensions.height) : null) : existing.height,
        // Structured Data
        condition: body.productCondition ?? body.condition ?? existing.condition,
        gtin: body.gtin ?? existing.gtin,
        // NEW fields
        subcategory: body.subcategory ?? existing.subcategory,
        skinType: Array.isArray(body.skinType) ? body.skinType : existing.skinType,
        ingredients: body.ingredients ?? existing.ingredients,
        shelfLife: body.shelfLife ?? existing.shelfLife,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : existing.expiryDate,
        originCountry: body.originCountry ?? existing.originCountry,
        shippingWeight: body.shippingWeight ?? existing.shippingWeight,
        isFragile: body.isFragile !== undefined ? (body.isFragile === true || body.isFragile === 'true') : existing.isFragile,
        discountPercentage: body.discountPercentage !== undefined ? (body.discountPercentage ? parseFloat(body.discountPercentage) : null) : existing.discountPercentage,
        salePrice: body.salePrice !== undefined ? (body.salePrice ? parseFloat(body.salePrice) : null) : existing.salePrice,
        offerStartDate: body.offerStartDate !== undefined ? (body.offerStartDate ? new Date(body.offerStartDate) : null) : existing.offerStartDate,
        offerEndDate: body.offerEndDate !== undefined ? (body.offerEndDate ? new Date(body.offerEndDate) : null) : existing.offerEndDate,
        flashSaleEligible: body.flashSaleEligible !== undefined ? (body.flashSaleEligible === true || body.flashSaleEligible === 'true') : existing.flashSaleEligible,
        returnEligible: body.returnEligible !== undefined ? body.returnEligible !== false : existing.returnEligible,
        codAvailable: body.codAvailable !== undefined ? body.codAvailable !== false : existing.codAvailable,
        preOrderOption: body.preOrderOption !== undefined ? (body.preOrderOption === true || body.preOrderOption === 'true') : existing.preOrderOption,
        barcode: body.barcode ?? existing.barcode,
        relatedProducts: body.relatedProducts ?? existing.relatedProducts,
        categoryId,
        brandId,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        brand: true,
        variants: true,
        reviews: { select: { rating: true } },
      },
    });

    productQueue.add('index', { type: 'index', productId: updated.id }).catch((err) => {
      console.error('[productQueue] Failed to enqueue index job for', updated.id, err);
    });

    return NextResponse.json(formatProduct(updated));
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    await prisma.product.delete({ where: { id } });

    productQueue.add('delete', { type: 'delete', productId: id }).catch((err) => {
      console.error('[productQueue] Failed to enqueue delete job for', id, err);
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
