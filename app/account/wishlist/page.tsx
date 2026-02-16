import { WishlistClient } from '@/components/account/wishlist-client';
import { Sparkles, Brush, Eye, Package } from 'lucide-react';

// Mock wishlist data
const mockWishlistItems = [
  {
    id: '1',
    productId: 'prod-001',
    productName: 'Premium Face Serum',
    productImage: <Sparkles className="w-12 h-12 text-purple-400" />,
    price: 29.99,
    originalPrice: 39.99,
    inStock: true,
    addedAt: new Date('2024-01-10'),
    category: 'Skincare',
    rating: 4.5,
    reviewCount: 234,
    discount: 25
  },
  {
    id: '2',
    productId: 'prod-002',
    productName: 'Luxury Lipstick Set',
    productImage: <Brush className="w-12 h-12 text-pink-400" />,
    price: 24.99,
    originalPrice: null,
    inStock: true,
    addedAt: new Date('2024-01-12'),
    category: 'Makeup',
    rating: 4.8,
    reviewCount: 156
  },
  {
    id: '3',
    productId: 'prod-003',
    productName: 'Organic Face Cream',
    productImage: <Sparkles className="w-12 h-12 text-green-400" />,
    price: 45.99,
    originalPrice: 55.99,
    inStock: false,
    addedAt: new Date('2024-01-08'),
    category: 'Skincare',
    rating: 4.7,
    reviewCount: 89,
    discount: 18,
    restockDate: new Date('2024-02-01')
  },
  {
    id: '4',
    productId: 'prod-004',
    productName: 'Eye Shadow Palette',
    productImage: <Package className="w-12 h-12 text-yellow-400" />,
    price: 35.99,
    originalPrice: null,
    inStock: true,
    addedAt: new Date('2024-01-15'),
    category: 'Makeup',
    rating: 4.6,
    reviewCount: 203
  },
  {
    id: '5',
    productId: 'prod-005',
    productName: 'Mascara Deluxe',
    productImage: <Eye className="w-12 h-12 text-blue-400" />,
    price: 19.99,
    originalPrice: 24.99,
    inStock: true,
    addedAt: new Date('2024-01-14'),
    category: 'Makeup',
    rating: 4.4,
    reviewCount: 178,
    discount: 20
  }
];

export default async function WishlistPage() {
  return <WishlistClient initialItems={mockWishlistItems} />;
}
