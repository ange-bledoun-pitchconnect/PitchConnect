// src/app/api/superadmin/audit-logs/route.ts
/**
 * SuperAdmin Audit Logs API
 * GET - Get all audit logs with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkSuperAdminSession } from '@/lib/superadmin-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (action) filter.action = action;

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) {
        filter.timestamp.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.timestamp.lte = endDate;
      }
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: filter,
        include: {
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip,
      }),
      prisma.auditLog.count({ where: filter }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: logs.map((log) => ({
          id: log.id,
          performedById: log.performedById,
          performedBy: log.performedBy,
          targetUserId: log.targetUserId,
          action: log.action,
          details: JSON.parse(log.details || '{}'),
          timestamp: log.timestamp,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Audit logs GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}