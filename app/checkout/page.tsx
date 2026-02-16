'use client';

import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, CreditCard, FileText, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { formatPrice, convertUSDtoBDT } from '@/utils/currency';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    shippingCost,
    tax,
    total,
    selectedAddress,
    selectedPaymentMethod,
    updateQuantity
  } = useCart();

  const [expandedSection, setExpandedSection] = useState<'address' | 'payment' | 'summary' | null>('address');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const bdtSubtotal = convertUSDtoBDT(subtotal);
  const bdtShipping = convertUSDtoBDT(shippingCost);
  const bdtTax = convertUSDtoBDT(tax);
  const bdtTotal = convertUSDtoBDT(total);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a shipping address');
      return;
    }
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            sku: item.sku || '',
            price: item.price,
            quantity: item.quantity,
          })),
          addressId: selectedAddress.id,
          paymentMethod: selectedPaymentMethod.type,
          subtotal,
          shippingCost,
          taxAmount: tax,
          discountAmount: 0,
          total,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to place order. Please try again.');
        return;
      }

      router.push(data.redirectURL || '/checkout/order-confirmed');
    } catch {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const toggleSection = (section: 'address' | 'payment' | 'summary') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-minsah-light pb-24">
      {/* Header */}
      <header className="bg-minsah-dark text-minsah-light sticky top-0 z-50 shadow-md">
        <div className="px-4 py-4 flex items-center justify-between">
          <Link href="/cart" className="p-2 hover:bg-minsah-primary rounded-lg transition">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-semibold">Checkout</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Shipping Address Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('address')}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-minsah-accent/30 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-minsah-accent rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-minsah-primary" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-minsah-dark">Shipping Address</h2>
                {selectedAddress && !expandedSection && (
                  <p className="text-xs text-minsah-secondary line-clamp-1">
                    {selectedAddress.address}
                  </p>
                )}
              </div>
            </div>
            {expandedSection === 'address' ? (
              <ChevronUp className="text-minsah-secondary" size={20} />
            ) : (
              <ChevronDown className="text-minsah-secondary" size={20} />
            )}
          </button>

          {expandedSection === 'address' && (
            <div className="px-4 pb-4 border-t border-minsah-accent">
              {selectedAddress ? (
                <div className="mt-4 p-4 bg-minsah-accent rounded-xl relative">
                  <Link
                    href="/checkout/select-address"
                    className="absolute top-3 right-3 p-2 bg-white rounded-lg hover:bg-minsah-light transition"
                  >
                    <Edit2 size={16} className="text-minsah-primary" />
                  </Link>
                  <div className="pr-12">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin size={16} className="text-minsah-primary mt-0.5" />
                      <p className="text-sm font-semibold text-minsah-dark">
                        {selectedAddress.address}
                      </p>
                    </div>
                    <p className="text-sm text-minsah-secondary ml-6">
                      {selectedAddress.city}, {selectedAddress.zone}
                    </p>
                    <p className="text-sm text-minsah-secondary ml-6">
                      {selectedAddress.fullName} • {selectedAddress.phoneNumber}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  href="/checkout/select-address"
                  className="mt-4 block w-full bg-minsah-primary text-minsah-light text-center py-3 rounded-xl font-semibold hover:bg-minsah-dark transition"
                >
                  Add Shipping Address
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Payment Method Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('payment')}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-minsah-accent/30 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-minsah-accent rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-minsah-primary" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-minsah-dark">Payment Method</h2>
                {selectedPaymentMethod && !expandedSection && (
                  <p className="text-xs text-minsah-secondary">
                    {selectedPaymentMethod.name}
                  </p>
                )}
              </div>
            </div>
            {expandedSection === 'payment' ? (
              <ChevronUp className="text-minsah-secondary" size={20} />
            ) : (
              <ChevronDown className="text-minsah-secondary" size={20} />
            )}
          </button>

          {expandedSection === 'payment' && (
            <div className="px-4 pb-4 border-t border-minsah-accent">
              {selectedPaymentMethod ? (
                <div className="mt-4 p-4 bg-minsah-accent rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-xl">{selectedPaymentMethod.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-minsah-dark">{selectedPaymentMethod.name}</p>
                      {selectedPaymentMethod.details && (
                        <p className="text-xs text-minsah-secondary">{selectedPaymentMethod.details}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/checkout/payment-method"
                    className="p-2 bg-white rounded-lg hover:bg-minsah-light transition"
                  >
                    <Edit2 size={16} className="text-minsah-primary" />
                  </Link>
                </div>
              ) : (
                <Link
                  href="/checkout/payment-method"
                  className="mt-4 block w-full bg-minsah-primary text-minsah-light text-center py-3 rounded-xl font-semibold hover:bg-minsah-dark transition"
                >
                  Select Payment Method
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-minsah-accent/30 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-minsah-accent rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-minsah-primary" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-minsah-dark">Order Summary</h2>
                <p className="text-xs text-minsah-secondary">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-minsah-primary">{formatPrice(bdtTotal)}</span>
              {expandedSection === 'summary' ? (
                <ChevronUp className="text-minsah-secondary" size={20} />
              ) : (
                <ChevronDown className="text-minsah-secondary" size={20} />
              )}
            </div>
          </button>

          {expandedSection === 'summary' && (
            <div className="px-4 pb-4 border-t border-minsah-accent">
              {/* Cart Items */}
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-minsah-accent rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-white to-minsah-light rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image && (item.image.startsWith('/') || item.image.startsWith('http') || item.image.startsWith('data:')) ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{item.image || '✨'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-minsah-dark line-clamp-1 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-minsah-secondary mb-2">
                        {formatPrice(convertUSDtoBDT(item.price))}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-minsah-secondary hover:text-white transition"
                        >
                          −
                        </button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-minsah-secondary hover:text-white transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-minsah-primary">
                        {formatPrice(convertUSDtoBDT(item.price * item.quantity))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-minsah-secondary">Subtotal</span>
                  <span className="font-semibold text-minsah-dark">{formatPrice(bdtSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-minsah-secondary">Shipping Cost</span>
                  <span className="font-semibold text-minsah-dark">
                    {shippingCost === 0 ? 'FREE' : formatPrice(bdtShipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-minsah-secondary">Tax</span>
                  <span className="font-semibold text-minsah-dark">{formatPrice(bdtTax)}</span>
                </div>
                <div className="border-t border-minsah-secondary/20 pt-2 flex justify-between">
                  <span className="font-bold text-minsah-dark">Total</span>
                  <span className="font-bold text-minsah-primary text-lg">{formatPrice(bdtTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-minsah-light via-minsah-light to-transparent">
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedAddress || !selectedPaymentMethod || isPlacingOrder}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 ${
            selectedAddress && selectedPaymentMethod && !isPlacingOrder
              ? 'bg-minsah-primary text-minsah-light hover:bg-minsah-dark'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isPlacingOrder ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Placing Order...</span>
            </>
          ) : (
            <>
              <span>Place Order</span>
              <span className="text-xl">🔒</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
