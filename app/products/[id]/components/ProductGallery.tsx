'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipeAndScrollHeader';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  discountPct: number | null;
  isNew: boolean;
}

export default function ProductGallery({ images, productName, discountPct, isNew }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const safeImages = images.length > 0 ? images : ['/placeholder.jpg'];

  const prev = useCallback(() => setActiveIdx((i) => (i === 0 ? safeImages.length - 1 : i - 1)), [safeImages.length]);
  const next = useCallback(() => setActiveIdx((i) => (i === safeImages.length - 1 ? 0 : i + 1)), [safeImages.length]);

  const swipeHandlers = useSwipe({ onSwipeLeft: next, onSwipeRight: prev });

  return (
    <>
      <div className="w-full">
        {/* Main image */}
        <div
          className="relative aspect-[4/3] md:aspect-square bg-[#F5E9DC] rounded-2xl md:rounded-3xl overflow-hidden cursor-zoom-in select-none"
          {...swipeHandlers}
          onClick={() => setZoomed(true)}
        >
          <img
            src={safeImages[activeIdx]}
            alt={productName}
            className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/600x600/F5E9DC/8B5E3C?text=${encodeURIComponent(productName)}`;
            }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
            {discountPct && discountPct > 0 ? (
              <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">-{discountPct}%</span>
            ) : null}
            {isNew && (
              <span className="bg-[#3D1F0E] text-[#F5E6D3] text-xs font-semibold px-2.5 py-1 rounded-full">নতুন</span>
            )}
          </div>

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 bg-white/70 rounded-lg p-1.5 pointer-events-none">
            <ZoomIn size={14} className="text-[#3D1F0E]" />
          </div>

          {/* Nav arrows */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition"
              >
                <ChevronLeft size={16} className="text-[#3D1F0E]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition"
              >
                <ChevronRight size={16} className="text-[#3D1F0E]" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
              {safeImages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === activeIdx ? 'w-4 bg-[#3D1F0E]' : 'w-1.5 bg-[#C4A882]'
                  }`}
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
                  i === activeIdx ? 'border-[#3D1F0E] shadow-md' : 'border-transparent hover:border-[#C4A882]'
                }`}
              >
                <img
                  src={src}
                  alt={`${productName} ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/F5E9DC/8B5E3C?text=${i + 1}`; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom overlay — full screen lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2"
            onClick={() => setZoomed(false)}
          >
            ✕
          </button>
          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 text-white bg-white/20 rounded-full p-2"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 text-white bg-white/20 rounded-full p-2"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <img
            src={safeImages[activeIdx]}
            alt={productName}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/60 text-sm">
            {activeIdx + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </>
  );
}
