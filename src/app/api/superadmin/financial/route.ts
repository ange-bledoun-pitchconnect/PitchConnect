/**
 * ============================================================================
 * SUPERADMIN FINANCIAL ROUTE - World-Class Financial Analytics
 * ============================================================================
 *
 * @file src/app/api/superadmin/financial/route.ts
 * @description Financial metrics and revenue analytics for SuperAdmin dashboard
 * @version 2.0.0 (Production-Ready)
 *
 * FEATURES:
 * ✅ Full TypeScript type safety
 * ✅ Schema-aligned field names
 * ✅ Comprehensive financial metrics
 * ✅ Revenue breakdown by payment type
 * ✅ Subscription analytics
 * ✅ Date range filtering
 * ✅ Aggregation queries optimized
 * ✅ Error handling & structured logging
 * ✅ JSDoc documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentByStatus {
  status: string;
  _count: number;
  _sum: {
    amount: number | null;
  };
}

interface FinancialMetrics {
  totalRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedAmount: number;
  activeSubscriptions: number;
  subscriptionValue: number;
  paymentsByType: Array<{
    type: string;
    count: number;
    amount: number;
  }>;
  paymentsByStatus: PaymentByStatus[];
}

interface FinancialResponse {
  success: boolean;
  data: {
    period: {
      startDate: string;
      endDate: string;
    };
    metrics: FinancialMetrics;
  };
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_DAYS_BACK = 90;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse and validate date range parameters
 */
function parseDateRange(startDateStr?: string, endDateStr?: string): {
  startDate: Date;
  endDate: Date;
  error?: string;
} {
  try {
    let startDate: Date;
    let endDate: Date;

    // Parse end date (default to now)
    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        return {
          startDate: new Date(),
          endDate: new Date(),
          error: 'Invalid endDate format. Use ISO 8601 (YYYY-MM-DD)',
        };
      }
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
    }

    // Parse start date (default to 90 days back)
    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return {
          startDate: new Date(),
          endDate,
          error: 'Invalid startDate format. Use ISO 8601 (YYYY-MM-DD)',
        };
      }
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - DEFAULT_DAYS_BACK);
    }

    // Validate date range
    if (startDate > endDate) {
      return {
        startDate,
        endDate,
        error: 'startDate must be before endDate',
      };
    }

    return { startDate, endDate };
  } catch (error) {
    return {
      startDate: new Date(),
      endDate: new Date(),
      error: 'Invalid date parameters',
    };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * GET /api/superadmin/financial
 *
 * Retrieve financial metrics and revenue analytics (SuperAdmin only)
 *
 * Query parameters:
 * - startDate: ISO 8601 date string (default: 90 days ago)
 * - endDate: ISO 8601 date string (default: today)
 *
 * @param request NextRequest
 * @returns FinancialResponse on success, ErrorResponse on failure
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<FinancialResponse | ErrorResponse>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const session = await auth();

    if (!session) {
      console.warn('Unauthorized financial access - no session', { requestId });
      return Response.json(
        {
          success: false,
          error: 'Authentication required',
          code: ERROR_CODES.UNAUTHORIZED,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. VALIDATE SUPERADMIN ACCESS
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        roles: true,
      },
    });

    if (!user || (!user.isSuperAdmin && !user.roles.includes('SUPERADMIN'))) {
      console.warn('SuperAdmin authorization failed for financial', {
        requestId,
        email: session.user.email,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'SuperAdmin access required',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. PARSE & VALIDATE DATE RANGE
    // ========================================================================

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate') || undefined;
    const endDateStr = searchParams.get('endDate') || undefined;

    const { startDate, endDate, error: dateError } = parseDateRange(startDateStr, endDateStr);

    if (dateError) {
      console.warn('Invalid date range', {
        requestId,
        error: dateError,
        startDate: startDateStr,
        endDate: endDateStr,
      });
      return NextResponse.json(
        {
          success: false,
          error: dateError,
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    console.log('Financial report request', {
      requestId,
      superAdminId: user.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // ========================================================================
    // 4. FETCH FINANCIAL DATA (Batch queries)
    // ========================================================================

    const dateFilter = { gte: startDate, lte: endDate };

    const [
      totalRevenue,
      paymentsByStatus,
      paymentsByType,
      activeSubscriptions,
      completedPaymentsCount,
      pendingPaymentsCount,
      failedPaymentsCount,
      refundedPayments,
    ] = await Promise.all([
      // Total revenue (all completed payments)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: dateFilter,
          status: 'COMPLETED',
        },
      }),

      // Payments breakdown by status
      prisma.payment.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
        where: { createdAt: dateFilter },
      }),

      // Payments breakdown by type
      prisma.payment.groupBy({
        by: ['paymentType'],
        _count: true,
        _sum: { amount: true },
        where: { createdAt: dateFilter },
      }),

      // Active subscriptions count
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),

      // Completed payments count
      prisma.payment.count({
        where: {
          createdAt: dateFilter,
          status: 'COMPLETED',
        },
      }),

      // Pending payments count
      prisma.payment.count({
        where: {
          createdAt: dateFilter,
          status: 'PENDING',
        },
      }),

      // Failed payments count
      prisma.payment.count({
        where: {
          createdAt: dateFilter,
          status: 'FAILED',
        },
      }),

      // Refunded payments amount
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: dateFilter,
          status: 'REFUNDED',
        },
      }),
    ]);

    // ========================================================================
    // 5. CALCULATE SUBSCRIPTION VALUE
    // ========================================================================

    const activeSubscriptionsData = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        monthlyPrice: true,
        customPrice: true,
      },
    });

    const subscriptionValue = activeSubscriptionsData.reduce((sum, sub) => {
      const price = sub.customPrice || sub.monthlyPrice || 0;
      return sum + price;
    }, 0);

    // ========================================================================
    // 6. TRANSFORM DATA
    // ========================================================================

    const transformedPaymentsByType = paymentsByType.map((item) => ({
      type: item.paymentType,
      count: item._count,
      amount: item._sum.amount || 0,
    }));

    const metrics: FinancialMetrics = {
      totalRevenue: totalRevenue._sum.amount || 0,
      completedPayments: completedPaymentsCount,
      pendingPayments: pendingPaymentsCount,
      failedPayments: failedPaymentsCount,
      refundedAmount: refundedPayments._sum.amount || 0,
      activeSubscriptions,
      subscriptionValue,
      paymentsByType: transformedPaymentsByType,
      paymentsByStatus: paymentsByStatus.map((item) => ({
        status: item.status,
        _count: item._count,
        _sum: {
          amount: item._sum.amount,
        },
      })),
    };

    // ========================================================================
    // 7. BUILD RESPONSE
    // ========================================================================

    const response: FinancialResponse = {
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        metrics,
      },
    };

    // ========================================================================
    // 8. LOG & RESPOND
    // ========================================================================

    const duration = performance.now() - startTime;

    console.log('Financial report retrieved successfully', {
      requestId,
      superAdminId: user.id,
      totalRevenue: metrics.totalRevenue,
      activeSubscriptions: metrics.activeSubscriptions,
      completedPayments: metrics.completedPayments,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    console.error('Financial report error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve financial metrics',
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}