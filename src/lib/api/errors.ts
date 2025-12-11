// ============================================================================
// ENHANCED: src/lib/api/errors.ts - Enterprise-Grade Error Handling
// Centralized, typed error system with audit logging and context
// ============================================================================

import { logger } from './logger';

/**
 * Base API Error Class
 * All API errors should extend this class
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, any>;
  context?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  traceId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    options?: {
      details?: Record<string, any>;
      context?: Record<string, any>;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      traceId?: string;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = options?.details;
    this.context = options?.context;
    this.severity = options?.severity || 'MEDIUM';
    this.timestamp = new Date();
    this.traceId = options?.traceId;

    // Log error with context
    logger.error({
      code: this.code,
      message: this.message,
      status: this.status,
      severity: this.severity,
      details: this.details,
      context: this.context,
      traceId: this.traceId,
    });
  }
}

// ============================================================================
// CLIENT ERRORS (4xx)
// ============================================================================

export class BadRequestError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(400, 'BAD_REQUEST', message, {
      details,
      context,
      severity: 'LOW',
    });
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(
    message = 'Authentication required',
    context?: Record<string, any>
  ) {
    super(401, 'UNAUTHORIZED', message, {
      context,
      severity: 'MEDIUM',
    });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(
    message = 'Access denied',
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(403, 'FORBIDDEN', message, {
      details,
      context,
      severity: 'MEDIUM',
    });
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(
    resourceType: string,
    identifier?: string,
    context?: Record<string, any>
  ) {
    const message = identifier
      ? `${resourceType} with ID "${identifier}" not found`
      : `${resourceType} not found`;

    super(404, 'NOT_FOUND', message, {
      details: { resourceType, identifier },
      context,
      severity: 'LOW',
    });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(409, 'CONFLICT', message, {
      details,
      context,
      severity: 'MEDIUM',
    });
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(422, 'UNPROCESSABLE_ENTITY', message, {
      details,
      context,
      severity: 'LOW',
    });
    this.name = 'UnprocessableEntityError';
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(429, 'RATE_LIMIT_EXCEEDED', message, {
      details: { retryAfter },
      context,
      severity: 'MEDIUM',
    });
    this.name = 'TooManyRequestsError';
  }
}

// ============================================================================
// SERVER ERRORS (5xx)
// ============================================================================

export class InternalServerError extends ApiError {
  constructor(
    message = 'Internal server error',
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(500, 'INTERNAL_SERVER_ERROR', message, {
      details,
      context,
      severity: 'HIGH',
    });
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(
    serviceName: string,
    context?: Record<string, any>
  ) {
    super(503, 'SERVICE_UNAVAILABLE', `${serviceName} is temporarily unavailable`, {
      details: { serviceName },
      context,
      severity: 'HIGH',
    });
    this.name = 'ServiceUnavailableError';
  }
}

// ============================================================================
// BUSINESS LOGIC ERRORS
// ============================================================================

export class ValidationError extends ApiError {
  constructor(
    field: string,
    message: string,
    context?: Record<string, any>
  ) {
    super(422, 'VALIDATION_ERROR', `${field}: ${message}`, {
      details: { field, message },
      context,
      severity: 'LOW',
    });
    this.name = 'ValidationError';
  }
}

export class DuplicateResourceError extends ApiError {
  constructor(
    resourceType: string,
    field: string,
    value: string,
    context?: Record<string, any>
  ) {
    super(409, 'DUPLICATE_RESOURCE', `${resourceType} with ${field} "${value}" already exists`, {
      details: { resourceType, field, value },
      context,
      severity: 'LOW',
    });
    this.name = 'DuplicateResourceError';
  }
}

export class InvalidStatusTransitionError extends ApiError {
  constructor(
    resourceType: string,
    currentStatus: string,
    requestedStatus: string,
    context?: Record<string, any>
  ) {
    super(
      422,
      'INVALID_STATUS_TRANSITION',
      `Cannot transition ${resourceType} from ${currentStatus} to ${requestedStatus}`,
      {
        details: { resourceType, currentStatus, requestedStatus },
        context,
        severity: 'MEDIUM',
      }
    );
    this.name = 'InvalidStatusTransitionError';
  }
}

export class InsufficientPermissionsError extends ApiError {
  constructor(
    action: string,
    requiredRole: string,
    userRole: string,
    context?: Record<string, any>
  ) {
    super(403, 'INSUFFICIENT_PERMISSIONS', `User role "${userRole}" cannot ${action}`, {
      details: { action, requiredRole, userRole },
      context,
      severity: 'MEDIUM',
    });
    this.name = 'InsufficientPermissionsError';
  }
}

export class ResourceLockedError extends ApiError {
  constructor(
    resourceType: string,
    resourceId: string,
    lockedBy?: string,
    context?: Record<string, any>
  ) {
    super(
      423,
      'RESOURCE_LOCKED',
      `${resourceType} is locked and cannot be modified`,
      {
        details: { resourceType, resourceId, lockedBy },
        context,
        severity: 'MEDIUM',
      }
    );
    this.name = 'ResourceLockedError';
  }
}

export class InvalidOperationError extends ApiError {
  constructor(
    operation: string,
    reason: string,
    context?: Record<string, any>
  ) {
    super(400, 'INVALID_OPERATION', `Cannot ${operation}: ${reason}`, {
      details: { operation, reason },
      context,
      severity: 'LOW',
    });
    this.name = 'InvalidOperationError';
  }
}

export class DataIntegrityError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(500, 'DATA_INTEGRITY_ERROR', message, {
      details,
      context,
      severity: 'CRITICAL',
    });
    this.name = 'DataIntegrityError';
  }
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isAuthenticationRequired(error: unknown): error is UnauthorizedError | ForbiddenError {
  return error instanceof UnauthorizedError || error instanceof ForbiddenError;
}

// ============================================================================
// ERROR MAPPER FOR PRISMA ERRORS
// ============================================================================

export function mapPrismaError(error: any, context?: Record<string, any>): ApiError {
  if (isApiError(error)) {
    return error;
  }

  // Handle specific Prisma errors
  if (error.code === 'P2002') {
    // Unique constraint violation
    const field = error.meta?.target?. || 'field';
    return new DuplicateResourceError('Resource', field, '', context);
  }

  if (error.code === 'P2025') {
    // Record not found
    return new NotFoundError('Resource', '', context);
  }

  if (error.code === 'P2014') {
    // Relation constraint failed
    return new InvalidOperationError('Operation', 'Related records exist', context);
  }

  if (error.code === 'P2003') {
    // Foreign key constraint failed
    return new InvalidOperationError('Operation', 'Invalid reference', context);
  }

  // Fallback to generic error
  return new InternalServerError('Database operation failed', { prismaCode: error.code }, context);
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Generate a unique trace ID for error tracking
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user-friendly error message from various error types
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }

  return 'An unexpected error occurred';
}
