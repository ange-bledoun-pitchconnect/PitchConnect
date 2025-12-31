// =============================================================================
// 💰 SUPERADMIN FINANCIAL API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/superadmin/financial - Financial metrics and revenue analytics
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Revenue breakdown, subscription analytics, payment tracking
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

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

interface RevenueMetrics {
  totalRevenue: number;
  periodRevenue: number;
  previousPeriodRevenue: number;
  revenueGrowth: number;
  
  mrr: number;
  arr: number;
  arpu: number; // Average Revenue Per User
  
  projectedMonthlyRevenue: number;
}

interface PaymentMetrics {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  
  completedAmount: number;
  pendingAmount: number;
  refundedAmount: number;
  
  successRate: number;
}

interface SubscriptionMetrics {
  totalActive: number;
  totalTrialing: number;
  totalPaused: number;
  totalCancelled: number;
  totalPastDue: number;
  
  churnRate: number;
  conversionRate: number;
  
  averageLifetimeValue: number;
}

interface RevenueByTier {
  tier: string;
  subscribers: number;
  monthlyPrice: number;
  totalRevenue: number;
  percentageOfTotal: number;
}

interface RevenueByPaymentType {
  type: string;
  count: number;
  amount: number;
  percentageOfTotal: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  transactions: number;
}

interface FinancialResponse {
  period: {
    start: string;
    end: string;
    days: number;
  };
  
  revenue: RevenueMetrics;
  payments: PaymentMetrics;
  subscriptions: SubscriptionMetrics;
  
  revenueByTier: RevenueByTier[];
  revenueByPaymentType: RevenueByPaymentType[];
  revenueTrend: RevenueTrend[];
  
  topMetrics: {
    highestRevenueDay: { date: string; amount: number } | null;
    largestTransaction: { id: string; amount: number; date: string } | null;
    mostPopularTier: { tier: string; count: number };
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

const DEFAULT_DAYS = 30;

// Tier pricing (should match subscription configuration)
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

const GetFinancialSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.coerce.number().int().min(1).max(365).default(DEFAULT_DAYS),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `financial_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      'Cache-Control': 'private, max-age=60',
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
 * Calculate date range
 */
function getDateRange(
  startDate?: string,
  endDate?: string,
  days?: number
): { start: Date; end: Date; days: number } {
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  let start: Date;
  let actualDays: number;

  if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    actualDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    actualDays = days || DEFAULT_DAYS;
    start = new Date(end.getTime() - actualDays * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end, days: actualDays };
}

// =============================================================================
// GET HANDLER - Financial Metrics
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

    const validation = GetFinancialSchema.safeParse(rawParams);
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
    const { start: periodStart, end: periodEnd, days } = getDateRange(
      params.startDate,
      params.endDate,
      params.days
    );

    // Previous period for comparison
    const previousPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = new Date(periodStart.getTime() - 1);

    const dateFilter = { gte: periodStart, lte: periodEnd };
    const previousDateFilter = { gte: previousPeriodStart, lte: previousPeriodEnd };

    // 4. Fetch all financial data in parallel
    const [
      // Revenue metrics
      totalRevenueAll,
      periodRevenue,
      previousPeriodRevenue,
      
      // Payment metrics
      paymentsByStatus,
      
      // Subscription metrics
      activeSubscriptions,
      trialingSubscriptions,
      pausedSubscriptions,
      cancelledSubscriptions,
      pastDueSubscriptions,
      subscriptionsWithTier,
      
      // Revenue by tier
      revenueByTierRaw,
      
      // Revenue by payment type
      revenueByTypeRaw,
      
      // Daily revenue trend
      dailyRevenueRaw,
      
      // Largest transaction
      largestTransaction,
      
      // Total users for ARPU
      totalActiveUsers,
    ] = await Promise.all([
      // All-time revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      
      // Period revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'COMPLETED', createdAt: dateFilter },
      }),
      
      // Previous period revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED', createdAt: previousDateFilter },
      }),
      
      // Payments by status
      prisma.payment.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
        where: { createdAt: dateFilter },
      }),
      
      // Subscription counts
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIALING' } }),
      prisma.subscription.count({ where: { status: 'PAUSED' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      
      // Subscriptions with tier for MRR
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { tier: true, monthlyPrice: true, customPrice: true },
      }),
      
      // Revenue by tier
      prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
        where: { status: 'ACTIVE' },
      }),
      
      // Revenue by payment type
      prisma.payment.groupBy({
        by: ['paymentType'],
        _count: true,
        _sum: { amount: true },
        where: { status: 'COMPLETED', createdAt: dateFilter },
      }),
      
      // Daily revenue (raw query for date grouping)
      prisma.$queryRaw<Array<{ date: Date; amount: number; count: bigint }>>`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(amount), 0) as amount,
          COUNT(*) as count
        FROM "Payment"
        WHERE status = 'COMPLETED'
          AND created_at >= ${periodStart}
          AND created_at <= ${periodEnd}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      
      // Largest transaction in period
      prisma.payment.findFirst({
        where: { status: 'COMPLETED', createdAt: dateFilter },
        orderBy: { amount: 'desc' },
        select: { id: true, amount: true, createdAt: true },
      }),
      
      // Total active users
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    ]);

    // 5. Calculate MRR from active subscriptions
    const mrr = subscriptionsWithTier.reduce((sum, sub) => {
      return sum + (sub.customPrice || sub.monthlyPrice || TIER_PRICES[sub.tier] || 0);
    }, 0);

    // 6. Process payment metrics
    const paymentMetrics: PaymentMetrics = {
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      refundedPayments: 0,
      completedAmount: 0,
      pendingAmount: 0,
      refundedAmount: 0,
      successRate: 0,
    };

    paymentsByStatus.forEach(item => {
      paymentMetrics.totalPayments += item._count;
      
      switch (item.status) {
        case 'COMPLETED':
          paymentMetrics.completedPayments = item._count;
          paymentMetrics.completedAmount = item._sum.amount || 0;
          break;
        case 'PENDING':
          paymentMetrics.pendingPayments = item._count;
          paymentMetrics.pendingAmount = item._sum.amount || 0;
          break;
        case 'FAILED':
          paymentMetrics.failedPayments = item._count;
          break;
        case 'REFUNDED':
          paymentMetrics.refundedPayments = item._count;
          paymentMetrics.refundedAmount = item._sum.amount || 0;
          break;
      }
    });

    paymentMetrics.successRate = paymentMetrics.totalPayments > 0
      ? Math.round((paymentMetrics.completedPayments / paymentMetrics.totalPayments) * 10000) / 100
      : 0;

    // 7. Calculate revenue metrics
    const currentRevenue = periodRevenue._sum.amount || 0;
    const prevRevenue = previousPeriodRevenue._sum.amount || 0;
    const revenueGrowth = prevRevenue > 0
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 10000) / 100
      : 0;

    const arpu = totalActiveUsers > 0 ? Math.round((mrr / totalActiveUsers) * 100) / 100 : 0;

    const revenueMetrics: RevenueMetrics = {
      totalRevenue: totalRevenueAll._sum.amount || 0,
      periodRevenue: currentRevenue,
      previousPeriodRevenue: prevRevenue,
      revenueGrowth,
      mrr,
      arr: mrr * 12,
      arpu,
      projectedMonthlyRevenue: mrr + (currentRevenue / days) * 30,
    };

    // 8. Calculate subscription metrics
    const totalSubscriptionsEver = activeSubscriptions + cancelledSubscriptions;
    const churnRate = totalSubscriptionsEver > 0
      ? Math.round((cancelledSubscriptions / totalSubscriptionsEver) * 10000) / 100
      : 0;

    // Conversion rate (trial to paid)
    const convertedTrials = await prisma.subscription.count({
      where: { 
        status: 'ACTIVE',
        trialEnd: { not: null, lt: new Date() },
      },
    });
    const totalTrialsEver = trialingSubscriptions + convertedTrials;
    const conversionRate = totalTrialsEver > 0
      ? Math.round((convertedTrials / totalTrialsEver) * 10000) / 100
      : 0;

    const subscriptionMetrics: SubscriptionMetrics = {
      totalActive: activeSubscriptions,
      totalTrialing: trialingSubscriptions,
      totalPaused: pausedSubscriptions,
      totalCancelled: cancelledSubscriptions,
      totalPastDue: pastDueSubscriptions,
      churnRate,
      conversionRate,
      averageLifetimeValue: arpu * 12, // Simplified LTV calculation
    };

    // 9. Process revenue by tier
    const totalTierRevenue = revenueByTierRaw.reduce((sum, t) => {
      return sum + (t._count * (TIER_PRICES[t.tier] || 0));
    }, 0);

    const revenueByTier: RevenueByTier[] = revenueByTierRaw.map(item => {
      const tierRevenue = item._count * (TIER_PRICES[item.tier] || 0);
      return {
        tier: item.tier,
        subscribers: item._count,
        monthlyPrice: TIER_PRICES[item.tier] || 0,
        totalRevenue: tierRevenue,
        percentageOfTotal: totalTierRevenue > 0
          ? Math.round((tierRevenue / totalTierRevenue) * 10000) / 100
          : 0,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 10. Process revenue by payment type
    const totalTypeRevenue = revenueByTypeRaw.reduce((sum, t) => sum + (t._sum.amount || 0), 0);

    const revenueByPaymentType: RevenueByPaymentType[] = revenueByTypeRaw.map(item => ({
      type: item.paymentType,
      count: item._count,
      amount: item._sum.amount || 0,
      percentageOfTotal: totalTypeRevenue > 0
        ? Math.round(((item._sum.amount || 0) / totalTypeRevenue) * 10000) / 100
        : 0,
    })).sort((a, b) => b.amount - a.amount);

    // 11. Process daily revenue trend
    const revenueTrend: RevenueTrend[] = dailyRevenueRaw.map(item => ({
      date: item.date.toISOString().split('T')[0],
      revenue: Number(item.amount) || 0,
      transactions: Number(item.count),
    }));

    // Find highest revenue day
    const highestRevenueDay = revenueTrend.length > 0
      ? revenueTrend.reduce((max, day) => day.revenue > max.revenue ? day : max)
      : null;

    // 12. Find most popular tier
    const mostPopularTier = revenueByTier.length > 0
      ? { tier: revenueByTier[0].tier, count: revenueByTier[0].subscribers }
      : { tier: 'FREE', count: 0 };

    // 13. Build response
    const response: FinancialResponse = {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        days,
      },
      
      revenue: revenueMetrics,
      payments: paymentMetrics,
      subscriptions: subscriptionMetrics,
      
      revenueByTier,
      revenueByPaymentType,
      revenueTrend,
      
      topMetrics: {
        highestRevenueDay: highestRevenueDay ? {
          date: highestRevenueDay.date,
          amount: highestRevenueDay.revenue,
        } : null,
        largestTransaction: largestTransaction ? {
          id: largestTransaction.id,
          amount: largestTransaction.amount,
          date: largestTransaction.createdAt.toISOString(),
        } : null,
        mostPopularTier,
      },
    };

    // 14. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DATA_EXPORTED',
        resourceType: 'FINANCIAL_REPORT',
        resourceId: 'financial-metrics',
        details: JSON.stringify({
          period: { start: periodStart, end: periodEnd, days },
          accessedAt: new Date().toISOString(),
        }),
        severity: 'INFO',
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Financial metrics retrieved`, {
      adminId: session.user.id,
      period: `${days} days`,
      mrr,
      periodRevenue: currentRevenue,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/financial error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch financial metrics',
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