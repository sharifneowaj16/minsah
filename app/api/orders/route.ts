import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/orders - Create a new order from checkout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      items,           // [{ productId, variantId?, name, sku, price, quantity }]
      addressId,       // shipping address DB id
      paymentMethod,   // 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card'
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      total,
      couponCode,
      couponDiscount,
      customerNote,
    } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }
    if (!addressId) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 });
    }

    // Generate unique order number
    const orderNumber = `MB${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod,
          subtotal: subtotal || 0,
          shippingCost: shippingCost || 0,
          taxAmount: taxAmount || 0,
          discountAmount: discountAmount || 0,
          total: total || 0,
          addressId,
          couponCode: couponCode || null,
          couponDiscount: couponDiscount || null,
          customerNote: customerNote || null,
          items: {
            create: items.map((item: {
              productId: string;
              variantId?: string;
              name: string;
              sku: string;
              price: number;
              quantity: number;
            }) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              name: item.name,
              sku: item.sku || '',
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            })),
          },
        },
      });

      // Clear user's cart after order creation
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      redirectURL: `/checkout/order-confirmed?orderNumber=${order.orderNumber}`,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders - Get current user's orders
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
