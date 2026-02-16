import { ReferralsClient } from '@/components/account/referrals-client';
import { Copy, Mail, MessageSquare } from 'lucide-react';
import { LOYALTY_CONFIG } from '@/types/user';
import type { Referral } from '@/types/user';

const mockReferralData = {
  referralCode: 'JOHN2024',
  referralLink: 'https://minsahbeauty.com/referral/JOHN2024',
  totalReferrals: 8,
  successfulReferrals: 5,
  pendingReferrals: 3,
  totalEarned: 3500,
  referralStats: { thisMonth: 2, lastMonth: 3, lifetime: 5 },
  rewards: {
    signupBonus: LOYALTY_CONFIG.points_for_referral_signup,
    purchaseBonus: LOYALTY_CONFIG.points_for_referral_purchase,
    totalPotential: 7500
  }
};

const mockReferrals: Referral[] = [
  { id: '1', referralCode: 'JOHN2024', referredEmail: 'sarah.johnson@email.com', referredName: 'Sarah Johnson', status: 'completed', rewardPoints: 1500, createdAt: new Date('2024-01-10'), completedAt: new Date('2024-01-15') },
  { id: '2', referralCode: 'JOHN2024', referredEmail: 'mike.wilson@email.com', referredName: 'Mike Wilson', status: 'made_purchase', rewardPoints: 1500, createdAt: new Date('2024-01-08'), completedAt: new Date('2024-01-12') },
  { id: '3', referralCode: 'JOHN2024', referredEmail: 'emma.brown@email.com', referredName: 'Emma Brown', status: 'made_purchase', rewardPoints: 1000, createdAt: new Date('2024-01-05'), completedAt: new Date('2024-01-10') },
  { id: '4', referralCode: 'JOHN2024', referredEmail: 'david.lee@email.com', referredName: 'David Lee', status: 'signed_up', rewardPoints: 500, createdAt: new Date('2024-01-03') },
  { id: '5', referralCode: 'JOHN2024', referredEmail: 'lisa.anderson@email.com', referredName: 'Lisa Anderson', status: 'pending', rewardPoints: 0, createdAt: new Date('2023-12-28') }
];

const shareOptions = [
  { name: 'Copy Link', icon: Copy, action: 'copy' },
  { name: 'Email', icon: Mail, action: 'email' },
  { name: 'Facebook', icon: MessageSquare, action: 'facebook' },
  { name: 'Twitter', icon: MessageSquare, action: 'twitter' }
];

const emailTemplates = [
  { id: 'personal', name: 'Personal Message', subject: 'Join me at Minsah Beauty!', body: 'Hi there!\n\nI wanted to share this amazing beauty brand with you - Minsah Beauty. They have incredible toxin-free skincare and makeup products that I absolutely love.\n\nUse my referral code {referralCode} to get a special welcome bonus when you sign up!\n\nCheck them out here: {referralLink}\n\nBest regards,\n{senderName}' },
  { id: 'casual', name: 'Casual Invite', subject: "You've got to check this out!", body: 'Hey!\n\nFound this awesome beauty store called Minsah Beauty and thought you would love it. Amazing products, great prices, and they are all about clean beauty.\n\nUse my code {referralCode} for a discount on your first order. Here is the link: {referralLink}\n\nEnjoy!' }
];

export default async function ReferralsPage() {
  return <ReferralsClient referralData={mockReferralData} referrals={mockReferrals} shareOptions={shareOptions} emailTemplates={emailTemplates} />;
}
