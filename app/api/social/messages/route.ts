import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Inbox messages list — no hard limit, supports pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const platform = searchParams.get('platform');
    const unreadOnly = searchParams.get('unread') === 'true';
    const cursor = searchParams.get('cursor'); // for pagination
    const take = Math.min(parseInt(searchParams.get('take') || '500', 10), 1000);

    const baseWhere = {
      ...(platform && { platform }),
      ...(unreadOnly ? { isRead: false, isIncoming: true } : {}),
    };

    const messages = await prisma.socialMessage.findMany({
      where: baseWhere,
      orderBy: { timestamp: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const unreadCount = await prisma.socialMessage.count({
      where: {
        ...(platform && { platform }),
        isRead: false,
        isIncoming: true,
      },
    });

    const nextCursor = messages.length === take ? messages[messages.length - 1]?.id : null;

    return NextResponse.json({ messages, unreadCount, nextCursor });
  } catch (e) {
    console.error('GET /api/social/messages error:', e);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// PATCH - Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const { id, conversationId, platform, markAll } = await request.json();

    if (markAll) {
      await prisma.socialMessage.updateMany({
        where: {
          ...(platform && { platform }),
          isRead: false,
          isIncoming: true,
        },
        data: { isRead: true },
      });
    } else if (conversationId) {
      await prisma.socialMessage.updateMany({
        where: {
          conversationId,
          ...(platform && { platform }),
          isRead: false,
          isIncoming: true,
        },
        data: { isRead: true },
      });
    } else if (id) {
      await prisma.socialMessage.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/social/messages error:', e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
