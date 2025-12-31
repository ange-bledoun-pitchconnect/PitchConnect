// =============================================================================
// 📬 SUPERADMIN NOTIFICATIONS API - Enterprise-Grade with Sport Support
// =============================================================================
// GET  /api/superadmin/notifications - List system notifications
// POST /api/superadmin/notifications - Send notifications (broadcast/targeted)
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Sport-specific notifications, role targeting, batch sending
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, NotificationType, NotificationPriority, Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface NotificationRecord {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  actionUrl: string | null;
  sport: string | null;
  createdAt: string;
}

interface SendNotificationResult {
  notificationsSent: number;
  failedCount: number;
  notificationType: string;
  targetSummary: {
    totalRecipients: number;
    byRole?: Record<string, number>;
    bySport?: Record<string, number>;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_PAGE_LIMIT = 50;
const MAX_BATCH_SIZE = 1000;

// Sport-specific notification types
const SPORT_NOTIFICATION_TYPES: Record<Sport, string[]> = {
  FOOTBALL: [
    'FOOTBALL_GOAL_SCORED',
    'FOOTBALL_CARD_ISSUED',
    'FOOTBALL_SUBSTITUTION',
    'FOOTBALL_PENALTY',
    'FOOTBALL_HALFTIME',
    'FOOTBALL_FULLTIME',
  ],
  FUTSAL: [
    'FOOTBALL_GOAL_SCORED', // Reuse football types
    'FOOTBALL_CARD_ISSUED',
    'FOOTBALL_SUBSTITUTION',
  ],
  BEACH_FOOTBALL: [
    'FOOTBALL_GOAL_SCORED',
    'FOOTBALL_CARD_ISSUED',
  ],
  RUGBY: [
    'RUGBY_TRY_SCORED',
    'RUGBY_CONVERSION',
    'RUGBY_PENALTY_KICK',
    'RUGBY_DROP_GOAL',
    'RUGBY_SIN_BIN',
    'RUGBY_RED_CARD',
  ],
  AMERICAN_FOOTBALL: [
    'AMERICAN_FOOTBALL_TOUCHDOWN',
    'AMERICAN_FOOTBALL_FIELD_GOAL',
    'AMERICAN_FOOTBALL_SAFETY',
    'AMERICAN_FOOTBALL_TWO_POINT',
    'AMERICAN_FOOTBALL_QUARTER_END',
  ],
  BASKETBALL: [
    'BASKETBALL_QUARTER_END',
    'BASKETBALL_TIMEOUT',
    'BASKETBALL_FOUL',
    'BASKETBALL_THREE_POINTER',
  ],
  NETBALL: [],
  CRICKET: [
    'CRICKET_WICKET',
    'CRICKET_BOUNDARY',
    'CRICKET_SIX',
    'CRICKET_OVER_COMPLETE',
    'CRICKET_INNINGS_END',
    'CRICKET_DRINKS_BREAK',
  ],
  HOCKEY: [
    'HOCKEY_GOAL',
    'HOCKEY_PENALTY',
    'HOCKEY_PERIOD_END',
    'HOCKEY_SHOOTOUT',
  ],
  LACROSSE: [],
  AUSTRALIAN_RULES: [],
  GAELIC_FOOTBALL: [],
};

// Generic notification types (applicable to all sports)
const GENERIC_NOTIFICATION_TYPES = [
  'SYSTEM_NOTIFICATION',
  'SYSTEM_ALERT',
  'SYSTEM_MAINTENANCE',
  'MATCH_SCHEDULED',
  'MATCH_REMINDER',
  'MATCH_CANCELLED',
  'MATCH_RESULT',
  'TRAINING_SCHEDULED',
  'TRAINING_REMINDER',
  'TEAM_ANNOUNCEMENT',
  'PERFORMANCE_UPDATE',
  'PAYMENT_DUE',
  'ACCOUNT_UPDATE',
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_LIMIT),
  type: z.string().optional(),
  sport: z.nativeEnum(Sport).optional(),
  userId: z.string().cuid().optional(),
  isRead: z.enum(['true', 'false']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const SendNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  
  // Notification type
  type: z.string().default('SYSTEM_NOTIFICATION'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  
  // Optional action
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(50).optional(),
  
  // Targeting
  targetUsers: z.array(z.string().cuid()).optional(),
  targetRoles: z.array(z.string()).optional(),
  targetSports: z.array(z.nativeEnum(Sport)).optional(),
  targetClubs: z.array(z.string().cuid()).optional(),
  targetTeams: z.array(z.string().cuid()).optional(),
  
  // Broadcast to all if no targeting specified
  broadcastToAll: z.boolean().default(false),
  
  // Sport context
  sport: z.nativeEnum(Sport).optional(),
  
  // Scheduling (future feature)
  scheduledFor: z.string().datetime().optional(),
  
  // Email/Push options
  sendEmail: z.boolean().default(false),
  sendPush: z.boolean().default(true),
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
    message?: string;
    error?: { code: string; message: string };
    requestId: string;
    status?: number;
    pagination?: PaginationMeta;
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

  if (options.message) {
    response.message = options.message;
  }

  if (options.error) {
    response.error = options.error;
  }

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: { 'X-Request-ID': options.requestId },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<{ isValid: boolean; user?: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSuperAdmin: true,
      roles: true,
    },
  });

  if (!user) return { isValid: false };
  
  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Get users by targeting criteria
 */
async function getTargetUsers(params: {
  targetUsers?: string[];
  targetRoles?: string[];
  targetSports?: Sport[];
  targetClubs?: string[];
  targetTeams?: string[];
  broadcastToAll?: boolean;
}): Promise<string[]> {
  // Specific users
  if (params.targetUsers?.length) {
    const users = await prisma.user.findMany({
      where: { 
        id: { in: params.targetUsers },
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    return users.map(u => u.id);
  }

  // Build OR conditions for other targeting
  const conditions: Prisma.UserWhereInput[] = [];

  // By role
  if (params.targetRoles?.length) {
    params.targetRoles.forEach(role => {
      conditions.push({ roles: { has: role } });
    });
  }

  // By sport (via club membership)
  if (params.targetSports?.length) {
    conditions.push({
      clubMembers: {
        some: {
          isActive: true,
          club: { sport: { in: params.targetSports } },
        },
      },
    });
  }

  // By club
  if (params.targetClubs?.length) {
    conditions.push({
      clubMembers: {
        some: {
          isActive: true,
          clubId: { in: params.targetClubs },
        },
      },
    });
  }

  // By team
  if (params.targetTeams?.length) {
    conditions.push({
      player: {
        teamPlayers: {
          some: {
            isActive: true,
            teamId: { in: params.targetTeams },
          },
        },
      },
    });
  }

  // Broadcast to all
  if (params.broadcastToAll && conditions.length === 0) {
    const users = await prisma.user.findMany({
      where: { 
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: { id: true },
      take: MAX_BATCH_SIZE,
    });
    return users.map(u => u.id);
  }

  // Apply conditions
  if (conditions.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      OR: conditions,
    },
    select: { id: true },
    take: MAX_BATCH_SIZE,
  });

  return users.map(u => u.id);
}

// =============================================================================
// GET HANDLER - List Notifications
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid } = await verifySuperAdmin(session.user.id);
    if (!isValid) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetNotificationsSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Invalid parameters' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 4. Build where clause
    const where: Prisma.NotificationWhereInput = {};

    if (params.type) {
      where.type = params.type as NotificationType;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.isRead !== undefined) {
      where.isRead = params.isRead === 'true';
    }

    if (params.priority) {
      where.priority = params.priority as NotificationPriority;
    }

    // Note: Sport filtering would require a sport field on Notification model
    // For now, we can filter by type prefix
    if (params.sport) {
      const sportTypes = SPORT_NOTIFICATION_TYPES[params.sport] || [];
      if (sportTypes.length > 0) {
        where.type = { in: sportTypes as NotificationType[] };
      }
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const endDate = new Date(params.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // 5. Fetch notifications
    const offset = (params.page - 1) * params.limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: params.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    // 6. Transform notifications
    const transformedNotifications: NotificationRecord[] = notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      user: {
        id: n.user.id,
        email: n.user.email,
        firstName: n.user.firstName,
        lastName: n.user.lastName,
      },
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      isRead: n.isRead,
      actionUrl: n.actionUrl,
      sport: null, // Would come from notification if we add the field
      createdAt: n.createdAt.toISOString(),
    }));

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Notifications listed`, {
      adminId: session.user.id,
      total,
      returned: transformedNotifications.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({ notifications: transformedNotifications }, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + notifications.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/notifications error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch notifications' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Send Notifications
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
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
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid JSON in request body' },
        requestId,
        status: 400,
      });
    }

    const validation = SendNotificationSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 4. Validate notification type
    const isValidType = GENERIC_NOTIFICATION_TYPES.includes(params.type) ||
      Object.values(SPORT_NOTIFICATION_TYPES).flat().includes(params.type);
    
    if (!isValidType) {
      // Allow any string type for flexibility
      console.warn(`[${requestId}] Non-standard notification type: ${params.type}`);
    }

    // 5. Get target users
    const targetUserIds = await getTargetUsers({
      targetUsers: params.targetUsers,
      targetRoles: params.targetRoles,
      targetSports: params.targetSports,
      targetClubs: params.targetClubs,
      targetTeams: params.targetTeams,
      broadcastToAll: params.broadcastToAll,
    });

    if (targetUserIds.length === 0) {
      return createResponse<SendNotificationResult>({
        notificationsSent: 0,
        failedCount: 0,
        notificationType: params.type,
        targetSummary: { totalRecipients: 0 },
      }, {
        success: true,
        message: 'No recipients found matching criteria',
        requestId,
      });
    }

    // 6. Create notifications in batches
    const batchSize = 100;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < targetUserIds.length; i += batchSize) {
      const batch = targetUserIds.slice(i, i + batchSize);
      
      try {
        const result = await prisma.notification.createMany({
          data: batch.map(userId => ({
            userId,
            type: params.type as NotificationType,
            title: params.title,
            message: params.message,
            priority: params.priority as NotificationPriority,
            actionUrl: params.actionUrl,
            isRead: false,
          })),
          skipDuplicates: true,
        });
        
        sentCount += result.count;
      } catch (error) {
        console.error(`[${requestId}] Batch send failed:`, error);
        failedCount += batch.length;
      }
    }

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'NOTIFICATION_BROADCAST',
        resourceType: 'NOTIFICATION',
        resourceId: `batch_${requestId}`,
        details: JSON.stringify({
          title: params.title,
          type: params.type,
          recipientCount: sentCount,
          failedCount,
          targeting: {
            roles: params.targetRoles,
            sports: params.targetSports,
            clubs: params.targetClubs?.length,
            teams: params.targetTeams?.length,
            broadcast: params.broadcastToAll,
          },
        }),
        severity: 'INFO',
      },
    });

    // 8. Build response
    const result: SendNotificationResult = {
      notificationsSent: sentCount,
      failedCount,
      notificationType: params.type,
      targetSummary: {
        totalRecipients: targetUserIds.length,
      },
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Notifications sent`, {
      adminId: session.user.id,
      type: params.type,
      sent: sentCount,
      failed: failedCount,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(result, {
      success: true,
      message: `Successfully sent ${sentCount} notifications`,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/notifications error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to send notifications' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';