// app/api/gift/create/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, senderName, recipientName, message } = body;

    if (!productId || !senderName?.trim() || !recipientName?.trim()) {
      return NextResponse.json(
        { error: 'productId, senderName, recipientName প্রয়োজন' },
        { status: 400 }
      );
    }

    // Product exists check
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, isActive: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি' }, { status: 404 });
    }

    // Unique 12-char token
    const token = randomBytes(6).toString('hex'); // e.g. "a3f9c2b1e4d8"

    // 7 days expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const gift = await prisma.giftRequest.create({
      data: {
        token,
        productId,
        variantId: variantId || null,
        senderName: senderName.trim(),
        recipientName: recipientName.trim(),
        message: message?.trim() || null,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minsahbeauty.cloud';
    const giftUrl = `${baseUrl}/gift/${gift.token}`;

    // WhatsApp share text
    const waText = encodeURIComponent(
      `🎁 ${recipientName}, তোমার জন্য একটা গিফট!\n\n${senderName} তোমাকে "${product.name}" গিফট করতে চায়।\n\nএই link-এ click করো:\n${giftUrl}\n\n💝 Minsah Beauty`
    );
    const waUrl = `https://wa.me/?text=${waText}`;

    // Facebook share
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(giftUrl)}`;

    return NextResponse.json({
      token: gift.token,
      giftUrl,
      waUrl,
      fbUrl,
      expiresAt: gift.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[Gift Create]', error);
    return NextResponse.json({ error: 'Gift link তৈরি হয়নি' }, { status: 500 });
  }
}
