/**
 * SuperAdmin Dashboard API
 * Provides overview statistics and data for the SuperAdmin panel
 * @route GET /api/superadmin/dashboard
 * @access SuperAdmin only
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

export async function GET() {
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

    // Get admin user details
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // ========================================
    // 1. PLATFORM STATISTICS
    // ========================================

    // Total users
    const totalUsers = await prisma.user.count();

    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: thirtyDaysAgo,
        },
        status: 'ACTIVE',
      },
    });

    // Total teams
    const totalTeams = await prisma.team.count();

    // Total leagues
    const totalLeagues = await prisma.league.count();

    // Calculate revenue (from payments table)
    const revenueData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const totalRevenue = revenueData._sum.amount || 0;

    // Monthly revenue (current month)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const monthlyRevenue = monthlyRevenueData._sum.amount || 0;

    // Subscription rate (percentage of users with active subscriptions)
    const subscribedUsers = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    });

    const subscriptionRate = totalUsers > 0 ? (subscribedUsers / totalUsers) * 100 : 0;

    // User growth (new users this month vs last month)
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const thisMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: firstDayOfMonth,
        },
      },
    });

    const userGrowth = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
      : 0;

    // Revenue growth (similar calculation)
    const lastMonthEnd = firstDayOfMonth;
    const lastMonthRevenueData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: lastMonthStart,
          lt: lastMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const lastMonthRevenue = lastMonthRevenueData._sum.amount || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // ========================================
    // 2. USERS BY ROLE
    // ========================================

    const usersByRole = {
      PLAYER: await prisma.user.count({ where: { roles: { has: 'PLAYER' } } }),
      PLAYER_PRO: await prisma.user.count({ where: { roles: { has: 'PLAYER_PRO' } } }),
      COACH: await prisma.user.count({ where: { roles: { has: 'COACH' } } }),
      CLUB_MANAGER: await prisma.user.count({ where: { roles: { has: 'CLUB_MANAGER' } } }),
      LEAGUE_ADMIN: await prisma.user.count({ where: { roles: { has: 'LEAGUE_ADMIN' } } }),
    };

    // ========================================
    // 3. UPGRADE REQUESTS
    // ========================================

    const upgradeRequests = await prisma.upgradeRequest.findMany({
      orderBy: {
        requestedAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            roles: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const formattedRequests = upgradeRequests.map((request) => ({
      id: request.id,
      user: {
        id: request.user.id,
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
        userType: request.user.roles[0] || 'PLAYER',
        avatar: request.user.avatar,
      },
      currentRole: request.currentRole,
      requestedRole: request.requestedRole,
      reason: request.reason,
      status: request.status,
      requestedAt: request.requestedAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
      reviewedBy: request.reviewedByUser
        ? `${request.reviewedByUser.firstName} ${request.reviewedByUser.lastName}`
        : undefined,
      reviewedAt: request.reviewedAt?.toISOString().split('T')[0],
      reviewNotes: request.reviewNotes,
    }));

    // ========================================
    // 4. RECENT ACTIVITY (from audit logs)
    // ========================================

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        performer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const recentActivity = recentLogs.map((log) => ({
      id: log.id,
      type: log.action,
      description: log.reason || `${log.action} performed`,
      timestamp: log.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
      user: log.performer
        ? {
            name: `${log.performer.firstName} ${log.performer.lastName}`,
            email: log.performer.email,
          }
        : undefined,
    }));

    // ========================================
    // 5. BUILD RESPONSE
    // ========================================

    const dashboardData = {
      admin: {
        id: adminUser.id,
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        avatarUrl: adminUser.avatar,
      },
      stats: {
        totalUsers,
        activeUsers,
        totalTeams,
        totalLeagues,
        totalRevenue: Math.round(totalRevenue),
        monthlyRevenue: Math.round(monthlyRevenue),
        subscriptionRate: Math.round(subscriptionRate),
        userGrowth: Math.round(userGrowth),
        revenueGrowth: Math.round(revenueGrowth),
      },
      usersByRole,
      upgradeRequests: formattedRequests,
      recentActivity,
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('SuperAdmin Dashboard API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// Export route segment config
export const dynamic = 'force-dynamic';
export const revalidate = 0;
