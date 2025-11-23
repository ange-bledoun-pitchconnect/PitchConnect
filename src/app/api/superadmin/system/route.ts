// src/app/api/superadmin/system/route.ts
// SuperAdmin System Health & Logs API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// GET - Fetch System Health & Audit Logs
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
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filters for audit logs
    const where: any = {};

    switch (type) {
      case 'user_actions':
        where.action = {
          in: ['USER_SUSPENDED', 'USER_UPDATED', 'USER_BANNED', 'USER_DELETED', 'ROLE_UPGRADED'],
        };
        break;
      case 'subscription_actions':
        where.action = {
          in: [
            'SUBSCRIPTION_GRANTED',
            'SUBSCRIPTION_EXTENDED',
            'SUBSCRIPTION_CHANGED',
            'SUBSCRIPTION_REVOKED',
          ],
        };
        break;
      case 'security':
        where.action = {
          in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PASSWORD_CHANGED', 'SESSION_EXPIRED'],
        };
        break;
      case 'errors':
        where.action = { contains: 'ERROR' };
        break;
      // 'all' fetches everything
    }

    // Fetch audit logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        performer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    });

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // System health metrics (mock for now - would integrate with monitoring service)
    const health = {
      status: 'healthy' as const,
      uptime: 99.98,
      apiResponseTime: 245,
      databaseConnections: 15,
      errorRate: 0.02,
      requestsPerMinute: 1250,
    };

    // Format logs
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      performedBy: log.performedBy,
      performedByName: log.performer
        ? `${log.performer.firstName} ${log.performer.lastName}`
        : 'System',
      affectedUser: log.affectedUser || undefined,
      affectedUserName: log.affected
        ? `${log.affected.firstName} ${log.affected.lastName}`
        : undefined,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      reason: log.reason || 'No reason provided',
      timestamp: log.createdAt.toISOString(),
      ipAddress: log.metadata?.ipAddress || undefined,
    }));

    return NextResponse.json(
      {
        success: true,
        health,
        logs: formattedLogs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('System GET Error:', error);
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