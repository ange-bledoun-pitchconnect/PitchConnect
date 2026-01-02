/**
 * ============================================================================
 * 🔄 PITCHCONNECT - Async Route Handler v7.10.1
 * Path: src/lib/api/middleware/asyncHandler.ts
 * ============================================================================
 * 
 * Express-like async handler for Next.js API routes
 * Automatic error catching and response formatting
 * Request tracking and logging integration
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, createRequestId, getRequestId } from './logger';
import { checkRateLimit, getRateLimitHeaders } from './rateLimit';
import { handleError, ApiError } from '../errors';

// =============================================================================
// TYPES
// =============================================================================

export type AsyncHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

export interface HandlerOptions {
  /** Enable rate limiting (default: true) */
  rateLimit?: boolean;
  /** User ID extractor for rate limiting */
  getUserId?: (request: NextRequest) => Promise<string | undefined>;
  /** User tier extractor for rate limiting */
  getUserTier?: (request: NextRequest) => Promise<'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE'>;
  /** Log requests (default: true) */
  logging?: boolean;
  /** Custom error handler */
  onError?: (error: unknown, requestId: string) => NextResponse;
}

// =============================================================================
// REQUEST CONTEXT
// =============================================================================

export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  method: string;
  path: string;
}

/**
 * Create request context
 */
function createContext(request: NextRequest): RequestContext {
  return {
    requestId: getRequestId(request),
    startTime: Date.now(),
    userId: request.headers.get('x-user-id') || undefined,
    method: request.method,
    path: new URL(request.url).pathname,
  };
}

// =============================================================================
// ASYNC HANDLER WRAPPER
// =============================================================================

/**
 * Wrap async route handler with error handling
 */
export function asyncHandler(
  handler: AsyncHandler,
  options: HandlerOptions = {}
): AsyncHandler {
  const {
    rateLimit = true,
    getUserId,
    getUserTier,
    logging = true,
    onError,
  } = options;

  return async (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const ctx = createContext(request);

    try {
      // Rate limiting
      if (rateLimit) {
        const userId = getUserId 
          ? await getUserId(request) 
          : ctx.userId;
        const tier = getUserTier
          ? await getUserTier(request)
          : 'FREE';
        
        const identifier = userId || 
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          'unknown';
        
        const rateLimitResult = await checkRateLimit(identifier, tier, ctx.path);
        
        if (!rateLimitResult.allowed) {
          const headers = await getRateLimitHeaders(identifier, tier, ctx.path);
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
                retryAfter: rateLimitResult.retryAfter,
              },
              meta: {
                requestId: ctx.requestId,
                timestamp: new Date().toISOString(),
              },
            },
            { status: 429, headers }
          );
        }
      }

      // Execute handler
      const response = await handler(request, context);

      // Calculate duration
      const duration = Date.now() - ctx.startTime;

      // Log successful request
      if (logging) {
        logger.request(
          ctx.method,
          ctx.path,
          response.status,
          duration,
          {
            requestId: ctx.requestId,
            userId: ctx.userId,
          }
        );
      }

      // Add request ID to response
      response.headers.set('x-request-id', ctx.requestId);

      // Add rate limit headers if enabled
      if (rateLimit) {
        const userId = getUserId 
          ? await getUserId(request) 
          : ctx.userId;
        const tier = getUserTier
          ? await getUserTier(request)
          : 'FREE';
        const identifier = userId || 
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          'unknown';
        
        const headers = await getRateLimitHeaders(identifier, tier, ctx.path);
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - ctx.startTime;

      // Log error
      if (logging) {
        logger.error(`Request failed: ${ctx.method} ${ctx.path}`, {
          requestId: ctx.requestId,
          userId: ctx.userId,
          duration,
          error: error instanceof Error ? error : undefined,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      // Custom error handler
      if (onError) {
        return onError(error, ctx.requestId);
      }

      // Default error handling
      const response = handleError(error, ctx.requestId);
      response.headers.set('x-request-id', ctx.requestId);
      
      return response;
    }
  };
}

/**
 * Wrapper alias for backward compatibility
 */
export const withErrorHandling = asyncHandler;

// =============================================================================
// HTTP METHOD HANDLERS
// =============================================================================

export interface ApiHandlers {
  GET?: AsyncHandler;
  POST?: AsyncHandler;
  PUT?: AsyncHandler;
  PATCH?: AsyncHandler;
  DELETE?: AsyncHandler;
  HEAD?: AsyncHandler;
  OPTIONS?: AsyncHandler;
}

/**
 * Create wrapped handlers for all HTTP methods
 */
export function createApiHandler(
  handlers: ApiHandlers,
  options: HandlerOptions = {}
): ApiHandlers {
  const wrapped: ApiHandlers = {};

  if (handlers.GET) {
    wrapped.GET = asyncHandler(handlers.GET, options);
  }
  if (handlers.POST) {
    wrapped.POST = asyncHandler(handlers.POST, options);
  }
  if (handlers.PUT) {
    wrapped.PUT = asyncHandler(handlers.PUT, options);
  }
  if (handlers.PATCH) {
    wrapped.PATCH = asyncHandler(handlers.PATCH, options);
  }
  if (handlers.DELETE) {
    wrapped.DELETE = asyncHandler(handlers.DELETE, options);
  }
  if (handlers.HEAD) {
    wrapped.HEAD = asyncHandler(handlers.HEAD, options);
  }
  if (handlers.OPTIONS) {
    wrapped.OPTIONS = asyncHandler(handlers.OPTIONS, options);
  }

  return wrapped;
}

// =============================================================================
// CONVENIENCE WRAPPERS
// =============================================================================

/**
 * Create handler with authentication required
 */
export function withAuth(
  handler: AsyncHandler,
  options: HandlerOptions = {}
): AsyncHandler {
  return asyncHandler(async (request, context) => {
    // Check for session (this is a simplified check)
    const sessionCookie = request.cookies.get('next-auth.session-token') ||
                          request.cookies.get('__Secure-next-auth.session-token');
    
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    return handler(request, context);
  }, options);
}

/**
 * Create handler with admin role required
 */
export function withAdminRole(
  handler: AsyncHandler,
  options: HandlerOptions = {}
): AsyncHandler {
  return asyncHandler(async (request, context) => {
    // This would typically check the user's roles
    // For now, this is a placeholder that should be combined with requireAuth
    return handler(request, context);
  }, options);
}

/**
 * Create handler without rate limiting
 */
export function withoutRateLimit(
  handler: AsyncHandler,
  options: Omit<HandlerOptions, 'rateLimit'> = {}
): AsyncHandler {
  return asyncHandler(handler, { ...options, rateLimit: false });
}

/**
 * Create handler without logging
 */
export function withoutLogging(
  handler: AsyncHandler,
  options: Omit<HandlerOptions, 'logging'> = {}
): AsyncHandler {
  return asyncHandler(handler, { ...options, logging: false });
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  asyncHandler,
  withErrorHandling,
  createApiHandler,
  withAuth,
  withAdminRole,
  withoutRateLimit,
  withoutLogging,
  type AsyncHandler,
  type HandlerOptions,
  type RequestContext,
  type ApiHandlers,
};
