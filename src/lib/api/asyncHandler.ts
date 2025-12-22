/**
 * 🌟 PITCHCONNECT - Async Route Handler Wrapper
 * Path: /src/lib/api/asyncHandler.ts
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 * Express-like async handler for Next.js API routes
 * Automatically catches unhandled errors and returns proper responses
 *
 * ============================================================================
 * PROBLEM IT SOLVES
 * ============================================================================
 * WITHOUT this: Unhandled Promise rejections crash the server silently
 * WITH this: All errors are caught, logged, and properly responded to
 *
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from './errors';

/**
 * Type for async route handler
 */
export type AsyncRouteHandler = (
  request: NextRequest
) => Promise<NextResponse>;

/**
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(handler: AsyncRouteHandler): AsyncRouteHandler {
  return async (request: NextRequest) => {
    try {
      // Generate request ID for tracking
      const requestId = crypto.randomUUID?.() || Date.now().toString();

      // Attach request ID to headers for logging
      const response = await handler(request);

      return response;
    } catch (error) {
      // Log context
      const context = {
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString(),
      };

      // Handle error and return response
      return handleApiError(error, context);
    }
  };
}

/**
 * Higher-order function pattern for different HTTP methods
 */
export function createApiHandler(handlers: {
  GET?: AsyncRouteHandler;
  POST?: AsyncRouteHandler;
  PUT?: AsyncRouteHandler;
  PATCH?: AsyncRouteHandler;
  DELETE?: AsyncRouteHandler;
}) {
  return {
    GET: handlers.GET ? asyncHandler(handlers.GET) : undefined,
    POST: handlers.POST ? asyncHandler(handlers.POST) : undefined,
    PUT: handlers.PUT ? asyncHandler(handlers.PUT) : undefined,
    PATCH: handlers.PATCH ? asyncHandler(handlers.PATCH) : undefined,
    DELETE: handlers.DELETE ? asyncHandler(handlers.DELETE) : undefined,
  };
}

/**
 * Example usage:
 * 
 * export const { GET, POST } = createApiHandler({
 *   GET: asyncHandler(async (request) => {
 *     const data = await fetchData();
 *     return ApiResponse.ok(data);
 *   }),
 *   POST: asyncHandler(async (request) => {
 *     const body = await request.json();
 *     validateRequiredFields(body, ['name', 'email']);
 *     const result = await createItem(body);
 *     return ApiResponse.created(result);
 *   }),
 * });
 */
