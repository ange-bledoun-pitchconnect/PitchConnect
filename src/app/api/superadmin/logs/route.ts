/**
 * SuperAdmin Audit Logs API
 * View complete system audit trail
 * @route GET /api/superadmin/logs - Get audit logs
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// ============================================================================
// GET - Get Audit Logs
// ============================================================================

export async function GET(req: NextRequest) {
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
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: { role: true },
});

if (user?.role !== 'SUPERADMIN') {
  return NextResponse.json(
    { error: 'Forbidden: SuperAdmin access required' },
    { status: 403 }
  );
}


    // Get query parameters
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const performedBy = searchParams.get('performedBy');
    const affectedUser = searchParams.get('affectedUser');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const exportFormat = searchParams.get('export'); // 'json' or 'csv'

    // Build query filters
    const where: any = {};

    // Action filter
    if (action) {
      where.action = action;
    }

    // Entity type filter
    if (entityType) {
      where.entityType = entityType;
    }

    // Performed by filter
    if (performedBy) {
      where.performedBy = performedBy;
    }

    // Affected user filter
    if (affectedUser) {
      where.affectedUser = affectedUser;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Search filter (in reason field)
    if (search) {
      where.reason = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Fetch audit logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: exportFormat ? undefined : limit, // No limit for exports
      skip: exportFormat ? undefined : offset,
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

    // Format logs
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      performer: log.performer
        ? {
            id: log.performer.id,
            name: `${log.performer.firstName} ${log.performer.lastName}`,
            email: log.performer.email,
          }
        : null,
      affected: log.affected
        ? {
            id: log.affected.id,
            name: `${log.affected.firstName} ${log.affected.lastName}`,
            email: log.affected.email,
          }
        : null,
      previousValue: log.previousValue,
      newValue: log.newValue,
      reason: log.reason,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.createdAt.toISOString(),
    }));

    // ========================================
    // EXPORT HANDLING
    // ========================================

    if (exportFormat === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'Action',
        'Entity Type',
        'Performer',
        'Affected User',
        'Reason',
        'IP Address',
      ];

      const csvRows = formattedLogs.map((log) => [
        log.timestamp,
        log.action,
        log.entityType,
        log.performer?.name || 'System',
        log.affected?.name || '-',
        log.reason || '-',
        log.ipAddress || '-',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
        },
      });
    }

    if (exportFormat === 'json') {
      // Return full JSON export
      return new NextResponse(JSON.stringify(formattedLogs, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.json"`,
        },
      });
    }

    // ========================================
    // STANDARD RESPONSE WITH PAGINATION
    // ========================================

    // Get action type statistics
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    const actionBreakdown = actionStats.map((stat) => ({
      action: stat.action,
      count: stat._count,
    }));

    // Get entity type statistics
    const entityStats = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true,
    });

    const entityBreakdown = entityStats.map((stat) => ({
      entityType: stat.entityType,
      count: stat._count,
    }));

    // Get most active performers
    const topPerformers = await prisma.auditLog.groupBy({
      by: ['performedBy'],
      where: {
        ...where,
        performedBy: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          performedBy: 'desc',
        },
      },
      take: 5,
    });

    const performersWithDetails = await Promise.all(
      topPerformers.map(async (item) => {
        if (!item.performedBy) return null;

        const user = await prisma.user.findUnique({
          where: { id: item.performedBy },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        return user
          ? {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              actionCount: item._count,
            }
          : null;
      })
    );

    const topPerformersFiltered = performersWithDetails.filter((p) => p !== null);

    // Build response
    return NextResponse.json(
      {
        logs: formattedLogs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        statistics: {
          total,
          byAction: actionBreakdown,
          byEntityType: entityBreakdown,
          topPerformers: topPerformersFiltered,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit Logs API Error:', error);
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
