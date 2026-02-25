import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/orders - Create a new order from checkout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const {
      items,
      addressId,       // DB address id (logged-in users with saved address)
      addressData,     // Inline address object (guest users OR new unsaved address)
      paymentMethod,
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

    // ─── Resolve shipping address ───────────────────────────────────────────
    let resolvedAddressId: string | null = null;

    if (session?.user?.id) {
      // Logged-in user
      if (addressId) {
        // Verify address belongs to this user
        const address = await prisma.address.findFirst({
          where: { id: addressId, userId: session.user.id },
        });

        if (!address) {
          // Maybe it's a temp/local id — try to find default address instead
          const defaultAddr = await prisma.address.findFirst({
            where: { userId: session.user.id, isDefault: true },
          });
          if (!defaultAddr) {
            // Last resort: any address for this user
            const anyAddr = await prisma.address.findFirst({
              where: { userId: session.user.id },
              orderBy: { createdAt: 'desc' },
            });
            if (!anyAddr && !addressData) {
              return NextResponse.json({ error: 'Shipping address not found. Please add an address first.' }, { status: 400 });
            }
            resolvedAddressId = anyAddr?.id ?? null;
          } else {
            resolvedAddressId = defaultAddr.id;
          }
        } else {
          resolvedAddressId = address.id;
        }
      } else if (addressData) {
        // Logged-in user passing inline address (e.g. just added a new one)
        const newAddress = await prisma.address.create({
          data: {
            userId:    session.user.id,
            firstName: addressData.fullName || addressData.firstName || '',
            lastName:  addressData.lastName || '',
            phone:     addressData.phoneNumber || addressData.phone || '',
            street1:   addressData.address || addressData.street1 || '',
            street2:   addressData.zone || addressData.street2 || null,
            city:      addressData.city || '',
            state:     addressData.provinceRegion || addressData.state || '',
            postalCode:addressData.postalCode || '',
            country:   addressData.country || 'Bangladesh',
            isDefault: false,
            type:      'SHIPPING',
          },
        });
        resolvedAddressId = newAddress.id;
      } else {
        return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
      }
    } else {
      // Guest user — must provide inline addressData
      if (!addressData) {
        return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
      }
      // Guest: create a temp address without userId (make userId optional or store in note)
      // Since Address model requires userId, store address inline in customerNote
      // and skip addressId for guest orders
      resolvedAddressId = null;
    }

    // ─── Generate order number ───────────────────────────────────────────────
    const orderNumber = `MB${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // ─── Create order ────────────────────────────────────────────────────────
    const orderData: Parameters<typeof prisma.order.create>[0]['data'] = {
      orderNumber,
      status:         'PENDING',
      paymentStatus:  'PENDING',
      paymentMethod,
      subtotal:       subtotal || 0,
      shippingCost:   shippingCost || 0,
      taxAmount:      taxAmount || 0,
      discountAmount: discountAmount || 0,
      total:          total || 0,
      couponCode:     couponCode || null,
      couponDiscount: couponDiscount || null,
      customerNote:   customerNote || null,
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
          name:      item.name,
          sku:       item.sku || '',
          price:     item.price,
          quantity:  item.quantity,
          total:     item.price * item.quantity,
        })),
      },
    };

    // Attach user if logged in
    if (session?.user?.id) {
      orderData.userId = session.user.id;
    } else {
      // For guest, store shipping info in customerNote if no userId
      const guestNote = addressData
        ? `GUEST ORDER | ${addressData.fullName || ''} | ${addressData.phoneNumber || ''} | ${addressData.address || ''}, ${addressData.city || ''}`
        : '';
      orderData.customerNote = [customerNote, guestNote].filter(Boolean).join(' | ') || null;
    }

    // Attach address if resolved
    if (resolvedAddressId) {
      orderData.addressId = resolvedAddressId;
    }

    // Guest orders require a userId in DB — create guest user or skip if schema requires it
    // NOTE: If your Order model has userId as required (non-nullable), guest orders need
    // a guest User record. Check schema: userId String (required) means we need a user.
    // For now, if no session, return error asking user to log in OR create guest account.
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Please log in to place an order.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({ data: orderData });
      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectURL: `/checkout/order-confirmed?orderNumber=${order.orderNumber}`,
    });

  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}

// GET /api/orders - List current user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const skip  = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
              },
            },
          },
          shippingAddress: true,
        },
      }),
      prisma.order.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page, limit, totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
