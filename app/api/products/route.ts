import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

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
  const mainImage =
    sortedImages.find((img) => img.isDefault)?.url ||
    sortedImages[0]?.url ||
    '';
  const imageUrls = sortedImages.map((img) => img.url);

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const status = !product.isActive
    ? 'inactive'
    : product.quantity === 0
    ? 'out_of_stock'
    : 'active';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    // Admin panel can pass activeOnly=false to see all products
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (category) {
      where.category = {
        OR: [
          { name: { equals: category, mode: 'insensitive' } },
          { slug: { equals: toSlug(category) } },
        ],
      };
    }

    if (brand) {
      where.brand = {
        name: { contains: brand, mode: 'insensitive' },
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      where.quantity = { gt: 0 };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { metaKeywords: { contains: search, mode: 'insensitive' } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderByMap: Record<string, any> = {
      name: { name: order },
      price: { price: order },
      createdAt: { createdAt: order },
    };
    const orderBy = orderByMap[sort] ?? { createdAt: 'desc' };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: true,
          brand: true,
          variants: true,
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products: products.map(formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!body.brand?.trim()) {
      return NextResponse.json({ error: 'brand is required' }, { status: 400 });
    }

    // Derive price from first variant or direct field
    const basePrice =
      body.variants?.[0]?.price
        ? parseFloat(body.variants[0].price)
        : body.price
        ? parseFloat(body.price)
        : 0;

    if (basePrice <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    // Calculate total stock from variants
    const totalStock =
      body.variants?.length > 0
        ? (body.variants as Array<{ stock: string }>).reduce(
            (sum, v) => sum + (parseInt(v.stock) || 0),
            0
          )
        : parseInt(body.stock) || 0;

    // Generate unique slug – append timestamp if needed
    const baseSlug = body.urlSlug?.trim() || toSlug(body.name);
    const slug = `${baseSlug}-${Date.now()}`;

    // Use first variant SKU or generate one
    const sku = body.variants?.[0]?.sku?.trim() || `SKU-${Date.now()}`;

    // Find or create Category
    let categoryId: string | undefined;
    if (body.category?.trim()) {
      const categorySlug = toSlug(body.category);
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { name: body.category, slug: categorySlug, isActive: true },
      });
      categoryId = category.id;
    }

    // Find or create Brand
    let brandId: string | undefined;
    if (body.brand?.trim()) {
      const brandSlug = toSlug(body.brand);
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: { name: body.brand, slug: brandSlug, isActive: true },
      });
      brandId = brand.id;
    }

    const isActive = body.status !== 'inactive';
    const isFeatured = body.featured === true || body.featured === 'true';
    const compareAtPrice = body.originalPrice ? parseFloat(body.originalPrice) : null;

    const imagesList: string[] = Array.isArray(body.images) ? body.images : [];
    const variantsList: Array<{
      sku?: string;
      size?: string;
      color?: string;
      price?: string;
      stock?: string;
    }> = Array.isArray(body.variants) ? body.variants : [];

    const product = await prisma.product.create({
      data: {
        sku,
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        shortDescription: body.description
          ? body.description.substring(0, 150)
          : null,
        price: basePrice,
        compareAtPrice,
        quantity: totalStock,
        lowStockThreshold: body.lowStockThreshold ? parseInt(body.lowStockThreshold) : 5,
        isActive,
        isFeatured,
        isNew: true,
        metaTitle: body.metaTitle?.trim() || null,
        metaDescription: body.metaDescription?.trim() || null,
        metaKeywords: body.tags?.trim() || null,
        categoryId,
        brandId,
        images:
          imagesList.length > 0
            ? {
                create: imagesList.map((url, index) => ({
                  url,
                  alt: body.name,
                  sortOrder: index,
                  isDefault: index === 0,
                })),
              }
            : undefined,
        variants:
          variantsList.length > 0
            ? {
                create: variantsList.map((v, index) => ({
                  sku: v.sku?.trim() || `${sku}-${index + 1}`,
                  name:
                    [v.size, v.color].filter(Boolean).join(' / ') ||
                    `Variant ${index + 1}`,
                  price: v.price ? parseFloat(v.price) : null,
                  quantity: parseInt(v.stock || '0') || 0,
                  attributes: {
                    ...(v.size ? { size: v.size } : {}),
                    ...(v.color ? { color: v.color } : {}),
                  },
                })),
              }
            : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        brand: true,
        variants: true,
        reviews: { select: { rating: true } },
      },
    });

    return NextResponse.json(formatProduct(product), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A product with this slug or SKU already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
