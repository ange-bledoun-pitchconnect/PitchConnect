import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch user notifications
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

    // Get notifications (FIXED: isRead → read)
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { read: false }),  // ✅ FIXED: was isRead
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Calculate unread count (FIXED: already correct)
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,  // ✅ Already correct
      },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,  // ✅ FIXED: use n.read directly
        isRead: n.read, // Alias for backward compatibility
        createdAt: n.createdAt.toISOString(),
        link: n.link,
        metadata: n.metadata,
      })),
      unreadCount,
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

// POST - Create notification
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

    // Create notification (FIXED: isRead → read)
    const notification = await prisma.notification.create({
      data: {
        userId: userId || user.id,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || null,
        read: false,  // ✅ FIXED: was isRead
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

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
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
    const { notificationId, notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read (FIXED: isRead → read)
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,  // ✅ FIXED: was isRead
        },
        data: {
          read: true,  // ✅ FIXED: was isRead
        },
      });

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark multiple notifications as read (FIXED: isRead → read)
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: {
          read: true,  // ✅ FIXED: was isRead
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read',
      });
    } else if (notificationId) {
      // Mark single notification as read (FIXED: isRead → read)
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: user.id,
        },
        data: {
          read: true,  // ✅ FIXED: was isRead
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      return NextResponse.json(
        { error: 'No notification ID(s) provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      {
        error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
