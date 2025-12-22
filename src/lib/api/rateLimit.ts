/**
 * 🌟 PITCHCONNECT - Rate Limiting Middleware
 * Path: /src/lib/api/rateLimit.ts
 *
 * Prevents API abuse and DDoS attacks
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory rate limit store (for development/small deployments)
 * For production, use Redis
 */
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Clean up expired entries
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create rate limit key from request
 */
function getRateLimitKey(request: NextRequest): string {
  // Use IP address or session ID
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return ip;
}

/**
 * Check rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  options: {
    windowMs?: number; // 60000 = 1 minute
    maxRequests?: number; // requests per window
  } = {}
) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100, // 100 requests per minute
  } = options;

  // Cleanup periodically
  if (Math.random() < 0.1) {
    cleanupStore();
  }

  const key = getRateLimitKey(request);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.resetTime < now) {
    // Window expired, reset
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Window still active
  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.count),
  };
}

/**
 * Rate limit middleware
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: Parameters<typeof checkRateLimit>[1]
) {
  return async (request: NextRequest) => {
    const rateLimit = checkRateLimit(request, options);

    // Create response headers with rate limit info
    const headers = new Headers({
      'X-RateLimit-Limit': String(options?.maxRequests || 100),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    });

    if (!rateLimit.allowed) {
      headers.set('Retry-After', String(rateLimit.retryAfter));
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: rateLimit.retryAfter,
          },
        }),
        {
          status: 429,
          headers,
        }
      );
    }

    // Call handler
    const response = await handler(request);

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', headers.get('X-RateLimit-Limit')!);
    response.headers.set('X-RateLimit-Remaining', headers.get('X-RateLimit-Remaining')!);

    return response;
  };
}
