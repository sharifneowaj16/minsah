import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';

// ── Telegram notification ─────────────────────────────────────────────────────
async function sendTelegram(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error('[Gift Order] Telegram error:', e);
  }
}

// ── WhatsApp notification (via existing WhatsApp number) ───────────────────────
// Note: This generates the WhatsApp link — actual auto-send requires WA Business API
// For now we'll just send Telegram; WhatsApp is handled client-side

// POST /api/gift/[token]/order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // ── 1. Fetch gift request ─────────────────────────────────────────────────
    const gift = await prisma.giftRequest.findUnique({
      where: { token },
      include: {
        product: {
          select: {
            id:             true,
            name:           true,
            sku:            true,
            price:          true,
            compareAtPrice: true,
            quantity:       true,
            trackInventory: true,
            allowBackorder: true,
            images:         { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!gift) {
      return NextResponse.json({ error: 'Gift link bulunamadı' }, { status: 404 });
    }
    if (gift.status === 'ORDERED') {
      return NextResponse.json({ error: 'Bu gift zaten sipariş edildi' }, { status: 409 });
    }
    if (gift.status === 'EXPIRED' || new Date() > gift.expiresAt) {
      return NextResponse.json({ error: 'Gift link süresi dolmuş' }, { status: 410 });
    }

    // ── 2. Delivery address ───────────────────────────────────────────────────
    // SEND_GIFT: recipient fills address (comes in body)
    // GET_GIFT:  requester pre-filled address (stored in gift.requesterAddress)
    const isSendGift = gift.giftType === 'SEND_GIFT';

    let deliveryName:  string;
    let deliveryPhone: string;
    let deliveryStreet: string;
    let deliveryCity:  string;
    let deliveryNote:  string | undefined;
    let payerName:     string;

    if (isSendGift) {
      // Recipient fills address
      const { name, phone, street, city, note } = body;
      if (!name || !phone || !street || !city) {
        return NextResponse.json(
          { error: 'নাম, ফোন, ঠিকানা ও জেলা দিন' },
          { status: 400 }
        );
      }
      deliveryName   = name;
      deliveryPhone  = phone;
      deliveryStreet = street;
      deliveryCity   = city;
      deliveryNote   = note;
      payerName      = gift.senderName;
    } else {
      // GET_GIFT: address pre-filled by requester
      const addr = gift.requesterAddress as {
        name: string; phone: string; street: string; city: string;
      } | null;

      if (!addr) {
        return NextResponse.json({ error: 'Delivery address bulunamadı' }, { status: 400 });
      }
      deliveryName   = addr.name;
      deliveryPhone  = addr.phone;
      deliveryStreet = addr.street;
      deliveryCity   = addr.city;
      payerName      = gift.recipientName; // payer is the one who received the GET_GIFT link
    }

    // ── 3. Payer identity ─────────────────────────────────────────────────────
    // Try session first, fall back to guest fields from body
    const session = await getServerSession(authOptions);
    const payerUserId = session?.user?.id ?? null;

    // Guest fields (if not logged in)
    const guestName  = body.payerName  || payerName;
    const guestPhone = body.payerPhone || null;

    // ── 4. Stock check ────────────────────────────────────────────────────────
    const product = gift.product;
    if (product.trackInventory && !product.allowBackorder && product.quantity < 1) {
      return NextResponse.json({ error: 'পণ্যটি স্টকে নেই' }, { status: 409 });
    }

    // ── 5. Create or resolve shipping address in DB ───────────────────────────
    // For logged-in users, create/reuse address. For guests, create a one-off address.
    const nameParts = deliveryName.split(' ');
    const firstName = nameParts[0] || deliveryName;
    const lastName  = nameParts.slice(1).join(' ') || '';

    // ── 6. Transaction: address + order + decrement stock + update gift ───────
    const result = await prisma.$transaction(async (tx) => {

      // 6a. Create shipping address
      const address = await tx.address.create({
        data: {
          // For logged-in payers, link to their account; guests get userId null workaround
          // We'll use sender/recipient userId if available, else use a system fallback
          userId:    payerUserId ?? (gift.senderId ?? gift.recipientId ?? ''),
          firstName,
          lastName,
          phone:     deliveryPhone,
          street1:   deliveryStreet,
          city:      deliveryCity,
          state:     deliveryCity,
          postalCode: '',
          country:   'Bangladesh',
          isDefault: false,
          type:      'SHIPPING',
        },
      });

      // 6b. Order number
      const orderNumber = `MB${Date.now()}${Math.random()
        .toString(36).substring(2, 5).toUpperCase()}`;

      const unitPrice = parseFloat(product.price.toString());
      const total     = unitPrice; // 1 item, no shipping for gift

      // 6c. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          // userId required by schema — use payer if logged in, else sender/recipient
          userId:        payerUserId ?? gift.senderId ?? gift.recipientId ?? '',
          addressId:     address.id,
          status:        'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: 'cod', // default; bKash handled client-side
          subtotal:      unitPrice,
          shippingCost:  0,
          taxAmount:     0,
          discountAmount:0,
          total,
          isGiftOrder:   true,
          giftToken:     token,
          customerNote:  `🎁 Gift Order — ${isSendGift ? `From: ${gift.senderName}` : `Requested by: ${gift.senderName}`} | Payer: ${guestName}${deliveryNote ? ` | Note: ${deliveryNote}` : ''}`,
          items: {
            create: [{
              productId: product.id,
              variantId: gift.variantId ?? null,
              name:      product.name,
              sku:       product.sku,
              price:     unitPrice,
              quantity:  1,
              total:     unitPrice,
            }],
          },
        },
      });

      // 6d. Decrement stock
      if (product.trackInventory) {
        if (gift.variantId) {
          await tx.productVariant.update({
            where: { id: gift.variantId },
            data:  { quantity: { decrement: 1 } },
          });
        } else {
          await tx.product.update({
            where: { id: product.id },
            data:  { quantity: { decrement: 1 } },
          });
        }
      }

      // 6e. Mark gift as ORDERED
      await tx.giftRequest.update({
        where: { token },
        data:  { status: 'ORDERED', orderedAt: new Date() },
      });

      // 6f. Create admin notification
      await tx.adminNotification.create({
        data: {
          type:    'GIFT_ORDER',
          title:   '🎁 নতুন Gift Order',
          message: `${guestName} — ${product.name} — ৳${total.toLocaleString()} | Delivery: ${deliveryName}, ${deliveryCity}`,
          orderId: order.id,
          isRead:  false,
        },
      });

      return { order, address };
    });

    // ── 7. Telegram notification ──────────────────────────────────────────────
    const tgMsg = [
      `🎁 <b>নতুন Gift Order!</b>`,
      ``,
      `📦 পণ্য: ${product.name}`,
      `💰 মূল্য: ৳${parseFloat(product.price.toString()).toLocaleString()}`,
      ``,
      `👤 Payer: ${guestName}${guestPhone ? ` (${guestPhone})` : ''}`,
      `📍 Delivery: ${deliveryName}`,
      `📞 Phone: ${deliveryPhone}`,
      `🏠 ঠিকানা: ${deliveryStreet}, ${deliveryCity}`,
      ``,
      `🎀 Gift Type: ${isSendGift ? 'Send Gift' : 'Get Gift'}`,
      `🔑 Token: <code>${token}</code>`,
      `📋 Order: #${result.order.orderNumber}`,
    ].join('\n');

    sendTelegram(tgMsg).catch(() => {}); // fire and forget

    return NextResponse.json({
      success:     true,
      orderNumber: result.order.orderNumber,
      orderId:     result.order.id,
    });

  } catch (error) {
    console.error('[Gift Order] Error:', error);
    return NextResponse.json(
      { error: 'Order create করতে পারিনি। আবার try করুন।' },
      { status: 500 }
    );
  }
}
