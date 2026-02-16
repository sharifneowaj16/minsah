import { SettingsClient } from '@/components/account/settings-client';
import type { User } from '@/types/user';

// Mock user data
const mockUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1 (555) 123-4567',
  dateOfBirth: new Date('1990-05-15'),
  gender: 'male',
  avatar: '/avatars/john-doe.jpg',
  emailVerified: true,
  phoneVerified: false,
  role: 'customer',
  status: 'active',
  createdAt: new Date('2023-01-15'),
  lastLoginAt: new Date('2024-01-20'),
  addresses: [],
  loyaltyPoints: 0,
  referralCode: 'JOHN123',
  preferences: {
    newsletter: true,
    smsNotifications: false,
    promotions: true,
    newProducts: true,
    orderUpdates: true
  }
};

export default async function ProfileSettingsPage() {
  return <SettingsClient initialUser={mockUser} />;
}
