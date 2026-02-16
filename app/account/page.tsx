import { DashboardClient } from '@/components/account/dashboard-client';
import {
  ShoppingBag,
  Star,
  BarChart3,
  Heart,
  MapPin,
  Users
} from 'lucide-react';

// Mock dashboard data
const mockDashboardData = {
  recentOrders: [
    {
      id: '1',
      orderNumber: 'MB-2024-001',
      status: 'delivered',
      total: 90.96,
      createdAt: new Date('2024-01-15'),
      itemCount: 2
    },
    {
      id: '2',
      orderNumber: 'MB-2024-002',
      status: 'shipped',
      total: 51.98,
      createdAt: new Date('2024-01-20'),
      itemCount: 1
    }
  ],
  wishlistItems: 12,
  savedAddresses: 3,
  unreadNotifications: 2,
  upcomingOrderDate: new Date('2024-01-25'),
  loyaltyPointsExpiring: 150,
  expiryDate: new Date('2024-02-28')
};

const quickActions = [
  {
    name: 'Shop New Arrivals',
    description: 'Check out the latest products',
    href: '/shop?category=new-arrivals',
    icon: ShoppingBag,
    color: 'purple'
  },
  {
    name: 'Write a Review',
    description: 'Share your experience',
    href: '/account/reviews',
    icon: Star,
    color: 'yellow'
  },
  {
    name: 'Refer a Friend',
    description: 'Earn 500 points per referral',
    href: '/account/referrals',
    icon: Users,
    color: 'blue'
  },
  {
    name: 'Update Profile',
    description: 'Keep your information current',
    href: '/account/settings',
    icon: MapPin,
    color: 'green'
  }
];

const upcomingFeatures = [
  {
    name: 'Personalized Recommendations',
    description: 'AI-powered product suggestions based on your preferences',
    icon: Star,
    progress: 80
  },
  {
    name: 'Beauty Profile Quiz',
    description: 'Find the perfect products for your skin type',
    icon: BarChart3,
    progress: 60
  },
  {
    name: 'Virtual Try-On',
    description: 'See how makeup looks before you buy',
    icon: Heart,
    progress: 40
  }
];

export default async function AccountDashboard() {
  return (
    <DashboardClient
      initialData={mockDashboardData}
      quickActions={quickActions}
      upcomingFeatures={upcomingFeatures}
    />
  );
}
