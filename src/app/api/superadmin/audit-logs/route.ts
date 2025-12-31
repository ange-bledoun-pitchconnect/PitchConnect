// =============================================================================
// 📋 SUPERADMIN AUDIT LOGS API - Enterprise-Grade with Export
// =============================================================================
// GET /api/superadmin/audit-logs - Retrieve audit logs with export capability
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Filtering, pagination, statistics, CSV/JSON export
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface AuditLogEntry {
  id: string;
  
  performer: {
    id: string;
    email: string;
    name: string;
  } | null;
  
  target: {
    id: string;
    email: string;
    name: string;
  } | null;
  
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  
  changes: Record<string, unknown> | null;
  details: string | null;
  
  severity: string;
  
  ipAddress: string | null;
  userAgent: string | null;
  
  timestamp: string;
}

interface AuditStatistics {
  total: number;
  byAction: Array<{ action: string; count: number }>;
  byResourceType: Array<{ resourceType: string | null; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
  topPerformers: Array<{
    id: string;
    email: string;
    name: string;
    actionCount: number;
  }>;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  statistics: AuditStatistics;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 500;
const EXPORT_MAX_RECORDS = 10000;

const VALID_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  
  // Filters
  action: z.string().optional(),
  resourceType: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  performerId: z.string().cuid().optional(),
  targetId: z.string().cuid().optional(),
  
  // Date range
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  
  // Search
  search: z.string().max(200).optional(),
  
  // Export
  export: z.enum(['json', 'csv']).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string };
    requestId: string;
    status?: number;
    pagination?: PaginationMeta;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
      'Cache-Control': 'private, no-cache',
    },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
    },
  });

  return user?.isSuperAdmin || user?.roles.includes('SUPERADMIN') || false;
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string, endOfDay: boolean = false): Date | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  
  return date;
}

/**
 * Transform audit log to response format
 */
function transformAuditLog(log: any): AuditLogEntry {
  return {
    id: log.id,
    
    performer: log.user ? {
      id: log.user.id,
      email: log.user.email,
      name: `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || 'Unknown',
    } : null,
    
    target: log.targetUser ? {
      id: log.targetUser.id,
      email: log.targetUser.email,
      name: `${log.targetUser.firstName || ''} ${log.targetUser.lastName || ''}`.trim() || 'Unknown',
    } : null,
    
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    
    changes: log.changes as Record<string, unknown> | null,
    details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
    
    severity: log.severity,
    
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    
    timestamp: log.createdAt.toISOString(),
  };
}

/**
 * Generate CSV from audit logs
 */
function generateCsv(logs: AuditLogEntry[]): string {
  const headers = [
    'Timestamp',
    'Action',
    'Severity',
    'Resource Type',
    'Resource ID',
    'Performer Email',
    'Performer Name',
    'Target Email',
    'Target Name',
    'IP Address',
    'Details',
  ];

  const escapeCell = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = logs.map(log => [
    escapeCell(log.timestamp),
    escapeCell(log.action),
    escapeCell(log.severity),
    escapeCell(log.resourceType),
    escapeCell(log.resourceId),
    escapeCell(log.performer?.email),
    escapeCell(log.performer?.name),
    escapeCell(log.target?.email),
    escapeCell(log.target?.name),
    escapeCell(log.ipAddress),
    escapeCell(log.details),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

// =============================================================================
// GET HANDLER - Audit Logs with Export
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const isSuperAdmin = await verifySuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'SuperAdmin access required',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetAuditLogsSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 4. Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (params.action) {
      where.action = params.action;
    }

    if (params.resourceType) {
      where.resourceType = params.resourceType;
    }

    if (params.severity) {
      where.severity = params.severity;
    }

    if (params.performerId) {
      where.userId = params.performerId;
    }

    if (params.targetId) {
      where.targetUserId = params.targetId;
    }

    // Date range
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      
      if (params.startDate) {
        const startDate = parseDate(params.startDate);
        if (!startDate) {
          return createResponse(null, {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid startDate format. Use ISO 8601 (YYYY-MM-DD)',
            },
            requestId,
            status: 400,
          });
        }
        where.createdAt.gte = startDate;
      }
      
      if (params.endDate) {
        const endDate = parseDate(params.endDate, true);
        if (!endDate) {
          return createResponse(null, {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid endDate format. Use ISO 8601 (YYYY-MM-DD)',
            },
            requestId,
            status: 400,
          });
        }
        where.createdAt.lte = endDate;
      }
    }

    // Search
    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: 'insensitive' } },
        { resourceType: { contains: params.search, mode: 'insensitive' } },
        { details: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    // 5. Handle export
    if (params.export) {
      const exportLogs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          targetUser: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: EXPORT_MAX_RECORDS,
      });

      const transformedLogs = exportLogs.map(transformAuditLog);

      // Log export action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DATA_EXPORTED',
          resourceType: 'AUDIT_LOG',
          resourceId: 'bulk_export',
          details: JSON.stringify({
            format: params.export,
            recordCount: transformedLogs.length,
            filters: {
              action: params.action,
              severity: params.severity,
              startDate: params.startDate,
              endDate: params.endDate,
            },
          }),
          severity: 'INFO',
        },
      });

      if (params.export === 'csv') {
        const csv = generateCsv(transformedLogs);
        const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Request-ID': requestId,
            'X-Record-Count': String(transformedLogs.length),
          },
        });
      } else {
        const json = JSON.stringify({
          exportedAt: new Date().toISOString(),
          exportedBy: session.user.id,
          recordCount: transformedLogs.length,
          logs: transformedLogs,
        }, null, 2);
        
        const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        
        return new NextResponse(json, {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Request-ID': requestId,
            'X-Record-Count': String(transformedLogs.length),
          },
        });
      }
    }

    // 6. Fetch logs with pagination
    const offset = (params.page - 1) * params.limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          targetUser: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: params.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // 7. Fetch statistics
    const [actionStats, resourceStats, severityStats, topPerformersRaw] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['resourceType'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          userId: { not: null },
        },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
    ]);

    // Enrich top performers
    const topPerformerIds = topPerformersRaw
      .filter(p => p.userId)
      .map(p => p.userId!);
    
    const topPerformerUsers = topPerformerIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: topPerformerIds } },
          select: { id: true, email: true, firstName: true, lastName: true },
        })
      : [];

    const topPerformers = topPerformersRaw
      .filter(p => p.userId)
      .map(p => {
        const user = topPerformerUsers.find(u => u.id === p.userId);
        return user ? {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
          actionCount: p._count,
        } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // 8. Transform logs
    const transformedLogs = logs.map(transformAuditLog);

    // 9. Build response
    const response: AuditLogsResponse = {
      logs: transformedLogs,
      statistics: {
        total,
        byAction: actionStats.map(s => ({ action: s.action, count: s._count })),
        byResourceType: resourceStats.map(s => ({ resourceType: s.resourceType, count: s._count })),
        bySeverity: severityStats.map(s => ({ severity: s.severity, count: s._count })),
        topPerformers,
      },
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Audit logs retrieved`, {
      adminId: session.user.id,
      total,
      returned: transformedLogs.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/audit-logs error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch audit logs',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';