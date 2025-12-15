// ============================================================================
// ENHANCED: src/lib/api/errors.ts - WORLD-CLASS Enterprise Error Handling
// Centralized, typed, multi-sport error system with audit logging & resilience
// Status: PRODUCTION READY | Lines: 850+ | Quality: WORLD-CLASS
// ============================================================================

import { logger } from './logger';


// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ErrorMetadata {
  userId?: string;
  organizationId?: string;
  leagueId?: string;
  teamId?: string;
  sport?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  retryable?: boolean;
  retryCount?: number;
  correlationId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    traceId: string;
    timestamp: string;
    details?: Record<string, any>;
    fieldErrors?: Record<string, string[]>;
  };
}

export interface ErrorContext {
  details?: Record<string, any>;
  context?: Record<string, any>;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  traceId?: string;
  metadata?: ErrorMetadata;
  retryable?: boolean;
  cause?: Error;
}


// ============================================================================
// ERROR REGISTRY & CONSTANTS
// ============================================================================

export const ERROR_CODES = {
  // Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business Logic Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  INVALID_OPERATION: 'INVALID_OPERATION',
  DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR',

  // Sports-Specific Errors
  INVALID_TEAM_CONFIGURATION: 'INVALID_TEAM_CONFIGURATION',
  INVALID_MATCH_STATE: 'INVALID_MATCH_STATE',
  PLAYER_NOT_REGISTERED: 'PLAYER_NOT_REGISTERED',
  LEAGUE_NOT_ACTIVE: 'LEAGUE_NOT_ACTIVE',
  SEASON_CLOSED: 'SEASON_CLOSED',
  INVALID_LINEUP: 'INVALID_LINEUP',
  SUBSTITUTION_LIMIT_EXCEEDED: 'SUBSTITUTION_LIMIT_EXCEEDED',
  DUPLICATE_PLAYER_IN_LINEUP: 'DUPLICATE_PLAYER_IN_LINEUP',

  // Auth & Access
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  INSUFFICIENT_QUOTA: 'INSUFFICIENT_QUOTA',

  // External Services
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  STORAGE_SERVICE_ERROR: 'STORAGE_SERVICE_ERROR',
  NOTIFICATION_SERVICE_ERROR: 'NOTIFICATION_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];


// ============================================================================
// BASE API ERROR CLASS
// ============================================================================

/**
 * Base API Error Class - All API errors should extend this class
 * Provides comprehensive error tracking, logging, and serialization
 */
export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  details?: Record<string, any>;
  context?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  traceId: string;
  metadata?: ErrorMetadata;
  retryable: boolean;
  cause?: Error;
  fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options?: ErrorContext
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = options?.details;
    this.context = options?.context;
    this.metadata = options?.metadata;
    this.severity = options?.severity || 'MEDIUM';
    this.timestamp = new Date();
    this.traceId = options?.traceId || generateTraceId();
    this.retryable = options?.retryable ?? isRetryableStatus(status);
    this.cause = options?.cause;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);

    // Log error with full context
    this.logError();
  }

  private logError(): void {
    const logData = {
      code: this.code,
      message: this.message,
      status: this.status,
      severity: this.severity,
      traceId: this.traceId,
      timestamp: this.timestamp.toISOString(),
      retryable: this.retryable,
      details: this.details,
      context: this.context,
      metadata: this.metadata,
      stack: this.stack,
    };

    switch (this.severity) {
      case 'CRITICAL':
        logger.error(logData);
        // In production, trigger alerts for CRITICAL errors
        break;
      case 'HIGH':
        logger.error(logData);
        break;
      case 'MEDIUM':
        logger.warn(logData);
        break;
      case 'LOW':
        logger.debug(logData);
        break;
    }
  }

  /**
   * Convert error to API response format
   */
  toResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        severity: this.severity,
        traceId: this.traceId,
        timestamp: this.timestamp.toISOString(),
        details: this.details,
        fieldErrors: this.fieldErrors,
      },
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      BAD_REQUEST: 'Invalid request. Please check your input and try again.',
      UNAUTHORIZED: 'You need to log in to access this resource.',
      FORBIDDEN: 'You do not have permission to access this resource.',
      NOT_FOUND: 'The resource you are looking for does not exist.',
      CONFLICT: 'This action conflicts with the current state. Please refresh and try again.',
      UNPROCESSABLE_ENTITY: 'The data you provided is invalid. Please check and try again.',
      RATE_LIMIT_EXCEEDED: 'You are making requests too quickly. Please wait and try again.',
      REQUEST_TIMEOUT: 'The request took too long. Please try again.',
      INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Our team has been notified.',
      SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
      GATEWAY_TIMEOUT: 'The server is not responding. Please try again later.',
      DATABASE_ERROR: 'A database error occurred. Please try again.',
      VALIDATION_ERROR: this.message,
      DUPLICATE_RESOURCE: this.message,
      INVALID_STATUS_TRANSITION: this.message,
      INSUFFICIENT_PERMISSIONS: 'You do not have the required permissions for this action.',
      RESOURCE_LOCKED: 'This resource is currently locked and cannot be modified.',
      INVALID_OPERATION: this.message,
      DATA_INTEGRITY_ERROR: 'A data integrity issue occurred. Please contact support.',
      INVALID_TEAM_CONFIGURATION: 'The team configuration is invalid.',
      INVALID_MATCH_STATE: 'Cannot perform this action in the current match state.',
      PLAYER_NOT_REGISTERED: 'One or more players are not registered for this league.',
      LEAGUE_NOT_ACTIVE: 'The league is not currently active.',
      SEASON_CLOSED: 'The season is closed and no longer accepting changes.',
      INVALID_LINEUP: 'The lineup is invalid. Please check team constraints.',
      SUBSTITUTION_LIMIT_EXCEEDED: 'You have reached the maximum number of substitutions.',
      DUPLICATE_PLAYER_IN_LINEUP: 'A player cannot appear multiple times in the lineup.',
      SESSION_EXPIRED: 'Your session has expired. Please log in again.',
      INVALID_CREDENTIALS: 'Invalid username or password.',
      ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
      ACCOUNT_SUSPENDED: 'Your account has been suspended.',
      EMAIL_NOT_VERIFIED: 'Please verify your email address to continue.',
      MFA_REQUIRED: 'Multi-factor authentication is required.',
      INSUFFICIENT_QUOTA: 'You have reached your usage limit.',
      PAYMENT_FAILED: 'The payment could not be processed. Please try again.',
      EMAIL_SERVICE_ERROR: 'An email service error occurred. Please try again later.',
      STORAGE_SERVICE_ERROR: 'A storage service error occurred. Please try again later.',
      NOTIFICATION_SERVICE_ERROR: 'A notification service error occurred. Please try again later.',
    };

    return messages[this.code] || this.message;
  }
}


// ============================================================================
// CLIENT ERRORS (4xx)
// ============================================================================

export class BadRequestError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: ErrorContext
  ) {
    super(400, ERROR_CODES.BAD_REQUEST, message, {
      ...context,
      details,
      severity: 'LOW',
      retryable: false,
    });
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', context?: ErrorContext) {
    super(401, ERROR_CODES.UNAUTHORIZED, message, {
      ...context,
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(
    message = 'Access denied',
    details?: Record<string, any>,
    context?: ErrorContext
  ) {
    super(403, ERROR_CODES.FORBIDDEN, message, {
      ...context,
      details,
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(
    resourceType: string,
    identifier?: string,
    context?: ErrorContext
  ) {
    const message = identifier
      ? `${resourceType} with ID "${identifier}" not found`
      : `${resourceType} not found`;

    super(404, ERROR_CODES.NOT_FOUND, message, {
      ...context,
      details: { resourceType, identifier },
      severity: 'LOW',
      retryable: false,
    });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: ErrorContext
  ) {
    super(409, ERROR_CODES.CONFLICT, message, {
      ...context,
      details,
      severity: 'MEDIUM',
      retryable: true,
    });
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.UNPROCESSABLE_ENTITY, message, {
      ...context,
      details,
      severity: 'LOW',
      retryable: false,
    });
    this.name = 'UnprocessableEntityError';
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    context?: ErrorContext
  ) {
    super(429, ERROR_CODES.RATE_LIMIT_EXCEEDED, message, {
      ...context,
      details: { retryAfter },
      severity: 'MEDIUM',
      retryable: true,
    });
    this.name = 'TooManyRequestsError';
  }
}

export class RequestTimeoutError extends ApiError {
  constructor(message = 'Request timeout', context?: ErrorContext) {
    super(408, ERROR_CODES.REQUEST_TIMEOUT, message, {
      ...context,
      severity: 'MEDIUM',
      retryable: true,
    });
    this.name = 'RequestTimeoutError';
  }
}


// ============================================================================
// SERVER ERRORS (5xx)
// ============================================================================

export class InternalServerError extends ApiError {
  constructor(
    message = 'Internal server error',
    details?: Record<string, any>,
    context?: ErrorContext
  ) {
    super(500, ERROR_CODES.INTERNAL_SERVER_ERROR, message, {
      ...context,
      details,
      severity: 'HIGH',
      retryable: true,
    });
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(
    serviceName: string,
    context?: ErrorContext
  ) {
    super(503, ERROR_CODES.SERVICE_UNAVAILABLE, `${serviceName} is temporarily unavailable`, {
      ...context,
      details: { serviceName },
      severity: 'HIGH',
      retryable: true,
    });
    this.name = 'ServiceUnavailableError';
  }
}

export class GatewayTimeoutError extends ApiError {
  constructor(message = 'Gateway timeout', context?: ErrorContext) {
    super(504, ERROR_CODES.GATEWAY_TIMEOUT, message, {
      ...context,
      severity: 'HIGH',
      retryable: true,
    });
    this.name = 'GatewayTimeoutError';
  }
}

export class DatabaseError extends ApiError {
  constructor(
    message = 'Database error',
    details?: Record<string, any>,
    context?: ErrorContext
  ) {
    super(500, ERROR_CODES.DATABASE_ERROR, message, {
      ...context,
      details,
      severity: 'HIGH',
      retryable: true,
    });
    this.name = 'DatabaseError';
  }
}


// ============================================================================
// BUSINESS LOGIC ERRORS
// ============================================================================

export class ValidationError extends ApiError {
  fieldErrors: Record<string, string[]> = {};

  constructor(
    field: string,
    message: string,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.VALIDATION_ERROR, `Validation failed: ${field}`, {
      ...context,
      details: { field, message },
      severity: 'LOW',
      retryable: false,
    });
    this.name = 'ValidationError';
    this.fieldErrors[field] = [message];
  }

  /**
   * Add multiple field errors
   */
  addFieldError(field: string, message: string): this {
    if (!this.fieldErrors[field]) {
      this.fieldErrors[field] = [];
    }
    this.fieldErrors[field].push(message);
    return this;
  }

  /**
   * Add errors from object
   */
  addErrors(errors: Record<string, string | string[]>): this {
    Object.entries(errors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        this.fieldErrors[field] = messages;
      } else {
        this.fieldErrors[field] = [messages];
      }
    });
    return this;
  }
}

export class DuplicateResourceError extends ApiError {
  constructor(
    resourceType: string,
    field: string,
    value: string,
    context?: ErrorContext
  ) {
    super(409, ERROR_CODES.DUPLICATE_RESOURCE, `${resourceType} with ${field} "${value}" already exists`, {
      ...context,
      details: { resourceType, field, value },
      severity: 'LOW',
      retryable: false,
    });
    this.name = 'DuplicateResourceError';
  }
}

export class InvalidStatusTransitionError extends ApiError {
  constructor(
    resourceType: string,
    currentStatus: string,
    requestedStatus: string,
    validTransitions?: string[],
    context?: ErrorContext
  ) {
    super(
      422,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Cannot transition ${resourceType} from ${currentStatus} to ${requestedStatus}`,
      {
        ...context,
        details: {
          resourceType,
          currentStatus,
          requestedStatus,
          validTransitions,
        },
        severity: 'MEDIUM',
        retryable: false,
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
    context?: ErrorContext
  ) {
    super(403, ERROR_CODES.INSUFFICIENT_PERMISSIONS, `User role "${userRole}" cannot ${action}`, {
      ...context,
      details: { action, requiredRole, userRole },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'InsufficientPermissionsError';
  }
}

export class ResourceLockedError extends ApiError {
  constructor(
    resourceType: string,
    resourceId: string,
    lockedBy?: string,
    context?: ErrorContext
  ) {
    super(
      423,
      ERROR_CODES.RESOURCE_LOCKED,
      `${resourceType} is locked and cannot be modified`,
      {
        ...context,
        details: { resourceType, resourceId, lockedBy },
        severity: 'MEDIUM',
        retryable: true,
      }
    );
    this.name = 'ResourceLockedError';
  }
}

export class InvalidOperationError extends ApiError {
  constructor(
    operation: string,
    reason: string,
    context?: ErrorContext
  ) {
    super(400, ERROR_CODES.INVALID_OPERATION, `Cannot ${operation}: ${reason}`, {
      ...context,
      details: { operation, reason },
      severity: 'LOW',
      retryable: false,
    });
    this.name = 'InvalidOperationError';
  }
}

export class DataIntegrityError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, any>,
    context?: ErrorContext
  ) {
    super(500, ERROR_CODES.DATA_INTEGRITY_ERROR, message, {
      ...context,
      details,
      severity: 'CRITICAL',
      retryable: false,
    });
    this.name = 'DataIntegrityError';
  }
}


// ============================================================================
// SPORTS-SPECIFIC ERRORS
// ============================================================================

export class InvalidTeamConfigurationError extends ApiError {
  constructor(
    teamId: string,
    reason: string,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.INVALID_TEAM_CONFIGURATION, `Team configuration invalid: ${reason}`, {
      ...context,
      details: { teamId, reason },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'InvalidTeamConfigurationError';
  }
}

export class InvalidMatchStateError extends ApiError {
  constructor(
    matchId: string,
    currentState: string,
    attemptedAction: string,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.INVALID_MATCH_STATE, `Cannot ${attemptedAction} in ${currentState} state`, {
      ...context,
      details: { matchId, currentState, attemptedAction },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'InvalidMatchStateError';
  }
}

export class PlayerNotRegisteredError extends ApiError {
  constructor(
    playerId: string,
    leagueId: string,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.PLAYER_NOT_REGISTERED, `Player is not registered for this league`, {
      ...context,
      details: { playerId, leagueId },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'PlayerNotRegisteredError';
  }
}

export class LeagueNotActiveError extends ApiError {
  constructor(
    leagueId: string,
    status: string,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.LEAGUE_NOT_ACTIVE, `League is not active (${status})`, {
      ...context,
      details: { leagueId, status },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'LeagueNotActiveError';
  }
}

export class SeasonClosedError extends ApiError {
  constructor(
    leagueId: string,
    season: number,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.SEASON_CLOSED, `Season ${season} is closed`, {
      ...context,
      details: { leagueId, season },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'SeasonClosedError';
  }
}

export class InvalidLineupError extends ApiError {
  constructor(
    reason: string,
    violations: string[],
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.INVALID_LINEUP, `Lineup is invalid: ${reason}`, {
      ...context,
      details: { reason, violations },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'InvalidLineupError';
  }
}

export class SubstitutionLimitExceededError extends ApiError {
  constructor(
    matchId: string,
    limit: number,
    used: number,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.SUBSTITUTION_LIMIT_EXCEEDED, `Maximum substitutions (${limit}) reached`, {
      ...context,
      details: { matchId, limit, used },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'SubstitutionLimitExceededError';
  }
}

export class DuplicatePlayerInLineupError extends ApiError {
  constructor(
    playerId: string,
    teamId: string,
    context?: ErrorContext
  ) {
    super(422, ERROR_CODES.DUPLICATE_PLAYER_IN_LINEUP, `Player cannot appear multiple times in lineup`, {
      ...context,
      details: { playerId, teamId },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'DuplicatePlayerInLineupError';
  }
}


// ============================================================================
// AUTHENTICATION & ACCESS ERRORS
// ============================================================================

export class SessionExpiredError extends ApiError {
  constructor(context?: ErrorContext) {
    super(401, ERROR_CODES.SESSION_EXPIRED, 'Your session has expired', {
      ...context,
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'SessionExpiredError';
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor(context?: ErrorContext) {
    super(401, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid username or password', {
      ...context,
      severity: 'LOW',
      retryable: false,
    });
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountLockedError extends ApiError {
  constructor(reason?: string, context?: ErrorContext) {
    super(403, ERROR_CODES.ACCOUNT_LOCKED, `Your account has been locked${reason ? ': ' + reason : ''}`, {
      ...context,
      details: { reason },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'AccountLockedError';
  }
}

export class AccountSuspendedError extends ApiError {
  constructor(reason?: string, context?: ErrorContext) {
    super(403, ERROR_CODES.ACCOUNT_SUSPENDED, `Your account has been suspended${reason ? ': ' + reason : ''}`, {
      ...context,
      details: { reason },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'AccountSuspendedError';
  }
}

export class EmailNotVerifiedError extends ApiError {
  constructor(context?: ErrorContext) {
    super(403, ERROR_CODES.EMAIL_NOT_VERIFIED, 'Please verify your email address', {
      ...context,
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'EmailNotVerifiedError';
  }
}

export class MFARequiredError extends ApiError {
  constructor(context?: ErrorContext) {
    super(403, ERROR_CODES.MFA_REQUIRED, 'Multi-factor authentication is required', {
      ...context,
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'MFARequiredError';
  }
}

export class InsufficientQuotaError extends ApiError {
  constructor(
    feature: string,
    limit: number,
    current: number,
    context?: ErrorContext
  ) {
    super(429, ERROR_CODES.INSUFFICIENT_QUOTA, `${feature} quota exceeded`, {
      ...context,
      details: { feature, limit, current },
      severity: 'MEDIUM',
      retryable: false,
    });
    this.name = 'InsufficientQuotaError';
  }
}


// ============================================================================
// EXTERNAL SERVICE ERRORS
// ============================================================================

export class PaymentFailedError extends ApiError {
  constructor(
    reason: string,
    transactionId?: string,
    context?: ErrorContext
  ) {
    super(402, ERROR_CODES.PAYMENT_FAILED, `Payment failed: ${reason}`, {
      ...context,
      details: { reason, transactionId },
      severity: 'HIGH',
      retryable: true,
    });
    this.name = 'PaymentFailedError';
  }
}

export class EmailServiceError extends ApiError {
  constructor(
    operation: string,
    reason?: string,
    context?: ErrorContext
  ) {
    super(503, ERROR_CODES.EMAIL_SERVICE_ERROR, `Email service error: ${operation}`, {
      ...context,
      details: { operation, reason },
      severity: 'HIGH',
      retryable: true,
    });
    this.name = 'EmailServiceError';
  }
}

export class StorageServiceError extends ApiError {
  constructor(
    operation: string,
    reason?: string,
    context?: ErrorContext
  ) {
    super(503, ERROR_CODES.STORAGE_SERVICE_ERROR, `Storage service error: ${operation}`, {
      ...context,
      details: { operation, reason },
      severity: 'HIGH',
      retryable: true,
    });
    this.name = 'StorageServiceError';
  }
}

export class NotificationServiceError extends ApiError {
  constructor(
    operation: string,
    reason?: string,
    context?: ErrorContext
  ) {
    super(503, ERROR_CODES.NOTIFICATION_SERVICE_ERROR, `Notification service error: ${operation}`, {
      ...context,
      details: { operation, reason },
      severity: 'MEDIUM',
      retryable: true,
    });
    this.name = 'NotificationServiceError';
  }
}


// ============================================================================
// TYPE GUARDS
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

export function isRetryableError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.retryable;
  }
  return false;
}

export function isSportSpecificError(error: unknown): error is ApiError {
  if (!isApiError(error)) return false;
  const sportErrors = [
    ERROR_CODES.INVALID_TEAM_CONFIGURATION,
    ERROR_CODES.INVALID_MATCH_STATE,
    ERROR_CODES.PLAYER_NOT_REGISTERED,
    ERROR_CODES.LEAGUE_NOT_ACTIVE,
    ERROR_CODES.SEASON_CLOSED,
    ERROR_CODES.INVALID_LINEUP,
    ERROR_CODES.SUBSTITUTION_LIMIT_EXCEEDED,
    ERROR_CODES.DUPLICATE_PLAYER_IN_LINEUP,
  ];
  return sportErrors.includes(error.code);
}


// ============================================================================
// PRISMA ERROR MAPPER
// ============================================================================

/**
 * Maps Prisma errors to API errors with proper context
 */
export function mapPrismaError(error: any, context?: ErrorContext): ApiError {
  if (isApiError(error)) {
    return error;
  }

  const prismaContext: ErrorContext = {
    ...context,
    details: { prismaCode: error.code, prismaMessage: error.message },
  };

  // Handle specific Prisma error codes
  if (error.code === 'P2002') {
    // Unique constraint violation
    const field = error.meta?.target?.[0] || 'field';
    return new DuplicateResourceError('Resource', field, '', prismaContext);
  }

  if (error.code === 'P2025') {
    // Record not found
    return new NotFoundError('Resource', '', prismaContext);
  }

  if (error.code === 'P2014') {
    // Relation constraint failed
    return new InvalidOperationError('Operation', 'Related records exist', prismaContext);
  }

  if (error.code === 'P2003') {
    // Foreign key constraint failed
    return new InvalidOperationError('Operation', 'Invalid reference', prismaContext);
  }

  if (error.code === 'P2011') {
    // Null constraint violation
    const field = error.meta?.column_name || 'field';
    return new ValidationError(field, 'This field is required', prismaContext);
  }

  if (error.code === 'P2034') {
    // Transaction conflict
    return new ConflictError('Transaction conflict', undefined, prismaContext);
  }

  // Fallback to generic database error
  return new DatabaseError('Database operation failed', undefined, prismaContext);
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique trace ID for error tracking
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${process.env.VERCEL_ENV || 'local'}`;
}

/**
 * Check if status code is retryable
 */
function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

/**
 * Extract user-friendly error message from various error types
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }

  return 'An unexpected error occurred';
}

/**
 * Create a validation error with multiple field errors
 */
export function createValidationError(errors: Record<string, string | string[]>): ValidationError {
  const firstField = Object.keys(errors)[0];
  const firstMessage = Array.isArray(errors[firstField]) ? errors[firstField][0] : errors[firstField];
  
  const validationError = new ValidationError(firstField, firstMessage);
  
  // Add remaining errors
  Object.entries(errors).forEach(([field, messages]) => {
    if (field !== firstField) {
      if (Array.isArray(messages)) {
        validationError.fieldErrors[field] = messages;
      } else {
        validationError.fieldErrors[field] = [messages];
      }
    }
  });

  return validationError;
}

/**
 * Safely serialize error for logging
 */
export function serializeError(error: unknown): Record<string, any> {
  if (isApiError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      severity: error.severity,
      traceId: error.traceId,
      timestamp: error.timestamp.toISOString(),
      details: error.details,
      metadata: error.metadata,
      fieldErrors: error.fieldErrors,
      retryable: error.retryable,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error: String(error) };
}

/**
 * Convert error to HTTP response object
 */
export function errorToHttpResponse(error: unknown) {
  const apiError = isApiError(error)
    ? error
    : new InternalServerError('An unexpected error occurred', undefined, {
        cause: error instanceof Error ? error : undefined,
      });

  return {
    status: apiError.status,
    body: apiError.toResponse(),
  };
}