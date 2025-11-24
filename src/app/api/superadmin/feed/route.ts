/**
 * ============================================================================
 * src/app/api/superadmin/feed/route.ts * Feed API - Aggregates activity from all users, clubs, and events
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sport = searchParams.get('sport') || 'all';
    const dateRange = searchParams.get('dateRange') || 'all';
    const clubId = searchParams.get('clubId') || 'all';
    const activityType = searchParams.get('activityType') || 'all';
    const userType = searchParams.get('userType') || 'all';
    const teamId = searchParams.get('teamId') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build date filter
    let dateFilter: any = {};
    if (dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        dateFilter = {
          gte: new Date(now.setHours(0, 0, 0, 0)),
          lte: new Date(now.setHours(23, 59, 59, 999)),
        };
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekAgo };
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: monthAgo };
      }
    }

    // ========================================
    // AGGREGATE ACTIVITIES FROM MULTIPLE SOURCES
    // ========================================

    const activities: any[] = [];

    // 1. USER REGISTRATIONS (FIXED: removed userType field, use roles array)
    const newUsers = await prisma.user.findMany({
      where: {
        ...(dateRange !== 'all' && { createdAt: dateFilter }),
        // REMOVED: userType filter (doesn't exist in schema)
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true, // FIXED: changed from userType to roles (array)
        createdAt: true,
        avatar: true,
      },
    });

    newUsers.forEach((user) => {
      // Get primary role (first role in array or default)
      const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'USER';
      
      activities.push({
        id: `user-${user.id}`,
        type: 'USER_REGISTRATION',
        title: 'New User Joined',
        description: `${user.firstName} ${user.lastName} joined as ${primaryRole}`,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          avatar: user.avatar,
          type: primaryRole,
        },
        timestamp: user.createdAt,
        metadata: {
          userType: primaryRole,
          roles: user.roles,
        },
      });
    });

    // 2. SUBSCRIPTION CHANGES
    const subscriptions = await prisma.subscription.findMany({
      where: {
        ...(dateRange !== 'all' && { createdAt: dateFilter }),
        ...(status !== 'all' && { status }),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    }).catch(() => []);

    subscriptions.forEach((sub) => {
      activities.push({
        id: `sub-${sub.id}`,
        type: 'SUBSCRIPTION_CHANGE',
        title: 'Subscription Updated',
        description: `${sub.user.firstName} ${sub.user.lastName} ${
          sub.status === 'ACTIVE' ? 'activated' : 'cancelled'
        } ${sub.tier} subscription`,
        user: {
          id: sub.user.id,
          name: `${sub.user.firstName} ${sub.user.lastName}`,
          email: sub.user.email,
          avatar: sub.user.avatar,
        },
        timestamp: sub.createdAt,
        metadata: {
          tier: sub.tier,
          status: sub.status,
          price: sub.monthlyPrice || sub.customPrice,
        },
      });
    });

    // 3. AUDIT LOGS (System Activities)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        ...(dateRange !== 'all' && { createdAt: dateFilter }),
        ...(search && { action: { contains: search, mode: 'insensitive' } }),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        performer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        affected: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }).catch(() => []);

    auditLogs.forEach((log) => {
      activities.push({
        id: `audit-${log.id}`,
        type: 'SYSTEM_ACTION',
        title: log.action.replace(/_/g, ' '),
        description: `${log.performer?.firstName || 'System'} ${log.performer?.lastName || ''} performed ${log.action}${
          log.affected ? ` on ${log.affected.firstName} ${log.affected.lastName}` : ''
        }`,
        user: log.performer
          ? {
              id: log.performer.id,
              name: `${log.performer.firstName} ${log.performer.lastName}`,
              email: log.performer.email,
              avatar: log.performer.avatar,
            }
          : null,
        timestamp: log.createdAt,
        metadata: {
          action: log.action,
          affectedUser: log.affected
            ? `${log.affected.firstName} ${log.affected.lastName}`
            : null,
        },
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate total count (FIXED: removed userType filter)
    const totalUsers = await prisma.user.count({
      where: {
        ...(dateRange !== 'all' && { createdAt: dateFilter }),
        // REMOVED: userType filter
      },
    });

    const totalSubscriptions = await prisma.subscription.count({
      where: {
        ...(dateRange !== 'all' && { createdAt: dateFilter }),
      },
    }).catch(() => 0);

    const totalAuditLogs = await prisma.auditLog.count({
      where: {
        ...(dateRange !== 'all' && { createdAt: dateFilter }),
      },
    }).catch(() => 0);

    const totalCount = totalUsers + totalSubscriptions + totalAuditLogs;

    return NextResponse.json(
      {
        activities: activities.slice(0, limit),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        filters: {
          sport,
          dateRange,
          clubId,
          activityType,
          userType,
          teamId,
          status,
          search,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feed API Error:', error);
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
