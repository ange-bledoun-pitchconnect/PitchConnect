/**
 * ============================================================================
 * 🚨 PITCHCONNECT - Enterprise Error Handling System v7.10.1
 * Path: src/lib/api/errors.ts
 * ============================================================================
 * 
 * Complete error hierarchy aligned with HTTP semantics
 * Supports all 18 UserRoles and 12 Sports
 * Datadog integration ready
 * 
 * ============================================================================
 */

import { NextResponse } from 'next/server';

// =============================================================================
// ERROR CODES ENUM
// =============================================================================

export enum ErrorCode {
  // Authentication (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Authorization (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  TIER_REQUIRED = 'TIER_REQUIRED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED = 'ACCOUNT_BANNED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  
  // Validation (400)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_SPORT = 'INVALID_SPORT',
  INVALID_POSITION = 'INVALID_POSITION',
  INVALID_ROLE = 'INVALID_ROLE',
  
  // Not Found (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CLUB_NOT_FOUND = 'CLUB_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  
  // Conflict (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  
  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Service Unavailable (503)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

// =============================================================================
// BASE API ERROR CLASS
// =============================================================================

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

// =============================================================================
// AUTHENTICATION ERRORS (401)
// =============================================================================

export class UnauthorizedError extends ApiError {
  constructor(
    message: string = 'Authentication required',
    details?: Record<string, any>
  ) {
    super(401, message, ErrorCode.UNAUTHORIZED, details);
    this.name = 'UnauthorizedError';
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor(message: string = 'Invalid email or password') {
    super(401, message, ErrorCode.INVALID_CREDENTIALS);
    this.name = 'InvalidCredentialsError';
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message: string = 'Your session has expired. Please log in again.') {
    super(401, message, ErrorCode.TOKEN_EXPIRED);
    this.name = 'TokenExpiredError';
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message: string = 'Session expired. Please log in again.') {
    super(401, message, ErrorCode.SESSION_EXPIRED);
    this.name = 'SessionExpiredError';
  }
}

// =============================================================================
// AUTHORIZATION ERRORS (403)
// =============================================================================

export class ForbiddenError extends ApiError {
  constructor(
    message: string = 'You do not have permission to perform this action',
    details?: Record<string, any>
  ) {
    super(403, message, ErrorCode.FORBIDDEN, details);
    this.name = 'ForbiddenError';
  }
}

export class InsufficientPermissionsError extends ApiError {
  constructor(
    action: string,
    requiredRoles: string,
    currentRoles: string
  ) {
    super(
      403,
      `Insufficient permissions to ${action}. Required: ${requiredRoles}. You have: ${currentRoles}`,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      { action, requiredRoles, currentRoles }
    );
    this.name = 'InsufficientPermissionsError';
  }
}

export class RoleRequiredError extends ApiError {
  constructor(requiredRoles: string[]) {
    super(
      403,
      `One of the following roles is required: ${requiredRoles.join(', ')}`,
      ErrorCode.ROLE_REQUIRED,
      { requiredRoles }
    );
    this.name = 'RoleRequiredError';
  }
}

export class TierRequiredError extends ApiError {
  constructor(
    requiredTier: string,
    currentTier: string,
    feature: string
  ) {
    super(
      403,
      `${feature} requires ${requiredTier} tier or higher. Your current tier: ${currentTier}`,
      ErrorCode.TIER_REQUIRED,
      { requiredTier, currentTier, feature }
    );
    this.name = 'TierRequiredError';
  }
}

export class AccountSuspendedError extends ApiError {
  constructor(reason?: string) {
    super(
      403,
      `Your account has been suspended${reason ? `: ${reason}` : ''}`,
      ErrorCode.ACCOUNT_SUSPENDED,
      { reason }
    );
    this.name = 'AccountSuspendedError';
  }
}

export class AccountBannedError extends ApiError {
  constructor(reason?: string) {
    super(
      403,
      `Your account has been banned${reason ? `: ${reason}` : ''}`,
      ErrorCode.ACCOUNT_BANNED,
      { reason }
    );
    this.name = 'AccountBannedError';
  }
}

// =============================================================================
// VALIDATION ERRORS (400)
// =============================================================================

export class BadRequestError extends ApiError {
  constructor(
    message: string = 'Bad request',
    details?: Record<string, any>
  ) {
    super(400, message, ErrorCode.BAD_REQUEST, details);
    this.name = 'BadRequestError';
  }
}

export class ValidationError extends ApiError {
  public readonly fieldErrors: Record<string, string>;

  constructor(
    message: string = 'Validation failed',
    fieldErrors?: Record<string, string>
  ) {
    super(400, message, ErrorCode.VALIDATION_ERROR, { fieldErrors });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors || {};
  }
}

export class MissingFieldError extends ApiError {
  constructor(fields: string[]) {
    super(
      400,
      `Missing required fields: ${fields.join(', ')}`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      { missingFields: fields }
    );
    this.name = 'MissingFieldError';
  }
}

export class InvalidFormatError extends ApiError {
  constructor(field: string, expectedFormat: string) {
    super(
      400,
      `Invalid format for ${field}. Expected: ${expectedFormat}`,
      ErrorCode.INVALID_FORMAT,
      { field, expectedFormat }
    );
    this.name = 'InvalidFormatError';
  }
}

export class InvalidSportError extends ApiError {
  constructor(providedSport: string, validSports: string[]) {
    super(
      400,
      `Invalid sport: "${providedSport}". Valid sports: ${validSports.join(', ')}`,
      ErrorCode.INVALID_SPORT,
      { providedSport, validSports }
    );
    this.name = 'InvalidSportError';
  }
}

export class InvalidPositionError extends ApiError {
  constructor(position: string, sport: string, validPositions: string[]) {
    super(
      400,
      `Invalid position "${position}" for ${sport}. Valid positions: ${validPositions.join(', ')}`,
      ErrorCode.INVALID_POSITION,
      { position, sport, validPositions }
    );
    this.name = 'InvalidPositionError';
  }
}

// =============================================================================
// NOT FOUND ERRORS (404)
// =============================================================================

export class NotFoundError extends ApiError {
  constructor(
    resourceType: string,
    resourceId?: string
  ) {
    const message = resourceId
      ? `${resourceType} with ID "${resourceId}" not found`
      : `${resourceType} not found`;
    super(404, message, ErrorCode.NOT_FOUND, { resourceType, resourceId });
    this.name = 'NotFoundError';
  }
}

export class UserNotFoundError extends ApiError {
  constructor(identifier: string) {
    super(
      404,
      `User not found: ${identifier}`,
      ErrorCode.USER_NOT_FOUND,
      { identifier }
    );
    this.name = 'UserNotFoundError';
  }
}

export class ClubNotFoundError extends ApiError {
  constructor(clubId: string) {
    super(
      404,
      `Club not found: ${clubId}`,
      ErrorCode.CLUB_NOT_FOUND,
      { clubId }
    );
    this.name = 'ClubNotFoundError';
  }
}

export class TeamNotFoundError extends ApiError {
  constructor(teamId: string) {
    super(
      404,
      `Team not found: ${teamId}`,
      ErrorCode.TEAM_NOT_FOUND,
      { teamId }
    );
    this.name = 'TeamNotFoundError';
  }
}

export class PlayerNotFoundError extends ApiError {
  constructor(playerId: string) {
    super(
      404,
      `Player not found: ${playerId}`,
      ErrorCode.PLAYER_NOT_FOUND,
      { playerId }
    );
    this.name = 'PlayerNotFoundError';
  }
}

export class MatchNotFoundError extends ApiError {
  constructor(matchId: string) {
    super(
      404,
      `Match not found: ${matchId}`,
      ErrorCode.MATCH_NOT_FOUND,
      { matchId }
    );
    this.name = 'MatchNotFoundError';
  }
}

// =============================================================================
// CONFLICT ERRORS (409)
// =============================================================================

export class ConflictError extends ApiError {
  constructor(
    message: string = 'Resource conflict',
    details?: Record<string, any>
  ) {
    super(409, message, ErrorCode.CONFLICT, details);
    this.name = 'ConflictError';
  }
}

export class DuplicateResourceError extends ApiError {
  constructor(resourceType: string, field: string, value: string) {
    super(
      409,
      `${resourceType} with ${field} "${value}" already exists`,
      ErrorCode.DUPLICATE_RESOURCE,
      { resourceType, field, value }
    );
    this.name = 'DuplicateResourceError';
  }
}

// =============================================================================
// RATE LIMIT ERRORS (429)
// =============================================================================

export class RateLimitError extends ApiError {
  public readonly retryAfter: number;

  constructor(
    message: string = 'Too many requests. Please try again later.',
    retryAfter: number = 60
  ) {
    super(429, message, ErrorCode.RATE_LIMIT_EXCEEDED, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class DailyLimitError extends ApiError {
  constructor(limit: number, resetTime: Date) {
    super(
      429,
      `Daily limit of ${limit} requests exceeded. Resets at ${resetTime.toISOString()}`,
      ErrorCode.DAILY_LIMIT_EXCEEDED,
      { limit, resetTime: resetTime.toISOString() }
    );
    this.name = 'DailyLimitError';
  }
}

// =============================================================================
// SERVER ERRORS (500)
// =============================================================================

export class InternalServerError extends ApiError {
  constructor(
    message: string = 'An unexpected error occurred',
    details?: Record<string, any>
  ) {
    super(500, message, ErrorCode.INTERNAL_ERROR, details, false);
    this.name = 'InternalServerError';
  }
}

export class DatabaseError extends ApiError {
  constructor(operation: string) {
    super(
      500,
      `Database error during ${operation}`,
      ErrorCode.DATABASE_ERROR,
      { operation },
      false
    );
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, originalError?: string) {
    super(
      500,
      `External service error: ${service}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      { service, originalError },
      false
    );
    this.name = 'ExternalServiceError';
  }
}

// =============================================================================
// SERVICE UNAVAILABLE (503)
// =============================================================================

export class ServiceUnavailableError extends ApiError {
  constructor(
    message: string = 'Service temporarily unavailable',
    retryAfter?: number
  ) {
    super(503, message, ErrorCode.SERVICE_UNAVAILABLE, { retryAfter });
    this.name = 'ServiceUnavailableError';
  }
}

export class MaintenanceModeError extends ApiError {
  constructor(estimatedEndTime?: Date) {
    super(
      503,
      'System is under maintenance. Please try again later.',
      ErrorCode.MAINTENANCE_MODE,
      { estimatedEndTime: estimatedEndTime?.toISOString() }
    );
    this.name = 'MaintenanceModeError';
  }
}

// =============================================================================
// ERROR RESPONSE HELPER
// =============================================================================

export interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create NextResponse from ApiError
 */
export function errorResponse(
  error: ApiError | Error,
  requestId?: string
): NextResponse<ErrorResponseBody> {
  if (error instanceof ApiError) {
    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        requestId,
      },
    };

    const response = NextResponse.json(body, { status: error.statusCode });
    
    // Add headers for rate limiting
    if (error instanceof RateLimitError) {
      response.headers.set('Retry-After', String(error.retryAfter));
    }
    
    return response;
  }

  // Handle non-ApiError
  const body: ErrorResponseBody = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return NextResponse.json(body, { status: 500 });
}

/**
 * Handle any error and convert to API response
 */
export function handleError(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponseBody> {
  if (error instanceof ApiError) {
    return errorResponse(error, requestId);
  }

  if (error instanceof Error) {
    // Map common error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('not found')) {
      return errorResponse(new NotFoundError('Resource'), requestId);
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return errorResponse(new UnauthorizedError(), requestId);
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return errorResponse(new ForbiddenError(), requestId);
    }
    
    if (message.includes('duplicate') || message.includes('unique constraint')) {
      return errorResponse(new ConflictError('Resource already exists'), requestId);
    }

    return errorResponse(new InternalServerError(error.message), requestId);
  }

  return errorResponse(new InternalServerError(), requestId);
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isOperationalError(error: unknown): boolean {
  return error instanceof ApiError && error.isOperational;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ApiError,
  ErrorCode,
  errorResponse,
  handleError,
};
