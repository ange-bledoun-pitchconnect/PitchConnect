// ============================================================================
// src/lib/api/audit.ts - Audit Logging for Compliance & Security
// ============================================================================

import { prisma } from '@/lib/prisma';

/**
 * Log audit action for compliance, security, and debugging
 * Used to track all important user actions and data changes
 */
export async function logAuditAction(options: {
  performedById: string;
  targetUserId?: string;
  action: string; // e.g., 'USER_CREATED', 'PLAYER_UPDATED', 'LOGIN_SUCCESS'
  entityType?: string; // e.g., 'User', 'Player', 'Team', 'Match'
  entityId?: string;
  resourceName?: string; // e.g., 'user@email.com', 'Arsenal FC'
  changes?: Record<string, any>; // Track what changed (from/to)
  details?: string; // Additional context
  ipAddress?: string; // Optional: client IP for security tracking
  severity?: 'INFO' | 'WARNING' | 'ERROR'; // Log severity level
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        performedById: options.performedById,
        targetUserId: options.targetUserId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        resourceName: options.resourceName,
        changes: options.changes,
        details: options.details,
        ipAddress: options.ipAddress,
        severity: options.severity || 'INFO',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should never break the main flow
    console.error('[AUDIT LOG ERROR]', {
      action: options.action,
      entityType: options.entityType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Log user authentication event
 */
export async function logAuthEvent(
  userId: string,
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET',
  details?: string,
  ipAddress?: string
): Promise<void> {
  return logAuditAction({
    performedById: userId,
    targetUserId: userId,
    action: eventType,
    entityType: 'User',
    entityId: userId,
    details: details || `User ${eventType.toLowerCase()}`,
    ipAddress,
    severity: eventType === 'LOGIN_FAILED' ? 'WARNING' : 'INFO',
  });
}

/**
 * Log resource creation
 */
export async function logResourceCreated(
  performedById: string,
  entityType: string,
  entityId: string,
  resourceName: string,
  initialData?: Record<string, any>,
  details?: string
): Promise<void> {
  return logAuditAction({
    performedById,
    action: `${entityType.toUpperCase()}_CREATED`,
    entityType,
    entityId,
    resourceName,
    changes: initialData,
    details: details || `Created ${entityType}: ${resourceName}`,
    severity: 'INFO',
  });
}

/**
 * Log resource update
 */
export async function logResourceUpdated(
  performedById: string,
  entityType: string,
  entityId: string,
  resourceName: string,
  changes: Record<string, any>,
  details?: string
): Promise<void> {
  return logAuditAction({
    performedById,
    action: `${entityType.toUpperCase()}_UPDATED`,
    entityType,
    entityId,
    resourceName,
    changes,
    details: details || `Updated ${entityType}: ${resourceName}`,
    severity: 'INFO',
  });
}

/**
 * Log resource deletion
 */
export async function logResourceDeleted(
  performedById: string,
  entityType: string,
  entityId: string,
  resourceName: string,
  details?: string
): Promise<void> {
  return logAuditAction({
    performedById,
    action: `${entityType.toUpperCase()}_DELETED`,
    entityType,
    entityId,
    resourceName,
    details: details || `Deleted ${entityType}: ${resourceName}`,
    severity: 'WARNING',
  });
}

/**
 * Log role/permission change (HIGH SENSITIVITY)
 */
export async function logPermissionChanged(
  performedById: string,
  targetUserId: string,
  oldRoles: string[],
  newRoles: string[],
  reason?: string
): Promise<void> {
  return logAuditAction({
    performedById,
    targetUserId,
    action: 'USER_ROLES_CHANGED',
    entityType: 'User',
    entityId: targetUserId,
    changes: {
      rolesFrom: oldRoles,
      rolesTo: newRoles,
    },
    details: reason || `Roles changed from ${oldRoles.join(', ')} to ${newRoles.join(', ')}`,
    severity: 'WARNING',
  });
}

/**
 * Log financial transaction (HIGH SENSITIVITY)
 */
export async function logFinancialTransaction(
  performedById: string,
  transactionType: 'PAYMENT' | 'REFUND' | 'TRANSFER' | 'ADJUSTMENT',
  amount: number,
  currency: string,
  entityType: string,
  entityId: string,
  details?: string
): Promise<void> {
  return logAuditAction({
    performedById,
    action: `FINANCIAL_${transactionType}`,
    entityType,
    entityId,
    changes: {
      type: transactionType,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    },
    details: details || `${transactionType} of ${currency}${amount}`,
    severity: 'WARNING',
  });
}

/**
 * Log security-related event (HIGHEST SENSITIVITY)
 */
export async function logSecurityEvent(
  performedById: string,
  eventType:
    | 'FAILED_LOGIN_ATTEMPT'
    | 'SUSPICIOUS_ACTIVITY'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'DATA_ACCESS_UNUSUAL'
    | '2FA_ENABLED'
    | '2FA_DISABLED'
    | 'PASSWORD_CHANGED',
  details: string,
  ipAddress?: string
): Promise<void> {
  return logAuditAction({
    performedById,
    action: eventType,
    entityType: 'Security',
    details,
    ipAddress,
    severity: eventType.includes('FAILED') ? 'WARNING' : 'INFO',
  });
}

/**
 * Log data export/download (COMPLIANCE)
 */
export async function logDataExport(
  performedById: string,
  entityType: string,
  entityIds: string[],
  format: 'CSV' | 'JSON' | 'PDF' | 'EXCEL',
  reason?: string
): Promise<void> {
  return logAuditAction({
    performedById,
    action: 'DATA_EXPORT',
    entityType,
    changes: {
      format,
      count: entityIds.length,
      entityIds: entityIds.slice(0, 10), // Log first 10 for preview
    },
    details: reason || `Exported ${entityIds.length} ${entityType} records in ${format}`,
    severity: 'INFO',
  });
}

/**
 * Retrieve audit logs for a specific entity
 */
export async function getAuditLogsForEntity(
  entityType: string,
  entityId: string,
  limit: number = 50
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        action: true,
        changes: true,
        details: true,
        timestamp: true,
        severity: true,
      },
    });
  } catch (error) {
    console.error('[GET AUDIT LOGS ERROR]', error);
    return [];
  }
}

/**
 * Retrieve audit logs for a specific user (what they did)
 */
export async function getAuditLogsForUser(
  userId: string,
  limit: number = 50
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        performedById: userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        resourceName: true,
        changes: true,
        details: true,
        timestamp: true,
      },
    });
  } catch (error) {
    console.error('[GET USER AUDIT LOGS ERROR]', error);
    return [];
  }
}

/**
 * Retrieve audit logs affecting a specific user (what was done to them)
 */
export async function getAuditLogsTargetingUser(
  targetUserId: string,
  limit: number = 50
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        targetUserId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        performedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        action: true,
        changes: true,
        details: true,
        timestamp: true,
        severity: true,
      },
    });
  } catch (error) {
    console.error('[GET TARGETING AUDIT LOGS ERROR]', error);
    return [];
  }
}

/**
 * Retrieve recent security-related audit logs
 */
export async function getSecurityAuditLogs(
  limit: number = 100,
  hoursBack: number = 24
) {
  try {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    return await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: since,
        },
        severity: {
          in: ['WARNING', 'ERROR'],
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        performedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        targetUser: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        action: true,
        details: true,
        timestamp: true,
        severity: true,
        ipAddress: true,
      },
    });
  } catch (error) {
    console.error('[GET SECURITY AUDIT LOGS ERROR]', error);
    return [];
  }
}
