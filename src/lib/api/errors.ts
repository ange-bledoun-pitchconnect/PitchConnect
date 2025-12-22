/**
 * 🌟 PITCHCONNECT - Comprehensive API Error Handler
 * Path: /src/lib/api/errors.ts
 *
 * ============================================================================
 * FEATURES
 * ============================================================================
 * ✅ Structured error responses
 * ✅ HTTP status code mapping
 * ✅ User-friendly error messages
 * ✅ Error logging & monitoring
 * ✅ Development vs Production modes
 * ✅ Type-safe error handling
 * ✅ Sentry integration ready
 * ✅ Request tracing support
 *
 * ============================================================================
 */

import { NextResponse } from 'next/server';

/**
 * API Error Types
 */
export enum ApiErrorCode {
  // Authentication (401-403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation (400)
  INVALID_REQUEST = 'INVALID_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',

  // Not Found (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Conflict (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * API Error Class
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public statusCode: number,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Map error code to HTTP status code
 */
function getStatusCode(code: ApiErrorCode): number {
  const statusMap: Record<ApiErrorCode, number> = {
    [ApiErrorCode.UNAUTHORIZED]: 401,
    [ApiErrorCode.FORBIDDEN]: 403,
    [ApiErrorCode.INVALID_CREDENTIALS]: 401,
    [ApiErrorCode.TOKEN_EXPIRED]: 401,
    [ApiErrorCode.SESSION_EXPIRED]: 401,
    [ApiErrorCode.INVALID_REQUEST]: 400,
    [ApiErrorCode.VALIDATION_ERROR]: 400,
    [ApiErrorCode.MISSING_FIELDS]: 400,
    [ApiErrorCode.NOT_FOUND]: 404,
    [ApiErrorCode.RESOURCE_NOT_FOUND]: 404,
    [ApiErrorCode.CONFLICT]: 409,
    [ApiErrorCode.DUPLICATE_RESOURCE]: 409,
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ApiErrorCode.TOO_MANY_REQUESTS]: 429,
    [ApiErrorCode.INTERNAL_ERROR]: 500,
    [ApiErrorCode.DATABASE_ERROR]: 500,
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ApiErrorCode.UNKNOWN_ERROR]: 500,
  };
  return statusMap[code] || 500;
}

/**
 * Log API Error
 */
export function logApiError(error: ApiError | Error, context?: Record<string, any>) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const logData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...(error instanceof ApiError && {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    }),
    message: error.message,
    ...(isDevelopment && { stack: error.stack }),
    ...context,
  };

  // Log to console in development
  if (isDevelopment) {
    console.error('[API Error]', logData);
  }

  // Log to monitoring service (Sentry, LogRocket, etc.)
  if (typeof window === 'undefined' && global.__SENTRY__) {
    global.__SENTRY__.captureException(error, {
      contexts: { api: logData },
    });
  }

  return logData;
}

/**
 * Create API Error Response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, any>,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  const statusCode = getStatusCode(code);

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle API Errors Safely
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  // Handle known API errors
  if (error instanceof ApiError) {
    logApiError(error, context);
    return createErrorResponse(
      error.code,
      error.message,
      error.details,
      context?.requestId
    );
  }

  // Handle Error objects
  if (error instanceof Error) {
    logApiError(error, context);

    // Map common error patterns
    if (error.message.includes('not found')) {
      return createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'The requested resource was not found',
        undefined,
        context?.requestId
      );
    }

    if (error.message.includes('permission')) {
      return createErrorResponse(
        ApiErrorCode.FORBIDDEN,
        'You do not have permission to perform this action',
        undefined,
        context?.requestId
      );
    }

    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return createErrorResponse(
        ApiErrorCode.DUPLICATE_RESOURCE,
        'This resource already exists',
        undefined,
        context?.requestId
      );
    }

    // Default to internal error
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      context?.requestId
    );
  }

  // Handle unknown errors
  logApiError(new Error('Unknown error'), context);
  return createErrorResponse(
    ApiErrorCode.UNKNOWN_ERROR,
    'An unexpected error occurred',
    undefined,
    context?.requestId
  );
}

/**
 * Utility: Check if user has permission
 */
export function checkPermission(
  userPermissions: string[],
  requiredPermission: string
): void {
  if (!userPermissions.includes(requiredPermission)) {
    throw new ApiError(
      ApiErrorCode.FORBIDDEN,
      403,
      `Permission denied. Required: ${requiredPermission}`
    );
  }
}

/**
 * Utility: Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new ApiError(
      ApiErrorCode.MISSING_FIELDS,
      400,
      'Missing required fields',
      { missingFields }
    );
  }
}

/**
 * Utility: Validate field format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      400,
      'Invalid email format'
    );
  }
}

export function validateUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      400,
      'Invalid URL format'
    );
  }
}
