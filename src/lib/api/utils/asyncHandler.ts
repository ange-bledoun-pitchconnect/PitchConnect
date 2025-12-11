import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '../responses';
import { ApiError } from '../errors';
import { createRequestId, logger } from './logger';
import { checkRateLimit, getRateLimitHeaders } from '../middleware/rateLimit';

export type AsyncHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

export function withErrorHandling(handler: AsyncHandler): AsyncHandler {
  return async (request: NextRequest, context?) => {
    const requestId = createRequestId();
    const startTime = Date.now();
    const userId = (request.headers.get('x-user-id') || 'anonymous');
    
    try {
      // Check rate limiting
      await checkRateLimit(userId);

      // Execute handler
      const response = await handler(request, context);

      // Log successful request
      const duration = Date.now() - startTime;
      logger.info(`${request.method} ${request.nextUrl.pathname}`, {
        requestId,
        userId,
        statusCode: response.status,
        duration,
      });

      // Add rate limit headers
      const rateLimitHeaders = await getRateLimitHeaders(userId);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        logger.warn(`API Error: ${error.message}`, {
          requestId,
          userId,
          code: error.code,
          statusCode: error.statusCode,
          duration,
        });
        return errorResponse(error);
      }

      if (error instanceof Error) {
        logger.error(`Unexpected error: ${error.message}`, {
          requestId,
          userId,
          duration,
          error,
        });
        return errorResponse(
          new ApiError(500, 'An unexpected error occurred', 'INTERNAL_SERVER_ERROR'),
          500
        );
      }

      logger.error('Unknown error occurred', { requestId, userId, duration });
      return errorResponse(
        new ApiError(500, 'An unexpected error occurred', 'INTERNAL_SERVER_ERROR'),
        500
      );
    }
  };
}
