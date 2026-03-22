'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  discountPct: number | null;
  isNew: boolean;
}

export default function ProductGallery({ images, productName, discountPct, isNew }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const safeImages = images.length > 0 ? images : ['/placeholder.jpg'];

  const prev = useCallback(() => setActiveIdx((i) => (i === 0 ? safeImages.length - 1 : i - 1)), [safeImages.length]);
  const next = useCallback(() => setActiveIdx((i) => (i === safeImages.length - 1 ? 0 : i + 1)), [safeImages.length]);

  return (
    <div className="w-full">
      {/* Main Image */}
      <div className="relative aspect-[4/3] md:aspect-square bg-[#F5E9DC] rounded-2xl md:rounded-3xl overflow-hidden">
        <img
          src={safeImages[activeIdx]}
          alt={productName}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/600x600/F5E9DC/8B5E3C?text=${encodeURIComponent(productName)}`;
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPct && discountPct > 0 ? (
            <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              -{discountPct}%
            </span>
          ) : null}
          {isNew && (
            <span className="bg-[#3D1F0E] text-[#F5E6D3] text-xs font-semibold px-2.5 py-1 rounded-full">
              নতুন
            </span>
          )}
        </div>

        {/* Arrows — only if multiple images */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} className="text-[#3D1F0E]" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition"
              aria-label="Next image"
            >
              <ChevronRight size={16} className="text-[#3D1F0E]" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {safeImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === activeIdx ? 'w-4 bg-[#3D1F0E]' : 'w-1.5 bg-[#C4A882]'
                }`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {safeImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === activeIdx
                  ? 'border-[#3D1F0E] shadow-md'
                  : 'border-transparent hover:border-[#C4A882]'
              }`}
            >
              <img
                src={src}
                alt={`${productName} ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/64x64/F5E9DC/8B5E3C?text=${i + 1}`;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
