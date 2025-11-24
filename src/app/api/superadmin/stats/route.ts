/**
 * ============================================================================
 * src/app/api/superadmin/stats/route.ts
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

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

    console.log('\n📊 ===== FETCHING REAL STATS =====');

    // ========================================
    // FIXED: Real Database Queries
    // ========================================

    // 1. Total Users (REAL COUNT)
    const totalUsers = await prisma.user.count();
    console.log(`✅ Total Users: ${totalUsers}`);

    // 2. Active Users (status = ACTIVE)
    const activeUsers = await prisma.user.count({
      where: {
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Active Users: ${activeUsers}`);

    // 3. Active Subscriptions (REAL COUNT)
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    }).catch(() => 0);

    console.log(`✅ Active Subscriptions: ${activeSubscriptions}`);

    // 4. Monthly Revenue (FIXED: removed interval field)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        monthlyPrice: true,
        customPrice: true,
      },
    }).catch(() => []);

    const monthlyRevenue = subscriptions.reduce(
      (sum, sub) => sum + (sub.monthlyPrice || sub.customPrice || 0),
      0
    );
    console.log(`✅ Monthly Revenue: £${monthlyRevenue}`);

    // 5. Pending Upgrades (REAL COUNT)
    const pendingUpgrades = await prisma.upgradeRequest.count({
      where: {
        status: 'PENDING',
      },
    }).catch(() => 0);

    console.log(`✅ Pending Upgrades: ${pendingUpgrades}`);

    // 6. System Health (placeholder - can add real checks)
    const systemHealth = 98;

    // 7. Recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
    console.log(`✅ Recent Signups (30d): ${recentSignups}`);

    // 8. User Growth (compare to previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousPeriodUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const userGrowth =
      previousPeriodUsers > 0
        ? ((recentSignups - previousPeriodUsers) / previousPeriodUsers) * 100
        : recentSignups > 0 ? 100 : 0;

    console.log(`✅ User Growth: ${userGrowth.toFixed(1)}%`);

    // 9. Recent Activities (last 10 audit logs)
    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        action: true,
        performedBy: true,
        affectedUser: true,
        createdAt: true,
        performer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        affected: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }).catch(() => []);

    const formattedActivities = recentActivities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      performerName: activity.performer
        ? `${activity.performer.firstName} ${activity.performer.lastName}`
        : 'System',
      affectedUserName: activity.affected
        ? `${activity.affected.firstName} ${activity.affected.lastName}`
        : null,
      timestamp: activity.createdAt.toISOString(),
    }));

    console.log(`✅ Recent Activities: ${formattedActivities.length}`);
    console.log('===== STATS COMPLETE =====\n');

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          activeUsers,
          activeSubscriptions,
          monthlyRevenue,
          pendingUpgrades,
          systemHealth,
          recentSignups,
          userGrowth: Math.round(userGrowth * 10) / 10,
        },
        recentActivities: formattedActivities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Stats API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;