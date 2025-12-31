// =============================================================================
// 🔔 NOTIFICATIONS API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/notifications - List user notifications
// POST   /api/notifications - Create notification (system/admin)
// PATCH  /api/notifications - Bulk actions (read-all, archive-all)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ (notification types are sport-agnostic)
// Consolidates: mark-all-read, bulk operations
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

interface NotificationListResponse {
  notifications: NotificationResponse[];
  unreadCount: number;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
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

// Notification types for the platform
const NOTIFICATION_TYPES = [
  // Match notifications
  'MATCH_SCHEDULED',
  'MATCH_REMINDER',
  'MATCH_STARTED',
  'MATCH_FINISHED',
  'MATCH_CANCELLED',
  'MATCH_POSTPONED',
  'MATCH_LINEUP_ANNOUNCED',
  'MATCH_RESULT_SUBMITTED',
  
  // Training notifications
  'TRAINING_SCHEDULED',
  'TRAINING_REMINDER',
  'TRAINING_CANCELLED',
  'TRAINING_UPDATED',
  
  // Team notifications
  'TEAM_JOINED',
  'TEAM_LEFT',
  'TEAM_INVITE',
  'TEAM_ANNOUNCEMENT',
  'JOIN_REQUEST_RECEIVED',
  'JOIN_REQUEST_APPROVED',
  'JOIN_REQUEST_REJECTED',
  
  // Player notifications
  'SELECTION_ANNOUNCED',
  'PLAYER_INJURY_REPORTED',
  'PLAYER_CLEARED',
  'PLAYER_PERFORMANCE_REVIEW',
  'PLAYER_MILESTONE',
  
  // Coach notifications
  'TIMESHEET_REMINDER',
  'TIMESHEET_APPROVED',
  'TIMESHEET_REJECTED',
  'CERTIFICATION_EXPIRING',
  
  // Financial notifications
  'PAYMENT_DUE',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'INVOICE_GENERATED',
  
  // System notifications
  'SYSTEM_ANNOUNCEMENT',
  'ACCOUNT_ACTIVITY',
  'SECURITY_ALERT',
  'FEATURE_UPDATE',
] as const;

type NotificationType = typeof NOTIFICATION_TYPES[number];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const NotificationFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  unreadOnly: z.coerce.boolean().default(false),
  type: z.string().optional(),
  types: z.string().optional(), // Comma-separated
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const CreateNotificationSchema = z.object({
  userId: z.string().cuid(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  link: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

const BulkActionSchema = z.object({
  action: z.enum(['read-all', 'archive-all', 'read', 'archive']),
  notificationIds: z.array(z.string().cuid()).optional(),
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

async function getUserFromSession(
  session: { user?: { id?: string; email?: string } } | null
): Promise<{ id: string; email: string } | null> {
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isSuperAdmin: true },
  });

  return user;
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
// GET HANDLER - List User Notifications
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    const user = await getUserFromSession(session);

    if (!user) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    
    const validation = NotificationFiltersSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const filters = validation.data;

    // 3. Build where clause
    const where: Prisma.NotificationWhereInput = {
      userId: user.id,
    };

    if (filters.unreadOnly) {
      where.read = false;
    }

    // Type filter (single or multiple)
    if (filters.type) {
      where.type = filters.type;
    } else if (filters.types) {
      const types = filters.types.split(',').map((t) => t.trim()).filter(Boolean);
      if (types.length > 0) {
        where.type = { in: types };
      }
    }

    // Date filters
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // 4. Execute queries
    const offset = (filters.page - 1) * filters.limit;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: filters.limit,
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
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: user.id,
          read: false,
        },
      }),
    ]);

    // 5. Transform response
    const transformedNotifications = notifications.map(transformNotification);

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Notifications fetched`, {
      userId: user.id,
      count: notifications.length,
      unreadCount,
      duration: `${Math.round(duration)}ms`,
    });

    const response: NotificationListResponse = {
      notifications: transformedNotifications,
      unreadCount,
      totalCount,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        hasMore: offset + notifications.length < totalCount,
      },
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/notifications error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch notifications',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Notification (System/Admin)
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    const user = await getUserFromSession(session);

    if (!user) {
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

    // 2. Check if user is admin/superadmin or system
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isSuperAdmin: true, roles: true },
    });

    const isAdmin = fullUser?.isSuperAdmin || fullUser?.roles?.includes('ADMIN');

    if (!isAdmin) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Only administrators can create notifications',
        },
        requestId,
        status: 403,
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

    const validation = CreateNotificationSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 4. Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });

    if (!targetUser) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Target user not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        metadata: data.metadata || {},
        read: false,
        emailSent: false,
        pushSent: false,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      },
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

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Notification created`, {
      notificationId: notification.id,
      targetUserId: data.userId,
      type: data.type,
      createdBy: user.id,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(transformNotification(notification), {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/notifications error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create notification',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Bulk Actions (read-all, archive-all, etc.)
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    const user = await getUserFromSession(session);

    if (!user) {
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

    // 2. Parse and validate body
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

    const validation = BulkActionSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid action',
        },
        requestId,
        status: 400,
      });
    }

    const { action, notificationIds } = validation.data;
    const now = new Date();

    let result: { count: number };
    let message: string;

    switch (action) {
      case 'read-all':
        // Mark all unread notifications as read
        result = await prisma.notification.updateMany({
          where: {
            userId: user.id,
            read: false,
          },
          data: {
            read: true,
            readAt: now,
          },
        });
        message = `Marked ${result.count} notification(s) as read`;
        break;

      case 'archive-all':
        // Delete all notifications for user
        result = await prisma.notification.deleteMany({
          where: {
            userId: user.id,
          },
        });
        message = `Archived ${result.count} notification(s)`;
        break;

      case 'read':
        // Mark specific notifications as read
        if (!notificationIds || notificationIds.length === 0) {
          return createResponse(null, {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'notificationIds array is required for "read" action',
            },
            requestId,
            status: 400,
          });
        }

        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: user.id,
          },
          data: {
            read: true,
            readAt: now,
          },
        });
        message = `Marked ${result.count} notification(s) as read`;
        break;

      case 'archive':
        // Delete specific notifications
        if (!notificationIds || notificationIds.length === 0) {
          return createResponse(null, {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'notificationIds array is required for "archive" action',
            },
            requestId,
            status: 400,
          });
        }

        result = await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: user.id,
          },
        });
        message = `Archived ${result.count} notification(s)`;
        break;

      default:
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Unknown action: ${action}`,
          },
          requestId,
          status: 400,
        });
    }

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Notification bulk action`, {
      userId: user.id,
      action,
      count: result.count,
      duration: `${Math.round(duration)}ms`,
    });

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return createResponse(
      {
        action,
        affectedCount: result.count,
        unreadCount,
        message,
        timestamp: now.toISOString(),
      },
      {
        success: true,
        requestId,
      }
    );
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/notifications error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to process bulk action',
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
