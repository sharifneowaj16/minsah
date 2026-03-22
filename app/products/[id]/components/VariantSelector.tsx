'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface Variant {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string> | null;
}

interface VariantSelectorProps {
  variants: Variant[];
  basePrice: number;
  onVariantChange: (variantId: string | null, price: number, qty: number) => void;
}

export default function VariantSelector({ variants, basePrice, onVariantChange }: VariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);

  const currentVariant = variants.find((v) => v.id === selectedVariant);
  const currentPrice = currentVariant?.price ?? basePrice;
  const maxStock = currentVariant?.stock ?? 99;

  const handleVariantSelect = (variantId: string) => {
    const v = variants.find((x) => x.id === variantId);
    if (!v || v.stock === 0) return;
    setSelectedVariant(variantId);
    setQuantity(1);
    onVariantChange(variantId, v.price, 1);
  };

  const handleQtyChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(maxStock, quantity + delta));
    setQuantity(newQty);
    onVariantChange(selectedVariant, currentPrice, newQty);
  };

  // Group by attribute type (size, color, etc.)
  const allSizes = Array.from(
    new Set(variants.map((v) => v.attributes?.size).filter(Boolean))
  ) as string[];
  const allColors = Array.from(
    new Set(variants.map((v) => v.attributes?.color).filter(Boolean))
  ) as string[];

  if (variants.length === 0) {
    // No variants — just show quantity
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#8B5E3C]">পরিমাণ:</span>
        <div className="flex items-center gap-2 border border-[#D4B896] rounded-full px-3 py-1">
          <button
            onClick={() => handleQtyChange(-1)}
            disabled={quantity <= 1}
            className="w-6 h-6 flex items-center justify-center text-[#3D1F0E] disabled:opacity-30 hover:bg-[#F5E9DC] rounded-full transition"
          >
            <Minus size={12} />
          </button>
          <span className="text-sm font-semibold text-[#1A0D06] w-6 text-center">{quantity}</span>
          <button
            onClick={() => handleQtyChange(1)}
            disabled={quantity >= maxStock}
            className="w-6 h-6 flex items-center justify-center text-[#3D1F0E] disabled:opacity-30 hover:bg-[#F5E9DC] rounded-full transition"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Size variants */}
      {allSizes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide mb-2">
            সাইজ:{' '}
            <span className="font-normal text-[#6B4226] normal-case tracking-normal">
              {currentVariant?.attributes?.size || 'নির্বাচন করুন'}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => {
              const variant = variants.find((v) => v.attributes?.size === size);
              const isSelected = currentVariant?.attributes?.size === size;
              const outOfStock = variant?.stock === 0;
              return (
                <button
                  key={size}
                  onClick={() => variant && handleVariantSelect(variant.id)}
                  disabled={outOfStock}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#3D1F0E] text-[#F5E6D3] border-[#3D1F0E]'
                      : outOfStock
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                      : 'bg-transparent text-[#3D1F0E] border-[#D4B896] hover:border-[#3D1F0E]'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color variants */}
      {allColors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide mb-2">
            কালার:{' '}
            <span className="font-normal text-[#6B4226] normal-case tracking-normal">
              {currentVariant?.attributes?.color || 'নির্বাচন করুন'}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {allColors.map((color) => {
              const variant = variants.find((v) => v.attributes?.color === color);
              const isSelected = currentVariant?.attributes?.color === color;
              return (
                <button
                  key={color}
                  onClick={() => variant && handleVariantSelect(variant.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#3D1F0E] text-[#F5E6D3] border-[#3D1F0E]'
                      : 'bg-transparent text-[#3D1F0E] border-[#D4B896] hover:border-[#3D1F0E]'
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Named variants (fallback) */}
      {allSizes.length === 0 && allColors.length === 0 && (
        <div>
          <p className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide mb-2">ভেরিয়েন্ট</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedVariant === v.id;
              const outOfStock = v.stock === 0;
              return (
                <button
                  key={v.id}
                  onClick={() => handleVariantSelect(v.id)}
                  disabled={outOfStock}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#3D1F0E] text-[#F5E6D3] border-[#3D1F0E]'
                      : outOfStock
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                      : 'bg-transparent text-[#3D1F0E] border-[#D4B896] hover:border-[#3D1F0E]'
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[#3D1F0E] uppercase tracking-wide">পরিমাণ:</span>
        <div className="flex items-center gap-1 border border-[#D4B896] rounded-full px-2 py-1">
          <button
            onClick={() => handleQtyChange(-1)}
            disabled={quantity <= 1}
            className="w-7 h-7 flex items-center justify-center text-[#3D1F0E] disabled:opacity-30 hover:bg-[#F5E9DC] rounded-full transition"
          >
            <Minus size={13} />
          </button>
          <span className="text-sm font-semibold text-[#1A0D06] w-7 text-center">{quantity}</span>
          <button
            onClick={() => handleQtyChange(1)}
            disabled={quantity >= maxStock}
            className="w-7 h-7 flex items-center justify-center text-[#3D1F0E] disabled:opacity-30 hover:bg-[#F5E9DC] rounded-full transition"
          >
            <Plus size={13} />
          </button>
        </div>
        {maxStock <= 5 && maxStock > 0 && (
          <span className="text-xs text-red-500 font-medium">মাত্র {maxStock}টি বাকি!</span>
        )}
      </div>
    </div>
  );
}
