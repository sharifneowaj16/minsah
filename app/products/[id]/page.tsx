// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProductClient from './components/ProductClient';
import ProductStickyHeader from './components/ProductStickyHeader';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchProduct(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/products/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchProduct(id);
  if (!data) return { title: 'Product Not Found' };
  const { product } = data;
  return {
    title: product.metaTitle || `${product.name} | Minsah Beauty`,
    description: product.metaDescription || product.shortDescription,
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.shortDescription,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchProduct(id);

  if (!data?.product) notFound();

  const { product, reviews, rating, relatedProducts } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minsahbeauty.cloud';
  const productUrl = `${baseUrl}/products/${product.id}`;

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Scroll-aware sticky header */}
      <ProductStickyHeader productName={product.name} price={product.price} />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        <nav className="flex items-center gap-1.5 text-xs text-[#8B5E3C]">
          <Link href="/" className="hover:text-[#3D1F0E] transition">হোম</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-[#3D1F0E] transition">
                {product.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#3D1F0E] font-medium line-clamp-1">{product.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto">
        <ProductClient
          product={product}
          reviews={reviews}
          rating={rating}
          relatedProducts={relatedProducts}
          productUrl={productUrl}
        />
      </main>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            sku: product.sku,
            image: product.images,
            brand: { '@type': 'Brand', name: product.brand },
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'BDT',
              availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
            ...(rating.total > 0 && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: rating.average,
                reviewCount: rating.total,
              },
            }),
          }),
        }}
      />
    </div>
  );
}
