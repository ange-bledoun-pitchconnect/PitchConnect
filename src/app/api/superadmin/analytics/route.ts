// =============================================================================
// 📊 SUPERADMIN ANALYTICS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/superadmin/analytics - Comprehensive platform metrics
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Sport breakdown, user metrics, revenue analytics, retention
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, UserStatus, SubscriptionStatus, Prisma } from '@prisma/client';

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
  };
}

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  
  totalRevenue: number;
  mrr: number;
  arr: number;
  
  churnRate: number;
  conversionRate: number;
}

interface GrowthMetrics {
  mrrGrowth: number;
  revenueGrowth: number;
  userGrowth: number;
  subscriptionGrowth: number;
}

interface UsersByStatus {
  ACTIVE: number;
  SUSPENDED: number;
  BANNED: number;
  PENDING_VERIFICATION: number;
  DEACTIVATED: number;
}

interface UsersByRole {
  [role: string]: number;
}

interface UsersBySport {
  [sport: string]: number;
}

interface RevenueByTier {
  tier: string;
  subscribers: number;
  monthlyPrice: number;
  revenue: number;
}

interface SignupTrend {
  date: string;
  signups: number;
}

interface RetentionMetrics {
  day7Retention: number;
  day30Retention: number;
  day90Retention: number;
  usersRetained7: number;
  usersRetained30: number;
  usersRetained90: number;
}

interface SubscriptionMetrics {
  active: number;
  trialing: number;
  pastDue: number;
  cancelled: number;
  paused: number;
}

interface AnalyticsResponse {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  
  metrics: PlatformMetrics;
  growth: GrowthMetrics;
  
  usersByStatus: UsersByStatus;
  usersByRole: UsersByRole;
  usersBySport: UsersBySport;
  
  revenueByTier: RevenueByTier[];
  signupsTrend: SignupTrend[];
  
  retention: RetentionMetrics;
  subscriptionMetrics: SubscriptionMetrics;
  
  topStats: {
    mostPopularTier: { tier: string; count: number };
    mostActiveSport: { sport: string; users: number };
    topClubByUsers: { clubId: string; name: string; users: number } | null;
  };
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

// Tier pricing (should match your subscription tiers)
const TIER_PRICES: Record<string, number> = {
  FREE: 0,
  PLAYER_BASIC: 2.99,
  PLAYER_PRO: 4.99,
  COACH: 9.99,
  MANAGER: 19.99,
  CLUB: 49.99,
  LEAGUE_ADMIN: 29.99,
  ENTERPRISE: 199.99,
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetAnalyticsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'all']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string };
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
      'Cache-Control': 'private, no-cache',
    },
  });
}

/**
 * Calculate date range based on period
 */
function getDateRange(period: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const end = endDate ? new Date(endDate) : new Date();
  let start: Date;

  if (startDate) {
    start = new Date(startDate);
  } else {
    switch (period) {
      case 'today':
        start = new Date(end);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(end);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(end);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start = new Date(end);
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start = new Date(end);
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date(0); // All time
    }
  }

  return { start, end };
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

// =============================================================================
// GET HANDLER - Platform Analytics
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

    const validation = GetAnalyticsSchema.safeParse(rawParams);
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
    const { start: periodStart, end: periodEnd } = getDateRange(
      params.period,
      params.startDate,
      params.endDate
    );

    const dateFilter = { gte: periodStart, lte: periodEnd };

    // 4. Fetch all metrics in parallel
    const [
      // User metrics
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByStatusRaw,
      usersByRoleRaw,
      
      // Subscription metrics
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      pausedSubscriptions,
      pastDueSubscriptions,
      subscriptionsByTier,
      
      // Revenue metrics
      totalRevenueResult,
      currentPeriodRevenue,
      previousPeriodRevenue,
      
      // Signup trend
      signupsByDate,
      
      // Sport breakdown
      clubsBySport,
      
      // Top club
      topClub,
    ] = await Promise.all([
      // Users
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: true,
        where: { deletedAt: null },
      }),
      prisma.user.groupBy({
        by: ['roles'],
        _count: true,
        where: { deletedAt: null },
      }),
      
      // Subscriptions
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIALING' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      prisma.subscription.count({ where: { status: 'PAUSED' } }),
      prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
        where: { status: 'ACTIVE' },
      }),
      
      // Revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED', createdAt: dateFilter },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(periodStart.getTime() - (periodEnd.getTime() - periodStart.getTime())),
            lt: periodStart,
          },
        },
      }),
      
      // Signups by date (last 30 days)
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "User"
        WHERE created_at >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      
      // Sport breakdown (via clubs)
      prisma.club.groupBy({
        by: ['sport'],
        _count: true,
        where: { deletedAt: null },
      }),
      
      // Top club by members
      prisma.clubMember.groupBy({
        by: ['clubId'],
        _count: true,
        where: { isActive: true },
        orderBy: { _count: { clubId: 'desc' } },
        take: 1,
      }),
    ]);

    // 5. Process user status breakdown
    const usersByStatus: UsersByStatus = {
      ACTIVE: 0,
      SUSPENDED: 0,
      BANNED: 0,
      PENDING_VERIFICATION: 0,
      DEACTIVATED: 0,
    };
    usersByStatusRaw.forEach(item => {
      usersByStatus[item.status as keyof UsersByStatus] = item._count;
    });

    // 6. Process role breakdown
    const usersByRole: UsersByRole = {};
    usersByRoleRaw.forEach(item => {
      // roles is an array, so we need to handle it differently
      const roles = item.roles as string[];
      roles.forEach(role => {
        usersByRole[role] = (usersByRole[role] || 0) + item._count;
      });
    });

    // 7. Process sport breakdown (users per sport via club membership)
    const usersBySport: UsersBySport = {};
    
    // Get user count per sport through club memberships
    for (const sportData of clubsBySport) {
      const clubIds = await prisma.club.findMany({
        where: { sport: sportData.sport, deletedAt: null },
        select: { id: true },
      });
      
      const userCount = await prisma.clubMember.count({
        where: {
          clubId: { in: clubIds.map(c => c.id) },
          isActive: true,
        },
      });
      
      usersBySport[sportData.sport] = userCount;
    }

    // 8. Calculate revenue by tier
    const revenueByTier: RevenueByTier[] = subscriptionsByTier.map(item => ({
      tier: item.tier,
      subscribers: item._count,
      monthlyPrice: TIER_PRICES[item.tier] || 0,
      revenue: item._count * (TIER_PRICES[item.tier] || 0),
    }));

    // 9. Process signup trend
    const signupsTrend: SignupTrend[] = signupsByDate.map(item => ({
      date: item.date.toISOString().split('T')[0],
      signups: Number(item.count),
    }));

    // 10. Calculate MRR (Monthly Recurring Revenue)
    const mrr = revenueByTier.reduce((sum, tier) => sum + tier.revenue, 0);
    const arr = mrr * 12;

    // 11. Calculate growth metrics
    const currentRevenue = currentPeriodRevenue._sum.amount || 0;
    const previousRevenue = previousPeriodRevenue._sum.amount || 0;

    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // 12. Calculate retention metrics
    const retentionMetrics = await calculateRetentionMetrics();

    // 13. Calculate churn rate
    const totalSubscriptionsEver = activeSubscriptions + cancelledSubscriptions;
    const churnRate = totalSubscriptionsEver > 0
      ? (cancelledSubscriptions / totalSubscriptionsEver) * 100
      : 0;

    // 14. Calculate conversion rate (trial to paid)
    const totalTrialsEver = await prisma.subscription.count({
      where: { OR: [{ status: 'ACTIVE' }, { status: 'TRIALING' }, { status: 'CANCELLED' }] },
    });
    const convertedTrials = await prisma.subscription.count({
      where: { status: 'ACTIVE', trialEnd: { not: null } },
    });
    const conversionRate = totalTrialsEver > 0
      ? (convertedTrials / totalTrialsEver) * 100
      : 0;

    // 15. Get top club details
    let topClubData = null;
    if (topClub.length > 0) {
      const club = await prisma.club.findUnique({
        where: { id: topClub[0].clubId },
        select: { id: true, name: true },
      });
      if (club) {
        topClubData = {
          clubId: club.id,
          name: club.name,
          users: topClub[0]._count,
        };
      }
    }

    // 16. Find most popular tier
    const mostPopularTier = revenueByTier.reduce(
      (max, tier) => tier.subscribers > max.count ? { tier: tier.tier, count: tier.subscribers } : max,
      { tier: 'FREE', count: 0 }
    );

    // 17. Find most active sport
    const mostActiveSport = Object.entries(usersBySport).reduce(
      (max, [sport, users]) => users > max.users ? { sport, users } : max,
      { sport: 'FOOTBALL', users: 0 }
    );

    // 18. Build response
    const response: AnalyticsResponse = {
      period: params.period,
      dateRange: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      
      metrics: {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        activeSubscriptions,
        trialSubscriptions,
        cancelledSubscriptions,
        totalRevenue: totalRevenueResult._sum.amount || 0,
        mrr,
        arr,
        churnRate: Math.round(churnRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      
      growth: {
        mrrGrowth: 0, // Would need historical MRR data
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        userGrowth: 0, // Would need historical user data
        subscriptionGrowth: 0, // Would need historical subscription data
      },
      
      usersByStatus,
      usersByRole,
      usersBySport,
      
      revenueByTier,
      signupsTrend,
      
      retention: retentionMetrics,
      
      subscriptionMetrics: {
        active: activeSubscriptions,
        trialing: trialSubscriptions,
        pastDue: pastDueSubscriptions,
        cancelled: cancelledSubscriptions,
        paused: pausedSubscriptions,
      },
      
      topStats: {
        mostPopularTier,
        mostActiveSport,
        topClubByUsers: topClubData,
      },
    };

    // 19. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DATA_EXPORTED',
        resourceType: 'ANALYTICS',
        resourceId: 'platform-analytics',
        details: JSON.stringify({
          period: params.period,
          accessedAt: new Date().toISOString(),
        }),
        severity: 'INFO',
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Analytics retrieved`, {
      adminId: session.user.id,
      period: params.period,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/analytics error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch analytics',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// RETENTION CALCULATION
// =============================================================================

async function calculateRetentionMetrics(): Promise<RetentionMetrics> {
  const now = new Date();
  
  // 7-day retention
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const users7DaysOld = await prisma.user.count({
    where: {
      createdAt: { lte: sevenDaysAgo },
      deletedAt: null,
    },
  });
  const retained7Days = await prisma.user.count({
    where: {
      createdAt: { lte: sevenDaysAgo },
      lastLoginAt: { gte: sevenDaysAgo },
      deletedAt: null,
    },
  });

  // 30-day retention
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const users30DaysOld = await prisma.user.count({
    where: {
      createdAt: { lte: thirtyDaysAgo },
      deletedAt: null,
    },
  });
  const retained30Days = await prisma.user.count({
    where: {
      createdAt: { lte: thirtyDaysAgo },
      lastLoginAt: { gte: thirtyDaysAgo },
      deletedAt: null,
    },
  });

  // 90-day retention
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const users90DaysOld = await prisma.user.count({
    where: {
      createdAt: { lte: ninetyDaysAgo },
      deletedAt: null,
    },
  });
  const retained90Days = await prisma.user.count({
    where: {
      createdAt: { lte: ninetyDaysAgo },
      lastLoginAt: { gte: ninetyDaysAgo },
      deletedAt: null,
    },
  });

  return {
    day7Retention: users7DaysOld > 0 ? Math.round((retained7Days / users7DaysOld) * 10000) / 100 : 0,
    day30Retention: users30DaysOld > 0 ? Math.round((retained30Days / users30DaysOld) * 10000) / 100 : 0,
    day90Retention: users90DaysOld > 0 ? Math.round((retained90Days / users90DaysOld) * 10000) / 100 : 0,
    usersRetained7: retained7Days,
    usersRetained30: retained30Days,
    usersRetained90: retained90Days,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';