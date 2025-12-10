// ============================================================================
// src/app/api/notifications/[notificationId]/route.ts
// Individual Notification API - PATCH & DELETE
// Production-ready with comprehensive error handling
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * PATCH /api/notifications/[notificationId]
 * Update individual notification
 * 
 * Body:
 * {
 *   action: 'read' | 'archive' | 'unread' (optional)
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

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

    const { notificationId } = params;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    // Verify notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this notification' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action = 'read' } = body;

    let updatedNotification;

    switch (action) {
      case 'read':
        updatedNotification = await prisma.notification.update({
          where: { id: notificationId },
          data: {
            read: true,
            updatedAt: new Date(),
          },
        });

        logger.info('Notification marked as read', {
          notificationId,
          userId: user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'Notification marked as read',
          notification: {
            id: updatedNotification.id,
            read: updatedNotification.read,
            updatedAt: updatedNotification.updatedAt.toISOString(),
          },
        });

      case 'unread':
        updatedNotification = await prisma.notification.update({
          where: { id: notificationId },
          data: {
            read: false,
            updatedAt: new Date(),
          },
        });

        logger.info('Notification marked as unread', {
          notificationId,
          userId: user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'Notification marked as unread',
          notification: {
            id: updatedNotification.id,
            read: updatedNotification.read,
            updatedAt: updatedNotification.updatedAt.toISOString(),
          },
        });

      case 'archive':
        await prisma.notification.delete({
          where: { id: notificationId },
        });

        logger.info('Notification archived', {
          notificationId,
          userId: user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'Notification archived',
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('PATCH /api/notifications/[notificationId] error', {
      error,
      params,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[notificationId]
 * Delete individual notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

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

    const { notificationId } = params;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    // Verify notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this notification' },
        { status: 403 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    logger.info('Notification deleted', {
      notificationId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    logger.error('DELETE /api/notifications/[notificationId] error', {
      error,
      params,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
