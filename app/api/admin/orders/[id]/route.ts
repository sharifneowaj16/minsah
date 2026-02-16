import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAccessToken } from '@/lib/auth/jwt';

// GET /api/admin/orders/[id] - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = request.cookies.get('admin_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const payload = await verifyAdminAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { id } = await params;

    // Support lookup by orderNumber or DB id
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
            variant: true,
          },
        },
        shippingAddress: true,
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Admin order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/orders/[id] - Update order status, tracking, admin notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = request.cookies.get('admin_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const payload = await verifyAdminAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, trackingNumber, adminNote } = body;

    // Find order by orderNumber or DB id
    const existing = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (status) {
      const statusMap: Record<string, string> = {
        pending: 'PENDING',
        confirmed: 'CONFIRMED',
        processing: 'PROCESSING',
        shipped: 'SHIPPED',
        completed: 'DELIVERED',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED',
        refunded: 'REFUNDED',
      };
      updateData.status = statusMap[status.toLowerCase()] || status.toUpperCase();

      // Set timestamp fields
      if (status === 'shipped') updateData.shippedAt = new Date();
      if (status === 'completed' || status === 'delivered') updateData.deliveredAt = new Date();
      if (status === 'cancelled') updateData.cancelledAt = new Date();
    }

    if (paymentStatus) {
      const paymentMap: Record<string, string> = {
        pending: 'PENDING',
        paid: 'COMPLETED',
        completed: 'COMPLETED',
        failed: 'FAILED',
        refunded: 'REFUNDED',
        cancelled: 'CANCELLED',
      };
      updateData.paymentStatus = paymentMap[paymentStatus.toLowerCase()] || paymentStatus.toUpperCase();
      if (paymentStatus === 'paid' || paymentStatus === 'completed') {
        updateData.paidAt = new Date();
      }
    }

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    // Auto-generate tracking if shipped and no tracking provided
    if (status === 'shipped' && !trackingNumber && !existing.trackingNumber) {
      updateData.trackingNumber = `TRK${Date.now()}`;
    }

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updated.orderNumber,
        dbId: updated.id,
        status: updated.status.toLowerCase(),
        paymentStatus: updated.paymentStatus.toLowerCase(),
        tracking: updated.trackingNumber,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin order PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
