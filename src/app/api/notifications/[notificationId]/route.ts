// =============================================================================
// 🔔 INDIVIDUAL NOTIFICATION API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/notifications/[notificationId] - Get single notification
// PATCH  /api/notifications/[notificationId] - Update (read/unread)
// DELETE /api/notifications/[notificationId] - Delete notification
// =============================================================================
// Schema: v7.8.0 | Replaces: /read/route.ts (consolidated)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  emailSent: boolean;
  pushSent: boolean;
  createdAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateNotificationSchema = z.object({
  read: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

function transformNotification(notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: Date | null;
  link: string | null;
  metadata: Prisma.JsonValue | null;
  emailSent: boolean;
  pushSent: boolean;
  createdAt: Date;
}): NotificationResponse {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    readAt: notification.readAt?.toISOString() || null,
    link: notification.link,
    metadata: notification.metadata as Record<string, unknown> | null,
    emailSent: notification.emailSent,
    pushSent: notification.pushSent,
    createdAt: notification.createdAt.toISOString(),
  };
}

// =============================================================================
// ROUTE CONTEXT
// =============================================================================

interface RouteContext {
  params: Promise<{ notificationId: string }>;
}

// =============================================================================
// GET HANDLER - Get Single Notification
// =============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;
    const { notificationId } = await context.params;

    // 2. Validate notificationId
    if (!notificationId || typeof notificationId !== 'string') {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid notification ID',
        },
        requestId,
        status: 400,
      });
    }

    // 3. Fetch notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        message: true,
        read: true,
        readAt: true,
        link: true,
        metadata: true,
        emailSent: true,
        pushSent: true,
        createdAt: true,
      },
    });

    if (!notification) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Notification not found',
        },
        requestId,
        status: 404,
      });
    }

    // 4. Authorization - user can only view own notifications
    if (notification.userId !== userId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    return createResponse(transformNotification(notification), {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/notifications/[id] error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch notification',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Notification (read/unread)
// =============================================================================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;
    const { notificationId } = await context.params;

    // 2. Validate notificationId
    if (!notificationId || typeof notificationId !== 'string') {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid notification ID',
        },
        requestId,
        status: 400,
      });
    }

    // 3. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = UpdateNotificationSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid data',
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 4. Verify notification exists and belongs to user
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true, read: true },
    });

    if (!existing) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Notification not found',
        },
        requestId,
        status: 404,
      });
    }

    if (existing.userId !== userId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    // 5. Build update data
    const updateData: Prisma.NotificationUpdateInput = {};
    const now = new Date();

    if (data.read !== undefined) {
      updateData.read = data.read;
      // Set readAt when marking as read, clear when marking as unread
      updateData.readAt = data.read ? now : null;
    }

    // 6. Update notification
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        readAt: true,
        link: true,
        metadata: true,
        emailSent: true,
        pushSent: true,
        createdAt: true,
      },
    });

    console.log(`[${requestId}] Notification updated`, {
      notificationId,
      userId,
      read: notification.read,
    });

    return createResponse(transformNotification(notification), {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/notifications/[id] error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update notification',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete Notification
// =============================================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;
    const { notificationId } = await context.params;

    // 2. Validate notificationId
    if (!notificationId || typeof notificationId !== 'string') {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid notification ID',
        },
        requestId,
        status: 400,
      });
    }

    // 3. Verify notification exists and belongs to user
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Notification not found',
        },
        requestId,
        status: 404,
      });
    }

    if (existing.userId !== userId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    // 4. Delete notification
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    console.log(`[${requestId}] Notification deleted`, {
      notificationId,
      userId,
    });

    return createResponse(
      {
        id: notificationId,
        deleted: true,
        timestamp: new Date().toISOString(),
      },
      {
        success: true,
        requestId,
      }
    );
  } catch (error) {
    console.error(`[${requestId}] DELETE /api/notifications/[id] error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to delete notification',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';