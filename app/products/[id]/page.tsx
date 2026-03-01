// 'use client';
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  ChevronRight,
  Shield,
  Users,
  Clock,
  Palette,
  Truck,
  RotateCcw,
  MessageCircle,
  Facebook,
  CheckCircle,
  Sparkles,
  MapPin,
  Package,
} from 'lucide-react';
import { formatPrice } from '@/utils/currency';
import { useCart } from '@/contexts/CartContext';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  quantity: number;
  attributes: Record<string, string> | null;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isDefault: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  averageRating?: number;
  reviewCount?: number;
  ingredients?: string | null;
  skinType?: string[];
}

// ─── Color swatches for hair color products ─────────────────────────────────
const HAIR_COLOR_SWATCHES = [
  { id: '88.0', label: '88.0', hex: '#D4B483', name: 'Blonde' },
  { id: '6.0', label: '6.0', hex: '#7B4F2E', name: 'Light Brown' },
  { id: '4.0', label: '4.0', hex: '#4A2C1A', name: 'Medium Brown' },
  { id: '3.22', label: '3.22', hex: '#3D2314', name: 'Dark Brown' },
  { id: '2.0', label: '2.0', hex: '#2C1810', name: 'Darkest Brown' },
  { id: '1.0', label: '1.0', hex: '#1A0F0A', name: 'Black' },
];

// ─── Mix calculator ──────────────────────────────────────────────────────────
function blendColors(hex1: string, hex2: string): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round((r1 + r2) / 2).toString(16).padStart(2, '0');
  const g = Math.round((g1 + g2) / 2).toString(16).padStart(2, '0');
  const b = Math.round((b1 + b2) / 2).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
      <span className="text-sm font-semibold text-gray-800 ml-0.5">{rating.toFixed(1)}</span>
      <span className="text-sm text-gray-400">({count.toLocaleString()})</span>
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────
interface PackageOption {
  id: string;
  label: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  price: number;
  originalPrice?: number;
  highlight?: boolean;
}

function PackageCard({
  pkg,
  selected,
  qty,
  onSelect,
  onQtyChange,
  onBuyNow,
}: {
  pkg: PackageOption;
  selected: boolean;
  qty: number;
  onSelect: () => void;
  onQtyChange: (delta: number) => void;
  onBuyNow: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border-2 p-3 cursor-pointer transition-all duration-200 ${
        selected
          ? 'border-[#8B4513] bg-[#FFF8F0] shadow-md'
          : 'border-gray-200 bg-white hover:border-[#D4AF37]/50'
      }`}
    >
      {pkg.badge && (
        <div
          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
            pkg.badgeColor || 'bg-[#8B4513] text-white'
          }`}
        >
          {pkg.badge}
        </div>
      )}

      <div className="text-center mb-2">
        <p className="text-xs font-semibold text-gray-700">{pkg.label}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{pkg.subtitle}</p>
        {pkg.originalPrice && (
          <p className="text-[10px] text-gray-400 line-through">{formatPrice(pkg.originalPrice)}</p>
        )}
        <p className={`text-sm font-bold mt-0.5 ${selected ? 'text-[#8B4513]' : 'text-gray-800'}`}>
          {formatPrice(pkg.price)}
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button
          onClick={(e) => { e.stopPropagation(); onQtyChange(-1); }}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
        >
          <Minus size={10} />
        </button>
        <span className="text-sm font-semibold w-5 text-center">{qty}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onQtyChange(1); }}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
        >
          <Plus size={10} />
        </button>
      </div>

      {selected && (
        <button
          onClick={(e) => { e.stopPropagation(); onBuyNow(); }}
          className="w-full py-1.5 rounded-xl text-xs font-bold bg-[#8B4513] text-white hover:bg-[#6B3410] transition-colors"
        >
          Buy Now (WhatsApp)
        </button>
      )}
      {!selected && (
        <div className="w-full py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 text-center">
          Select
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColors, setSelectedColors] = useState<string[]>(['88.0', '3.22']);
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'double' | 'triple'>('double');
  const [quantities, setQuantities] = useState({ single: 1, double: 1, triple: 1 });
  const [addedToCart, setAddedToCart] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('howToUse');

  // ── Fetch product ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const id = params?.id as string;
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) fetchProduct();
  }, [params?.id]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const basePrice = product?.price ?? 399;
  const comparePrice = product?.compareAtPrice;

  const packages: PackageOption[] = [
    {
      id: 'single',
      label: 'Single Color',
      subtitle: 'Basic card',
      price: basePrice,
      originalPrice: comparePrice ?? undefined,
    },
    {
      id: 'double',
      label: 'Two Color Mix',
      subtitle: '',
      badge: '🔥 Most Popular & Best Value',
      badgeColor: 'bg-[#8B4513] text-white',
      price: Math.round(basePrice * 1.12),
      originalPrice: Math.round(basePrice * 1.35),
      highlight: true,
    },
    {
      id: 'triple',
      label: 'Three Color Mix',
      subtitle: '',
      badge: '⭐⭐⭐ Premium Stylist Choice',
      badgeColor: 'bg-amber-500 text-white',
      price: Math.round(basePrice * 1.5),
      originalPrice: Math.round(basePrice * 1.8),
    },
  ];

  const rating = product?.averageRating ?? 4.9;
  const reviewCount = product?.reviewCount ?? 1234;

  const color1 = HAIR_COLOR_SWATCHES.find((c) => c.id === selectedColors[0]);
  const color2 = HAIR_COLOR_SWATCHES.find((c) => c.id === selectedColors[1]);
  const mixedHex = color1 && color2 ? blendColors(color1.hex, color2.hex) : '#8B6540';

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleColorSelect = (colorId: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(colorId)) {
        return prev.filter((c) => c !== colorId);
      }
      if (selectedPackage === 'single') return [colorId];
      if (selectedPackage === 'double') {
        if (prev.length < 2) return [...prev, colorId];
        return [prev[1], colorId];
      }
      if (prev.length < 3) return [...prev, colorId];
      return [prev[1], prev[2], colorId];
    });
  };

  const handleQtyChange = (pkg: 'single' | 'double' | 'triple', delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [pkg]: Math.max(1, prev[pkg] + delta),
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    const qty = quantities[selectedPackage];
    const price = packages.find((p) => p.id === selectedPackage)?.price ?? basePrice;
    addItem({
      id: product.id,
      name: product.name,
      price,
      image: product.images[0]?.url ?? '',
      quantity: qty,
    } as any);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWhatsApp = () => {
    const pkg = packages.find((p) => p.id === selectedPackage);
    const colors = selectedColors.join(' + ');
    const text = encodeURIComponent(
      `আমি অর্ডার করতে চাই:\n\nপণ্য: ${product?.name}\nপ্যাকেজ: ${pkg?.label}\nরঙ: ${colors}\nপরিমাণ: ${quantities[selectedPackage]}\nমূল্য: ৳${pkg?.price}`
    );
    window.open(`https://wa.me/8801700000000?text=${text}`, '_blank');
  };

  const handleFacebookOrder = () => {
    window.open('https://m.me/minsahbeauty', '_blank');
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error ?? 'Product not found'}</p>
          <button onClick={() => router.back()} className="text-[#8B4513] font-semibold underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [{ url: '/placeholder.jpg', alt: product.name, id: '0', sortOrder: 0, isDefault: true }];
  const activeImage = images[activeImageIdx];
  const discountPct = comparePrice ? Math.round(((comparePrice - basePrice) / comparePrice) * 100) : 0;

  const howToUseSteps = [
    { icon: '🥣', title: 'Mix in bowl', desc: 'Mix in a non-metallic bowl' },
    { icon: '💆', title: 'Apply to dry hair', desc: 'Apply to dry hair evenly' },
    { icon: '⏱️', title: '30-40 min wait', desc: 'Wait 30-40 minutes' },
    { icon: '🚿', title: 'Rinse your rinse', desc: 'Rinse thoroughly with water' },
    { icon: '✨', title: 'Condition', desc: 'Apply conditioner after' },
  ];

  const trustBadges = [
    { icon: Shield, label: '100% Original', sub: 'Guarantee' },
    { icon: Users, label: 'Expert', sub: 'Guidance' },
    { icon: RotateCcw, label: '7 Days', sub: 'Easy Return' },
    { icon: Palette, label: 'Color', sub: 'Consultation FREE' },
  ];

  const mockReviews = [
    { name: 'Farida B.', rating: 5, text: 'I recommended customer to use this product and it works great for natural highlights!', avatar: '👩' },
    { name: 'Yasmin S.', rating: 5, text: 'Highly satisfied with the results. The color consultation service was amazing!', avatar: '👩🏽' },
    { name: 'Roksana K.', rating: 4, text: 'Great product, will definitely buy again. Lovely natural look achieved.', avatar: '👩🏻' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-28">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#F0EBE1] px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[#FAF8F5] transition">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-sm font-semibold text-gray-800">Beauty — Product</h1>
        <button onClick={() => router.push('/cart')} className="relative p-1.5 rounded-full hover:bg-[#FAF8F5] transition">
          <ShoppingCart size={20} className="text-gray-700" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── Compact Product Title (under app bar) ─────────────────────────── */}
        <p className="text-[13px] font-medium text-gray-800 leading-snug">
          {product.name}
        </p>

        {/* ── Image Gallery ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F0EBE1]">
          <div className="relative aspect-[4/3] bg-[#FDF9F5]">
            <img
              src={activeImage.url}
              alt={activeImage.alt ?? product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x450/FDF9F5/8B4513?text=${encodeURIComponent(product.name)}`; }}
            />
            {discountPct > 0 && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                -{discountPct}%
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    i === activeImageIdx ? 'border-[#8B4513] shadow-md' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Title & Rating ────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
          <h1 className="text-[15px] font-semibold text-gray-900 leading-snug mb-1">
            {product.name}
          </h1>
          <StarRating rating={rating} count={reviewCount} />
        </div>

        {/* ── Pricing & Package Selection ──────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Pricing</h2>
          <div className="grid grid-cols-3 gap-2">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackage === pkg.id}
                qty={quantities[pkg.id as 'single' | 'double' | 'triple']}
                onSelect={() => setSelectedPackage(pkg.id as any)}
                onQtyChange={(delta) => handleQtyChange(pkg.id as any, delta)}
                onBuyNow={handleWhatsApp}
              />
            ))}
          </div>
        </div>

        {/* ── Color Selector ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Color Selector</h2>
            <button className="flex items-center gap-1 text-xs text-[#8B4513] font-semibold bg-[#FFF3E8] px-2.5 py-1 rounded-full">
              <Sparkles size={11} />
              Virtual Try-On
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {HAIR_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.id}
                onClick={() => handleColorSelect(swatch.id)}
                title={`${swatch.id} – ${swatch.name}`}
                className={`w-10 h-10 rounded-full border-3 transition-all ${
                  selectedColors.includes(swatch.id)
                    ? 'border-[#8B4513] scale-110 shadow-lg ring-2 ring-[#8B4513]/30'
                    : 'border-white shadow-md hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Selected {selectedColors.join(' + ')}
            {selectedPackage === 'single' && ' (1 color)'}
            {selectedPackage === 'double' && ' (up to 2 colors)'}
            {selectedPackage === 'triple' && ' (up to 3 colors)'}
          </p>
        </div>

        {/* ── Art of Mixing ─────────────────────────────────────────────────── */}
        {selectedColors.length >= 2 && color1 && color2 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
            <h2 className="text-sm font-bold text-gray-900 mb-3">The Art of Mixing:</h2>

            {/* Mix visual */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full shadow-md" style={{ backgroundColor: color1.hex }} />
                <span className="text-xs font-semibold text-gray-700">{color1.id}</span>
              </div>
              <Plus size={16} className="text-gray-400" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full shadow-md" style={{ backgroundColor: color2.hex }} />
                <span className="text-xs font-semibold text-gray-700">{color2.id}</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-gray-400 text-lg">=</span>
              <div className="flex gap-1">
                <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: mixedHex }} />
                <div className="w-10 h-10 rounded-full shadow-md opacity-80" style={{ backgroundColor: blendColors(color1.hex, mixedHex) }} />
              </div>
            </div>

            <p className="text-[11px] text-center text-[#8B4513] font-semibold">50% + 50%</p>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { icon: '💎', label: 'Unique Look' },
                { icon: '✨', label: 'Natural Highlights' },
                { icon: '📋', label: 'Professional Results' },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center text-center p-2 bg-[#FAF8F5] rounded-xl">
                  <span className="text-lg mb-1">{b.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-700">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How to Use ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F0EBE1]">
          <button
            onClick={() => setExpandedSection(expandedSection === 'howToUse' ? null : 'howToUse')}
            className="w-full flex items-center justify-between p-4"
          >
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">How to Use</h2>
            <span className="text-xs text-[#8B4513] font-semibold">
              {expandedSection === 'howToUse' ? 'Hide' : 'See all'}
            </span>
          </button>

          {expandedSection === 'howToUse' && (
            <div className="px-4 pb-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {howToUseSteps.map((step, i) => (
                  <div key={i} className="flex-shrink-0 w-20 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-2xl mb-1.5 shadow-sm">
                      {step.icon}
                    </div>
                    <p className="text-[10px] font-semibold text-gray-700 leading-tight">{step.title}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Trust Badges ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
          <div className="grid grid-cols-4 gap-2">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.label} className="flex flex-col items-center text-center p-2 bg-[#FAF8F5] rounded-xl">
                  <Icon size={18} className="text-[#8B4513] mb-1" />
                  <p className="text-[9px] font-bold text-gray-800 leading-tight">{badge.label}</p>
                  <p className="text-[8px] text-gray-500">{badge.sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Delivery Information ──────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Delivery Information</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center p-3 bg-[#FAF8F5] rounded-2xl">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Pathao_logo.svg/200px-Pathao_logo.svg.png"
                alt="Pathao"
                className="h-5 object-contain mb-1.5"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <p className="text-[10px] font-bold text-[#8B4513]">FREE Dhaka Delivery</p>
              <p className="text-[9px] text-gray-500">(24-48h)</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-[#FAF8F5] rounded-2xl">
              <Truck size={16} className="text-blue-600 mb-1" />
              <p className="text-[10px] font-bold text-gray-700">Outside Dhaka</p>
              <p className="text-[10px] font-bold text-[#8B4513]">৳120</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-[#FAF8F5] rounded-2xl">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold text-green-600">Live Tracking</span>
              </div>
              <p className="text-[10px] font-bold text-[#8B4513]">FREE</p>
              <p className="text-[9px] text-gray-500">Nationwide on orders ৳1500+</p>
            </div>
          </div>
        </div>

        {/* ── Customer Reviews ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Customer Reviews</h2>
            <button className="text-xs text-[#8B4513] font-semibold">View All</button>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 bg-[#FAF8F5] rounded-2xl p-3 mb-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#8B4513]">{rating.toFixed(1)}</p>
              <div className="flex gap-0.5 my-1">
                {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />)}
              </div>
              <p className="text-[9px] text-gray-500">{reviewCount.toLocaleString()} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = star === 5 ? 78 : star === 4 ? 15 : star === 3 ? 5 : star === 2 ? 1 : 1;
                return (
                  <div key={star} className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-500 w-2">{star}</span>
                    <Star size={8} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 w-6 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual reviews */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {mockReviews.map((review, i) => (
              <div key={i} className="flex-shrink-0 w-52 bg-[#FAF8F5] rounded-2xl p-3">
                <div className="flex gap-0.5 mb-2">
                  {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />)}
                </div>
                <p className="text-[11px] text-gray-700 leading-relaxed line-clamp-3">{review.text}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-base">{review.avatar}</span>
                  <div>
                    <p className="text-[10px] font-bold text-gray-800">{review.name}</p>
                    <div className="flex items-center gap-0.5">
                      <CheckCircle size={8} className="text-green-500" />
                      <span className="text-[9px] text-green-600">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ingredients ────────────────────────────────────────────────────── */}
        {product.ingredients && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F0EBE1]">
            <button
              onClick={() => setExpandedSection(expandedSection === 'ingredients' ? null : 'ingredients')}
              className="w-full flex items-center justify-between p-4"
            >
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Ingredients</h2>
              <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandedSection === 'ingredients' ? 'rotate-90' : ''}`} />
            </button>
            {expandedSection === 'ingredients' && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-600 leading-relaxed">{product.ingredients}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Skin Type ──────────────────────────────────────────────────────── */}
        {product.skinType && product.skinType.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Suitable For</h2>
            <div className="flex flex-wrap gap-2">
              {product.skinType.map((type) => (
                <span key={type} className="px-3 py-1 bg-[#FFF3E8] text-[#8B4513] text-xs font-semibold rounded-full">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Sticky Bottom Bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0EBE1] shadow-2xl">
        {/* Summary row */}
        <div className="flex items-center gap-3 px-4 pt-2 pb-1 max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 flex-1">
            {selectedColors.map((c, i) => {
              const sw = HAIR_COLOR_SWATCHES.find((s) => s.id === c);
              return sw ? (
                <div key={i} className="flex items-center gap-0.5">
                  {i > 0 && <span className="text-gray-400 text-xs">+</span>}
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: sw.hex }} />
                  <span className="text-[10px] font-semibold text-gray-700">{sw.id}</span>
                </div>
              ) : null;
            })}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#8B4513]">
              ৳{packages.find((p) => p.id === selectedPackage)?.price}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 px-4 pb-3 max-w-lg mx-auto">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/30"
          >
            <MessageCircle size={16} />
            WhatsApp Order
          </button>
          <button
            onClick={handleFacebookOrder}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1877F2] text-white font-bold text-sm hover:bg-[#1565D8] active:scale-95 transition-all shadow-lg shadow-blue-500/30"
          >
            <Facebook size={16} />
            Facebook Order
          </button>
        </div>
      </div>
    </div>
  );
}
// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import {
//   ArrowLeft,
//   ShoppingCart,
//   Star,
//   Minus,
//   Plus,
//   ChevronRight,
//   Shield,
//   Users,
//   Clock,
//   Palette,
//   Truck,
//   RotateCcw,
//   MessageCircle,
//   Facebook,
//   CheckCircle,
//   Sparkles,
//   MapPin,
//   Package,
// } from 'lucide-react';
// import { formatPrice } from '@/utils/currency';
// import { useCart } from '@/contexts/CartContext';

// // ─── Types ─────────────────────────────────────────────────────────────────

// interface ProductVariant {
//   id: string;
//   name: string;
//   sku: string;
//   price: number | null;
//   quantity: number;
//   attributes: Record<string, string> | null;
// }

// interface ProductImage {
//   id: string;
//   url: string;
//   alt: string | null;
//   sortOrder: number;
//   isDefault: boolean;
// }

// interface Product {
//   id: string;
//   name: string;
//   slug: string;
//   description: string | null;
//   shortDescription: string | null;
//   price: number;
//   compareAtPrice: number | null;
//   quantity: number;
//   isActive: boolean;
//   isFeatured: boolean;
//   images: ProductImage[];
//   variants: ProductVariant[];
//   category: { name: string; slug: string } | null;
//   brand: { name: string; slug: string } | null;
//   averageRating?: number;
//   reviewCount?: number;
//   ingredients?: string | null;
//   skinType?: string[];
// }

// // ─── Color swatches for hair color products ─────────────────────────────────
// const HAIR_COLOR_SWATCHES = [
//   { id: '88.0', label: '88.0', hex: '#D4B483', name: 'Blonde' },
//   { id: '6.0', label: '6.0', hex: '#7B4F2E', name: 'Light Brown' },
//   { id: '4.0', label: '4.0', hex: '#4A2C1A', name: 'Medium Brown' },
//   { id: '3.22', label: '3.22', hex: '#3D2314', name: 'Dark Brown' },
//   { id: '2.0', label: '2.0', hex: '#2C1810', name: 'Darkest Brown' },
//   { id: '1.0', label: '1.0', hex: '#1A0F0A', name: 'Black' },
// ];

// // ─── Mix calculator ──────────────────────────────────────────────────────────
// function blendColors(hex1: string, hex2: string): string {
//   const r1 = parseInt(hex1.slice(1, 3), 16);
//   const g1 = parseInt(hex1.slice(3, 5), 16);
//   const b1 = parseInt(hex1.slice(5, 7), 16);
//   const r2 = parseInt(hex2.slice(1, 3), 16);
//   const g2 = parseInt(hex2.slice(3, 5), 16);
//   const b2 = parseInt(hex2.slice(5, 7), 16);
//   const r = Math.round((r1 + r2) / 2).toString(16).padStart(2, '0');
//   const g = Math.round((g1 + g2) / 2).toString(16).padStart(2, '0');
//   const b = Math.round((b1 + b2) / 2).toString(16).padStart(2, '0');
//   return `#${r}${g}${b}`;
// }

// // ─── Star Rating ─────────────────────────────────────────────────────────────
// function StarRating({ rating, count }: { rating: number; count: number }) {
//   return (
//     <div className="flex items-center gap-1.5">
//       {[1, 2, 3, 4, 5].map((s) => (
//         <Star
//           key={s}
//           size={14}
//           className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
//         />
//       ))}
//       <span className="text-sm font-semibold text-gray-800 ml-0.5">{rating.toFixed(1)}</span>
//       <span className="text-sm text-gray-400">({count.toLocaleString()})</span>
//     </div>
//   );
// }

// // ─── Package Card ─────────────────────────────────────────────────────────────
// interface PackageOption {
//   id: string;
//   label: string;
//   subtitle: string;
//   badge?: string;
//   badgeColor?: string;
//   price: number;
//   originalPrice?: number;
//   highlight?: boolean;
// }

// function PackageCard({
//   pkg,
//   selected,
//   qty,
//   onSelect,
//   onQtyChange,
//   onBuyNow,
// }: {
//   pkg: PackageOption;
//   selected: boolean;
//   qty: number;
//   onSelect: () => void;
//   onQtyChange: (delta: number) => void;
//   onBuyNow: () => void;
// }) {
//   return (
//     <div
//       onClick={onSelect}
//       className={`relative rounded-2xl border-2 p-3 cursor-pointer transition-all duration-200 ${
//         selected
//           ? 'border-[#8B4513] bg-[#FFF8F0] shadow-md'
//           : 'border-gray-200 bg-white hover:border-[#D4AF37]/50'
//       }`}
//     >
//       {pkg.badge && (
//         <div
//           className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
//             pkg.badgeColor || 'bg-[#8B4513] text-white'
//           }`}
//         >
//           {pkg.badge}
//         </div>
//       )}

//       <div className="text-center mb-2">
//         <p className="text-xs font-semibold text-gray-700">{pkg.label}</p>
//         <p className="text-[11px] text-gray-500 mt-0.5">{pkg.subtitle}</p>
//         {pkg.originalPrice && (
//           <p className="text-[10px] text-gray-400 line-through">{formatPrice(pkg.originalPrice)}</p>
//         )}
//         <p className={`text-sm font-bold mt-0.5 ${selected ? 'text-[#8B4513]' : 'text-gray-800'}`}>
//           {formatPrice(pkg.price)}
//         </p>
//       </div>

//       {/* Qty controls */}
//       <div className="flex items-center justify-center gap-2 mb-2">
//         <button
//           onClick={(e) => { e.stopPropagation(); onQtyChange(-1); }}
//           className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
//         >
//           <Minus size={10} />
//         </button>
//         <span className="text-sm font-semibold w-5 text-center">{qty}</span>
//         <button
//           onClick={(e) => { e.stopPropagation(); onQtyChange(1); }}
//           className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
//         >
//           <Plus size={10} />
//         </button>
//       </div>

//       {selected && (
//         <button
//           onClick={(e) => { e.stopPropagation(); onBuyNow(); }}
//           className="w-full py-1.5 rounded-xl text-xs font-bold bg-[#8B4513] text-white hover:bg-[#6B3410] transition-colors"
//         >
//           Buy Now (WhatsApp)
//         </button>
//       )}
//       {!selected && (
//         <div className="w-full py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 text-center">
//           Select
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function ProductDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { addItem } = useCart();

//   const [product, setProduct] = useState<Product | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [activeImageIdx, setActiveImageIdx] = useState(0);
//   const [selectedColors, setSelectedColors] = useState<string[]>(['88.0', '3.22']);
//   const [selectedPackage, setSelectedPackage] = useState<'single' | 'double' | 'triple'>('double');
//   const [quantities, setQuantities] = useState({ single: 1, double: 1, triple: 1 });
//   const [addedToCart, setAddedToCart] = useState(false);
//   const [expandedSection, setExpandedSection] = useState<string | null>('howToUse');

//   // ── Fetch product ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         setLoading(true);
//         const id = params?.id as string;
//         const res = await fetch(`/api/products/${id}`);
//         if (!res.ok) throw new Error('Product not found');
//         const data = await res.json();
//         setProduct(data.product);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to load product');
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (params?.id) fetchProduct();
//   }, [params?.id]);

//   // ── Derived values ─────────────────────────────────────────────────────────
//   const basePrice = product?.price ?? 399;
//   const comparePrice = product?.compareAtPrice;

//   const packages: PackageOption[] = [
//     {
//       id: 'single',
//       label: 'Single Color',
//       subtitle: 'Basic card',
//       price: basePrice,
//       originalPrice: comparePrice ?? undefined,
//     },
//     {
//       id: 'double',
//       label: 'Two Color Mix',
//       subtitle: '',
//       badge: '🔥 Most Popular & Best Value',
//       badgeColor: 'bg-[#8B4513] text-white',
//       price: Math.round(basePrice * 1.12),
//       originalPrice: Math.round(basePrice * 1.35),
//       highlight: true,
//     },
//     {
//       id: 'triple',
//       label: 'Three Color Mix',
//       subtitle: '',
//       badge: '⭐⭐⭐ Premium Stylist Choice',
//       badgeColor: 'bg-amber-500 text-white',
//       price: Math.round(basePrice * 1.5),
//       originalPrice: Math.round(basePrice * 1.8),
//     },
//   ];

//   const rating = product?.averageRating ?? 4.9;
//   const reviewCount = product?.reviewCount ?? 1234;

//   const color1 = HAIR_COLOR_SWATCHES.find((c) => c.id === selectedColors[0]);
//   const color2 = HAIR_COLOR_SWATCHES.find((c) => c.id === selectedColors[1]);
//   const mixedHex = color1 && color2 ? blendColors(color1.hex, color2.hex) : '#8B6540';

//   // ── Handlers ──────────────────────────────────────────────────────────────
//   const handleColorSelect = (colorId: string) => {
//     setSelectedColors((prev) => {
//       if (prev.includes(colorId)) {
//         return prev.filter((c) => c !== colorId);
//       }
//       if (selectedPackage === 'single') return [colorId];
//       if (selectedPackage === 'double') {
//         if (prev.length < 2) return [...prev, colorId];
//         return [prev[1], colorId];
//       }
//       if (prev.length < 3) return [...prev, colorId];
//       return [prev[1], prev[2], colorId];
//     });
//   };

//   const handleQtyChange = (pkg: 'single' | 'double' | 'triple', delta: number) => {
//     setQuantities((prev) => ({
//       ...prev,
//       [pkg]: Math.max(1, prev[pkg] + delta),
//     }));
//   };

//   const handleAddToCart = () => {
//     if (!product) return;
//     const qty = quantities[selectedPackage];
//     const price = packages.find((p) => p.id === selectedPackage)?.price ?? basePrice;
//     addItem({
//       id: product.id,
//       name: product.name,
//       price,
//       image: product.images[0]?.url ?? '',
//       quantity: qty,
//     } as any);
//     setAddedToCart(true);
//     setTimeout(() => setAddedToCart(false), 2000);
//   };

//   const handleWhatsApp = () => {
//     const pkg = packages.find((p) => p.id === selectedPackage);
//     const colors = selectedColors.join(' + ');
//     const text = encodeURIComponent(
//       `আমি অর্ডার করতে চাই:\n\nপণ্য: ${product?.name}\nপ্যাকেজ: ${pkg?.label}\nরঙ: ${colors}\nপরিমাণ: ${quantities[selectedPackage]}\nমূল্য: ৳${pkg?.price}`
//     );
//     window.open(`https://wa.me/8801700000000?text=${text}`, '_blank');
//   };

//   const handleFacebookOrder = () => {
//     window.open('https://m.me/minsahbeauty', '_blank');
//   };

//   // ── Loading / Error ────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-10 h-10 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin" />
//           <p className="text-sm text-gray-500">Loading product...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
//         <div className="text-center">
//           <p className="text-gray-600 mb-4">{error ?? 'Product not found'}</p>
//           <button onClick={() => router.back()} className="text-[#8B4513] font-semibold underline">
//             Go back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const images = product.images.length > 0 ? product.images : [{ url: '/placeholder.jpg', alt: product.name, id: '0', sortOrder: 0, isDefault: true }];
//   const activeImage = images[activeImageIdx];
//   const discountPct = comparePrice ? Math.round(((comparePrice - basePrice) / comparePrice) * 100) : 0;

//   const howToUseSteps = [
//     { icon: '🥣', title: 'Mix in bowl', desc: 'Mix in a non-metallic bowl' },
//     { icon: '💆', title: 'Apply to dry hair', desc: 'Apply to dry hair evenly' },
//     { icon: '⏱️', title: '30-40 min wait', desc: 'Wait 30-40 minutes' },
//     { icon: '🚿', title: 'Rinse your rinse', desc: 'Rinse thoroughly with water' },
//     { icon: '✨', title: 'Condition', desc: 'Apply conditioner after' },
//   ];

//   const trustBadges = [
//     { icon: Shield, label: '100% Original', sub: 'Guarantee' },
//     { icon: Users, label: 'Expert', sub: 'Guidance' },
//     { icon: RotateCcw, label: '7 Days', sub: 'Easy Return' },
//     { icon: Palette, label: 'Color', sub: 'Consultation FREE' },
//   ];

//   const mockReviews = [
//     { name: 'Farida B.', rating: 5, text: 'I recommended customer to use this product and it works great for natural highlights!', avatar: '👩' },
//     { name: 'Yasmin S.', rating: 5, text: 'Highly satisfied with the results. The color consultation service was amazing!', avatar: '👩🏽' },
//     { name: 'Roksana K.', rating: 4, text: 'Great product, will definitely buy again. Lovely natural look achieved.', avatar: '👩🏻' },
//   ];

//   return (
//     <div className="min-h-screen bg-[#FAF8F5] pb-28">

//       {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
//       <div className="sticky top-0 z-50 bg-white border-b border-[#F0EBE1] px-4 py-3 flex items-center justify-between shadow-sm">
//         <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[#FAF8F5] transition">
//           <ArrowLeft size={20} className="text-gray-700" />
//         </button>
//         <h1 className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
//           {product.brand?.name ?? 'Beauty'} — {product.category?.name ?? 'Product'}
//         </h1>
//         <button onClick={() => router.push('/cart')} className="relative p-1.5 rounded-full hover:bg-[#FAF8F5] transition">
//           <ShoppingCart size={20} className="text-gray-700" />
//         </button>
//       </div>

//       <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

//         {/* ── Image Gallery ────────────────────────────────────────────────── */}
//         <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F0EBE1]">
//           <div className="relative aspect-[4/3] bg-[#FDF9F5]">
//             <img
//               src={activeImage.url}
//               alt={activeImage.alt ?? product.name}
//               className="w-full h-full object-cover"
//               onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x450/FDF9F5/8B4513?text=${encodeURIComponent(product.name)}`; }}
//             />
//             {discountPct > 0 && (
//               <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
//                 -{discountPct}%
//               </div>
//             )}
//           </div>

//           {/* Thumbnails */}
//           {images.length > 1 && (
//             <div className="flex gap-2 p-3 overflow-x-auto">
//               {images.map((img, i) => (
//                 <button
//                   key={img.id}
//                   onClick={() => setActiveImageIdx(i)}
//                   className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
//                     i === activeImageIdx ? 'border-[#8B4513] shadow-md' : 'border-transparent'
//                   }`}
//                 >
//                   <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* ── Product Title & Rating ────────────────────────────────────────── */}
//         <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//           <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">{product.name}</h1>
//           <StarRating rating={rating} count={reviewCount} />
//           {product.description && (
//             <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">{product.description}</p>
//           )}
//         </div>

//         {/* ── Pricing & Package Selection ──────────────────────────────────── */}
//         <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//           <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Pricing</h2>
//           <div className="grid grid-cols-3 gap-2">
//             {packages.map((pkg) => (
//               <PackageCard
//                 key={pkg.id}
//                 pkg={pkg}
//                 selected={selectedPackage === pkg.id}
//                 qty={quantities[pkg.id as 'single' | 'double' | 'triple']}
//                 onSelect={() => setSelectedPackage(pkg.id as any)}
//                 onQtyChange={(delta) => handleQtyChange(pkg.id as any, delta)}
//                 onBuyNow={handleWhatsApp}
//               />
//             ))}
//           </div>
//         </div>

//         {/* ── Color Selector ────────────────────────────────────────────────── */}
//         <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Color Selector</h2>
//             <button className="flex items-center gap-1 text-xs text-[#8B4513] font-semibold bg-[#FFF3E8] px-2.5 py-1 rounded-full">
//               <Sparkles size={11} />
//               Virtual Try-On
//             </button>
//           </div>

//           <div className="flex gap-2 flex-wrap">
//             {HAIR_COLOR_SWATCHES.map((swatch) => (
//               <button
//                 key={swatch.id}
//                 onClick={() => handleColorSelect(swatch.id)}
//                 title={`${swatch.id} – ${swatch.name}`}
//                 className={`w-10 h-10 rounded-full border-3 transition-all ${
//                   selectedColors.includes(swatch.id)
//                     ? 'border-[#8B4513] scale-110 shadow-lg ring-2 ring-[#8B4513]/30'
//                     : 'border-white shadow-md hover:scale-105'
//                 }`}
//                 style={{ backgroundColor: swatch.hex }}
//               />
//             ))}
//           </div>

//           <p className="text-xs text-gray-500 mt-2">
//             Selected: {selectedColors.join(' + ')}
//             {selectedPackage === 'single' && ' (1 color)'}
//             {selectedPackage === 'double' && ' (up to 2 colors)'}
//             {selectedPackage === 'triple' && ' (up to 3 colors)'}
//           </p>
//         </div>

//         {/* ── Art of Mixing ─────────────────────────────────────────────────── */}
//         {selectedColors.length >= 2 && color1 && color2 && (
//           <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//             <h2 className="text-sm font-bold text-gray-900 mb-3">The Art of Mixing:</h2>

//             {/* Mix visual */}
//             <div className="flex items-center justify-center gap-3 mb-4">
//               <div className="flex flex-col items-center gap-1">
//                 <div className="w-12 h-12 rounded-full shadow-md" style={{ backgroundColor: color1.hex }} />
//                 <span className="text-xs font-semibold text-gray-700">{color1.id}</span>
//               </div>
//               <Plus size={16} className="text-gray-400" />
//               <div className="flex flex-col items-center gap-1">
//                 <div className="w-12 h-12 rounded-full shadow-md" style={{ backgroundColor: color2.hex }} />
//                 <span className="text-xs font-semibold text-gray-700">{color2.id}</span>
//               </div>
//               <ChevronRight size={16} className="text-gray-400" />
//               <span className="text-gray-400 text-lg">=</span>
//               <div className="flex gap-1">
//                 <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: mixedHex }} />
//                 <div className="w-10 h-10 rounded-full shadow-md opacity-80" style={{ backgroundColor: blendColors(color1.hex, mixedHex) }} />
//               </div>
//             </div>

//             <p className="text-[11px] text-center text-[#8B4513] font-semibold">50% + 50%</p>

//             {/* Benefits */}
//             <div className="grid grid-cols-3 gap-2 mt-3">
//               {[
//                 { icon: '💎', label: 'Unique Look' },
//                 { icon: '✨', label: 'Natural Highlights' },
//                 { icon: '📋', label: 'Professional Results' },
//               ].map((b) => (
//                 <div key={b.label} className="flex flex-col items-center text-center p-2 bg-[#FAF8F5] rounded-xl">
//                   <span className="text-lg mb-1">{b.icon}</span>
//                   <span className="text-[10px] font-semibold text-gray-700">{b.label}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ── How to Use ────────────────────────────────────────────────────── */}
//         <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F0EBE1]">
//           <button
//             onClick={() => setExpandedSection(expandedSection === 'howToUse' ? null : 'howToUse')}
//             className="w-full flex items-center justify-between p-4"
//           >
//             <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">How to Use</h2>
//             <span className="text-xs text-[#8B4513] font-semibold">
//               {expandedSection === 'howToUse' ? 'Hide' : 'See all'}
//             </span>
//           </button>

//           {expandedSection === 'howToUse' && (
//             <div className="px-4 pb-4">
//               <div className="flex gap-3 overflow-x-auto pb-2">
//                 {howToUseSteps.map((step, i) => (
//                   <div key={i} className="flex-shrink-0 w-20 flex flex-col items-center text-center">
//                     <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-2xl mb-1.5 shadow-sm">
//                       {step.icon}
//                     </div>
//                     <p className="text-[10px] font-semibold text-gray-700 leading-tight">{step.title}</p>
//                     <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{step.desc}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ── Trust Badges ──────────────────────────────────────────────────── */}
//         <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//           <div className="grid grid-cols-4 gap-2">
//             {trustBadges.map((badge) => {
//               const Icon = badge.icon;
//               return (
//                 <div key={badge.label} className="flex flex-col items-center text-center p-2 bg-[#FAF8F5] rounded-xl">
//                   <Icon size={18} className="text-[#8B4513] mb-1" />
//                   <p className="text-[9px] font-bold text-gray-800 leading-tight">{badge.label}</p>
//                   <p className="text-[8px] text-gray-500">{badge.sub}</p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* ── Delivery Information ──────────────────────────────────────────── */}
//         <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//           <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Delivery Information</h2>
//           <div className="grid grid-cols-3 gap-3">
//             <div className="flex flex-col items-center text-center p-3 bg-[#FAF8F5] rounded-2xl">
//               <img
//                 src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Pathao_logo.svg/200px-Pathao_logo.svg.png"
//                 alt="Pathao"
//                 className="h-5 object-contain mb-1.5"
//                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
//               />
//               <p className="text-[10px] font-bold text-[#8B4513]">FREE Dhaka Delivery</p>
//               <p className="text-[9px] text-gray-500">(24-48h)</p>
//             </div>
//             <div className="flex flex-col items-center text-center p-3 bg-[#FAF8F5] rounded-2xl">
//               <Truck size={16} className="text-blue-600 mb-1" />
//               <p className="text-[10px] font-bold text-gray-700">Outside Dhaka</p>
//               <p className="text-[10px] font-bold text-[#8B4513]">৳120</p>
//             </div>
//             <div className="flex flex-col items-center text-center p-3 bg-[#FAF8F5] rounded-2xl">
//               <div className="flex items-center gap-1 mb-1">
//                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
//                 <span className="text-[9px] font-bold text-green-600">Live Tracking</span>
//               </div>
//               <p className="text-[10px] font-bold text-[#8B4513]">FREE</p>
//               <p className="text-[9px] text-gray-500">Nationwide on orders ৳1500+</p>
//             </div>
//           </div>
//         </div>

//         {/* ── Customer Reviews ──────────────────────────────────────────────── */}
//         <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Customer Reviews</h2>
//             <button className="text-xs text-[#8B4513] font-semibold">View All</button>
//           </div>

//           {/* Summary */}
//           <div className="flex items-center gap-4 bg-[#FAF8F5] rounded-2xl p-3 mb-3">
//             <div className="text-center">
//               <p className="text-3xl font-bold text-[#8B4513]">{rating.toFixed(1)}</p>
//               <div className="flex gap-0.5 my-1">
//                 {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />)}
//               </div>
//               <p className="text-[9px] text-gray-500">{reviewCount.toLocaleString()} reviews</p>
//             </div>
//             <div className="flex-1 space-y-1">
//               {[5, 4, 3, 2, 1].map((star) => {
//                 const pct = star === 5 ? 78 : star === 4 ? 15 : star === 3 ? 5 : star === 2 ? 1 : 1;
//                 return (
//                   <div key={star} className="flex items-center gap-1.5">
//                     <span className="text-[9px] text-gray-500 w-2">{star}</span>
//                     <Star size={8} className="fill-amber-400 text-amber-400 flex-shrink-0" />
//                     <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
//                       <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
//                     </div>
//                     <span className="text-[9px] text-gray-400 w-6 text-right">{pct}%</span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Individual reviews */}
//           <div className="flex gap-3 overflow-x-auto pb-1">
//             {mockReviews.map((review, i) => (
//               <div key={i} className="flex-shrink-0 w-52 bg-[#FAF8F5] rounded-2xl p-3">
//                 <div className="flex gap-0.5 mb-2">
//                   {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />)}
//                 </div>
//                 <p className="text-[11px] text-gray-700 leading-relaxed line-clamp-3">{review.text}</p>
//                 <div className="flex items-center gap-1.5 mt-2">
//                   <span className="text-base">{review.avatar}</span>
//                   <div>
//                     <p className="text-[10px] font-bold text-gray-800">{review.name}</p>
//                     <div className="flex items-center gap-0.5">
//                       <CheckCircle size={8} className="text-green-500" />
//                       <span className="text-[9px] text-green-600">Verified</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── Ingredients ────────────────────────────────────────────────────── */}
//         {product.ingredients && (
//           <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F0EBE1]">
//             <button
//               onClick={() => setExpandedSection(expandedSection === 'ingredients' ? null : 'ingredients')}
//               className="w-full flex items-center justify-between p-4"
//             >
//               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Ingredients</h2>
//               <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandedSection === 'ingredients' ? 'rotate-90' : ''}`} />
//             </button>
//             {expandedSection === 'ingredients' && (
//               <div className="px-4 pb-4">
//                 <p className="text-xs text-gray-600 leading-relaxed">{product.ingredients}</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── Skin Type ──────────────────────────────────────────────────────── */}
//         {product.skinType && product.skinType.length > 0 && (
//           <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EBE1]">
//             <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Suitable For</h2>
//             <div className="flex flex-wrap gap-2">
//               {product.skinType.map((type) => (
//                 <span key={type} className="px-3 py-1 bg-[#FFF3E8] text-[#8B4513] text-xs font-semibold rounded-full">
//                   {type}
//                 </span>
//               ))}
//             </div>
//           </div>
//         )}

//       </div>

//       {/* ── Sticky Bottom Bar ─────────────────────────────────────────────────── */}
//       <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0EBE1] shadow-2xl">
//         {/* Summary row */}
//         <div className="flex items-center gap-3 px-4 pt-2 pb-1 max-w-lg mx-auto">
//           <div className="flex items-center gap-1.5 flex-1">
//             {selectedColors.map((c, i) => {
//               const sw = HAIR_COLOR_SWATCHES.find((s) => s.id === c);
//               return sw ? (
//                 <div key={i} className="flex items-center gap-0.5">
//                   {i > 0 && <span className="text-gray-400 text-xs">+</span>}
//                   <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: sw.hex }} />
//                   <span className="text-[10px] font-semibold text-gray-700">{sw.id}</span>
//                 </div>
//               ) : null;
//             })}
//           </div>
//           <div className="text-right">
//             <p className="text-lg font-bold text-[#8B4513]">
//               ৳{packages.find((p) => p.id === selectedPackage)?.price}
//             </p>
//           </div>
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-2 px-4 pb-3 max-w-lg mx-auto">
//           <button
//             onClick={handleWhatsApp}
//             className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/30"
//           >
//             <MessageCircle size={16} />
//             WhatsApp Order
//           </button>
//           <button
//             onClick={handleFacebookOrder}
//             className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1877F2] text-white font-bold text-sm hover:bg-[#1565D8] active:scale-95 transition-all shadow-lg shadow-blue-500/30"
//           >
//             <Facebook size={16} />
//             Facebook Order
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// claude 
// // 'use client';

// // import { useParams } from 'next/navigation';
// // import { useState } from 'react';
// // import Navbar from '../../components/Header';
// // import TopBar from '../../components/TopBar';
// // import Footer from '../../components/Footer';
// // import Link from 'next/link';
// // import { ShoppingCart, Heart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCcw, Sparkles } from 'lucide-react';
// // import { formatPrice } from '@/utils/currency';
// // import { useProducts } from '@/contexts/ProductsContext';
// // import { useCart } from '@/contexts/CartContext';

// // // Dummy Color Swatches for the UI (Can be fetched from DB later)
// // const COLOR_SWATCHES = [
// //   { id: '88.0', hex: '#D7C4B1', name: 'Intense Light Blonde' },
// //   { id: '3.22', hex: '#8B7355', name: 'Ash Blonde' },
// //   { id: '8.3', hex: '#B8860B', name: 'Medium Gold' },
// //   { id: '5.4', hex: '#5C4033', name: 'Chestnut Brown' },
// //   { id: '22.0', hex: '#1A1A1A', name: 'Natural Black' },
// // ];

// // function ProductImage({ src, alt }: { src: string; alt: string }) {
// //   const isUrl = src && (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:'));
// //   if (isUrl) {
// //     return <img src={src} alt={alt} className="w-full h-full object-cover rounded-2xl" />;
// //   }
// //   return <div className="text-9xl flex items-center justify-center w-full h-full bg-gradient-to-br from-[#F5EFE6] to-[#EAE0D5] rounded-2xl">{src || '✨'}</div>;
// // }

// // export default function ProductDetailPage() {
// //   const params = useParams();
// //   const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
// //   const { getProductById } = useProducts();
// //   const { addItem, items } = useCart();

// //   const [isWishlisted, setIsWishlisted] = useState(false);
// //   const [addedToCart, setAddedToCart] = useState(false);
  
// //   // New States for Premium UI
// //   const [selectedPackage, setSelectedPackage] = useState<'single' | 'two-mix' | 'three-mix'>('two-mix');
// //   const [selectedColors, setSelectedColors] = useState<string[]>(['88.0', '3.22']);

// //   const stored = getProductById(id);

// //   const product = stored
// //     ? {
// //         id: stored.id,
// //         name: stored.name,
// //         price: stored.price,
// //         originalPrice: stored.originalPrice,
// //         description: stored.description || '',
// //         category: stored.category,
// //         brand: stored.brand,
// //         inStock: stored.status === 'active' && stored.stock > 0,
// //         stock: stored.stock,
// //         rating: stored.rating,
// //         reviews: stored.reviews,
// //         image: stored.image,
// //       }
// //     : {
// //         id,
// //         name: 'TOV CH Permanent Hair Color Cream - Bangladesh\'s #1',
// //         price: 399,
// //         originalPrice: 450,
// //         description: 'Professional salon-quality color at home. Intensive Color Cream-Oil Technology with 100% grey coverage and long-lasting shine.',
// //         category: 'Hair Care',
// //         brand: 'TOV CH',
// //         inStock: true,
// //         stock: 50,
// //         rating: 4.9,
// //         reviews: 1234,
// //         image: '💇‍♀️',
// //       };

// //   // Pricing Logic based on selection
// //   const currentPrice = selectedPackage === 'single' ? 399 : selectedPackage === 'two-mix' ? 449 : 599;
// //   const packageQty = selectedPackage === 'single' ? 1 : selectedPackage === 'two-mix' ? 2 : 3;

// //   const handleToggleColor = (colorId: string) => {
// //     if (selectedColors.includes(colorId)) {
// //       setSelectedColors(selectedColors.filter(c => c !== colorId));
// //     } else {
// //       if (selectedColors.length < packageQty) {
// //         setSelectedColors([...selectedColors, colorId]);
// //       } else {
// //         // Replace last selected if max reached
// //         const newColors = [...selectedColors];
// //         newColors[newColors.length - 1] = colorId;
// //         setSelectedColors(newColors);
// //       }
// //     }
// //   };

// //   const handleAddToCart = () => {
// //     if (!product.inStock) return;
// //     addItem({
// //       id: product.id,
// //       name: `${product.name} (${selectedPackage})`,
// //       price: currentPrice,
// //       quantity: 1,
// //       image: product.image,
// //       sku: `${product.id}-${selectedPackage}`,
// //       // You can pass selectedColors to your cart state if supported
// //     });
// //     setAddedToCart(true);
// //     setTimeout(() => setAddedToCart(false), 2000);
// //   };

// //   return (
// //     <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
// //       <TopBar />
// //       <Navbar />
      
// //       {/* Added pb-28 to account for sticky bottom bar on mobile */}
// //       <main className="flex-grow py-6 md:py-10 pb-28 md:pb-10">
// //         <div className="container mx-auto px-4 max-w-6xl">
          
// //           {/* Breadcrumb */}
// //           <div className="mb-6 flex items-center gap-2 text-sm">
// //             <Link href="/" className="text-gray-500 hover:text-[#D4AF37] transition">Home</Link>
// //             <span className="text-gray-400">/</span>
// //             <Link href="/shop" className="text-gray-500 hover:text-[#D4AF37] transition">Hair Care</Link>
// //             <span className="text-gray-400">/</span>
// //             <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
// //           </div>

// //           <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-[#F0EBE1]">
// //             <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              
// //               {/* Product Visuals (Left) */}
// //               <div className="p-4 md:p-8">
// //                 <div className="relative w-full aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden shadow-inner bg-[#FDFBF7]">
// //                   <ProductImage src={product.image} alt={product.name} />
// //                   {/* Premium Badge */}
// //                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-[#F0EBE1] flex items-center gap-1.5">
// //                     <Sparkles size={14} className="text-[#D4AF37]" />
// //                     <span className="text-xs font-semibold text-gray-800">Salon Fashion</span>
// //                   </div>
// //                 </div>

// //                 {/* Trust Badges */}
// //                 <div className="grid grid-cols-3 gap-3 mt-6">
// //                   <div className="flex flex-col items-center justify-center text-center p-3 bg-[#FAF8F5] rounded-xl">
// //                     <ShieldCheck size={20} className="text-[#8B5E34] mb-1" />
// //                     <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">100% Original</span>
// //                   </div>
// //                   <div className="flex flex-col items-center justify-center text-center p-3 bg-[#FAF8F5] rounded-xl">
// //                     <Truck size={20} className="text-[#8B5E34] mb-1" />
// //                     <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Fast Delivery</span>
// //                   </div>
// //                   <div className="flex flex-col items-center justify-center text-center p-3 bg-[#FAF8F5] rounded-xl">
// //                     <RefreshCcw size={20} className="text-[#8B5E34] mb-1" />
// //                     <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">7 Days Return</span>
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Product Details (Right) */}
// //               <div className="p-6 md:p-8 lg:p-10 flex flex-col border-l border-[#F0EBE1]/50 bg-white">
                
// //                 {/* Title & Rating */}
// //                 <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-gray-900 leading-tight mb-3">
// //                   {product.name}
// //                 </h1>
                
// //                 <div className="flex items-center gap-3 mb-6">
// //                   <div className="flex text-[#D4AF37] gap-0.5">
// //                     {Array.from({ length: 5 }).map((_, i) => (
// //                       <Star key={i} size={18} className={i < Math.round(product.rating) ? 'fill-[#D4AF37]' : 'text-gray-200'} />
// //                     ))}
// //                   </div>
// //                   <span className="text-sm font-bold text-gray-800">{product.rating.toFixed(1)}</span>
// //                   <span className="text-sm text-gray-500 underline decoration-gray-200 underline-offset-4">({product.reviews} reviews)</span>
// //                 </div>

// //                 {/* Description */}
// //                 <p className="text-gray-600 mb-8 leading-relaxed text-sm md:text-base">
// //                   {product.description}
// //                 </p>

// //                 {/* Smart Pricing Cards */}
// //                 <div className="mb-8">
// //                   <div className="flex items-center justify-between mb-3">
// //                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Choose Package</h3>
// //                   </div>
// //                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
// //                     {/* Single */}
// //                     <button 
// //                       onClick={() => { setSelectedPackage('single'); setSelectedColors(['88.0']); }}
// //                       className={`relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPackage === 'single' ? 'border-[#D4AF37] bg-[#FAF8F5]' : 'border-gray-100 hover:border-gray-200'}`}
// //                     >
// //                       <div className="text-sm text-gray-500 mb-1">Basic</div>
// //                       <div className="font-bold text-gray-900">Single Color</div>
// //                       <div className="text-lg font-serif text-[#8B5E34] mt-2">৳399</div>
// //                     </button>

// //                     {/* Two Mix (Highlighted) */}
// //                     <button 
// //                       onClick={() => { setSelectedPackage('two-mix'); setSelectedColors(['88.0', '3.22']); }}
// //                       className={`relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPackage === 'two-mix' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-100 hover:border-gray-200'}`}
// //                     >
// //                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
// //                         🔥 BEST VALUE
// //                       </div>
// //                       <div className="text-sm text-[#8B5E34] font-medium mb-1">Most Popular</div>
// //                       <div className="font-bold text-gray-900">Two Color Mix</div>
// //                       <div className="text-lg font-serif text-[#8B5E34] mt-2">৳449</div>
// //                     </button>

// //                     {/* Three Mix */}
// //                     <button 
// //                       onClick={() => { setSelectedPackage('three-mix'); setSelectedColors(['88.0', '3.22', '8.3']); }}
// //                       className={`relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPackage === 'three-mix' ? 'border-[#D4AF37] bg-[#FAF8F5]' : 'border-gray-100 hover:border-gray-200'}`}
// //                     >
// //                       <div className="text-sm text-gray-500 mb-1">Premium</div>
// //                       <div className="font-bold text-gray-900">Three Color Mix</div>
// //                       <div className="text-lg font-serif text-[#8B5E34] mt-2">৳599</div>
// //                     </button>
// //                   </div>
// //                 </div>

// //                 {/* Interactive Color Palette */}
// //                 <div className="mb-8 p-5 bg-[#FAF8F5] rounded-2xl border border-[#F0EBE1]">
// //                   <div className="flex justify-between items-center mb-4">
// //                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Shades ({selectedColors.length}/{packageQty})</h3>
// //                   </div>
// //                   <div className="flex flex-wrap gap-3">
// //                     {COLOR_SWATCHES.map((swatch) => (
// //                       <button
// //                         key={swatch.id}
// //                         onClick={() => handleToggleColor(swatch.id)}
// //                         className={`group relative w-12 h-12 rounded-full transition-all duration-300 ${selectedColors.includes(swatch.id) ? 'ring-2 ring-offset-2 ring-[#8B5E34] scale-110' : 'hover:scale-105 border border-gray-200'}`}
// //                         style={{ backgroundColor: swatch.hex }}
// //                         title={swatch.name}
// //                       >
// //                         {selectedColors.includes(swatch.id) && (
// //                           <div className="absolute inset-0 flex items-center justify-center">
// //                             <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
// //                           </div>
// //                         )}
// //                       </button>
// //                     ))}
// //                   </div>
// //                   <p className="text-xs text-gray-500 mt-3">
// //                     {selectedColors.length < packageQty 
// //                       ? `Select ${packageQty - selectedColors.length} more color(s)` 
// //                       : 'Perfect combination selected!'}
// //                   </p>
// //                 </div>

// //                 {/* The Art of Mixing (Visual) */}
// //                 {selectedPackage !== 'single' && (
// //                   <div className="mb-8">
// //                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">The Art of Mixing</h3>
// //                     <div className="flex items-center justify-center gap-4 bg-white p-6 rounded-2xl border border-[#F0EBE1] shadow-sm">
// //                       <div className="flex -space-x-3">
// //                         {selectedColors.map((colorId, idx) => {
// //                           const bg = COLOR_SWATCHES.find(c => c.id === colorId)?.hex;
// //                           return (
// //                             <div key={idx} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: bg }}></div>
// //                           );
// //                         })}
// //                       </div>
// //                       <div className="text-gray-400 font-bold">=</div>
// //                       <div className="flex flex-col">
// //                         <span className="text-sm font-bold text-[#8B5E34]">Unique Custom Shade</span>
// //                         <span className="text-xs text-gray-500">Professional results at home</span>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </main>

// //       {/* Sticky Bottom Action Bar (Mobile & Desktop) */}
// //       <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
// //         <div className="container mx-auto max-w-6xl flex items-center justify-between gap-4">
          
// //           <div className="hidden md:flex flex-col">
// //             <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Price</span>
// //             <span className="text-2xl font-serif text-[#8B5E34] font-bold">{formatPrice(currentPrice)}</span>
// //           </div>

// //           <div className="flex items-center gap-3 w-full md:w-auto flex-1 md:flex-none">
// //             <button
// //               onClick={() => setIsWishlisted(!isWishlisted)}
// //               className={`p-3.5 border rounded-xl transition-colors ${
// //                 isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 bg-white'
// //               }`}
// //             >
// //               <Heart size={24} className={isWishlisted ? 'fill-current' : ''} />
// //             </button>
            
// //             <button
// //               onClick={handleAddToCart}
// //               disabled={!product.inStock || addedToCart || selectedColors.length !== packageQty}
// //               className={`flex-1 md:px-12 py-3.5 rounded-xl font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
// //                 !product.inStock || selectedColors.length !== packageQty
// //                   ? 'bg-gray-300 cursor-not-allowed shadow-none'
// //                   : addedToCart
// //                   ? 'bg-green-600'
// //                   : 'bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:shadow-lg hover:-translate-y-0.5' // WhatsApp Green Vibe for Express Checkout
// //               }`}
// //             >
// //               {addedToCart ? (
// //                 <>✓ Added to Cart</>
// //               ) : (
// //                 <>Order Now (৳{currentPrice})</>
// //               )}
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       <Footer />
// //     </div>
// //   );
// // }

// // //design from gemini

// // // 'use client';

// // // import { useParams } from 'next/navigation';
// // // import { useState } from 'react';
// // // import Navbar from '../../components/Header';
// // // import TopBar from '../../components/TopBar';
// // // import Footer from '../../components/Footer';
// // // import Link from 'next/link';
// // // import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, Star } from 'lucide-react';
// // // import { formatPrice } from '@/utils/currency';
// // // import { useProducts } from '@/contexts/ProductsContext';
// // // import { useCart } from '@/contexts/CartContext';

// // // function ProductImage({ src, alt }: { src: string; alt: string }) {
// // //   const isUrl = src && (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:'));
// // //   if (isUrl) {
// // //     return <img src={src} alt={alt} className="w-full h-full object-contain" />;
// // //   }
// // //   return <span className="text-9xl">{src || '✨'}</span>;
// // // }

// // // export default function ProductDetailPage() {
// // //   const params = useParams();
// // //   const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
// // //   const { getProductById } = useProducts();
// // //   const { addItem, items } = useCart();

// // //   const [quantity, setQuantity] = useState(1);
// // //   const [isWishlisted, setIsWishlisted] = useState(false);
// // //   const [addedToCart, setAddedToCart] = useState(false);

// // //   const stored = getProductById(id);

// // //   const product = stored
// // //     ? {
// // //         id: stored.id,
// // //         name: stored.name,
// // //         price: stored.price,
// // //         originalPrice: stored.originalPrice,
// // //         description: stored.description || '',
// // //         category: stored.category,
// // //         brand: stored.brand,
// // //         inStock: stored.status === 'active' && stored.stock > 0,
// // //         stock: stored.stock,
// // //         rating: stored.rating,
// // //         reviews: stored.reviews,
// // //         image: stored.image,
// // //       }
// // //     : {
// // //         id,
// // //         name: 'Premium Face Serum',
// // //         price: 29.99,
// // //         originalPrice: 49.99,
// // //         description:
// // //           'Nourish your skin with this toxin-free premium face serum. Formulated with natural ingredients to provide deep hydration and anti-aging benefits.',
// // //         category: 'Skin care',
// // //         brand: 'Minsah Beauty',
// // //         inStock: true,
// // //         stock: 10,
// // //         rating: 4.5,
// // //         reviews: 128,
// // //         image: '💄',
// // //       };

// // //   const cartQty = items.find(i => i.id === product.id)?.quantity ?? 0;

// // //   const handleAddToCart = () => {
// // //     if (!product.inStock) return;
// // //     addItem({
// // //       id: product.id,
// // //       name: product.name,
// // //       price: product.price,
// // //       quantity,
// // //       image: product.image,
// // //       sku: product.id,
// // //     });
// // //     setAddedToCart(true);
// // //     setTimeout(() => setAddedToCart(false), 2000);
// // //   };

// // //   const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));
// // //   const increaseQty = () => setQuantity(q => Math.min(product.stock, q + 1));

// // //   const discountPct =
// // //     product.originalPrice && product.originalPrice > product.price
// // //       ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
// // //       : null;

// // //   return (
// // //     <div className="min-h-screen flex flex-col bg-gray-50">
// // //       <TopBar />
// // //       <Navbar />
// // //       <main className="flex-grow py-6 md:py-12">
// // //         <div className="container mx-auto px-4 max-w-5xl">
// // //           {/* Breadcrumb */}
// // //           <div className="mb-6 flex items-center gap-2 text-sm">
// // //             <Link href="/" className="text-gray-500 hover:text-pink-600">Home</Link>
// // //             <span className="text-gray-400">/</span>
// // //             <Link href="/shop" className="text-gray-500 hover:text-pink-600">Shop</Link>
// // //             <span className="text-gray-400">/</span>
// // //             <span className="text-gray-700 font-medium line-clamp-1">{product.name}</span>
// // //           </div>

// // //           <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
// // //             <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
// // //               {/* Product Image */}
// // //               <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 flex items-center justify-center min-h-[320px] md:min-h-[480px]">
// // //                 <div className="w-full max-w-xs flex items-center justify-center aspect-square">
// // //                   <ProductImage src={product.image} alt={product.name} />
// // //                 </div>
// // //               </div>

// // //               {/* Product Info */}
// // //               <div className="p-6 md:p-8 flex flex-col">
// // //                 {/* Category & Brand */}
// // //                 <div className="flex items-center gap-2 mb-3 flex-wrap">
// // //                   <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-medium">{product.category}</span>
// // //                   {product.brand && (
// // //                     <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{product.brand}</span>
// // //                   )}
// // //                 </div>

// // //                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

// // //                 {/* Rating */}
// // //                 <div className="flex items-center gap-2 mb-4">
// // //                   <div className="flex text-yellow-400 gap-0.5">
// // //                     {Array.from({ length: 5 }).map((_, i) => (
// // //                       <Star
// // //                         key={i}
// // //                         size={16}
// // //                         className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
// // //                       />
// // //                     ))}
// // //                   </div>
// // //                   <span className="text-sm font-medium text-gray-700">{product.rating.toFixed(1)}</span>
// // //                   <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
// // //                 </div>

// // //                 {/* Price */}
// // //                 <div className="mb-5">
// // //                   <div className="flex items-center gap-3 flex-wrap">
// // //                     <span className="text-3xl font-bold text-pink-600">
// // //                       {formatPrice(product.price)}
// // //                     </span>
// // //                     {product.originalPrice && product.originalPrice > product.price && (
// // //                       <>
// // //                         <span className="text-xl text-gray-400 line-through">
// // //                           {formatPrice(product.originalPrice)}
// // //                         </span>
// // //                         <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-sm font-bold">
// // //                           {discountPct}% OFF
// // //                         </span>
// // //                       </>
// // //                     )}
// // //                   </div>
// // //                   {product.originalPrice && product.originalPrice > product.price && (
// // //                     <p className="text-green-600 text-sm mt-1 font-medium">
// // //                       You save {formatPrice(product.originalPrice - product.price)}!
// // //                     </p>
// // //                   )}
// // //                 </div>

// // //                 <p className="text-gray-600 mb-5 leading-relaxed text-sm">{product.description}</p>

// // //                 {/* Availability */}
// // //                 <div className="flex items-center gap-2 mb-5">
// // //                   <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
// // //                   <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
// // //                     {product.inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
// // //                   </span>
// // //                 </div>

// // //                 {/* Quantity Selector */}
// // //                 {product.inStock && (
// // //                   <div className="mb-5">
// // //                     <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
// // //                     <div className="flex items-center gap-3">
// // //                       <button
// // //                         onClick={decreaseQty}
// // //                         disabled={quantity <= 1}
// // //                         className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition disabled:opacity-40"
// // //                       >
// // //                         <Minus size={16} />
// // //                       </button>
// // //                       <span className="text-xl font-bold w-10 text-center">{quantity}</span>
// // //                       <button
// // //                         onClick={increaseQty}
// // //                         disabled={quantity >= product.stock}
// // //                         className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition disabled:opacity-40"
// // //                       >
// // //                         <Plus size={16} />
// // //                       </button>
// // //                       {cartQty > 0 && (
// // //                         <span className="text-xs text-gray-500 ml-1">{cartQty} already in cart</span>
// // //                       )}
// // //                     </div>
// // //                   </div>
// // //                 )}

// // //                 {/* Action Buttons */}
// // //                 <div className="flex gap-3">
// // //                   <button
// // //                     onClick={handleAddToCart}
// // //                     disabled={!product.inStock || addedToCart}
// // //                     className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2 ${
// // //                       !product.inStock
// // //                         ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
// // //                         : addedToCart
// // //                         ? 'bg-green-500 text-white'
// // //                         : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
// // //                     }`}
// // //                   >
// // //                     {!product.inStock ? (
// // //                       'Out of Stock'
// // //                     ) : addedToCart ? (
// // //                       <>✓ Added to Cart</>
// // //                     ) : (
// // //                       <><ShoppingCart size={20} /> Add to Cart</>
// // //                     )}
// // //                   </button>
// // //                   <button
// // //                     onClick={() => setIsWishlisted(!isWishlisted)}
// // //                     className={`px-4 py-3.5 border-2 rounded-xl transition ${
// // //                       isWishlisted ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
// // //                     }`}
// // //                     aria-label="Toggle wishlist"
// // //                   >
// // //                     <Heart size={20} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
// // //                   </button>
// // //                 </div>

// // //                 {/* View Cart shortcut */}
// // //                 {cartQty > 0 && (
// // //                   <Link
// // //                     href="/cart"
// // //                     className="mt-3 text-center text-pink-600 hover:text-pink-700 text-sm font-medium underline underline-offset-2"
// // //                   >
// // //                     View Cart ({cartQty} item{cartQty !== 1 ? 's' : ''}) →
// // //                   </Link>
// // //                 )}

// // //                 {/* Meta */}
// // //                 <div className="mt-5 pt-5 border-t border-gray-100 text-sm text-gray-500 space-y-1">
// // //                   <p><span className="font-medium text-gray-700">SKU:</span> {product.id}</p>
// // //                   <p><span className="font-medium text-gray-700">Category:</span> {product.category}</p>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           <div className="mt-6">
// // //             <Link href="/shop" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium text-sm">
// // //               <ArrowLeft size={16} /> Back to Shop
// // //             </Link>
// // //           </div>
// // //         </div>
// // //       </main>
// // //       <Footer />
// // //     </div>
// // //   );
// // // }
