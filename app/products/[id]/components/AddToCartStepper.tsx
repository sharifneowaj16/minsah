'use client';

import { useState, useTransition } from 'react';
import { ShoppingCart, Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface AddToCartStepperProps {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  maxStock?: number;
  variantId?: string | null;
  className?: string;
}

export default function AddToCartStepper({
  productId,
  productName,
  productImage,
  price,
  maxStock = 99,
  variantId,
  className = '',
}: AddToCartStepperProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [isPending, startTransition] = useTransition();

  // Cart-এ এই product আছে কিনা দেখো
  const cartItemId = variantId || productId;
  const cartItem = items.find((i) => i.id === cartItemId);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    startTransition(async () => {
      await addItem({
        id: cartItemId,
        name: productName,
        price,
        quantity: 1,
        image: productImage,
      });
    });
  };

  const handleIncrement = () => {
    if (qty >= maxStock) return;
    startTransition(async () => {
      await updateQuantity(cartItemId, qty + 1);
    });
  };

  const handleDecrement = () => {
    if (qty > 1) {
      startTransition(async () => {
        await updateQuantity(cartItemId, qty - 1);
      });
    } else {
      // qty === 1 → remove
      startTransition(async () => {
        await removeItem(cartItemId);
      });
    }
  };

  // ── Add to Cart button ─────────────────────────────────────────
  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        disabled={isPending}
        aria-label={`Add ${productName} to cart`}
        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 bg-[#3D1F0E] text-[#F5E6D3] hover:bg-[#2A1509] ${className}`}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShoppingCart size={16} />
        )}
        Add to Cart
      </button>
    );
  }

  // ── Stepper ────────────────────────────────────────────────────
  return (
    <div
      className={`flex items-center gap-0 rounded-2xl overflow-hidden border-2 border-[#3D1F0E] ${className}`}
      role="group"
      aria-label={`${productName} quantity`}
    >
      {/* Decrement / Trash */}
      <button
        onClick={handleDecrement}
        disabled={isPending}
        aria-label={qty === 1 ? `Remove ${productName} from cart` : `Decrease ${productName} quantity`}
        className="w-10 h-10 flex items-center justify-center text-[#3D1F0E] hover:bg-[#F5E9DC] transition-colors duration-150 disabled:opacity-50 flex-shrink-0"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : qty === 1 ? (
          <Trash2 size={15} className="text-red-500" />
        ) : (
          <Minus size={15} />
        )}
      </button>

      {/* Quantity */}
      <span
        className="min-w-[32px] text-center text-sm font-bold text-[#1A0D06] select-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {isPending ? (
          <Loader2 size={13} className="animate-spin mx-auto" />
        ) : (
          qty
        )}
      </span>

      {/* Increment */}
      <button
        onClick={handleIncrement}
        disabled={isPending || qty >= maxStock}
        aria-label={`Increase ${productName} quantity`}
        className="w-10 h-10 flex items-center justify-center text-[#3D1F0E] hover:bg-[#F5E9DC] transition-colors duration-150 disabled:opacity-40 flex-shrink-0"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
