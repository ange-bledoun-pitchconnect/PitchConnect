// ============================================================================
// ENHANCED: src/lib/api/responses.ts - Standardized Response Format
// Type-safe, consistent API responses with metadata
// ============================================================================

import { NextResponse } from 'next/server';
import { isApiError, ApiError } from './errors';
import { logger } from './logger';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export type ApiMeta = {
  timestamp: string;
  traceId?: string;
  version: string;
  environment: string;
};

export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  meta: ApiMeta;
};

export type ApiPaginatedResponse<T = any> = ApiSuccessResponse<T> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, any>;
    traceId?: string;
    timestamp: string;
  };
};

export type ApiCreatedResponse<T = any> = ApiSuccessResponse<T> & {
  statusCode: 201;
};

export type ApiListResponse<T = any> = ApiPaginatedResponse<T[]>;

// ============================================================================
// HELPERS
// ============================================================================

function getMeta(traceId?: string): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    traceId,
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
}

function shouldExposeSensitiveData(): boolean {
  return process.env.NODE_ENV === 'development';
}

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/**
 * Send successful response with data
 */
export function success<T = any>(
  data: T,
  status = 200,
  traceId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: getMeta(traceId),
    },
    { status }
  );
}

/**
 * Send paginated response
 */
export function paginated<T = any>(
  data: T[],
  options: {
    page: number;
    limit: number;
    total: number;
  },
  status = 200,
  traceId?: string
): NextResponse<ApiPaginatedResponse<T>> {
  const pages = Math.ceil(options.total / options.limit) || 1;
  const hasMore = options.page < pages;
  const hasPrevious = options.page > 1;

  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: options.total,
        pages,
        hasMore,
        hasPrevious,
      },
      meta: getMeta(traceId),
    },
    { status }
  );
}

/**
 * Send created resource response (201)
 */
export function created<T = any>(
  data: T,
  traceId?: string
): NextResponse<ApiCreatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: getMeta(traceId),
      statusCode: 201,
    },
    { status: 201 }
  );
}

/**
 * Send list response with pagination
 */
export function list<T = any>(
  items: T[],
  total: number,
  page: number = 1,
  limit: number = 25,
  traceId?: string
): NextResponse<ApiListResponse<T>> {
  return paginated(items, { page, limit, total }, 200, traceId);
}

/**
 * Send no content response (204)
 */
export function noContent(): NextResponse<void> {
  return new NextResponse(null, { status: 204 });
}

/**
 * Send accepted response (202) for async operations
 */
export function accepted<T = any>(
  data?: T,
  traceId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data: data || { message: 'Request accepted for processing' },
      meta: getMeta(traceId),
    },
    { status: 202 }
  );
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Send error response
 */
export function errorResponse(
  error: ApiError | Error,
  fallbackStatus = 500,
  traceId?: string
): NextResponse<ApiErrorResponse> {
  const status = isApiError(error) ? error.status : fallbackStatus;
  const message = error.message || 'An unexpected error occurred';
  const code = isApiError(error) ? error.code : 'UNKNOWN_ERROR';
  const details = isApiError(error) ? error.details : undefined;

  // Log error
  logger.error({
    code,
    message,
    status,
    details,
    traceId,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        status,
        ...(details ? { details } : {}),
        traceId,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// ============================================================================
// SPECIAL RESPONSES
// ============================================================================

/**
 * Send redirect response
 */
export function redirect(
  url: string,
  status: 301 | 302 | 307 | 308 = 302
): NextResponse {
  return NextResponse.redirect(url, { status });
}

/**
 * Send file download response
 */
export function file(
  buffer: Buffer,
  filename: string,
  contentType: string = 'application/octet-stream'
): NextResponse {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Send health check response
 */
export function health(
  status: 'UP' | 'DEGRADED' | 'DOWN' = 'UP'
): NextResponse {
  const statusCode = status === 'UP' ? 200 : status === 'DEGRADED' ? 503 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: statusCode }
  );
}

// ============================================================================
// BULK OPERATIONS RESPONSE
// ============================================================================

export type BulkOperationResult<T = any> = {
  success: boolean;
  item: T;
  error?: string;
};

export function bulkOperationResponse<T = any>(
  results: BulkOperationResult<T>[],
  traceId?: string
): NextResponse {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const status = failed.length === 0 ? 200 : failed.length === results.length ? 400 : 207;

  return NextResponse.json(
    {
      success: failed.length === 0,
      data: {
        successful,
        failed,
        summary: {
          total: results.length,
          succeededCount: successful.length,
          failedCount: failed.length,
          successRate: (successful.length / results.length) * 100,
        },
      },
      meta: getMeta(traceId),
    },
    { status }
  );
}
