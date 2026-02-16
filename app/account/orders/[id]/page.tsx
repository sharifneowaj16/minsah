import { OrderDetailClient } from '@/components/account/order-detail-client';

// Mock order data
const mockOrderData: Record<string, any> = {
  '1': {
    id: '1',
    orderNumber: 'MB-2024-001',
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    items: [
      { id: '1', productName: 'Premium Face Serum', productImage: '💄', quantity: 2, price: 29.99, totalPrice: 59.98, sku: 'PFS-001' },
      { id: '2', productName: 'Luxury Lipstick Set', productImage: '💋', quantity: 1, price: 24.99, totalPrice: 24.99, sku: 'LLS-002' }
    ],
    subtotal: 84.97,
    shipping: 5.99,
    tax: 0,
    discount: 0,
    total: 90.96,
    currency: 'USD',
    createdAt: new Date('2024-01-15'),
    estimatedDelivery: new Date('2024-01-20'),
    deliveredAt: new Date('2024-01-19'),
    trackingNumber: 'TRK123456789',
    carrier: 'FedEx',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Beauty Street',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
      phone: '+1 (555) 123-4567'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Beauty Street',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
      phone: '+1 (555) 123-4567'
    },
    tracking: [
      {
        timestamp: new Date('2024-01-15T10:00:00'),
        status: 'ordered',
        description: 'Order placed successfully',
        location: 'Online'
      },
      {
        timestamp: new Date('2024-01-15T14:30:00'),
        status: 'confirmed',
        description: 'Order confirmed and payment processed',
        location: 'Processing Center'
      },
      {
        timestamp: new Date('2024-01-16T09:15:00'),
        status: 'processing',
        description: 'Order is being prepared for shipment',
        location: 'Warehouse'
      },
      {
        timestamp: new Date('2024-01-17T16:45:00'),
        status: 'shipped',
        description: 'Package shipped with FedEx',
        location: 'New York, NY'
      },
      {
        timestamp: new Date('2024-01-19T11:20:00'),
        status: 'delivered',
        description: 'Package delivered successfully',
        location: 'New York, NY'
      }
    ],
    notes: 'Please leave package at front door if no one is home.'
  }
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = mockOrderData[params.id];

  return <OrderDetailClient order={order} />;
}
