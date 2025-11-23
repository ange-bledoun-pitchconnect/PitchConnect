import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        link: n.link,
        icon: n.icon,
        metadata: n.metadata,
      })),
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userId, type, title, message, link, metadata } = body;

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: userId || user.id,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || null,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      message: 'Notification created',
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
