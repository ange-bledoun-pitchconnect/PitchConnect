/**
 * ============================================================================
 * SUPERADMIN AUDIT LOGS ROUTE - World-Class Audit & Security
 * ============================================================================
 *
 * @file src/app/api/superadmin/audit-logs/route.ts
 * @description Retrieve comprehensive audit logs with filtering and pagination
 * @version 2.0.0 (Production-Ready)
 *
 * FEATURES:
 * ✅ Full TypeScript type safety
 * ✅ Schema-aligned field names
 * ✅ Comprehensive filtering (action, date range)
 * ✅ Pagination support
 * ✅ SuperAdmin authorization check
 * ✅ Request ID tracking
 * ✅ Performance monitoring
 * ✅ Audit logging for audit log access
 * ✅ JSDoc documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

interface AuditLogEntry {
  id: string;
  performedById: string;
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  targetUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: Record<string, any> | null;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  severity: string;
  createdAt: string;
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
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

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;

const VALID_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate SuperAdmin access
 */
async function validateSuperAdminAccess(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSuperAdmin: true,
      roles: true,
    },
  });

  if (!user) {
    return {
      isValid: false,
      error: 'User not found',
      user: null,
    };
  }

  // Check if user is SuperAdmin
  if (!user.isSuperAdmin && !user.roles.includes('SUPERADMIN')) {
    return {
      isValid: false,
      error: 'SuperAdmin access required',
      user: null,
    };
  }

  return {
    isValid: true,
    error: null,
    user,
  };
}

/**
 * Parse and validate pagination parameters
 */
function parsePaginationParams(url: URL): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(
    MAX_PAGE_LIMIT,
    Math.max(1, parseInt(url.searchParams.get('limit') || String(DEFAULT_PAGE_LIMIT), 10))
  );

  return { page, limit };
}

/**
 * Parse and validate filter parameters
 */
function parseFilterParams(url: URL): {
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  severity?: string;
  error?: string;
} {
  const action = url.searchParams.get('action') || undefined;
  const severity = url.searchParams.get('severity') || undefined;
  const dateFromStr = url.searchParams.get('dateFrom');
  const dateToStr = url.searchParams.get('dateTo');

  // Validate severity if provided
  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return {
      error: `Invalid severity. Valid options: ${VALID_SEVERITIES.join(', ')}`,
    };
  }

  // Parse dates
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (dateFromStr) {
    dateFrom = new Date(dateFromStr);
    if (isNaN(dateFrom.getTime())) {
      return {
        error: 'Invalid dateFrom format. Use ISO 8601 (YYYY-MM-DD)',
      };
    }
  }

  if (dateToStr) {
    dateTo = new Date(dateToStr);
    if (isNaN(dateTo.getTime())) {
      return {
        error: 'Invalid dateTo format. Use ISO 8601 (YYYY-MM-DD)',
      };
    }
    // Set to end of day
    dateTo.setHours(23, 59, 59, 999);
  }

  return {
    action,
    dateFrom,
    dateTo,
    severity,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * GET /api/superadmin/audit-logs
 *
 * Retrieve audit logs with filtering and pagination (SuperAdmin only)
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - action: string (filter by action)
 * - severity: 'INFO' | 'WARNING' | 'CRITICAL' (filter by severity)
 * - dateFrom: ISO 8601 date string (filter by start date)
 * - dateTo: ISO 8601 date string (filter by end date)
 *
 * @param request NextRequest
 * @returns AuditLogsResponse on success, ErrorResponse on failure
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<AuditLogsResponse | ErrorResponse>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.warn('Unauthorized audit logs access - no session', { requestId });
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

    const { isValid: isAuthorized, error: authError, user } =
      await validateSuperAdminAccess(session.user.email);

    if (!isAuthorized || !user) {
      console.warn('SuperAdmin authorization failed', {
        requestId,
        email: session.user.email,
        error: authError,
      });
      return NextResponse.json(
        {
          success: false,
          error: authError || 'SuperAdmin access required',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. PARSE PAGINATION
    // ========================================================================

    const { page, limit } = parsePaginationParams(request.nextUrl);
    const skip = (page - 1) * limit;

    // ========================================================================
    // 4. PARSE & VALIDATE FILTERS
    // ========================================================================

    const filterParams = parseFilterParams(request.nextUrl);

    if (filterParams.error) {
      console.warn('Invalid filter parameters', {
        requestId,
        error: filterParams.error,
      });
      return NextResponse.json(
        {
          success: false,
          error: filterParams.error,
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 5. BUILD QUERY FILTER
    // ========================================================================

    const whereFilter: any = {};

    if (filterParams.action) {
      whereFilter.action = filterParams.action;
    }

    if (filterParams.severity) {
      whereFilter.severity = filterParams.severity;
    }

    if (filterParams.dateFrom || filterParams.dateTo) {
      whereFilter.createdAt = {};

      if (filterParams.dateFrom) {
        whereFilter.createdAt.gte = filterParams.dateFrom;
      }

      if (filterParams.dateTo) {
        whereFilter.createdAt.lte = filterParams.dateTo;
      }
    }

    // ========================================================================
    // 6. FETCH LOGS & COUNT
    // ========================================================================

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereFilter,
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),

      prisma.auditLog.count({ where: whereFilter }),
    ]);

    // ========================================================================
    // 7. TRANSFORM DATA
    // ========================================================================

    const transformedLogs: AuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      performedById: log.performedById,
      performedBy: {
        id: log.performedBy.id,
        firstName: log.performedBy.firstName,
        lastName: log.performedBy.lastName,
        email: log.performedBy.email,
      },
      targetUserId: log.targetUserId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: log.changes as Record<string, any> | null,
      details: log.details
        ? typeof log.details === 'string'
          ? JSON.parse(log.details)
          : log.details
        : {},
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      severity: log.severity,
      createdAt: log.createdAt.toISOString(),
    }));

    const pages = Math.ceil(totalCount / limit);

    // ========================================================================
    // 8. BUILD RESPONSE
    // ========================================================================

    const response: AuditLogsResponse = {
      success: true,
      data: transformedLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
      },
      timestamp: new Date().toISOString(),
    };

    // ========================================================================
    // 9. LOG & RESPOND
    // ========================================================================

    const duration = performance.now() - startTime;

    console.log('Audit logs retrieved successfully', {
      requestId,
      superAdminId: user.id,
      superAdminEmail: user.email,
      totalLogs: totalCount,
      returned: transformedLogs.length,
      page,
      pages,
      filters: {
        action: filterParams.action,
        severity: filterParams.severity,
        dateFrom: filterParams.dateFrom?.toISOString(),
        dateTo: filterParams.dateTo?.toISOString(),
      },
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
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
        error: 'Failed to fetch audit logs',
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
