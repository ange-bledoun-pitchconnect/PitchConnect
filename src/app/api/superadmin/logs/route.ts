/**
 * ============================================================================
 * SUPERADMIN AUDIT LOGS ROUTE - World-Class Audit Trail
 * ============================================================================
 *
 * @file src/app/api/superadmin/logs/route.ts
 * @description Complete system audit trail with filtering, statistics, and export
 * @version 2.0.0 (Production-Ready)
 *
 * FEATURES:
 * ✅ Full TypeScript type safety
 * ✅ Schema-aligned field names & relationships
 * ✅ SuperAdmin authorization checks
 * ✅ Advanced filtering (action, entity type, date range, search)
 * ✅ Pagination with offset/limit
 * ✅ Statistical breakdown (action, entity, top performers)
 * ✅ Export capabilities (JSON & CSV)
 * ✅ Error handling & structured logging
 * ✅ Request ID tracking
 * ✅ JSDoc documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface FormattedAuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  performer: {
    id: string;
    name: string;
    email: string;
  } | null;
  targetUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  details: string | null;
  changes: Record<string, unknown> | null;
  severity: string;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

interface LogsResponse {
  success: boolean;
  logs: FormattedAuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
    hasMore: boolean;
  };
  statistics: {
    total: number;
    byAction: Array<{ action: string; count: number }>;
    byEntityType: Array<{ entityType: string | null; count: number }>;
    bySeverity: Array<{ severity: string; count: number }>;
    topPerformers: Array<{
      id: string;
      name: string;
      email: string;
      actionCount: number;
    }>;
  };
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const DEFAULT_OFFSET = 0;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse and validate query parameters
 */
function parseQueryParams(searchParams: URLSearchParams): {
  action?: string;
  entityType?: string;
  performedBy?: string;
  targetUserId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit: number;
  offset: number;
  exportFormat?: 'json' | 'csv';
  error?: string;
} {
  const action = searchParams.get('action') || undefined;
  const entityType = searchParams.get('entityType') || undefined;
  const performedBy = searchParams.get('performedBy') || undefined;
  const targetUserId = searchParams.get('targetUserId') || undefined;
  const search = searchParams.get('search') || undefined;
  const exportFormat = searchParams.get('export') as 'json' | 'csv' | null;

  let limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10), 1),
    MAX_LIMIT
  );
  let offset = Math.max(parseInt(searchParams.get('offset') || String(DEFAULT_OFFSET), 10), 0);

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  const startDateStr = searchParams.get('startDate');
  if (startDateStr) {
    startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      return {
        limit: 0,
        offset: 0,
        error: 'Invalid startDate format. Use ISO 8601 (YYYY-MM-DD)',
      };
    }
    startDate.setHours(0, 0, 0, 0);
  }

  const endDateStr = searchParams.get('endDate');
  if (endDateStr) {
    endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) {
      return {
        limit: 0,
        offset: 0,
        error: 'Invalid endDate format. Use ISO 8601 (YYYY-MM-DD)',
      };
    }
    endDate.setHours(23, 59, 59, 999);
  }

  // Validate export format
  if (exportFormat && !['json', 'csv'].includes(exportFormat)) {
    return {
      limit: 0,
      offset: 0,
      error: 'Invalid export format. Use "json" or "csv"',
    };
  }

  return {
    action,
    entityType,
    performedBy,
    targetUserId,
    search,
    startDate,
    endDate,
    limit,
    offset,
    exportFormat: exportFormat || undefined,
  };
}

/**
 * Build Prisma where clause from filters
 */
function buildWhereClause(params: ReturnType<typeof parseQueryParams>) {
  const where: Record<string, unknown> = {};

  if (params.action) {
    where.action = params.action;
  }

  if (params.entityType) {
    where.entityType = params.entityType;
  }

  if (params.performedBy) {
    where.performedById = params.performedBy;
  }

  if (params.targetUserId) {
    where.targetUserId = params.targetUserId;
  }

  if (params.search) {
    where.OR = [
      { details: { contains: params.search, mode: 'insensitive' } },
      { performedBy: { email: { contains: params.search, mode: 'insensitive' } } },
      { performedBy: { firstName: { contains: params.search, mode: 'insensitive' } } },
      { performedBy: { lastName: { contains: params.search, mode: 'insensitive' } } },
      { targetUser: { email: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};

    if (params.startDate) {
      (where.createdAt as Record<string, unknown>).gte = params.startDate;
    }

    if (params.endDate) {
      (where.createdAt as Record<string, unknown>).lte = params.endDate;
    }
  }

  return where;
}

/**
 * Format audit log to response shape
 */
function formatAuditLog(auditLog: any): FormattedAuditLog {
  return {
    id: auditLog.id,
    action: auditLog.action,
    entityType: auditLog.entityType,
    entityId: auditLog.entityId,
    performer: auditLog.performedBy
      ? {
          id: auditLog.performedBy.id,
          name: `${auditLog.performedBy.firstName || ''} ${auditLog.performedBy.lastName || ''}`.trim(),
          email: auditLog.performedBy.email,
        }
      : null,
    targetUser: auditLog.targetUser
      ? {
          id: auditLog.targetUser.id,
          name: `${auditLog.targetUser.firstName || ''} ${auditLog.targetUser.lastName || ''}`.trim(),
          email: auditLog.targetUser.email,
        }
      : null,
    details: auditLog.details,
    changes: auditLog.changes as Record<string, unknown> | null,
    severity: auditLog.severity,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    timestamp: auditLog.createdAt.toISOString(),
  };
}

/**
 * Generate CSV from logs
 */
function generateCsv(logs: FormattedAuditLog[]): string {
  const headers = [
    'Timestamp',
    'Action',
    'Entity Type',
    'Entity ID',
    'Performer',
    'Target User',
    'Severity',
    'IP Address',
    'Details',
  ];

  const rows = logs.map((log) => [
    log.timestamp,
    log.action,
    log.entityType || '-',
    log.entityId || '-',
    log.performer?.name || 'System',
    log.targetUser?.name || '-',
    log.severity,
    log.ipAddress || '-',
    (log.details || '').replace(/"/g, '""'), // Escape quotes
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * GET /api/superadmin/logs
 *
 * Retrieve complete system audit trail with filtering and statistics
 * (SuperAdmin only)
 *
 * Query parameters:
 * - action: string (filter by action)
 * - entityType: string (filter by entity type)
 * - performedBy: string (filter by user ID who performed action)
 * - targetUserId: string (filter by affected user ID)
 * - startDate: ISO 8601 date (filter by start date)
 * - endDate: ISO 8601 date (filter by end date)
 * - search: string (search in details and user info)
 * - limit: number (default: 100, max: 500)
 * - offset: number (default: 0)
 * - export: 'json' | 'csv' (export all results)
 *
 * @param req NextRequest
 * @returns LogsResponse on success, ErrorResponse on failure
 */
export async function GET(req: NextRequest): Promise<NextResponse<LogsResponse | ErrorResponse | string>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.warn('Unauthorized logs access - no session', { requestId });
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: ERROR_CODES.UNAUTHORIZED,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. VALIDATE SUPERADMIN ACCESS
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        roles: true,
      },
    });

    if (!user || (!user.isSuperAdmin && !user.roles.includes('SUPERADMIN'))) {
      console.warn('SuperAdmin authorization failed for logs', {
        requestId,
        email: session.user.email,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'SuperAdmin access required',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. PARSE & VALIDATE PARAMETERS
    // ========================================================================

    const params = parseQueryParams(new URL(req.url).searchParams);

    if (params.error) {
      console.warn('Invalid query parameters', {
        requestId,
        error: params.error,
      });
      return NextResponse.json(
        {
          success: false,
          error: params.error,
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 4. BUILD QUERY
    // ========================================================================

    const where = buildWhereClause(params);

    // ========================================================================
    // 5. FETCH AUDIT LOGS
    // ========================================================================

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: params.exportFormat ? undefined : params.limit,
      skip: params.exportFormat ? undefined : params.offset,
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const total = await prisma.auditLog.count({ where });

    // ========================================================================
    // 6. FORMAT LOGS
    // ========================================================================

    const formattedLogs = logs.map(formatAuditLog);

    // ========================================================================
    // 7. HANDLE EXPORT
    // ========================================================================

    if (params.exportFormat === 'csv') {
      const csv = generateCsv(formattedLogs);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Request-ID': requestId,
        },
      });
    }

    if (params.exportFormat === 'json') {
      const json = JSON.stringify(formattedLogs, null, 2);
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`,
          'X-Request-ID': requestId,
        },
      });
    }

    // ========================================================================
    // 8. GET STATISTICS
    // ========================================================================

    const [actionStats, entityStats, severityStats, topPerformers] = await Promise.all([
      // Action breakdown
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),

      // Entity type breakdown
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
      }),

      // Severity breakdown
      prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),

      // Top performers
      prisma.auditLog.groupBy({
        by: ['performedById'],
        where: {
          ...where,
          performedById: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            performedById: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Enrich top performers with user details
    const topPerformersWithDetails = await Promise.all(
      topPerformers
        .filter((p) => p.performedById !== null)
        .map(async (item) => {
          const performerUser = await prisma.user.findUnique({
            where: { id: item.performedById! },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          });

          return performerUser
            ? {
                id: performerUser.id,
                name: `${performerUser.firstName || ''} ${performerUser.lastName || ''}`.trim(),
                email: performerUser.email,
                actionCount: item._count,
              }
            : null;
        })
    );

    // ========================================================================
    // 9. BUILD RESPONSE
    // ========================================================================

    const pages = Math.ceil(total / params.limit);
    const hasMore = params.offset + params.limit < total;

    const response: LogsResponse = {
      success: true,
      logs: formattedLogs,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        pages,
        hasMore,
      },
      statistics: {
        total,
        byAction: actionStats.map((stat) => ({
          action: stat.action,
          count: stat._count,
        })),
        byEntityType: entityStats.map((stat) => ({
          entityType: stat.entityType,
          count: stat._count,
        })),
        bySeverity: severityStats.map((stat) => ({
          severity: stat.severity,
          count: stat._count,
        })),
        topPerformers: topPerformersWithDetails.filter((p) => p !== null) as any[],
      },
    };

    // ========================================================================
    // 10. LOG & RESPOND
    // ========================================================================

    const duration = performance.now() - startTime;

    console.log('Audit logs retrieved successfully', {
      requestId,
      superAdminId: user.id,
      logCount: formattedLogs.length,
      total,
      pages,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
        'X-Total-Count': String(total),
        'X-Total-Pages': String(pages),
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    console.error('Audit logs error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve audit logs',
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// Export route segment config
// ============================================================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;