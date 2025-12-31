// =============================================================================
// 🖥️ SUPERADMIN SYSTEM API - Enterprise-Grade System Health
// =============================================================================
// GET /api/superadmin/system - System health and diagnostics
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Database health, performance metrics, maintenance status
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
  };
}

interface DatabaseHealth {
  connected: boolean;
  responseTime: number;
  lastQuery: string;
  tableCount: number;
  connectionPool: {
    active: number;
    idle: number;
    max: number;
  };
}

interface ApplicationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  uptimeFormatted: string;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: number;
}

interface MaintenanceStatus {
  enabled: boolean;
  message: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  allowedIps: string[];
}

interface EnvironmentInfo {
  nodeVersion: string;
  environment: string;
  appVersion: string;
  region: string | null;
  timezone: string;
}

interface RecentError {
  timestamp: string;
  type: string;
  message: string;
  count: number;
}

interface SystemResponse {
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number;
    checkedAt: string;
  };
  database: DatabaseHealth;
  application: ApplicationHealth;
  maintenance: MaintenanceStatus;
  environment: EnvironmentInfo;
  recentErrors: RecentError[];
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `system_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string };
    requestId: string;
    status?: number;
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

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: { 'X-Request-ID': options.requestId },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });

  return user?.isSuperAdmin || user?.roles.includes('SUPERADMIN') || false;
}

/**
 * Format uptime to human readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = performance.now();
  let connected = false;
  let tableCount = 0;

  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    connected = true;

    // Get table count (PostgreSQL)
    const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    tableCount = Number(tables[0]?.count || 0);
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  const responseTime = performance.now() - startTime;

  return {
    connected,
    responseTime: Math.round(responseTime),
    lastQuery: new Date().toISOString(),
    tableCount,
    connectionPool: {
      active: 1, // Would need actual pool metrics
      idle: 9,
      max: 10,
    },
  };
}

/**
 * Get maintenance status from settings
 */
async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    const [enabledSetting, messageSetting, allowedIpsSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'maintenance.enabled' } }),
      prisma.systemSetting.findUnique({ where: { key: 'maintenance.message' } }),
      prisma.systemSetting.findUnique({ where: { key: 'maintenance.allowed_ips' } }),
    ]);

    return {
      enabled: enabledSetting?.value === true,
      message: (messageSetting?.value as string) || null,
      scheduledStart: null,
      scheduledEnd: null,
      allowedIps: (allowedIpsSetting?.value as string[]) || [],
    };
  } catch {
    return {
      enabled: false,
      message: null,
      scheduledStart: null,
      scheduledEnd: null,
      allowedIps: [],
    };
  }
}

/**
 * Get recent error logs
 */
async function getRecentErrors(): Promise<RecentError[]> {
  try {
    const errors = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        severity: 'CRITICAL',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 5,
    });

    return errors.map(e => ({
      timestamp: new Date().toISOString(),
      type: e.action,
      message: `${e._count} occurrences in last 24h`,
      count: e._count,
    }));
  } catch {
    return [];
  }
}

// =============================================================================
// GET HANDLER - System Health
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
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const isSuperAdmin = await verifySuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Gather system information
    const [databaseHealth, maintenanceStatus, recentErrors] = await Promise.all([
      checkDatabaseHealth(),
      getMaintenanceStatus(),
      getRecentErrors(),
    ]);

    // 4. Calculate memory usage
    const memoryUsage = process.memoryUsage();

    // 5. Calculate overall health score
    let healthScore = 100;
    const alerts: Array<{ severity: 'info' | 'warning' | 'critical'; message: string; timestamp: string }> = [];

    if (!databaseHealth.connected) {
      healthScore -= 50;
      alerts.push({
        severity: 'critical',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }

    if (databaseHealth.responseTime > 1000) {
      healthScore -= 20;
      alerts.push({
        severity: 'warning',
        message: `Database response time is slow (${databaseHealth.responseTime}ms)`,
        timestamp: new Date().toISOString(),
      });
    }

    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (heapUsedPercent > 90) {
      healthScore -= 15;
      alerts.push({
        severity: 'warning',
        message: `High memory usage (${Math.round(heapUsedPercent)}%)`,
        timestamp: new Date().toISOString(),
      });
    }

    if (maintenanceStatus.enabled) {
      alerts.push({
        severity: 'info',
        message: 'Maintenance mode is enabled',
        timestamp: new Date().toISOString(),
      });
    }

    if (recentErrors.length > 0) {
      const totalErrors = recentErrors.reduce((sum, e) => sum + e.count, 0);
      if (totalErrors > 100) {
        healthScore -= 10;
        alerts.push({
          severity: 'warning',
          message: `${totalErrors} critical errors in the last 24 hours`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 6. Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthScore >= 80) {
      overallStatus = 'healthy';
    } else if (healthScore >= 50) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    // 7. Build response
    const uptime = process.uptime();

    const response: SystemResponse = {
      overall: {
        status: overallStatus,
        score: healthScore,
        checkedAt: new Date().toISOString(),
      },

      database: databaseHealth,

      application: {
        status: overallStatus,
        uptime,
        uptimeFormatted: formatUptime(uptime),
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
        cpuUsage: 0, // Would need os module for actual CPU usage
      },

      maintenance: maintenanceStatus,

      environment: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },

      recentErrors,
      alerts,
    };

    const queryTime = performance.now() - startTime;

    console.log(`[${requestId}] System health checked`, {
      adminId: session.user.id,
      status: overallStatus,
      score: healthScore,
      queryTime: `${Math.round(queryTime)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/system error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to check system health' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';