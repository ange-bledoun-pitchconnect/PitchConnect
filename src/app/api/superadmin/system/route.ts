// src/app/api/superadmin/system/route.ts
// SuperAdmin System Health & Logs API

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
    const type = searchParams.get('type') || 'all';

    // System Health Mock Data (you can enhance with real metrics)
    const health = {
      status: 'healthy',
      uptime: 99.98,
      apiResponseTime: 245,
      databaseConnections: 15,
      errorRate: 0.02,
      requestsPerMinute: 1250,
    };

    // Fetch audit logs from database
    let logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        affectedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }).catch(() => []);

    // Filter by type
    if (type !== 'all') {
      switch (type) {
        case 'useractions':
          logs = logs.filter((log) =>
            ['USER_SUSPENDED', 'USER_UPDATED', 'USER_BANNED', 'ROLE_UPGRADED'].includes(
              log.action
            )
          );
          break;
        case 'subscriptionactions':
          logs = logs.filter((log) =>
            ['SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_EXTENDED', 'SUBSCRIPTION_CHANGED'].includes(
              log.action
            )
          );
          break;
        case 'security':
          logs = logs.filter((log) =>
            ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PASSWORD_CHANGED'].includes(log.action)
          );
          break;
        case 'errors':
          logs = logs.filter((log) => log.action.includes('ERROR'));
          break;
      }
    }

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      performedBy: log.performedById,
      performedByName: log.performedBy
        ? `${log.performedBy.firstName} ${log.performedBy.lastName}`
        : 'System',
      affectedUser: log.affectedUserId,
      affectedUserName: log.affectedUser
        ? `${log.affectedUser.firstName} ${log.affectedUser.lastName}`
        : null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      reason: log.reason || '',
      timestamp: log.createdAt.toISOString(),
      ipAddress: log.ipAddress || null,
    }));

    return NextResponse.json(
      {
        health,
        logs: formattedLogs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('System API Error:', error);
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