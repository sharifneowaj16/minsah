/**
 * Product → Elasticsearch Document Transformer
 *
 * Converts a Prisma Product (with relations) into the shape stored in the
 * "products" ES index.  Keeps a stable mapping so field renames in Prisma
 * don't accidentally break search queries.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal shape we expect from Prisma when transforming */
export interface PrismaProductForES {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription?: string | null;
  price: { toString(): string } | number;
  compareAtPrice: { toString(): string } | number | null;
  quantity: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sku: string;
  metaKeywords?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  category?: { name: string; slug: string; parent?: { name: string; parent?: { name: string } | null } | null } | null;
  brand?: { name: string; slug: string } | null;
  images?: Array<{ url: string; isDefault: boolean; sortOrder: number }>;
  reviews?: Array<{ rating: number }>;
}

/** Shape stored in Elasticsearch */
export interface ESProductDocument {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  isNewArrival: boolean;
  category: string;
  subcategory: string;
  brand: string;
  brandSlug: string;
  images: string[];
  sku: string;
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  discount: number;
  createdAt: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toNumber(value: { toString(): string } | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value.toString()) || 0;
}

function resolveCategoryHierarchy(
  category: PrismaProductForES['category']
): { category: string; subcategory: string } {
  if (!category) return { category: '', subcategory: '' };

  if (category.parent?.parent) {
    // 3rd level: category.parent.parent → top, category.parent → sub
    return {
      category: category.parent.parent.name,
      subcategory: category.parent.name,
    };
  }
  if (category.parent) {
    // 2nd level
    return { category: category.parent.name, subcategory: category.name };
  }
  // 1st level
  return { category: category.name, subcategory: '' };
}

// ─── Main transformer ─────────────────────────────────────────────────────────

export function transformProductToES(product: PrismaProductForES): ESProductDocument {
  const price = toNumber(product.price);
  const compareAtPrice = product.compareAtPrice ? toNumber(product.compareAtPrice) : null;

  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const { category, subcategory } = resolveCategoryHierarchy(product.category ?? null);

  const sortedImages = [...(product.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const images = sortedImages.map((img) => img.url);

  const reviews = product.reviews ?? [];
  const rating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const tags = product.metaKeywords
    ? product.metaKeywords.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const createdAt =
    product.createdAt instanceof Date
      ? product.createdAt.toISOString()
      : String(product.createdAt);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price,
    compareAtPrice,
    inStock: product.quantity > 0 && product.isActive,
    isFeatured: product.isFeatured,
    isFlashSale: false, // extend here when flash-sale flag is added to schema
    isNewArrival: product.isNew,
    category,
    subcategory,
    brand: product.brand?.name ?? '',
    brandSlug: product.brand?.slug ?? '',
    images,
    sku: product.sku,
    tags,
    stock: product.quantity,
    rating,
    reviewCount: reviews.length,
    discount,
    createdAt,
  };
}
