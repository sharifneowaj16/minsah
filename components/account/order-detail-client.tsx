'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ORDER_STATUS } from '@/types/user';
import {
  ArrowLeft,
  Truck,
  CheckCircle,
  Clock,
  Package,
  MapPin,
  FileText,
  Phone,
  Mail
} from 'lucide-react';

interface OrderDetailClientProps {
  order: any;
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link
            href="/account/orders"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const getTimelineIcon = (status: string, isCompleted: boolean) => {
    const baseClasses = "w-6 h-6 rounded-full flex items-center justify-center";
    if (isCompleted) {
      return (
        <div className={`${baseClasses} bg-green-500`}>
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      );
    }

    switch (status) {
      case 'ordered':
        return <div className={`${baseClasses} bg-blue-500`}><Package className="w-3 h-3 text-white" /></div>;
      case 'shipped':
        return <div className={`${baseClasses} bg-purple-500`}><Truck className="w-3 h-3 text-white" /></div>;
      default:
        return <div className={`${baseClasses} bg-gray-300`}><Clock className="w-3 h-3 text-white" /></div>;
    }
  };

  const currentStatusIndex = order.tracking.findIndex((t: any) => t.status === order.status);
  const isCompleted = (index: number) => index <= currentStatusIndex;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
          <p className="text-gray-600">Order {order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status & Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status & Timeline</h2>

              {/* Current Status */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-600">Current Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.color}-100 text-${ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.color}-800`}>
                    {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label}
                  </span>
                </div>
                {order.trackingNumber && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Tracking Number</span>
                      <span className="text-sm text-gray-900">{order.trackingNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Carrier</span>
                      <span className="text-sm text-gray-900">{order.carrier}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                {order.tracking.map((event: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4">
                    {getTimelineIcon(event.status, isCompleted(index))}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{event.description}</h4>
                        <span className="text-sm text-gray-600">
                          {event.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {event.location && <MapPin className="w-4 h-4 inline mr-1" />}
                        {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl">
                      {item.productImage}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${order.shipping.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${order.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-purple-600">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Method</span>
                    <span className="font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p className="text-gray-600">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
                )}
                <p className="text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p className="text-gray-600">{order.shippingAddress.country}</p>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {order.shippingAddress.phone}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {order.trackingNumber && (
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <Truck className="w-4 h-4 mr-2" />
                    Track Package
                  </button>
                )}
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Invoice
                </button>
                {(order.status === 'delivered' || order.status === 'shipped') && (
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    Return/Exchange
                  </button>
                )}
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-purple-600 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
