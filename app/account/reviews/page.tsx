import { ReviewsClient } from '@/components/account/reviews-client';
import { Sparkles, Brush } from 'lucide-react';
import type { ProductReview } from '@/types/user';

const mockReviews: ProductReview[] = [
  { id: '1', productId: 'prod-001', productName: 'Premium Face Serum', productImage: '/images/products/face-serum.jpg', rating: 5, title: 'Amazing Product!', content: 'This face serum has completely transformed my skin. It feels so smooth and hydrated after just a week of use. The packaging is also beautiful and the scent is lovely. Highly recommend!', isVerified: true, helpfulCount: 24, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  { id: '2', productId: 'prod-002', productName: 'Luxury Lipstick Set', productImage: '/images/products/lipstick-set.jpg', rating: 4, title: 'Great colors, long lasting', content: 'The colors in this set are beautiful and very pigmented. They last for hours without needing to reapply. My only complaint is that the formula is a bit drying, so make sure to use lip balm underneath.', isVerified: true, helpfulCount: 18, createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-10') },
  { id: '3', productId: 'prod-003', productName: 'Organic Face Cream', productImage: '/images/products/face-cream.jpg', rating: 3, title: 'Good but not amazing', content: "This is a decent face cream. It's lightweight and absorbs quickly, but I didn't see any dramatic improvements in my skin. The price point is good for the quality though.", isVerified: true, helpfulCount: 7, createdAt: new Date('2023-12-28'), updatedAt: new Date('2023-12-28') },
  { id: '4', productId: 'prod-004', productName: 'Eye Shadow Palette', productImage: '/images/products/eyeshadow-palette.jpg', rating: 5, title: 'Beautiful pigmentation!', content: 'The pigmentation in these eyeshadows is incredible! They blend so easily and last all day without creasing. The color selection is perfect for both day and night looks. Will definitely repurchase.', isVerified: true, helpfulCount: 32, createdAt: new Date('2023-12-15'), updatedAt: new Date('2023-12-15') },
  { id: '5', productId: 'prod-005', productName: 'Mascara Deluxe', productImage: '/images/products/mascara.jpg', rating: 4, title: 'Great volume and length', content: "This mascara gives great volume and length to my lashes. I love the brush design - it separates the lashes perfectly. It can smudge a bit if you have watery eyes, but overall it's a great product.", isVerified: true, helpfulCount: 15, createdAt: new Date('2023-12-01'), updatedAt: new Date('2023-12-01') }
];

const mockReviewableProducts = [
  { id: 'prod-006', name: 'Blush Brush Set', image: <Brush className="w-8 h-8 text-orange-400" />, orderDate: new Date('2024-01-20'), canReview: true },
  { id: 'prod-007', name: 'Nail Polish Collection', image: <Sparkles className="w-8 h-8 text-red-400" />, orderDate: new Date('2024-01-18'), canReview: true }
];

export default async function ReviewsPage() {
  return <ReviewsClient reviews={mockReviews} reviewableProducts={mockReviewableProducts} />;
}
