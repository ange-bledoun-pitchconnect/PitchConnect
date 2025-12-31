// =============================================================================
// ⚡ SUPERADMIN BULK OPERATIONS API - Enterprise-Grade Implementation
// =============================================================================
// POST /api/superadmin/bulk-operations - Execute bulk user operations
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Soft delete, comprehensive audit logging, validation
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UserStatus, Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

type BulkOperation =
  | 'SUSPEND_USERS'
  | 'ACTIVATE_USERS'
  | 'BAN_USERS'
  | 'UNBAN_USERS'
  | 'DELETE_USERS'
  | 'RESTORE_USERS'
  | 'GRANT_ROLE'
  | 'REVOKE_ROLE'
  | 'GRANT_SUPERADMIN'
  | 'REVOKE_SUPERADMIN'
  | 'RESET_PASSWORDS'
  | 'VERIFY_EMAILS'
  | 'SEND_NOTIFICATION';

interface BulkOperationResult {
  operation: BulkOperation;
  targetCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  
  results: Array<{
    userId: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }>;
  
  auditLogId: string;
  executedAt: string;
  executedBy: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const MAX_BULK_TARGETS = 1000;

// Operations that affect user status
const STATUS_OPERATIONS: Record<string, UserStatus> = {
  SUSPEND_USERS: 'SUSPENDED',
  ACTIVATE_USERS: 'ACTIVE',
  BAN_USERS: 'BANNED',
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const BulkOperationSchema = z.object({
  operation: z.enum([
    'SUSPEND_USERS',
    'ACTIVATE_USERS',
    'BAN_USERS',
    'UNBAN_USERS',
    'DELETE_USERS',
    'RESTORE_USERS',
    'GRANT_ROLE',
    'REVOKE_ROLE',
    'GRANT_SUPERADMIN',
    'REVOKE_SUPERADMIN',
    'RESET_PASSWORDS',
    'VERIFY_EMAILS',
    'SEND_NOTIFICATION',
  ]),
  
  targetIds: z.array(z.string().cuid()).min(1).max(MAX_BULK_TARGETS),
  
  // Additional data for specific operations
  data: z.object({
    role: z.string().optional(),
    reason: z.string().max(500).optional(),
    notificationTitle: z.string().max(200).optional(),
    notificationMessage: z.string().max(2000).optional(),
  }).optional(),
  
  // Safety confirmation for destructive operations
  confirmDestructive: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
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
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<{ isValid: boolean; user?: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    return { isValid: false };
  }

  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Get IP address from request
 */
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// =============================================================================
// OPERATION HANDLERS
// =============================================================================

/**
 * Execute status change operation
 */
async function executeStatusChange(
  targetIds: string[],
  newStatus: UserStatus,
  adminId: string,
  reason?: string
): Promise<{ success: string[]; failed: Array<{ id: string; reason: string }> }> {
  const success: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  // Prevent self-status change
  const safeTargets = targetIds.filter(id => id !== adminId);
  if (safeTargets.length < targetIds.length) {
    failed.push({ id: adminId, reason: 'Cannot change own status' });
  }

  // Get existing users
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: safeTargets } },
    select: { id: true, status: true },
  });

  const existingIds = new Set(existingUsers.map(u => u.id));
  
  // Mark non-existent as failed
  safeTargets.forEach(id => {
    if (!existingIds.has(id)) {
      failed.push({ id, reason: 'User not found' });
    }
  });

  // Update users
  const validIds = safeTargets.filter(id => existingIds.has(id));
  
  if (validIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: validIds } },
      data: {
        status: newStatus,
        ...(newStatus === 'SUSPENDED' || newStatus === 'BANNED' ? {
          suspendedAt: new Date(),
          suspendedReason: reason,
        } : {}),
      },
    });
    
    success.push(...validIds);
  }

  return { success, failed };
}

/**
 * Execute soft delete operation
 */
async function executeSoftDelete(
  targetIds: string[],
  adminId: string
): Promise<{ success: string[]; failed: Array<{ id: string; reason: string }> }> {
  const success: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  // Prevent self-deletion
  const safeTargets = targetIds.filter(id => id !== adminId);
  if (safeTargets.length < targetIds.length) {
    failed.push({ id: adminId, reason: 'Cannot delete own account' });
  }

  // Get existing non-deleted users
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: safeTargets }, deletedAt: null },
    select: { id: true, isSuperAdmin: true },
  });

  const existingIds = new Set(existingUsers.map(u => u.id));
  
  // Check for SuperAdmins (can't delete other SuperAdmins)
  existingUsers.forEach(user => {
    if (user.isSuperAdmin) {
      failed.push({ id: user.id, reason: 'Cannot delete SuperAdmin accounts' });
      existingIds.delete(user.id);
    }
  });

  // Mark non-existent as failed
  safeTargets.forEach(id => {
    if (!existingIds.has(id) && !failed.some(f => f.id === id)) {
      failed.push({ id, reason: 'User not found or already deleted' });
    }
  });

  // Soft delete users
  const validIds = Array.from(existingIds);
  
  if (validIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: validIds } },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });
    
    // Also deactivate related records
    await prisma.$transaction([
      prisma.clubMember.updateMany({
        where: { userId: { in: validIds } },
        data: { isActive: false },
      }),
      prisma.teamPlayer.updateMany({
        where: { player: { userId: { in: validIds } } },
        data: { isActive: false },
      }),
    ]);
    
    success.push(...validIds);
  }

  return { success, failed };
}

/**
 * Execute restore operation (undo soft delete)
 */
async function executeRestore(
  targetIds: string[]
): Promise<{ success: string[]; failed: Array<{ id: string; reason: string }> }> {
  const success: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  // Get deleted users
  const deletedUsers = await prisma.user.findMany({
    where: { id: { in: targetIds }, deletedAt: { not: null } },
    select: { id: true },
  });

  const deletedIds = new Set(deletedUsers.map(u => u.id));

  // Mark non-deleted as failed
  targetIds.forEach(id => {
    if (!deletedIds.has(id)) {
      failed.push({ id, reason: 'User not found or not deleted' });
    }
  });

  // Restore users
  const validIds = Array.from(deletedIds);
  
  if (validIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: validIds } },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    });
    
    success.push(...validIds);
  }

  return { success, failed };
}

/**
 * Execute SuperAdmin grant/revoke
 */
async function executeSuperAdminChange(
  targetIds: string[],
  grant: boolean,
  adminId: string
): Promise<{ success: string[]; failed: Array<{ id: string; reason: string }> }> {
  const success: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  // Prevent self-modification
  const safeTargets = targetIds.filter(id => id !== adminId);
  if (safeTargets.length < targetIds.length) {
    failed.push({ id: adminId, reason: 'Cannot modify own SuperAdmin status' });
  }

  // Get existing users
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: safeTargets }, deletedAt: null },
    select: { id: true, isSuperAdmin: true },
  });

  const existingIds = new Set(existingUsers.map(u => u.id));

  // Check current status
  existingUsers.forEach(user => {
    if (grant && user.isSuperAdmin) {
      failed.push({ id: user.id, reason: 'User is already SuperAdmin' });
      existingIds.delete(user.id);
    } else if (!grant && !user.isSuperAdmin) {
      failed.push({ id: user.id, reason: 'User is not SuperAdmin' });
      existingIds.delete(user.id);
    }
  });

  // Mark non-existent as failed
  safeTargets.forEach(id => {
    if (!existingIds.has(id) && !failed.some(f => f.id === id)) {
      failed.push({ id, reason: 'User not found' });
    }
  });

  // Update users
  const validIds = Array.from(existingIds);
  
  if (validIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: validIds } },
      data: { isSuperAdmin: grant },
    });
    
    success.push(...validIds);
  }

  return { success, failed };
}

/**
 * Execute role change
 */
async function executeRoleChange(
  targetIds: string[],
  role: string,
  grant: boolean
): Promise<{ success: string[]; failed: Array<{ id: string; reason: string }> }> {
  const success: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  // Get existing users
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: targetIds }, deletedAt: null },
    select: { id: true, roles: true },
  });

  const existingIds = new Set(existingUsers.map(u => u.id));

  // Mark non-existent as failed
  targetIds.forEach(id => {
    if (!existingIds.has(id)) {
      failed.push({ id, reason: 'User not found' });
    }
  });

  // Update each user's roles
  for (const user of existingUsers) {
    const currentRoles = user.roles as string[];
    let newRoles: string[];

    if (grant) {
      if (currentRoles.includes(role)) {
        failed.push({ id: user.id, reason: `User already has role: ${role}` });
        continue;
      }
      newRoles = [...currentRoles, role];
    } else {
      if (!currentRoles.includes(role)) {
        failed.push({ id: user.id, reason: `User doesn't have role: ${role}` });
        continue;
      }
      newRoles = currentRoles.filter(r => r !== role);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { roles: newRoles },
    });
    
    success.push(user.id);
  }

  return { success, failed };
}

// =============================================================================
// POST HANDLER - Execute Bulk Operation
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();
  const clientIp = getClientIp(request);

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
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
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

    // 3. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = BulkOperationSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
        },
        requestId,
        status: 400,
      });
    }

    const { operation, targetIds, data, confirmDestructive } = validation.data;

    // 4. Check destructive operation confirmation
    const destructiveOps = ['DELETE_USERS', 'BAN_USERS', 'REVOKE_SUPERADMIN'];
    if (destructiveOps.includes(operation) && !confirmDestructive) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Destructive operations require confirmDestructive: true',
        },
        requestId,
        status: 400,
      });
    }

    console.log(`[${requestId}] Bulk operation started`, {
      operation,
      targetCount: targetIds.length,
      adminId: session.user.id,
      adminEmail: adminUser.email,
    });

    // 5. Execute operation
    let result: { success: string[]; failed: Array<{ id: string; reason: string }> };

    switch (operation) {
      case 'SUSPEND_USERS':
      case 'ACTIVATE_USERS':
      case 'BAN_USERS':
        const newStatus = STATUS_OPERATIONS[operation];
        result = await executeStatusChange(targetIds, newStatus, session.user.id, data?.reason);
        break;

      case 'UNBAN_USERS':
        result = await executeStatusChange(targetIds, 'ACTIVE', session.user.id);
        break;

      case 'DELETE_USERS':
        result = await executeSoftDelete(targetIds, session.user.id);
        break;

      case 'RESTORE_USERS':
        result = await executeRestore(targetIds);
        break;

      case 'GRANT_SUPERADMIN':
        result = await executeSuperAdminChange(targetIds, true, session.user.id);
        break;

      case 'REVOKE_SUPERADMIN':
        result = await executeSuperAdminChange(targetIds, false, session.user.id);
        break;

      case 'GRANT_ROLE':
        if (!data?.role) {
          return createResponse(null, {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Role is required for GRANT_ROLE operation',
            },
            requestId,
            status: 400,
          });
        }
        result = await executeRoleChange(targetIds, data.role, true);
        break;

      case 'REVOKE_ROLE':
        if (!data?.role) {
          return createResponse(null, {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Role is required for REVOKE_ROLE operation',
            },
            requestId,
            status: 400,
          });
        }
        result = await executeRoleChange(targetIds, data.role, false);
        break;

      case 'VERIFY_EMAILS':
        await prisma.user.updateMany({
          where: { id: { in: targetIds }, emailVerified: null },
          data: { emailVerified: new Date() },
        });
        result = { success: targetIds, failed: [] };
        break;

      default:
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Unsupported operation: ${operation}`,
          },
          requestId,
          status: 400,
        });
    }

    // 6. Create audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_USER_ACTION',
        resourceType: 'USER',
        resourceId: `bulk_${targetIds.length}_users`,
        details: JSON.stringify({
          operation,
          targetCount: targetIds.length,
          successCount: result.success.length,
          failedCount: result.failed.length,
          targetIds: targetIds.slice(0, 100), // Limit stored IDs
          reason: data?.reason,
        }),
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || null,
        severity: destructiveOps.includes(operation) ? 'CRITICAL' : 'WARNING',
      },
    });

    // 7. Build response
    const response: BulkOperationResult = {
      operation,
      targetCount: targetIds.length,
      successCount: result.success.length,
      failedCount: result.failed.length,
      skippedCount: 0,
      
      results: [
        ...result.success.map(id => ({ userId: id, status: 'success' as const })),
        ...result.failed.map(f => ({ userId: f.id, status: 'failed' as const, reason: f.reason })),
      ],
      
      auditLogId: auditLog.id,
      executedAt: new Date().toISOString(),
      executedBy: `${adminUser.firstName} ${adminUser.lastName}`,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Bulk operation completed`, {
      operation,
      successCount: result.success.length,
      failedCount: result.failed.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/bulk-operations error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Bulk operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
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