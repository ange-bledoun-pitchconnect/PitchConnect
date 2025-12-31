// =============================================================================
// 💳 SUPERADMIN SUBSCRIPTIONS API - Enterprise-Grade
// =============================================================================
// GET  /api/superadmin/subscriptions - List subscriptions
// POST /api/superadmin/subscriptions - Grant/change/cancel subscriptions
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Bulk operations, tier management, audit logging
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SubscriptionStatus, SubscriptionTier, Prisma } from '@prisma/client';

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

interface SubscriptionRecord {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  tier: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelledAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BulkOperationResult {
  action: string;
  tier?: string;
  processed: number;
  succeeded: number;
  failed: number;
  details: {
    succeeded: Array<{ userId: string; subscriptionId?: string }>;
    failed: Array<{ userId: string; error: string }>;
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

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;
const MAX_BULK_SIZE = 100;

const VALID_TIERS = ['FREE', 'PLAYER_BASIC', 'PLAYER_PRO', 'COACH', 'MANAGER', 'CLUB', 'LEAGUE_ADMIN', 'ENTERPRISE'];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetSubscriptionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  tier: z.string().optional(),
  status: z.enum(['ACTIVE', 'TRIALING', 'CANCELLED', 'PAST_DUE', 'PAUSED']).optional(),
  userId: z.string().cuid().optional(),
});

const GrantSubscriptionSchema = z.object({
  action: z.literal('grant'),
  userId: z.string().cuid(),
  tier: z.enum(['FREE', 'PLAYER_BASIC', 'PLAYER_PRO', 'COACH', 'MANAGER', 'CLUB', 'LEAGUE_ADMIN', 'ENTERPRISE']),
  durationDays: z.number().int().min(1).max(3650).default(30),
  reason: z.string().max(500).optional(),
});

const BulkGrantSchema = z.object({
  action: z.literal('bulk_grant'),
  userIds: z.array(z.string().cuid()).min(1).max(MAX_BULK_SIZE),
  tier: z.enum(['FREE', 'PLAYER_BASIC', 'PLAYER_PRO', 'COACH', 'MANAGER', 'CLUB', 'LEAGUE_ADMIN', 'ENTERPRISE']),
  durationDays: z.number().int().min(1).max(3650).default(30),
  reason: z.string().max(500).optional(),
});

const ChangeTierSchema = z.object({
  action: z.literal('change_tier'),
  userIds: z.array(z.string().cuid()).min(1).max(MAX_BULK_SIZE),
  tier: z.enum(['FREE', 'PLAYER_BASIC', 'PLAYER_PRO', 'COACH', 'MANAGER', 'CLUB', 'LEAGUE_ADMIN', 'ENTERPRISE']),
  reason: z.string().max(500).optional(),
});

const CancelSchema = z.object({
  action: z.literal('cancel'),
  userIds: z.array(z.string().cuid()).min(1).max(MAX_BULK_SIZE),
  reason: z.string().min(1).max(500),
  immediate: z.boolean().default(false),
});

const PostSchema = z.discriminatedUnion('action', [
  GrantSubscriptionSchema,
  BulkGrantSchema,
  ChangeTierSchema,
  CancelSchema,
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * Grant or update subscription for a user
 */
async function grantSubscription(
  userId: string,
  tier: string,
  durationDays: number
): Promise<any> {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  return prisma.subscription.upsert({
    where: { userId },
    update: {
      tier: tier as SubscriptionTier,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelledAt: null,
      updatedAt: now,
    },
    create: {
      userId,
      tier: tier as SubscriptionTier,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}

/**
 * Cancel subscription for a user
 */
async function cancelSubscription(
  userId: string,
  immediate: boolean = false
): Promise<any> {
  const now = new Date();
  
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new Error('No subscription found');
  }

  return prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      ...(immediate ? { currentPeriodEnd: now } : {}),
      updatedAt: now,
    },
  });
}

// =============================================================================
// GET HANDLER - List Subscriptions
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    const validation = GetSubscriptionsSchema.safeParse(rawParams);
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
    const where: Prisma.SubscriptionWhereInput = {};

    if (params.tier) {
      where.tier = params.tier as SubscriptionTier;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    // 5. Fetch subscriptions
    const offset = (params.page - 1) * params.limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: params.limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    // 6. Transform subscriptions
    const transformedSubscriptions: SubscriptionRecord[] = subscriptions.map(s => ({
      id: s.id,
      userId: s.userId,
      user: {
        id: s.user.id,
        email: s.user.email,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
      },
      tier: s.tier,
      status: s.status,
      currentPeriodStart: s.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: s.currentPeriodEnd?.toISOString() || null,
      trialEnd: s.trialEnd?.toISOString() || null,
      cancelledAt: s.cancelledAt?.toISOString() || null,
      stripeCustomerId: s.stripeCustomerId,
      stripeSubscriptionId: s.stripeSubscriptionId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    // 7. Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DATA_EXPORTED',
        resourceType: 'SUBSCRIPTION',
        resourceId: 'subscriptions_list',
        details: JSON.stringify({
          filters: { tier: params.tier, status: params.status },
          resultCount: transformedSubscriptions.length,
        }),
        severity: 'INFO',
      },
    });

    return createResponse({ subscriptions: transformedSubscriptions }, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + subscriptions.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/subscriptions error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch subscriptions' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Grant/Change/Cancel Subscriptions
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    const validation = PostSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // ==========================================================================
    // GRANT SINGLE SUBSCRIPTION
    // ==========================================================================
    if (params.action === 'grant') {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { id: true, email: true },
      });

      if (!user) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
          requestId,
          status: 404,
        });
      }

      const subscription = await grantSubscription(params.userId, params.tier, params.durationDays);

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          targetUserId: params.userId,
          action: 'SUBSCRIPTION_GRANTED',
          resourceType: 'SUBSCRIPTION',
          resourceId: subscription.id,
          details: JSON.stringify({
            tier: params.tier,
            durationDays: params.durationDays,
            reason: params.reason,
            method: 'single_grant',
          }),
          severity: 'INFO',
        },
      });

      return createResponse({
        subscriptionId: subscription.id,
        userId: params.userId,
        tier: subscription.tier,
        status: subscription.status,
        periodEnd: subscription.currentPeriodEnd?.toISOString(),
      }, {
        success: true,
        message: `Subscription granted to ${user.email}`,
        requestId,
        status: 201,
      });
    }

    // ==========================================================================
    // BULK GRANT / CHANGE TIER / CANCEL
    // ==========================================================================
    const userIds = 'userIds' in params ? params.userIds : [];
    const succeeded: Array<{ userId: string; subscriptionId?: string }> = [];
    const failed: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!user) {
          failed.push({ userId, error: 'User not found' });
          continue;
        }

        if (params.action === 'bulk_grant' || params.action === 'change_tier') {
          const durationDays = params.action === 'bulk_grant' ? params.durationDays : 365;
          const subscription = await grantSubscription(userId, params.tier, durationDays);
          
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              targetUserId: userId,
              action: 'SUBSCRIPTION_GRANTED',
              resourceType: 'SUBSCRIPTION',
              resourceId: subscription.id,
              details: JSON.stringify({
                tier: params.tier,
                method: params.action,
                reason: params.reason,
              }),
              severity: 'INFO',
            },
          });

          succeeded.push({ userId, subscriptionId: subscription.id });
        } else if (params.action === 'cancel') {
          const subscription = await cancelSubscription(userId, params.immediate);
          
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              targetUserId: userId,
              action: 'SUBSCRIPTION_CANCELLED',
              resourceType: 'SUBSCRIPTION',
              resourceId: subscription.id,
              details: JSON.stringify({
                reason: params.reason,
                immediate: params.immediate,
              }),
              severity: 'WARNING',
            },
          });

          succeeded.push({ userId, subscriptionId: subscription.id });
        }
      } catch (error) {
        failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const result: BulkOperationResult = {
      action: params.action,
      tier: 'tier' in params ? params.tier : undefined,
      processed: userIds.length,
      succeeded: succeeded.length,
      failed: failed.length,
      details: { succeeded, failed },
    };

    return createResponse(result, {
      success: true,
      message: `Processed ${userIds.length} subscriptions: ${succeeded.length} succeeded, ${failed.length} failed`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/subscriptions error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to process subscription' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';