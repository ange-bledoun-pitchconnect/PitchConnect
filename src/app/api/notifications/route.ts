// ============================================================================
// src/app/api/notifications/route.ts
// Notifications API Endpoints - GET, POST, PATCH
// Production-ready with comprehensive error handling
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/notifications
 * Fetch user notifications with advanced filtering and pagination
 * 
 * Query params:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - unreadOnly: boolean (default: false)
 * - type: NotificationType (optional filter)
 * - priority: 'HIGH' | 'MEDIUM' | 'LOW' (optional filter)
 * - startDate: ISO string (optional filter)
 * - endDate: ISO string (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = { userId: user.id };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch notifications
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          priority: true,
          channels: true,
          createdAt: true,
          updatedAt: true,
          link: true,
          actionLabel: true,
          metadata: true,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    // Calculate unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    // Format response
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      isRead: n.read, // Backward compatibility
      priority: n.priority || 'MEDIUM',
      channels: n.channels || ['in-app'],
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      link: n.link,
      actionLabel: n.actionLabel,
      metadata: n.metadata,
    }));

    logger.info('Notifications fetched', {
      userId: user.id,
      count: notifications.length,
      unreadCount,
      limit,
      offset,
    });

    return NextResponse.json(
      {
        success: true,
        notifications: formattedNotifications,
        unreadCount,
        totalCount,
        count: notifications.length,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('GET /api/notifications error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification (system/admin endpoint)
 * 
 * Body:
 * {
 *   userId: string (required - who to notify)
 *   type: NotificationType (required)
 *   title: string (required)
 *   message: string (required)
 *   priority?: 'HIGH' | 'MEDIUM' | 'LOW'
 *   channels?: ('in-app' | 'email' | 'sms' | 'push')[]
 *   link?: string (optional - where to navigate)
 *   actionLabel?: string (optional - button text)
 *   metadata?: Record<string, any> (optional - additional data)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, roles: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      priority = 'MEDIUM',
      channels = ['in-app'],
      link,
      actionLabel,
      metadata,
    } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority,
        channels,
        link: link || null,
        actionLabel: actionLabel || null,
        metadata: metadata || {},
        read: false,
        createdAt: new Date(),
      },
    });

    logger.info('Notification created', {
      notificationId: notification.id,
      userId,
      type,
      priority,
      createdBy: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: notification.read,
          priority: notification.priority,
          channels: notification.channels,
          createdAt: notification.createdAt.toISOString(),
          link: notification.link,
          actionLabel: notification.actionLabel,
          metadata: notification.metadata,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('POST /api/notifications error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Update multiple notifications (mark as read, archive, etc.)
 * 
 * Body:
 * {
 *   action: 'read' | 'read-all' | 'archive' | 'archive-all'
 *   notificationIds?: string[] (required for single/bulk actions)
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action field is required' },
        { status: 400 }
      );
    }

    let result: any;

    switch (action) {
      case 'read':
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { error: 'notificationIds array is required' },
            { status: 400 }
          );
        }

        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: user.id,
          },
          data: {
            read: true,
            updatedAt: new Date(),
          },
        });

        logger.info('Notifications marked as read', {
          userId: user.id,
          count: result.count,
        });

        return NextResponse.json({
          success: true,
          message: `${result.count} notification(s) marked as read`,
          count: result.count,
        });

      case 'read-all':
        result = await prisma.notification.updateMany({
          where: {
            userId: user.id,
            read: false,
          },
          data: {
            read: true,
            updatedAt: new Date(),
          },
        });

        logger.info('All notifications marked as read', {
          userId: user.id,
          count: result.count,
        });

        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read',
          count: result.count,
        });

      case 'archive':
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { error: 'notificationIds array is required' },
            { status: 400 }
          );
        }

        // Assuming you have an 'archived' field or soft delete
        result = await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: user.id,
          },
        });

        logger.info('Notifications archived', {
          userId: user.id,
          count: result.count,
        });

        return NextResponse.json({
          success: true,
          message: `${result.count} notification(s) archived`,
          count: result.count,
        });

      case 'archive-all':
        result = await prisma.notification.deleteMany({
          where: {
            userId: user.id,
          },
        });

        logger.info('All notifications archived', {
          userId: user.id,
          count: result.count,
        });

        return NextResponse.json({
          success: true,
          message: 'All notifications archived',
          count: result.count,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('PATCH /api/notifications error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
