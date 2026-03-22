'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift, Heart, ShoppingBag, ArrowLeft, Phone, MapPin, Zap } from 'lucide-react';

interface GiftData {
  gift: {
    token: string;
    senderName: string;
    recipientName: string;
    message: string | null;
    status: string;
    expiresAt: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    image: string;
    images: string[];
    brand: string;
    inStock: boolean;
    variants: Array<{ id: string; name: string; price: number; stock: number }>;
  };
  selectedVariantId: string | null;
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801700000000';

export default function GiftPageClient({ data }: { data: GiftData }) {
  const { gift, product } = data;
  const [step, setStep] = useState<'reveal' | 'checkout'>('reveal');
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: 'ঢাকা', note: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleOrder = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      alert('নাম, ফোন নম্বর ও ঠিকানা দিন');
      return;
    }
    setLoading(true);
    try {
      // WhatsApp order with gift context
      const msg = encodeURIComponent(
        `🎁 GIFT ORDER\n\nপ্রাপক: ${form.name}\nফোন: ${form.phone}\nঠিকানা: ${form.address}, ${form.city}\n\nপণ্য: ${product.name}\nমূল্য: ৳${product.price.toLocaleString()}\n\nউপহার পাঠানো হয়েছে: ${gift.senderName} এর পক্ষ থেকে\nNote: ${form.note || 'নেই'}\n\nGift Token: ${gift.token}`
      );
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank');

      // Mark gift as ordered
      await fetch(`/api/gift/${gift.token}/order`, { method: 'POST' }).catch(() => {});
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Reveal screen ──────────────────────────────────────────
  if (step === 'reveal') {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex flex-col">
        {/* Top bar */}
        <div className="bg-[#3D1F0E] px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-[#F5E6D3] text-sm">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-[#F5E6D3] text-sm font-semibold tracking-widest uppercase">
            Minsah Beauty
          </span>
          <div className="w-5" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-start px-5 pt-8 pb-32 max-w-md mx-auto w-full">

          {/* Gift envelope animation */}
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-[#F5E9DC] rounded-full flex items-center justify-center shadow-lg">
              <Gift size={40} className="text-[#3D1F0E]" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Heart size={14} className="text-white fill-white" />
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-[#8B5E3C] mb-1">বিশেষ উপহার পেয়েছ!</p>
          <h1 className="text-2xl font-semibold text-[#1A0D06] text-center mb-1">
            {gift.recipientName}
          </h1>
          <p className="text-sm text-[#6B4226] mb-6 text-center">
            <span className="font-semibold text-[#3D1F0E]">{gift.senderName}</span> তোমাকে গিফট করতে চায়
          </p>

          {/* Personal message */}
          {gift.message && (
            <div className="w-full bg-[#F5E9DC] rounded-2xl px-4 py-3 mb-6 border-l-4 border-[#C4956A]">
              <p className="text-sm text-[#4A2C1A] italic leading-relaxed">"{gift.message}"</p>
            </div>
          )}

          {/* Product card */}
          <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8D5C0] mb-6">
            <div className="aspect-[4/3] bg-[#F5E9DC] relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/400x300/F5E9DC/8B5E3C?text=${encodeURIComponent(product.name.slice(0, 8))}`;
                }}
              />
              {discountPct && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{discountPct}%
                </span>
              )}
            </div>
            <div className="p-4">
              {product.brand && (
                <span className="text-xs bg-[#F5E9DC] text-[#6B4226] px-2 py-0.5 rounded-full font-medium">
                  {product.brand}
                </span>
              )}
              <h2 className="text-base font-semibold text-[#1A0D06] mt-2 leading-snug">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-semibold text-[#1A0D06]">
                  ৳{product.price.toLocaleString('bn-BD')}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-[#A0856A] line-through">
                    ৳{product.compareAtPrice.toLocaleString('bn-BD')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8B5E3C] mt-1">
                {gift.senderName} সম্পূর্ণ বিনামূল্যে তোমার জন্য পাঠাচ্ছে
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setStep('checkout')}
            className="w-full bg-[#3D1F0E] text-[#F5E6D3] py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <ShoppingBag size={18} />
            গিফটটি গ্রহণ করো
          </button>

          <p className="text-xs text-[#A0856A] mt-3 text-center">
            Link মেয়াদ: {new Date(gift.expiresAt).toLocaleDateString('bn-BD')} পর্যন্ত
          </p>
        </div>
      </div>
    );
  }

  // ── Done screen ────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center px-5 text-center">
        <div className="w-20 h-20 bg-[#F5E9DC] rounded-full flex items-center justify-center mb-5">
          <Heart size={36} className="text-[#3D1F0E] fill-[#3D1F0E]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1A0D06] mb-2">অর্ডার নিশ্চিত হয়েছে!</h1>
        <p className="text-sm text-[#8B5E3C] mb-2">
          আমরা শীঘ্রই WhatsApp-এ যোগাযোগ করব।
        </p>
        <p className="text-xs text-[#A0856A]">
          {gift.senderName} জানতে পারবে তুমি গিফটটি গ্রহণ করেছ ❤️
        </p>
        <Link
          href="/shop"
          className="mt-8 text-sm text-[#3D1F0E] underline underline-offset-2"
        >
          আরো পণ্য দেখো
        </Link>
      </div>
    );
  }

  // ── Checkout screen ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <div className="bg-[#3D1F0E] px-4 py-3 flex items-center gap-3">
        <button onClick={() => setStep('reveal')} className="text-[#F5E6D3]">
          <ArrowLeft size={18} />
        </button>
        <span className="text-[#F5E6D3] text-sm font-semibold">ডেলিভারি তথ্য দাও</span>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 pb-32 space-y-4">

        {/* Mini product recap */}
        <div className="flex gap-3 bg-white rounded-2xl p-3 border border-[#E8D5C0]">
          <img
            src={product.image}
            alt={product.name}
            className="w-14 h-14 rounded-xl object-cover bg-[#F5E9DC]"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
          />
          <div>
            <p className="text-xs text-[#8B5E3C]">গিফট: {gift.senderName} এর পক্ষ থেকে</p>
            <p className="text-sm font-semibold text-[#1A0D06] leading-snug">{product.name}</p>
            <p className="text-sm font-semibold text-[#3D1F0E]">৳{product.price.toLocaleString('bn-BD')}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8D5C0] space-y-3">
          <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide flex items-center gap-1.5">
            <MapPin size={12} /> তোমার ঠিকানা
          </p>

          {[
            { key: 'name', label: 'তোমার নাম *', placeholder: 'পুরো নাম লেখো', type: 'text' },
            { key: 'phone', label: 'ফোন নম্বর *', placeholder: '01XXXXXXXXX', type: 'tel' },
            { key: 'address', label: 'বাসার ঠিকানা *', placeholder: 'বাড়ি/ফ্ল্যাট নম্বর, রাস্তা', type: 'text' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#6B4226] mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 border border-[#D4B896] rounded-xl text-sm focus:outline-none focus:border-[#3D1F0E] bg-[#FDF8F3]"
              />
            </div>
          ))}

          {/* City */}
          <div>
            <label className="block text-xs font-medium text-[#6B4226] mb-1">জেলা/শহর</label>
            <select
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-3 py-2.5 border border-[#D4B896] rounded-xl text-sm focus:outline-none focus:border-[#3D1F0E] bg-[#FDF8F3]"
            >
              {['ঢাকা','চট্টগ্রাম','সিলেট','রাজশাহী','খুলনা','বরিশাল','রংপুর','ময়মনসিংহ','কুমিল্লা','নারায়ণগঞ্জ'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-[#6B4226] mb-1">বিশেষ নির্দেশনা (optional)</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="যেমন: সন্ধ্যার পর দিও"
              className="w-full px-3 py-2.5 border border-[#D4B896] rounded-xl text-sm focus:outline-none focus:border-[#3D1F0E] bg-[#FDF8F3]"
            />
          </div>
        </div>

        {/* Trust */}
        <div className="flex gap-2 text-xs text-[#8B5E3C]">
          <span className="flex items-center gap-1"><Phone size={11} /> WhatsApp কনফার্মেশন</span>
          <span>•</span>
          <span>COD সুবিধা নেই (gift বলে)</span>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8D5C0] px-4 py-3 max-w-md mx-auto">
        <button
          onClick={handleOrder}
          disabled={loading}
          className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95 ${
            loading
              ? 'bg-[#C4A882] text-white cursor-not-allowed'
              : 'bg-[#3D1F0E] text-[#F5E6D3]'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              অর্ডার হচ্ছে...
            </span>
          ) : (
            <>
              <Zap size={15} />
              গিফট অর্ডার নিশ্চিত করো
            </>
          )}
        </button>
        <p className="text-xs text-center text-[#A0856A] mt-1.5">
          {gift.senderName} সম্পূর্ণ মূল্য পরিশোধ করবে
        </p>
      </div>
    </div>
  );
}
