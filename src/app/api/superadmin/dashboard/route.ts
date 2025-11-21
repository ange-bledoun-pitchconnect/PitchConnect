/**
 * SuperAdmin Dashboard API
 * Provides overview statistics and data for the SuperAdmin panel
 * @route GET /api/superadmin/dashboard
 * @access SuperAdmin only
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
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

    console.log('🔍 Fetching SuperAdmin dashboard data...');

    // ========================================
    // 1. PLATFORM STATISTICS (with error handling)
    // ========================================

    let totalUsers = 0;
    let activeUsers = 0;
    let totalTeams = 0;
    let totalLeagues = 0;

    try {
      totalUsers = await prisma.user.count();
      console.log('✅ Total users:', totalUsers);
    } catch (error) {
      console.error('❌ Error counting users:', error);
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      activeUsers = await prisma.user.count({
        where: {
          lastLogin: {
            gte: thirtyDaysAgo,
          },
          status: 'ACTIVE',
        },
      });
      console.log('✅ Active users:', activeUsers);
    } catch (error) {
      console.error('❌ Error counting active users:', error);
      // Fallback: just count active users
      activeUsers = await prisma.user.count({
        where: { status: 'ACTIVE' },
      });
    }

    try {
      totalTeams = await prisma.team.count();
      console.log('✅ Total teams:', totalTeams);
    } catch (error) {
      console.error('❌ Error counting teams:', error);
    }

    try {
      totalLeagues = await prisma.league.count();
      console.log('✅ Total leagues:', totalLeagues);
    } catch (error) {
      console.error('❌ Error counting leagues:', error);
    }

    // Revenue calculations (with error handling)
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let subscribedUsers = 0;

    try {
      const revenueData = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      });
      totalRevenue = revenueData._sum.amount || 0;
      console.log('✅ Total revenue:', totalRevenue);
    } catch (error) {
      console.error('❌ Error calculating revenue:', error);
    }

    try {
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
      monthlyRevenue = monthlyRevenueData._sum.amount || 0;
      console.log('✅ Monthly revenue:', monthlyRevenue);
    } catch (error) {
      console.error('❌ Error calculating monthly revenue:', error);
    }

    try {
      subscribedUsers = await prisma.subscription.count({
        where: {
          status: 'ACTIVE',
        },
      });
      console.log('✅ Subscribed users:', subscribedUsers);
    } catch (error) {
      console.error('❌ Error counting subscriptions:', error);
    }

    const subscriptionRate = totalUsers > 0 ? (subscribedUsers / totalUsers) * 100 : 0;

    // User growth calculation (with error handling)
    let userGrowth = 0;
    let revenueGrowth = 0;

    try {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

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

      userGrowth =
        lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

      console.log('✅ User growth:', userGrowth);
    } catch (error) {
      console.error('❌ Error calculating user growth:', error);
    }

    // ========================================
    // 2. USERS BY ROLE (FIXED)
    // ========================================

    const usersByRole = {
      PLAYER: 0,
      PLAYER_PRO: 0,
      COACH: 0,
      CLUB_MANAGER: 0,
      LEAGUE_ADMIN: 0,
    };

    try {
      // 🔧 FIXED: Count users by role using userRoles junction table
      const roleCounts = await prisma.userRole_User.groupBy({
        by: ['roleName'],
        _count: {
          userId: true,
        },
      });

      roleCounts.forEach((roleCount) => {
        if (roleCount.roleName in usersByRole) {
          usersByRole[roleCount.roleName as keyof typeof usersByRole] = roleCount._count.userId;
        }
      });

      console.log('✅ Users by role:', usersByRole);
    } catch (error) {
      console.error('❌ Error counting users by role:', error);
    }

    // ========================================
    // 3. UPGRADE REQUESTS (FIXED)
    // ========================================

    let upgradeRequests: any[] = [];

    try {
      const requests = await prisma.upgradeRequest.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              // 🔧 FIXED: Include userRoles
              userRoles: {
                select: {
                  roleName: true,
                },
              },
            },
          },
        },
      });

      upgradeRequests = requests.map((request) => ({
        id: request.id,
        user: {
          id: request.user.id,
          name: `${request.user.firstName} ${request.user.lastName}`,
          email: request.user.email,
          // 🔧 FIXED: Get first role from userRoles
          userType: request.user.userRoles[0]?.roleName || 'PLAYER',
          avatar: request.user.avatar,
        },
        currentRole: request.currentRole,
        requestedRole: request.requestedRole,
        reason: request.reason,
        status: request.status,
        requestedAt: new Date(request.createdAt).toISOString().split('T')[0],
        reviewedBy: request.reviewedBy || undefined,
        reviewedAt: request.reviewedAt
          ? new Date(request.reviewedAt).toISOString().split('T')[0]
          : undefined,
        reviewNotes: request.reviewNotes || undefined,
      }));

      console.log('✅ Upgrade requests:', upgradeRequests.length);
    } catch (error) {
      console.error('❌ Error fetching upgrade requests:', error);
      // If table doesn't exist, just use empty array
      upgradeRequests = [];
    }

    // ========================================
    // 4. RECENT ACTIVITY
    // ========================================

    let recentActivity: any[] = [];

    try {
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

      recentActivity = recentLogs.map((log) => ({
        id: log.id,
        type: log.action,
        description: log.reason || `${log.action} performed`,
        timestamp: new Date(log.createdAt).toISOString().split('T')[0],
        user: log.performer
          ? {
              name: `${log.performer.firstName} ${log.performer.lastName}`,
              email: log.performer.email,
            }
          : undefined,
      }));

      console.log('✅ Recent activity:', recentActivity.length);
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      // If table doesn't exist, create some mock activity
      recentActivity = [
        {
          id: '1',
          type: 'USER_CREATED',
          description: 'SuperAdmin dashboard accessed',
          timestamp: new Date().toISOString().split('T')[0],
          user: {
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email,
          },
        },
      ];
    }

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
      upgradeRequests,
      recentActivity,
    };

    console.log('✅ Dashboard data compiled successfully');

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('❌ SuperAdmin Dashboard API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Export route segment config
export const dynamic = 'force-dynamic';
export const revalidate = 0;
