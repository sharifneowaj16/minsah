import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth:me');

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const tokenFromCookie = request.cookies.get('auth_token')?.value;
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        loyaltyPoints: true,
        referralCode: true,
        newsletter: true,
        smsNotifications: true,
        promotions: true,
        newProducts: true,
        orderUpdates: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      logger.warn('User not found for valid token', { userId: payload.userId });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      logger.warn('Inactive user attempted to access profile', { userId: user.id, status: user.status });
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Format response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role.toLowerCase(),
      status: user.status.toLowerCase(),
      emailVerified: !!user.emailVerified,
      loyaltyPoints: user.loyaltyPoints,
      referralCode: user.referralCode,
      preferences: {
        newsletter: user.newsletter,
        smsNotifications: user.smsNotifications,
        promotions: user.promotions,
        newProducts: user.newProducts,
        orderUpdates: user.orderUpdates,
      },
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    return NextResponse.json({ user: userResponse });

  } catch (error) {
    logger.error('Error fetching user profile', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
