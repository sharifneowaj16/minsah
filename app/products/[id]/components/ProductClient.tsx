'use client';

import { useState, useCallback } from 'react';
import { Truck, ShieldCheck, RotateCcw, Smartphone, ChevronDown, ChevronUp, Package } from 'lucide-react';
import ProductGallery from './ProductGallery';
import VariantSelector from './VariantSelector';
import StickyBottomBar from './StickyBottomBar';
import ReviewSection from './ReviewSection';

interface Variant {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string> | null;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  createdAt: string;
}

interface RatingData {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  slug: string;
}

interface ProductClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    originalPrice: number | null;
    image: string;
    images: string[];
    sku: string;
    stock: number;
    category: string;
    brand: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    isNew: boolean;
    ingredients?: string;
    skinType?: string[];
    codAvailable?: boolean;
    returnEligible?: boolean;
    variants: Variant[];
  };
  reviews: Review[];
  rating: RatingData;
  relatedProducts: RelatedProduct[];
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801700000000';

export default function ProductClient({ product, reviews, rating, relatedProducts }: ProductClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.length === 1 ? product.variants[0].id : null
  );
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [expandIngredients, setExpandIngredients] = useState(false);

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const handleVariantChange = useCallback((variantId: string | null, price: number, qty: number) => {
    setSelectedVariantId(variantId);
    setCurrentPrice(price);
    setQuantity(qty);
  }, []);

  const handleAddToCart = useCallback(() => {
    // CartContext integration
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }, []);

  const totalPrice = currentPrice * quantity;

  return (
    <>
      {/* Main layout */}
      <div className="max-w-2xl mx-auto lg:max-w-6xl">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">

          {/* LEFT — Gallery (sticky on desktop) */}
          <div className="lg:sticky lg:top-20">
            <ProductGallery
              images={product.images}
              productName={product.name}
              discountPct={discountPct}
              isNew={product.isNew}
            />
          </div>

          {/* RIGHT — Product Info */}
          <div className="px-4 pt-4 pb-36 lg:pt-0 lg:px-0 lg:pb-8 space-y-5">

            {/* Brand + Category */}
            {(product.brand || product.category) && (
              <div className="flex items-center gap-2">
                {product.brand && (
                  <span className="text-xs bg-[#F5E9DC] text-[#6B4226] px-2.5 py-1 rounded-full font-medium">
                    {product.brand}
                  </span>
                )}
                {product.category && (
                  <span className="text-xs bg-[#F5E9DC] text-[#6B4226] px-2.5 py-1 rounded-full font-medium">
                    {product.category}
                  </span>
                )}
              </div>
            )}

            {/* Name */}
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#1A0D06] leading-tight">
                {product.name}
              </h1>

              {/* Stars */}
              {rating.total > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width="13" height="13" viewBox="0 0 24 24">
                        <path
                          fill={s <= Math.round(rating.average) ? '#F59E0B' : '#E5E7EB'}
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[#1A0D06]">{rating.average.toFixed(1)}</span>
                  <span className="text-sm text-[#8B5E3C]">({rating.total} রিভিউ)</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl md:text-3xl font-semibold text-[#1A0D06]">
                ৳{currentPrice.toLocaleString('bn-BD')}
              </span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-lg text-[#A0856A] line-through">
                  ৳{product.originalPrice.toLocaleString('bn-BD')}
                </span>
              )}
              {discountPct && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {discountPct}% সাশ্রয়
                </span>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                {product.inStock ? `স্টকে আছে (${product.stock}টি)` : 'স্টক শেষ'}
              </span>
            </div>

            {/* Description */}
            {product.shortDescription && (
              <p className="text-sm text-[#4A2C1A] leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Divider */}
            <div className="h-px bg-[#E8D5C0]" />

            {/* Variant Selector */}
            <VariantSelector
              variants={product.variants}
              basePrice={product.price}
              onVariantChange={handleVariantChange}
            />

            {/* Skin Type */}
            {product.skinType && product.skinType.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide mb-2">উপযুক্ত ত্বকের ধরন</p>
                <div className="flex flex-wrap gap-2">
                  {product.skinType.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-[#F5E9DC] text-[#6B4226] text-xs font-medium rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-[#E8D5C0]" />

            {/* Trust Badges */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Truck, label: 'দ্রুত ডেলিভারি', sub: 'সারাদেশে' },
                { icon: ShieldCheck, label: '১০০% অরিজিনাল', sub: 'গ্যারান্টি' },
                { icon: RotateCcw, label: '৭ দিন', sub: 'রিটার্ন' },
                { icon: Smartphone, label: 'bKash / COD', sub: 'পেমেন্ট' },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center p-2.5 bg-[#F5E9DC] rounded-xl"
                >
                  <Icon size={16} className="text-[#3D1F0E] mb-1" />
                  <p className="text-[10px] font-semibold text-[#1A0D06] leading-tight">{label}</p>
                  <p className="text-[9px] text-[#8B5E3C] mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Full Description */}
            {product.description && product.description !== product.shortDescription && (
              <div>
                <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide mb-2">বিস্তারিত</p>
                <p className="text-sm text-[#4A2C1A] leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Ingredients — collapsible */}
            {product.ingredients && (
              <div className="border border-[#E8D5C0] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandIngredients(!expandIngredients)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-[#3D1F0E]" />
                    <span className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide">উপাদান</span>
                  </div>
                  {expandIngredients ? (
                    <ChevronUp size={14} className="text-[#8B5E3C]" />
                  ) : (
                    <ChevronDown size={14} className="text-[#8B5E3C]" />
                  )}
                </button>
                {expandIngredients && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-[#4A2C1A] leading-relaxed">{product.ingredients}</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Section */}
            {rating.total > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide mb-3">কাস্টমার রিভিউ</p>
                <ReviewSection reviews={reviews} rating={rating} />
              </div>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide mb-3">সম্পর্কিত পণ্য</p>
                <div className="grid grid-cols-2 gap-3">
                  {relatedProducts.slice(0, 4).map((rp) => {
                    const rpDiscount =
                      rp.originalPrice && rp.originalPrice > rp.price
                        ? Math.round(((rp.originalPrice - rp.price) / rp.originalPrice) * 100)
                        : null;
                    return (
                      <a
                        key={rp.id}
                        href={`/products/${rp.id}`}
                        className="block bg-[#F5E9DC] rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square relative">
                          <img
                            src={rp.image}
                            alt={rp.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/200x200/F5E9DC/8B5E3C?text=${encodeURIComponent(rp.name.slice(0, 4))}`;
                            }}
                          />
                          {rpDiscount && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              -{rpDiscount}%
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium text-[#1A0D06] line-clamp-2 leading-tight">{rp.name}</p>
                          <p className="text-xs font-semibold text-[#3D1F0E] mt-1">
                            ৳{rp.price.toLocaleString('bn-BD')}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <StickyBottomBar
        productId={product.id}
        productName={product.name}
        productImage={product.image}
        price={totalPrice}
        variantId={selectedVariantId}
        quantity={quantity}
        inStock={product.inStock}
        whatsappNumber={WHATSAPP_NUMBER}
        onAddToCart={handleAddToCart}
        addedToCart={addedToCart}
      />
    </>
  );
}
