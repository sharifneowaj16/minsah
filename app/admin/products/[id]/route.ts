import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        variants: { orderBy: { id: 'asc' } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Return ALL fields — for admin edit page only
    return NextResponse.json({
      product: {
        // Core
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        shortDescription: product.shortDescription || '',

        // Pricing
        price: product.price.toNumber(),
        compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toNumber() : null,
        costPrice: product.costPrice ? product.costPrice.toNumber() : null,

        // Inventory
        stock: product.quantity,
        quantity: product.quantity,
        lowStockThreshold: product.lowStockThreshold,
        trackInventory: product.trackInventory,
        allowBackorder: product.allowBackorder,

        // Physical
        weight: product.weight ? product.weight.toNumber() : null,
        dimensions: {
          length: product.length ? product.length.toNumber().toString() : '',
          width: product.width ? product.width.toNumber().toString() : '',
          height: product.height ? product.height.toNumber().toString() : '',
        },

        // Status
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        status: !product.isActive ? 'inactive' : product.quantity === 0 ? 'out_of_stock' : 'active',
        featured: product.isFeatured,

        // Category & Brand — return both object and string for compatibility
        category: product.category?.name || '',
        categoryId: product.categoryId || '',
        categorySlug: product.category?.slug || '',
        brand: product.brand?.name || '',
        brandId: product.brandId || '',
        brandSlug: product.brand?.slug || '',

        // Images — full objects with alt text
        images: product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt || '',
          title: img.title || '',
          sortOrder: img.sortOrder,
          isDefault: img.isDefault,
        })),

        // Variants — full objects
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          price: v.price ? v.price.toNumber() : product.price.toNumber(),
          stock: v.quantity,
          quantity: v.quantity,
          attributes: v.attributes || {},
          image: v.image || '',
        })),

        // SEO
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        tags: product.metaKeywords || '',
        metaKeywords: product.metaKeywords || '',
        bengaliName: product.bengaliName || '',
        bengaliDescription: product.bengaliDescription || '',
        focusKeyword: product.focusKeyword || '',
        ogTitle: product.ogTitle || '',
        ogImageUrl: product.ogImageUrl || '',
        canonicalUrl: product.canonicalUrl || '',

        // Structured Data
        condition: product.condition || 'NEW',
        gtin: product.gtin || '',
        averageRating: product.averageRating ? product.averageRating.toNumber() : 0,
        reviewCount: product.reviewCount || 0,

        // Timestamps
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching product (admin):', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
