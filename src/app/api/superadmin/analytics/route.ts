/**
 * SuperAdmin Analytics API
 * Platform metrics, revenue analytics, and growth data
 * @route GET /api/superadmin/analytics - Get analytics data
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// GET - Get Platform Analytics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date ranges
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    // ========================================
    // 1. USER ANALYTICS
    // ========================================

    // Total users
    const totalUsers = await prisma.user.count();

    // New users in period
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Active users (logged in within period)
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: start,
          lte: end,
        },
        status: 'ACTIVE',
      },
    });

    // Users by status
    const usersByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusBreakdown = usersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // User growth over time (last 12 months)
    const monthlyGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyGrowth.push({
        month: monthStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        count,
      });
    }

    // ========================================
    // 2. REVENUE ANALYTICS
    // ========================================

    // Total revenue (all time)
    const totalRevenueData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });
    const totalRevenue = totalRevenueData._sum.amount || 0;

    // Revenue in period
    const periodRevenueData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });
    const periodRevenue = periodRevenueData._sum.amount || 0;
    const periodTransactions = periodRevenueData._count;

    // Average transaction value
    const avgTransactionValue = periodTransactions > 0 
      ? periodRevenue / periodTransactions 
      : 0;

    // Revenue by subscription tier
    const revenueByTier = await prisma.payment.groupBy({
      by: ['subscriptionTier'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const tierBreakdown = revenueByTier.map((item) => ({
      tier: item.subscriptionTier || 'UNKNOWN',
      revenue: item._sum.amount || 0,
      count: item._count,
    }));

    // Monthly revenue (last 12 months)
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const revenueData = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue: revenueData._sum.amount || 0,
      });
    }

    // ========================================
    // 3. SUBSCRIPTION ANALYTICS
    // ========================================

    // Active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Subscriptions by tier
    const subscriptionsByTier = await prisma.subscription.groupBy({
      by: ['tier'],
      where: {
        status: 'ACTIVE',
      },
      _count: true,
    });

    const subscriptionTierBreakdown = subscriptionsByTier.reduce((acc, item) => {
      acc[item.tier] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Churn rate (cancelled in period)
    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        canceledAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const churnRate = activeSubscriptions > 0
      ? (cancelledSubscriptions / activeSubscriptions) * 100
      : 0;

    // Trial conversions
    const trialsStarted = await prisma.subscription.count({
      where: {
        isTrial: true,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const trialsConverted = await prisma.subscription.count({
      where: {
        isTrial: false,
        createdAt: {
          gte: start,
          lte: end,
        },
        // Previously was trial (check if trialEndsAt exists)
        trialEndsAt: {
          not: null,
        },
      },
    });

    const trialConversionRate = trialsStarted > 0
      ? (trialsConverted / trialsStarted) * 100
      : 0;

    // ========================================
    // 4. ENGAGEMENT ANALYTICS
    // ========================================

    // Total teams
    const totalTeams = await prisma.team.count();

    // New teams in period
    const newTeams = await prisma.team.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Total leagues
    const totalLeagues = await prisma.league.count();

    // New leagues in period
    const newLeagues = await prisma.league.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Total matches
    const totalMatches = await prisma.match.count();

    // Matches in period
    const matchesInPeriod = await prisma.match.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // ========================================
    // 5. TOP PERFORMERS
    // ========================================

    // Top revenue generating users
    const topRevenueUsers = await prisma.payment.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10,
    });

    const topUsersWithDetails = await Promise.all(
      topRevenueUsers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        return {
          user: user
            ? {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
              }
            : null,
          totalRevenue: item._sum.amount || 0,
        };
      })
    );

    // ========================================
    // 6. BUILD RESPONSE
    // ========================================

    const analytics = {
      period: {
        type: period,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        byStatus: statusBreakdown,
        growthChart: monthlyGrowth,
      },
      revenue: {
        total: Math.round(totalRevenue),
        period: Math.round(periodRevenue),
        transactions: periodTransactions,
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
        byTier: tierBreakdown,
        monthlyChart: monthlyRevenue,
      },
      subscriptions: {
        active: activeSubscriptions,
        byTier: subscriptionTierBreakdown,
        churnRate: Math.round(churnRate * 100) / 100,
        trials: {
          started: trialsStarted,
          converted: trialsConverted,
          conversionRate: Math.round(trialConversionRate * 100) / 100,
        },
      },
      engagement: {
        teams: {
          total: totalTeams,
          new: newTeams,
        },
        leagues: {
          total: totalLeagues,
          new: newLeagues,
        },
        matches: {
          total: totalMatches,
          inPeriod: matchesInPeriod,
        },
      },
      topPerformers: {
        revenueUsers: topUsersWithDetails,
      },
    };

    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export route segment config
// ============================================================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;
