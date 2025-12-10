// ============================================================================
// src/lib/api/responses.ts - Standardised Response Format
// ============================================================================

import { NextResponse } from 'next/server';
import { isApiError, ApiError } from './errors';

export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  timestamp: string;
};

export type ApiPaginatedResponse<T = any> = ApiSuccessResponse<T> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: {
    message: string;
    code?: string;
    status: number;
    details?: Record<string, any>;
    timestamp: string;
  };
};

const getTimestamp = () => new Date().toISOString();

/**
 * Send successful response with data
 */
export function success<T = any>(
  data: T,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: getTimestamp(),
    },
    { status }
  );
}

/**
 * Send paginated response
 */
export function paginated<T = any>(
  data: T,
  options: {
    page: number;
    limit: number;
    total: number;
  },
  status = 200
): NextResponse<ApiPaginatedResponse<T>> {
  const pages = Math.ceil(options.total / options.limit) || 1;
  const hasMore = options.page < pages;

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
      },
      timestamp: getTimestamp(),
    },
    { status }
  );
}

/**
 * Send error response
 */
export function errorResponse(
  error: ApiError | Error,
  fallbackStatus = 500
): NextResponse<ApiErrorResponse> {
  const status = isApiError(error) ? error.status : fallbackStatus;
  const message = error.message || 'An unexpected error occurred';
  const code = isApiError(error) ? error.code : 'UNKNOWN_ERROR';
  const details = isApiError(error) ? error.details : undefined;

  console.error(`[API Error ${status}]`, {
    message,
    code,
    details,
    stack: error.stack,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        status,
        ...(details ? { details } : {}),
        timestamp: getTimestamp(),
      },
    },
    { status }
  );
}

/**
 * Created resource response
 */
export function created<T = any>(
  data: T
): NextResponse<ApiSuccessResponse<T>> {
  return success(data, 201);
}

/**
 * No content response
 */
export function noContent(): NextResponse<void> {
  return new NextResponse(null, { status: 204 });
}
