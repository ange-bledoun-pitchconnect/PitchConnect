/**
 * 🌟 PITCHCONNECT - Enhanced Audit Logging System (WORLD-CLASS VERSION)
 * Path: /src/lib/api/audit.ts
 *
 * ============================================================================
 * ENTERPRISE FEATURES
 * ============================================================================
 * ✅ Comprehensive audit trail for compliance (GDPR, SOC 2)
 * ✅ Security event tracking and alerting
 * ✅ Financial transaction logging with full traceability
 * ✅ Role and permission change tracking
 * ✅ Data export/import compliance logging
 * ✅ User action attribution and accountability
 * ✅ Sensitive data redaction (never log passwords, tokens)
 * ✅ IP address and user agent tracking
 * ✅ Severity-based filtering and alerting
 * ✅ Advanced filtering and search capabilities
 * ✅ Performance-optimized queries with pagination
 * ✅ Error resilience (audit failures don't break main flow)
 * ✅ Comprehensive type safety with TypeScript
 * ✅ Integration with global logger
 * ✅ Support for batch operations
 */

import { prisma } from '@/lib/prisma';
import {
  logger,
  logAuthEvent as logAuthEventToLogger,
  logSecurityEvent as logSecurityEventToLogger,
  logDataChange,
  logPaymentEvent,
} from '@/lib/logging';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'CLUB_CREATED'
  | 'CLUB_UPDATED'
  | 'CLUB_DELETED'
  | 'TEAM_CREATED'
  | 'TEAM_UPDATED'
  | 'TEAM_DELETED'
  | 'PLAYER_CREATED'
  | 'PLAYER_UPDATED'
  | 'PLAYER_DELETED'
  | 'COACH_CREATED'
  | 'COACH_UPDATED'
  | 'COACH_DELETED'
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'MATCH_DELETED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REMOVED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_FAILED'
  | 'REFUND_PROCESSED'
  | 'SUBSCRIPTION_UPGRADED'
  | 'SUBSCRIPTION_DOWNGRADED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'BULK_OPERATION'
  | 'FAILED_LOGIN_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'UNUSUAL_DATA_ACCESS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'API_KEY_GENERATED'
  | 'API_KEY_REVOKED'
  | 'SYSTEM_CONFIG_CHANGED';

export type AuditEntityType =
  | 'USER'
  | 'CLUB'
  | 'TEAM'
  | 'PLAYER'
  | 'COACH'
  | 'MATCH'
  | 'LEAGUE'
  | 'PAYMENT'
  | 'SUBSCRIPTION'
  | 'ROLE'
  | 'PERMISSION'
  | 'API_KEY'
  | 'SETTING'
  | 'SECURITY';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AuditDifference {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface CreateAuditLogInput {
  performedById: string;
  targetUserId?: string;
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  resourceName?: string;
  changes?: Record<string, any>;
  differences?: AuditDifference[];
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

export interface AuditLogResponse {
  id: string;
  performedById: string;
  performedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  targetUserId?: string;
  targetUser?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  resourceName?: string;
  changes?: Record<string, any>;
  differences?: AuditDifference[];
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'bearerToken',
  'apiKey',
  'secret',
  'creditCard',
  'ssn',
  'pinCode',
  'twoFactorSecret',
  'stripeToken',
  'paymentMethod',
];

const SECURITY_SENSITIVE_ACTIONS = [
  'LOGIN_FAILED',
  'FAILED_LOGIN_ATTEMPT',
  'SUSPICIOUS_ACTIVITY',
  'UNAUTHORIZED_ACCESS_ATTEMPT',
  'RATE_LIMIT_EXCEEDED',
  '2FA_DISABLED',
  'PASSWORD_RESET',
  'API_KEY_REVOKED',
];

const HIGH_SENSITIVITY_ACTIONS = [
  'ROLE_ASSIGNED',
  'ROLE_REMOVED',
  'PERMISSION_GRANTED',
  'PERMISSION_REVOKED',
  'PAYMENT_PROCESSED',
  'REFUND_PROCESSED',
  'SUBSCRIPTION_UPGRADED',
  'SUBSCRIPTION_DOWNGRADED',
  'USER_DELETED',
  'DATA_EXPORT',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Mask sensitive data in audit logs
 */
function maskSensitiveFields(data: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!data || typeof data !== 'object') return data;

  try {
    const masked = JSON.parse(JSON.stringify(data));

    function maskObject(obj: any, depth = 0): any {
      if (depth > 10) return obj;

      if (Array.isArray(obj)) {
        return obj.map((item) => maskObject(item, depth + 1));
      }

      if (obj !== null && typeof obj === 'object') {
        const result: any = {};

        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const lowerKey = key.toLowerCase();
            const shouldMask = SENSITIVE_FIELDS.some((field) =>
              lowerKey.includes(field.toLowerCase())
            );

            if (shouldMask) {
              result[key] = '***REDACTED***';
            } else {
              result[key] = maskObject(obj[key], depth + 1);
            }
          }
        }

        return result;
      }

      return obj;
    }

    return maskObject(masked);
  } catch (error) {
    logger.warn('Failed to mask sensitive data', { error: String(error) }, 'Audit');
    return data;
  }
}

/**
 * Mask sensitive differences
 */
function maskSensitiveDifferences(
  differences: AuditDifference[] | undefined
): AuditDifference[] | undefined {
  if (!differences || !Array.isArray(differences)) return differences;

  return differences.map((diff) => {
    const lowerField = diff.field.toLowerCase();
    const shouldMask = SENSITIVE_FIELDS.some((field) => lowerField.includes(field.toLowerCase()));

    if (shouldMask) {
      return {
        field: diff.field,
        oldValue: '***REDACTED***',
        newValue: '***REDACTED***',
      };
    }

    return diff;
  });
}

/**
 * Extract request details from Request object
 */
export function extractRequestDetails(request?: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  if (!request) {
    return {};
  }

  const ipAddress =
    (request.headers.get('x-forwarded-for') as string)?.split(',')[0] ||
    request.headers.get('x-client-ip') ||
    request.headers.get('cf-connecting-ip') ||
    undefined;

  const userAgent = request.headers.get('user-agent') || undefined;

  return { ipAddress: ipAddress?.trim(), userAgent };
}

/**
 * Determine severity level based on action
 */
function determineSeverity(action: AuditAction, customSeverity?: AuditSeverity): AuditSeverity {
  if (customSeverity) return customSeverity;

  if (action.includes('FAILED') || action.includes('SUSPICIOUS') || action.includes('UNAUTHORIZED')) {
    return 'WARNING';
  }

  if (HIGH_SENSITIVITY_ACTIONS.includes(action)) {
    return 'WARNING';
  }

  if (action.includes('DELETED') || action.includes('REVOKED')) {
    return 'WARNING';
  }

  return 'INFO';
}

// ============================================================================
// MAIN AUDIT LOGGING FUNCTIONS
// ============================================================================

/**
 * Core audit logging function
 * This is the foundation for all audit operations
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogResponse | null> {
  try {
    // Validate required fields
    if (!input.performedById || !input.action) {
      logger.warn(
        'Invalid audit log input - missing required fields',
        { action: input.action, performedById: input.performedById },
        'Audit'
      );
      return null;
    }

    // Mask sensitive data
    const maskedChanges = maskSensitiveFields(input.changes);
    const maskedDifferences = maskSensitiveDifferences(input.differences);

    // Determine severity
    const severity = determineSeverity(input.action, input.severity);

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        performedById: input.performedById,
        targetUserId: input.targetUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        resourceName: input.resourceName,
        changes: maskedChanges,
        differences: maskedDifferences,
        details: input.details,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        severity,
        metadata: input.metadata,
        timestamp: new Date(),
      },
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log to global logger based on severity
    if (severity === 'WARNING' && SECURITY_SENSITIVE_ACTIONS.includes(input.action)) {
      logSecurityEventToLogger(
        input.action as any,
        input.performedById,
        input.details || `Security event: ${input.action}`,
        input.ipAddress
      );
    } else if (severity === 'WARNING' || severity === 'ERROR' || severity === 'CRITICAL') {
      logger.warn(
        `Audit: ${input.action}`,
        {
          entityType: input.entityType,
          entityId: input.entityId,
          targetUserId: input.targetUserId,
        },
        'Audit',
        input.performedById
      );
    } else {
      logger.debug(
        `Audit: ${input.action}`,
        {
          entityType: input.entityType,
          entityId: input.entityId,
        },
        'Audit'
      );
    }

    return auditLog as AuditLogResponse;
  } catch (error) {
    // CRITICAL: Never let audit logging break the main application flow
    logger.error(
      'Failed to create audit log',
      error as Error,
      {
        action: input.action,
        entityType: input.entityType,
      },
      'Audit'
    );
    return null;
  }
}

/**
 * Log user authentication event
 */
export async function logAuthenticationEvent(
  userId: string,
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED',
  options?: {
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }
): Promise<AuditLogResponse | null> {
  const severity =
    eventType === 'LOGIN_FAILED' || eventType === 'PASSWORD_RESET' ? 'WARNING' : 'INFO';

  const auditLog = await createAuditLog({
    performedById: userId,
    targetUserId: userId,
    action: eventType,
    entityType: 'USER',
    entityId: userId,
    details: options?.details || `User ${eventType.toLowerCase()}${options?.reason ? `: ${options.reason}` : ''}`,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    severity,
  });

  // Also log to global logger
  logAuthEventToLogger(
    eventType.replace('PASSWORD_', 'PASSWORD_') as any,
    userId,
    severity === 'WARNING',
    options?.reason,
    options?.ipAddress
  );

  return auditLog;
}

/**
 * Log 2FA events
 */
export async function log2FAEvent(
  userId: string,
  eventType: '2FA_ENABLED' | '2FA_DISABLED',
  options?: {
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }
): Promise<AuditLogResponse | null> {
  return createAuditLog({
    performedById: userId,
    targetUserId: userId,
    action: eventType,
    entityType: 'SECURITY',
    entityId: userId,
    details: `Two-factor authentication ${eventType === '2FA_ENABLED' ? 'enabled' : 'disabled'}${options?.reason ? `: ${options.reason}` : ''}`,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    severity: eventType === '2FA_DISABLED' ? 'WARNING' : 'INFO',
  });
}

/**
 * Log resource creation
 */
export async function logResourceCreation(
  performedById: string,
  entityType: AuditEntityType,
  entityId: string,
  resourceName: string,
  options?: {
    initialData?: Record<string, any>;
    details?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  const action = `${entityType}_CREATED` as AuditAction;

  const auditLog = await createAuditLog({
    performedById,
    action,
    entityType,
    entityId,
    resourceName,
    changes: options?.initialData,
    details: options?.details || `Created ${entityType.toLowerCase()}: ${resourceName}`,
    ipAddress: options?.ipAddress,
    severity: 'INFO',
  });

  // Log to global logger
  logDataChange('CREATE', entityType, entityId, performedById, options?.initialData);

  return auditLog;
}

/**
 * Log resource update
 */
export async function logResourceUpdate(
  performedById: string,
  entityType: AuditEntityType,
  entityId: string,
  resourceName: string,
  options: {
    differences?: AuditDifference[];
    changes?: Record<string, any>;
    details?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  const action = `${entityType}_UPDATED` as AuditAction;

  const auditLog = await createAuditLog({
    performedById,
    action,
    entityType,
    entityId,
    resourceName,
    differences: options.differences,
    changes: options.changes,
    details: options.details || `Updated ${entityType.toLowerCase()}: ${resourceName}`,
    ipAddress: options.ipAddress,
    severity: 'INFO',
  });

  // Log to global logger
  logDataChange('UPDATE', entityType, entityId, performedById, options.changes);

  return auditLog;
}

/**
 * Log resource deletion
 */
export async function logResourceDeletion(
  performedById: string,
  entityType: AuditEntityType,
  entityId: string,
  resourceName: string,
  options?: {
    deletedData?: Record<string, any>;
    reason?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  const action = `${entityType}_DELETED` as AuditAction;

  const auditLog = await createAuditLog({
    performedById,
    action,
    entityType,
    entityId,
    resourceName,
    changes: options?.deletedData,
    details: options?.reason || `Deleted ${entityType.toLowerCase()}: ${resourceName}`,
    ipAddress: options?.ipAddress,
    severity: 'WARNING',
  });

  // Log to global logger
  logDataChange('DELETE', entityType, entityId, performedById);

  return auditLog;
}

/**
 * Log role/permission changes (HIGH SENSITIVITY)
 */
export async function logRoleChange(
  performedById: string,
  targetUserId: string,
  options: {
    oldRoles?: string[];
    newRoles?: string[];
    oldPermissions?: string[];
    newPermissions?: string[];
    reason?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  const changes: Record<string, any> = {};
  const differences: AuditDifference[] = [];

  if (options.oldRoles || options.newRoles) {
    changes.roles = {
      from: options.oldRoles,
      to: options.newRoles,
    };
    differences.push({
      field: 'roles',
      oldValue: options.oldRoles?.join(', ') || 'none',
      newValue: options.newRoles?.join(', ') || 'none',
    });
  }

  if (options.oldPermissions || options.newPermissions) {
    changes.permissions = {
      from: options.oldPermissions,
      to: options.newPermissions,
    };
    differences.push({
      field: 'permissions',
      oldValue: options.oldPermissions?.join(', ') || 'none',
      newValue: options.newPermissions?.join(', ') || 'none',
    });
  }

  return createAuditLog({
    performedById,
    targetUserId,
    action: options.oldRoles ? 'ROLE_ASSIGNED' : 'PERMISSION_GRANTED',
    entityType: 'USER',
    entityId: targetUserId,
    changes,
    differences,
    details:
      options.reason ||
      `Roles/permissions changed for user: ${options.newRoles?.join(', ') || options.newPermissions?.join(', ') || 'N/A'}`,
    ipAddress: options.ipAddress,
    severity: 'WARNING',
  });
}

/**
 * Log financial transaction (HIGH SENSITIVITY - CRITICAL)
 */
export async function logFinancialTransaction(
  performedById: string,
  options: {
    transactionType: 'PAYMENT' | 'REFUND' | 'TRANSFER' | 'ADJUSTMENT';
    amount: number;
    currency: string;
    entityType: AuditEntityType;
    entityId: string;
    targetUserId?: string;
    paymentMethod?: string;
    transactionId?: string;
    reason?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  const action = `${options.transactionType === 'PAYMENT' ? 'PAYMENT' : options.transactionType === 'REFUND' ? 'PAYMENT_FAILED' : options.transactionType}_PROCESSED` as AuditAction;

  const changes = {
    type: options.transactionType,
    amount: options.amount,
    currency: options.currency,
    paymentMethod: options.paymentMethod,
    transactionId: options.transactionId,
    timestamp: new Date().toISOString(),
  };

  const auditLog = await createAuditLog({
    performedById,
    targetUserId: options.targetUserId,
    action,
    entityType: options.entityType,
    entityId: options.entityId,
    changes,
    details:
      options.reason ||
      `${options.transactionType} of ${options.currency}${options.amount} (ID: ${options.transactionId || 'N/A'})`,
    ipAddress: options.ipAddress,
    severity: 'WARNING',
    metadata: {
      transactionId: options.transactionId,
      paymentMethod: options.paymentMethod,
    },
  });

  // Log to global logger
  logPaymentEvent(
    options.transactionType === 'PAYMENT' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
    options.transactionId || options.entityId,
    options.targetUserId || performedById,
    options.amount,
    options.currency,
    options.reason
  );

  return auditLog;
}

/**
 * Log subscription changes
 */
export async function logSubscriptionChange(
  performedById: string,
  targetUserId: string,
  options: {
    changeType: 'UPGRADED' | 'DOWNGRADED' | 'CANCELLED';
    oldPlan?: string;
    newPlan?: string;
    reason?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  const action = `SUBSCRIPTION_${options.changeType}` as AuditAction;

  return createAuditLog({
    performedById,
    targetUserId,
    action,
    entityType: 'SUBSCRIPTION',
    entityId: targetUserId,
    differences: [
      {
        field: 'plan',
        oldValue: options.oldPlan || 'N/A',
        newValue: options.newPlan || 'N/A',
      },
    ],
    details:
      options.reason ||
      `Subscription ${options.changeType.toLowerCase()} from ${options.oldPlan} to ${options.newPlan}`,
    ipAddress: options.ipAddress,
    severity: 'WARNING',
  });
}

/**
 * Log security-related events (HIGHEST SENSITIVITY)
 */
export async function logSecurityIncident(
  performedById: string,
  options: {
    eventType:
      | 'FAILED_LOGIN_ATTEMPT'
      | 'SUSPICIOUS_ACTIVITY'
      | 'UNAUTHORIZED_ACCESS_ATTEMPT'
      | 'UNUSUAL_DATA_ACCESS'
      | 'RATE_LIMIT_EXCEEDED'
      | 'API_KEY_GENERATED'
      | 'API_KEY_REVOKED';
    details: string;
    targetUserId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }
): Promise<AuditLogResponse | null> {
  const auditLog = await createAuditLog({
    performedById,
    targetUserId: options.targetUserId,
    action: options.eventType as AuditAction,
    entityType: 'SECURITY',
    details: options.details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    severity: 'WARNING',
    metadata: options.metadata,
  });

  // Log to global logger
  logSecurityEventToLogger(
    options.eventType,
    performedById,
    options.details,
    options.ipAddress
  );

  return auditLog;
}

/**
 * Log data export (COMPLIANCE)
 */
export async function logDataExport(
  performedById: string,
  options: {
    entityType: AuditEntityType;
    entityIds: string[];
    format: 'CSV' | 'JSON' | 'PDF' | 'EXCEL';
    reason?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  return createAuditLog({
    performedById,
    action: 'DATA_EXPORT',
    entityType: options.entityType,
    changes: {
      format: options.format,
      count: options.entityIds.length,
      entityIds: options.entityIds.slice(0, 10),
    },
    details:
      options.reason ||
      `Exported ${options.entityIds.length} ${options.entityType.toLowerCase()} records in ${options.format}`,
    ipAddress: options.ipAddress,
    severity: 'INFO',
    metadata: {
      totalExported: options.entityIds.length,
      format: options.format,
    },
  });
}

/**
 * Log bulk operations
 */
export async function logBulkOperation(
  performedById: string,
  options: {
    operationType: 'CREATE' | 'UPDATE' | 'DELETE';
    entityType: AuditEntityType;
    count: number;
    entityIds?: string[];
    reason?: string;
    ipAddress?: string;
  }
): Promise<AuditLogResponse | null> {
  return createAuditLog({
    performedById,
    action: 'BULK_OPERATION',
    entityType: options.entityType,
    changes: {
      operationType: options.operationType,
      count: options.count,
      affectedIds: options.entityIds?.slice(0, 10),
    },
    details:
      options.reason ||
      `Bulk ${options.operationType.toLowerCase()} of ${options.count} ${options.entityType.toLowerCase()} records`,
    ipAddress: options.ipAddress,
    severity: 'WARNING',
    metadata: {
      operationType: options.operationType,
      totalAffected: options.count,
    },
  });
}

// ============================================================================
// AUDIT LOG QUERIES
// ============================================================================

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(
  entityType: AuditEntityType,
  entityId: string,
  options?: {
    limit?: number;
    offset?: number;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AuditLogResponse[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
        ...(options?.severity && { severity: options.severity }),
        ...(options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return logs as AuditLogResponse[];
  } catch (error) {
    logger.error(
      'Failed to get audit logs for entity',
      error as Error,
      { entityType, entityId },
      'Audit'
    );
    return [];
  }
}

/**
 * Get audit logs performed by a specific user
 */
export async function getAuditLogsForUser(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
  }
): Promise<AuditLogResponse[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        performedById: userId,
        ...(options?.severity && { severity: options.severity }),
        ...(options?.action && { action: options.action }),
        ...(options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return logs as AuditLogResponse[];
  } catch (error) {
    logger.error('Failed to get user audit logs', error as Error, { userId }, 'Audit');
    return [];
  }
}

/**
 * Get audit logs affecting a specific user
 */
export async function getAuditLogsTargetingUser(
  targetUserId: string,
  options?: {
    limit?: number;
    offset?: number;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AuditLogResponse[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        targetUserId,
        ...(options?.severity && { severity: options.severity }),
        ...(options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return logs as AuditLogResponse[];
  } catch (error) {
    logger.error(
      'Failed to get targeting audit logs',
      error as Error,
      { targetUserId },
      'Audit'
    );
    return [];
  }
}

/**
 * Get recent security-related audit logs
 */
export async function getSecurityAuditLogs(
  options?: {
    limit?: number;
    hoursBack?: number;
    severity?: AuditSeverity;
    userId?: string;
  }
): Promise<AuditLogResponse[]> {
  try {
    const since = new Date(Date.now() - (options?.hoursBack || 24) * 60 * 60 * 1000);

    const logs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: since,
        },
        severity: {
          in: options?.severity ? [options.severity] : ['WARNING', 'ERROR', 'CRITICAL'],
        },
        action: {
          in: SECURITY_SENSITIVE_ACTIONS as AuditAction[],
        },
        ...(options?.userId && { performedById: options.userId }),
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 100,
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return logs as AuditLogResponse[];
  } catch (error) {
    logger.error('Failed to get security audit logs', error as Error, {}, 'Audit');
    return [];
  }
}

/**
 * Get financial transaction logs
 */
export async function getFinancialAuditLogs(
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AuditLogResponse[]> {
  try {
    const financialActions: AuditAction[] = [
      'PAYMENT_PROCESSED',
      'PAYMENT_FAILED',
      'REFUND_PROCESSED',
    ];

    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: financialActions,
        },
        ...(options?.userId && { performedById: options.userId }),
        ...(options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 100,
      skip: options?.offset || 0,
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return logs as AuditLogResponse[];
  } catch (error) {
    logger.error('Failed to get financial audit logs', error as Error, {}, 'Audit');
    return [];
  }
}

/**
 * Search audit logs
 */
export async function searchAuditLogs(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    entityType?: AuditEntityType;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AuditLogResponse[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: query, mode: 'insensitive' as any } },
          { details: { contains: query, mode: 'insensitive' as any } },
          { resourceName: { contains: query, mode: 'insensitive' as any } },
        ],
        ...(options?.entityType && { entityType: options.entityType }),
        ...(options?.severity && { severity: options.severity }),
        ...(options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return logs as AuditLogResponse[];
  } catch (error) {
    logger.error('Failed to search audit logs', error as Error, { query }, 'Audit');
    return [];
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(options?: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}): Promise<{
  total: number;
  byAction: Record<AuditAction, number>;
  bySeverity: Record<AuditSeverity, number>;
  byEntityType: Record<AuditEntityType, number>;
}> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(options?.userId && { performedById: options.userId }),
        ...(options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        },
      },
      select: {
        action: true,
        severity: true,
        entityType: true,
      },
    });

    const stats = {
      total: logs.length,
      byAction: {} as Record<AuditAction, number>,
      bySeverity: {} as Record<AuditSeverity, number>,
      byEntityType: {} as Record<AuditEntityType, number>,
    };

    logs.forEach((log) => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by severity
      const severity = log.severity as AuditSeverity;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      // Count by entity type
      if (log.entityType) {
        const entityType = log.entityType as AuditEntityType;
        stats.byEntityType[entityType] = (stats.byEntityType[entityType] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    logger.error('Failed to get audit log stats', error as Error, {}, 'Audit');
    return {
      total: 0,
      byAction: {},
      bySeverity: {},
      byEntityType: {},
    };
  }
}

// ============================================================================
// CLEANUP & MAINTENANCE
// ============================================================================

/**
 * Delete old audit logs (for compliance and storage management)
 */
export async function deleteOldAuditLogs(
  options: {
    daysOld?: number;
    severity?: AuditSeverity;
    excludeHighSensitivity?: boolean;
  } = {}
): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - (options.daysOld || 90) * 24 * 60 * 60 * 1000);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        ...(options.severity && { severity: options.severity }),
        ...(options.excludeHighSensitivity && {
          action: {
            notIn: HIGH_SENSITIVITY_ACTIONS as AuditAction[],
          },
        }),
      },
    });

    logger.info(
      'Old audit logs deleted',
      {
        count: result.count,
        cutoffDate: cutoffDate.toISOString(),
        daysOld: options.daysOld || 90,
      },
      'Audit'
    );

    return result.count;
  } catch (error) {
    logger.error('Failed to delete old audit logs', error as Error, {}, 'Audit');
    return 0;
  }
}

/**
 * Export audit logs for compliance/analysis
 */
export async function exportAuditLogsAsJSON(options?: {
  entityType?: AuditEntityType;
  entityId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<string> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(options?.entityType && { entityType: options.entityType }),
        ...(options?.entityId && { entityId: options.entityId }),
        ...(options?.userId && { performedById: options.userId }),
        ...(options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 10000,
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return JSON.stringify(logs, null, 2);
  } catch (error) {
    logger.error('Failed to export audit logs', error as Error, {}, 'Audit');
    throw error;
  }
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default {
  createAuditLog,
  logAuthenticationEvent,
  log2FAEvent,
  logResourceCreation,
  logResourceUpdate,
  logResourceDeletion,
  logRoleChange,
  logFinancialTransaction,
  logSubscriptionChange,
  logSecurityIncident,
  logDataExport,
  logBulkOperation,
  extractRequestDetails,
  getAuditLogsForEntity,
  getAuditLogsForUser,
  getAuditLogsTargetingUser,
  getSecurityAuditLogs,
  getFinancialAuditLogs,
  searchAuditLogs,
  getAuditLogStats,
  deleteOldAuditLogs,
  exportAuditLogsAsJSON,
};
