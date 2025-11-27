// src/app/api/superadmin/analytics/route.ts
/**
 * SuperAdmin Analytics API
 * GET - Get comprehensive dashboard metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkSuperAdminSession,
  getDashboardMetrics,
  getSignupMetrics,
  getRevenueByTier,
  findInactiveUsers,
  createAuditLog,
} from '@/lib/superadmin-helpers';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';

    let daysBack = 30;
    if (period === 'today') daysBack = 1;
    else if (period === 'week') daysBack = 7;
    else if (period === 'month') daysBack = 30;
    else if (period === 'year') daysBack = 365;

    const [
      dashboardMetrics,
      signupMetrics,
      revenueByTier,
      inactiveUsers,
      statusBreakdown,
      roleBreakdown,
    ] = await Promise.all([
      getDashboardMetrics(),
      getSignupMetrics(daysBack),
      getRevenueByTier(),
      findInactiveUsers(30),
      getStatusBreakdown(),
      getRoleBreakdown(),
    ]);

    const lastMonthSignups = Object.values(signupMetrics).reduce(
      (sum, count) => sum + count,
      0
    );

    const [previousMrr, previousRevenue] = await Promise.all([
      getPreviousMRR(daysBack),
      getPreviousRevenue(daysBack),
    ]);

    const mrrGrowth =
      previousMrr > 0
        ? ((dashboardMetrics.mrr - previousMrr) / previousMrr) * 100
        : 0;
    const revenueGrowth =
      previousRevenue > 0
        ? ((dashboardMetrics.totalRevenue - previousRevenue) /
            previousRevenue) *
          100
        : 0;

    await createAuditLog(
      admin.id,
      null,
      'DATA_EXPORTED',
      {
        action: 'analytics_accessed',
        period,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          period,
          metrics: {
            totalUsers: dashboardMetrics.totalUsers,
            activeSubscriptions: dashboardMetrics.activeSubscriptions,
            totalRevenue: dashboardMetrics.totalRevenue,
            mrr: dashboardMetrics.mrr,
            churnRate: dashboardMetrics.churnRate,
            conversionRate: dashboardMetrics.conversionRate,
            newSignupsToday: dashboardMetrics.newSignupsToday,
          },

          growth: {
            mrrGrowth: parseFloat(mrrGrowth.toFixed(2)),
            revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
            newSignupsThisPeriod: lastMonthSignups,
          },

          revenueByTier: Object.entries(revenueByTier).map(([tier, data]: any) => ({
            tier,
            subscribers: data.count,
            price: data.price,
            revenue: parseFloat(data.revenue.toFixed(2)),
          })),

          signupsTrend: Object.entries(signupMetrics).map(([date, count]) => ({
            date,
            signups: count,
          })),

          usersByStatus: statusBreakdown,

          usersByRole: roleBreakdown,

          inactiveUsersCount: inactiveUsers.length,
          inactiveUsersNeeded: Math.min(5, inactiveUsers.length),

          retention: await getRetentionMetrics(),

          subscriptionMetrics: {
            active: dashboardMetrics.activeSubscriptions,
            cancelled: await prisma.subscription.count({
              where: { status: 'CANCELLED' },
            }),
            paused: await prisma.subscription.count({
              where: { status: 'PAUSED' },
            }),
            pastDue: await prisma.subscription.count({
              where: { status: 'PAST_DUE' },
            }),
          },

          mostPopularTier: getMostPopularTier(revenueByTier),
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Analytics GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getStatusBreakdown() {
  const statusCounts = await prisma.user.groupBy({
    by: ['status'],
    _count: true,
  });

  const breakdown: any = {
    ACTIVE: 0,
    SUSPENDED: 0,
    BANNED: 0,
    PENDING_VERIFICATION: 0,
  };

  statusCounts.forEach((item) => {
    breakdown[item.status] = item._count;
  });

  return breakdown;
}

async function getRoleBreakdown() {
  const roleCounts = await prisma.userRole_User.groupBy({
    by: ['roleName'],
    _count: true,
  });

  const breakdown: Record<string, number> = {};
  roleCounts.forEach((item) => {
    breakdown[item.roleName] = item._count;
  });

  return breakdown;
}

async function getPreviousMRR(daysBack: number) {
  const previousPeriodStart = new Date(
    Date.now() - daysBack * 2 * 24 * 60 * 60 * 1000
  );
  const previousPeriodEnd = new Date(
    Date.now() - daysBack * 24 * 60 * 60 * 1000
  );

  const subscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: {
        gte: previousPeriodStart,
        lte: previousPeriodEnd,
      },
      status: 'ACTIVE',
    },
  });

  const tierPrices: Record<string, number> = {
    FREE: 0,
    PLAYER_PRO: 4.99,
    COACH: 9.99,
    MANAGER: 19.99,
    LEAGUE_ADMIN: 29.99,
  };

  return subscriptions.reduce((sum, sub) => {
    const price = tierPrices[sub.tier] || 0;
    return sum + price;
  }, 0);
}

async function getPreviousRevenue(daysBack: number) {
  const previousPeriodStart = new Date(
    Date.now() - daysBack * 2 * 24 * 60 * 60 * 1000
  );
  const previousPeriodEnd = new Date(
    Date.now() - daysBack * 24 * 60 * 60 * 1000
  );

  const result = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: {
        gte: previousPeriodStart,
        lte: previousPeriodEnd,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount || 0;
}

async function getRetentionMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const usersThirtyDaysAgo = await prisma.user.count({
    where: { createdAt: { lte: thirtyDaysAgo } },
  });

  const retainedUsers = await prisma.user.count({
    where: {
      createdAt: { lte: thirtyDaysAgo },
      lastLogin: { gte: thirtyDaysAgo },
    },
  });

  const retentionRate =
    usersThirtyDaysAgo > 0
      ? (retainedUsers / usersThirtyDaysAgo) * 100
      : 0;

  return {
    thirtyDayRetention: parseFloat(retentionRate.toFixed(2)),
    usersThirtyDaysAgo,
    retainedUsers,
  };
}

function getMostPopularTier(revenueByTier: any) {
  let mostPopular = { tier: 'FREE', count: 0 };

  Object.entries(revenueByTier).forEach(([tier, data]: any) => {
    if (data.count > mostPopular.count) {
      mostPopular = { tier, count: data.count };
    }
  });

  return mostPopular;
}