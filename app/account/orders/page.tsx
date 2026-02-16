import { OrdersClient } from '@/components/account/orders-client';
import { Sparkles, Brush, Eye, Package } from 'lucide-react';

// Mock data
const mockOrders = [
  {
    id: '1',
    orderNumber: 'MB-2024-001',
    status: 'delivered',
    paymentStatus: 'paid',
    items: [
      { id: '1', productName: 'Premium Face Serum', productImage: <Sparkles className="w-8 h-8 text-purple-400" />, quantity: 2, price: 29.99, totalPrice: 59.98 },
      { id: '2', productName: 'Luxury Lipstick Set', productImage: <Brush className="w-8 h-8 text-pink-400" />, quantity: 1, price: 24.99, totalPrice: 24.99 }
    ],
    total: 90.96,
    createdAt: new Date('2024-01-15'),
    estimatedDelivery: new Date('2024-01-20'),
    canReview: true
  },
  {
    id: '2',
    orderNumber: 'MB-2024-002',
    status: 'shipped',
    paymentStatus: 'paid',
    items: [
      { id: '3', productName: 'Organic Face Cream', productImage: <Sparkles className="w-8 h-8 text-green-400" />, quantity: 1, price: 45.99, totalPrice: 45.99 }
    ],
    total: 51.98,
    createdAt: new Date('2024-01-20'),
    estimatedDelivery: new Date('2024-01-25'),
    trackingNumber: 'TRK123456789',
    canReview: false
  },
  {
    id: '3',
    orderNumber: 'MB-2024-003',
    status: 'processing',
    paymentStatus: 'paid',
    items: [
      { id: '4', productName: 'Eye Shadow Palette', productImage: <Package className="w-8 h-8 text-yellow-400" />, quantity: 1, price: 35.99, totalPrice: 35.99 },
      { id: '5', productName: 'Mascara Deluxe', productImage: <Eye className="w-8 h-8 text-blue-400" />, quantity: 2, price: 19.99, totalPrice: 39.98 }
    ],
    total: 85.97,
    createdAt: new Date('2024-01-22'),
    estimatedDelivery: new Date('2024-01-28'),
    canReview: false
  }
];

export default async function OrdersPage() {
  return <OrdersClient initialOrders={mockOrders} />;
}
