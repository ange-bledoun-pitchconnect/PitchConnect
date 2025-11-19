/**
 * SuperAdmin Dashboard API
 * Returns platform-wide metrics, user stats, upgrade requests, and recent activity
 * @route GET /api/superadmin/dashboard
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// GET - Fetch SuperAdmin Dashboard Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // Check SuperAdmin status
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // ========================================
    // 2. FETCH ADMIN USER DATA
    // ========================================
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
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // ========================================
    // 3. FETCH PLATFORM STATISTICS
    // ========================================

    // Total users count
    const totalUsers = await prisma.user.count();

    // Active users (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: sevenDaysAgo,
        },
        status: 'ACTIVE',
      },
    });

    // Total teams
    const totalTeams = await prisma.team.count();

    // Total leagues
    const totalLeagues = await prisma.league.count();

    // Total revenue (sum of all completed payments)
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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const monthlyRevenue = monthlyRevenueData._sum.amount || 0;

    // User growth (this month vs last month)
    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const usersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: startOfMonth,
        },
      },
    });

    const userGrowth =
      usersLastMonth > 0
        ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
        : 100;

    // Revenue growth (this month vs last month)
    const revenueLastMonthData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: lastMonthStart,
          lt: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const revenueLastMonth = revenueLastMonthData._sum.amount || 0;

    const revenueGrowth =
      revenueLastMonth > 0
        ? Math.round(((monthlyRevenue - revenueLastMonth) / revenueLastMonth) * 100)
        : 100;

    // Subscription rate (percentage of users with active subscriptions)
    const subscribedUsers = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        tier: {
          not: 'FREE',
        },
      },
    });

    const subscriptionRate =
      totalUsers > 0 ? Math.round((subscribedUsers / totalUsers) * 100) : 0;

    // ========================================
    // 4. USERS BY ROLE
    // ========================================
    const usersByRole = await prisma.user.groupBy({
      by: ['roles'],
      _count: true,
    });

    // Transform into object with role counts
    const roleCount = {
      PLAYER: 0,
      PLAYER_PRO: 0,
      COACH: 0,
      CLUB_MANAGER: 0,
      LEAGUE_ADMIN: 0,
    };

    usersByRole.forEach((group) => {
      group.roles.forEach((role) => {
        if (role in roleCount) {
          roleCount[role as keyof typeof roleCount] += group._count;
        }
      });
    });

    // ========================================
    // 5. UPGRADE REQUESTS
    // ========================================
    const upgradeRequests = await prisma.upgradeRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Format upgrade requests for frontend
    const formattedRequests = upgradeRequests.map((request) => ({
      id: request.id,
      user: {
        id: request.user.id,
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
        userType: request.currentRole,
        avatar: request.user.avatar,
      },
      currentRole: request.currentRole,
      requestedRole: request.requestedRole,
      reason: request.reason,
      status: request.status,
      requestedAt: request.createdAt.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      reviewedBy: request.reviewedBy,
      reviewedAt: request.reviewedAt?.toLocaleDateString('en-GB'),
      reviewNotes: request.reviewNotes,
    }));

    // ========================================
    // 6. RECENT ACTIVITY (Last 20 audit logs)
    // ========================================
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      include: {
        performer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        affected: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Format activity for frontend
    const formattedActivity = recentActivity.map((log) => {
      let description = '';
      
      switch (log.action) {
        case 'USER_CREATED':
          description = `New user registered: ${log.affected?.firstName} ${log.affected?.lastName}`;
          break;
        case 'ROLE_UPGRADED':
          description = `User role upgraded by ${log.performer?.firstName || 'System'}`;
          break;
        case 'SUBSCRIPTION_GRANTED':
          description = `Premium access granted to ${log.affected?.firstName} ${log.affected?.lastName}`;
          break;
        case 'USER_SUSPENDED':
          description = `User suspended: ${log.affected?.firstName} ${log.affected?.lastName}`;
          break;
        case 'UPGRADE_REQUEST_APPROVED':
          description = `Upgrade request approved by ${log.performer?.firstName}`;
          break;
        default:
          description = `${log.action} performed`;
      }

      return {
        id: log.id,
        type: log.action,
        description,
        timestamp: log.createdAt.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' • ' + log.createdAt.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        }),
        user: log.affected ? {
          name: `${log.affected.firstName} ${log.affected.lastName}`,
          email: log.affected.email,
        } : undefined,
      };
    });

    // ========================================
    // 7. BUILD RESPONSE
    // ========================================
    const response = {
      admin: {
        id: adminUser.id,
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        avatarUrl: adminUser.avatar || undefined,
      },
      stats: {
        totalUsers,
        activeUsers,
        totalTeams,
        totalLeagues,
        totalRevenue: Math.round(totalRevenue),
        monthlyRevenue: Math.round(monthlyRevenue),
        subscriptionRate,
        userGrowth,
        revenueGrowth,
      },
      usersByRole: roleCount,
      upgradeRequests: formattedRequests,
      recentActivity: formattedActivity,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('SuperAdmin Dashboard API Error:', error);
    
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
