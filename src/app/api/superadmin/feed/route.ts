// =============================================================================
// 📰 SUPERADMIN ACTIVITY FEED API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/superadmin/feed - System-wide activity feed
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Real-time feed, filtering, categorization, severity levels
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

interface ActivityItem {
  id: string;
  
  actor: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
  };
  
  target: {
    id: string;
    email: string;
    name: string;
  } | null;
  
  action: string;
  actionCategory: string;
  
  resourceType: string | null;
  resourceId: string | null;
  
  details: string | null;
  changes: Record<string, unknown> | null;
  
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  
  ipAddress: string | null;
  location: string | null;
  
  timestamp: string;
  relativeTime: string;
}

interface FeedStats {
  totalActivities: number;
  criticalCount: number;
  warningCount: number;
  uniqueActors: number;
}

interface FeedResponse {
  activities: ActivityItem[];
  stats: FeedStats;
  period: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

// Action category mapping
const ACTION_CATEGORIES: Record<string, string> = {
  USER_CREATED: 'User Management',
  USER_UPDATED: 'User Management',
  USER_DELETED: 'User Management',
  USER_SUSPENDED: 'Security',
  USER_BANNED: 'Security',
  USER_UNBANNED: 'Security',
  ROLE_UPGRADED: 'Access Control',
  ROLE_DOWNGRADED: 'Access Control',
  SUBSCRIPTION_GRANTED: 'Billing',
  SUBSCRIPTION_CANCELLED: 'Billing',
  PAYMENT_RECEIVED: 'Billing',
  PAYMENT_REFUNDED: 'Billing',
  DATA_EXPORTED: 'Data Access',
  USER_IMPERSONATED: 'Security',
  IMPERSONATION_ENDED: 'Security',
  BULK_USER_ACTION: 'Administration',
  SETTINGS_UPDATED: 'Configuration',
  LOGIN_ATTEMPT: 'Authentication',
  FAILED_LOGIN: 'Security',
  API_KEY_GENERATED: 'Security',
  API_KEY_REVOKED: 'Security',
};

// Severity mapping for actions
const ACTION_SEVERITY: Record<string, 'INFO' | 'WARNING' | 'CRITICAL'> = {
  USER_DELETED: 'CRITICAL',
  USER_BANNED: 'CRITICAL',
  USER_IMPERSONATED: 'CRITICAL',
  BULK_USER_ACTION: 'CRITICAL',
  USER_SUSPENDED: 'WARNING',
  ROLE_UPGRADED: 'WARNING',
  SUBSCRIPTION_CANCELLED: 'WARNING',
  PAYMENT_REFUNDED: 'WARNING',
  FAILED_LOGIN: 'WARNING',
  API_KEY_REVOKED: 'WARNING',
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetFeedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  
  // Filters
  actionType: z.string().optional(),
  category: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  actorId: z.string().cuid().optional(),
  targetId: z.string().cuid().optional(),
  
  // Date range
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  
  // Search
  search: z.string().max(200).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `feed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
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

  if (options.error) {
    response.error = options.error;
  }

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
      'Cache-Control': 'private, max-age=10',
    },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
    },
  });

  return user?.isSuperAdmin || user?.roles.includes('SUPERADMIN') || false;
}

/**
 * Calculate relative time string
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Get action category
 */
function getActionCategory(action: string): string {
  return ACTION_CATEGORIES[action] || 'Other';
}

/**
 * Get action severity
 */
function getActionSeverity(action: string, storedSeverity?: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  if (storedSeverity && ['INFO', 'WARNING', 'CRITICAL'].includes(storedSeverity)) {
    return storedSeverity as 'INFO' | 'WARNING' | 'CRITICAL';
  }
  return ACTION_SEVERITY[action] || 'INFO';
}

// =============================================================================
// GET HANDLER - Activity Feed
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
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const isSuperAdmin = await verifySuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'SuperAdmin access required',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetFeedSchema.safeParse(rawParams);
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

    const params = validation.data;

    // 4. Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (params.actionType) {
      where.action = params.actionType;
    }

    if (params.severity) {
      where.severity = params.severity;
    }

    if (params.actorId) {
      where.userId = params.actorId;
    }

    if (params.targetId) {
      where.targetUserId = params.targetId;
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

    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: 'insensitive' } },
        { details: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    // Filter by category if provided
    if (params.category) {
      const actionsInCategory = Object.entries(ACTION_CATEGORIES)
        .filter(([_, cat]) => cat === params.category)
        .map(([action]) => action);
      
      if (actionsInCategory.length > 0) {
        where.action = { in: actionsInCategory };
      }
    }

    // 5. Fetch activities with pagination
    const offset = (params.page - 1) * params.limit;

    const [activities, total, severityCounts, uniqueActors] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: params.limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
      }),
    ]);

    // 6. Process severity counts
    const severityMap: Record<string, number> = {
      INFO: 0,
      WARNING: 0,
      CRITICAL: 0,
    };
    severityCounts.forEach(item => {
      severityMap[item.severity] = item._count;
    });

    // 7. Transform activities
    const transformedActivities: ActivityItem[] = activities.map(activity => ({
      id: activity.id,
      
      actor: activity.user ? {
        id: activity.user.id,
        email: activity.user.email,
        name: `${activity.user.firstName} ${activity.user.lastName}`.trim(),
        avatar: activity.user.avatar,
      } : {
        id: 'system',
        email: 'system@pitchconnect.com',
        name: 'System',
        avatar: null,
      },
      
      target: activity.targetUser ? {
        id: activity.targetUser.id,
        email: activity.targetUser.email,
        name: `${activity.targetUser.firstName} ${activity.targetUser.lastName}`.trim(),
      } : null,
      
      action: activity.action,
      actionCategory: getActionCategory(activity.action),
      
      resourceType: activity.resourceType,
      resourceId: activity.resourceId,
      
      details: typeof activity.details === 'string' 
        ? activity.details 
        : activity.details ? JSON.stringify(activity.details) : null,
      changes: activity.changes as Record<string, unknown> | null,
      
      severity: getActionSeverity(activity.action, activity.severity),
      
      ipAddress: activity.ipAddress,
      location: null, // Could add geo-IP lookup
      
      timestamp: activity.createdAt.toISOString(),
      relativeTime: getRelativeTime(activity.createdAt),
    }));

    // 8. Determine period description
    let period = 'All time';
    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      period = `${diffDays} days`;
    } else if (params.startDate) {
      period = `Since ${new Date(params.startDate).toLocaleDateString()}`;
    }

    // 9. Build response
    const response: FeedResponse = {
      activities: transformedActivities,
      stats: {
        totalActivities: total,
        criticalCount: severityMap.CRITICAL,
        warningCount: severityMap.WARNING,
        uniqueActors: uniqueActors.length,
      },
      period,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Activity feed retrieved`, {
      adminId: session.user.id,
      total,
      returned: transformedActivities.length,
      filters: {
        actionType: params.actionType,
        category: params.category,
        severity: params.severity,
      },
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + activities.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/feed error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch activity feed',
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