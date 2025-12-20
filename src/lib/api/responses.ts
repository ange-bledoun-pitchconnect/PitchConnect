/**
 * 🌟 PITCHCONNECT - API Response Handler
 * Path: /src/lib/api/responses.ts
 */

import { logger } from '@/lib/logging';

type StatusCode =
  | 200 | 201 | 202 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ApiSuccessResponse<T> {
  success: true;
  statusCode: StatusCode;
  data: T;
  message?: string;
  meta: ApiResponseMeta;
  pagination?: PaginationMeta;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  statusCode: StatusCode;
  error: {
    message: string;
    code: string;
    details?: ApiErrorDetail[];
  };
  meta: ApiResponseMeta;
  timestamp: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

const API_VERSION = '1.0.0';

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

function createMeta(requestId?: string): ApiResponseMeta {
  return {
    timestamp: getCurrentTimestamp(),
    requestId: requestId || generateRequestId(),
    version: API_VERSION,
  };
}

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: StatusCode = 200,
  requestId?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    statusCode,
    data,
    message: message || getStatusMessage(statusCode),
    meta: createMeta(requestId),
    timestamp: getCurrentTimestamp(),
  };
}

export function createdResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    statusCode: 201,
    data,
    message: message || 'Resource created successfully',
    meta: createMeta(requestId),
    timestamp: getCurrentTimestamp(),
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number,
  message?: string,
  requestId?: string
): ApiSuccessResponse<T[]> & { pagination: PaginationMeta } {
  const totalPages = Math.ceil(total / perPage);
  const hasMore = page < totalPages;

  return {
    success: true,
    statusCode: 200,
    data,
    message: message || 'Data retrieved successfully',
    meta: createMeta(requestId),
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasMore,
    },
    timestamp: getCurrentTimestamp(),
  };
}

export function noContentResponse(requestId?: string): ApiSuccessResponse<null> {
  return {
    success: true,
    statusCode: 204,
    data: null,
    message: 'No content',
    meta: createMeta(requestId),
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export function errorResponse(
  message: string,
  statusCode: StatusCode = 500,
  code: string = 'INTERNAL_ERROR',
  details?: ApiErrorDetail[],
  requestId?: string
): ApiErrorResponse {
  logger.error(
    {
      statusCode,
      code,
      message,
      details,
    },
    'API Error'
  );

  return {
    success: false,
    statusCode,
    error: {
      message,
      code,
      details,
    },
    meta: createMeta(requestId),
    timestamp: getCurrentTimestamp(),
  };
}

export function badRequestResponse(
  message: string = 'Bad request',
  details?: ApiErrorDetail[],
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 400, 'BAD_REQUEST', details, requestId);
}

export function unauthorizedResponse(
  message: string = 'Authentication required',
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 401, 'UNAUTHORIZED', undefined, requestId);
}

export function forbiddenResponse(
  message: string = 'Access denied',
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 403, 'FORBIDDEN', undefined, requestId);
}

export function notFoundResponse(
  message: string = 'Resource not found',
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 404, 'NOT_FOUND', undefined, requestId);
}

export function conflictResponse(
  message: string = 'Resource conflict',
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 409, 'CONFLICT', undefined, requestId);
}

export function validationErrorResponse(
  message: string = 'Validation failed',
  details?: ApiErrorDetail[],
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 422, 'VALIDATION_ERROR', details, requestId);
}

export function rateLimitResponse(
  message: string = 'Too many requests',
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 429, 'RATE_LIMIT_EXCEEDED', undefined, requestId);
}

export function serverErrorResponse(
  message: string = 'Internal server error',
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 500, 'INTERNAL_SERVER_ERROR', undefined, requestId);
}

export function serviceUnavailableResponse(
  message: string = 'Service unavailable',
  requestId?: string
): ApiErrorResponse {
  return errorResponse(message, 503, 'SERVICE_UNAVAILABLE', undefined, requestId);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getStatusMessage(statusCode: StatusCode): string {
  const messages: Record<StatusCode, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return messages[statusCode] || 'Unknown';
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: ApiResponse<any>): response is ApiErrorResponse {
  return response.success === false;
}

export function logApiResponse<T>(
  response: ApiResponse<T>,
  method?: string,
  path?: string,
  duration?: number
): void {
  if (isSuccessResponse(response)) {
    logger.info(
      {
        statusCode: response.statusCode,
        method,
        path,
        duration,
        requestId: response.meta.requestId,
      },
      'API Success'
    );
  } else {
    logger.error(
      {
        statusCode: response.statusCode,
        errorCode: response.error.code,
        message: response.error.message,
        method,
        path,
        duration,
        requestId: response.meta.requestId,
      },
      'API Error'
    );
  }
}

// ============================================================================
// CLASS-BASED API RESPONSE
// ============================================================================

export class ApiResponse<T = any> {
  success: boolean;
  statusCode: StatusCode;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: ApiErrorDetail[];
  };
  message?: string;
  meta: ApiResponseMeta;
  timestamp: string;
  pagination?: PaginationMeta;

  constructor(
    success: boolean,
    statusCode: StatusCode,
    data?: T,
    message?: string,
    error?: ApiErrorResponse['error'],
    requestId?: string
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.error = error;
    this.meta = createMeta(requestId);
    this.timestamp = getCurrentTimestamp();
  }

  static success<T>(
    data: T,
    message?: string,
    statusCode: StatusCode = 200,
    requestId?: string
  ): ApiResponse<T> {
    return new ApiResponse(true, statusCode, data, message || getStatusMessage(statusCode), undefined, requestId);
  }

  static error(
    message: string,
    statusCode: StatusCode = 500,
    code: string = 'INTERNAL_ERROR',
    details?: ApiErrorDetail[],
    requestId?: string
  ): ApiResponse {
    return new ApiResponse(
      false,
      statusCode,
      undefined,
      undefined,
      { message, code, details },
      requestId
    );
  }

  setPagination(page: number, perPage: number, total: number): this {
    const totalPages = Math.ceil(total / perPage);
    this.pagination = {
      page,
      perPage,
      total,
      totalPages,
      hasMore: page < totalPages,
    };
    return this;
  }

  toJSON() {
    const response: any = {
      success: this.success,
      statusCode: this.statusCode,
      meta: this.meta,
      timestamp: this.timestamp,
    };

    if (this.success) {
      response.data = this.data;
      if (this.message) response.message = this.message;
      if (this.pagination) response.pagination = this.pagination;
    } else {
      response.error = this.error;
    }

    return response;
  }
}

export type {
  ApiResponse as IApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiErrorDetail,
  ApiResponseMeta,
  PaginationMeta,
  StatusCode,
};
