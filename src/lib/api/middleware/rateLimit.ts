/**
 * ============================================================================
 * ⏱️ PITCHCONNECT - Tier-Based Rate Limiting v7.10.1
 * Path: src/lib/api/middleware/rateLimit.ts
 * ============================================================================
 * 
 * Enterprise rate limiting based on AccountTier
 * Redis-ready architecture (in-memory for development)
 * Per-user, per-endpoint, and global limits
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { RateLimitError, DailyLimitError } from '../errors';

// =============================================================================
// TYPES
// =============================================================================

export type AccountTier = 'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';

export interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute: number;
  /** Requests per hour */
  requestsPerHour: number;
  /** Requests per day */
  requestsPerDay: number;
  /** Burst limit (max concurrent) */
  burstLimit: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

// =============================================================================
// TIER CONFIGURATIONS
// =============================================================================

/**
 * Rate limits by account tier
 * Based on best practices for SaaS applications
 */
export const TIER_RATE_LIMITS: Record<AccountTier, RateLimitConfig> = {
  FREE: {
    requestsPerMinute: 20,
    requestsPerHour: 200,
    requestsPerDay: 1000,
    burstLimit: 10,
  },
  PRO: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 30,
  },
  PREMIUM: {
    requestsPerMinute: 120,
    requestsPerHour: 3000,
    requestsPerDay: 50000,
    burstLimit: 50,
  },
  ENTERPRISE: {
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    requestsPerDay: -1, // Unlimited
    burstLimit: 100,
  },
};

/**
 * Endpoint-specific limits (optional overrides)
 */
export const ENDPOINT_LIMITS: Record<string, Partial<RateLimitConfig>> = {
  '/api/ai/predictions': {
    requestsPerMinute: 10,
    requestsPerHour: 50,
  },
  '/api/analytics/market-value': {
    requestsPerMinute: 5,
    requestsPerHour: 30,
  },
  '/api/auth/login': {
    requestsPerMinute: 5,
    requestsPerHour: 20,
  },
  '/api/auth/register': {
    requestsPerMinute: 3,
    requestsPerHour: 10,
  },
  '/api/export': {
    requestsPerMinute: 2,
    requestsPerHour: 10,
    requestsPerDay: 50,
  },
};

// =============================================================================
// IN-MEMORY STORE (Development)
// In production, replace with Redis
// =============================================================================

interface RateLimitStore {
  minute: Map<string, RateLimitEntry>;
  hour: Map<string, RateLimitEntry>;
  day: Map<string, RateLimitEntry>;
}

const rateLimitStore: RateLimitStore = {
  minute: new Map(),
  hour: new Map(),
  day: new Map(),
};

// Cleanup interval (run every minute)
const CLEANUP_INTERVAL = 60 * 1000;
let cleanupTimer: NodeJS.Timer | null = null;

/**
 * Start cleanup timer
 */
function startCleanup(): void {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    
    // Clean minute entries
    for (const [key, entry] of rateLimitStore.minute.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.minute.delete(key);
      }
    }
    
    // Clean hour entries
    for (const [key, entry] of rateLimitStore.hour.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.hour.delete(key);
      }
    }
    
    // Clean day entries
    for (const [key, entry] of rateLimitStore.day.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.day.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

// Start cleanup on module load
startCleanup();

// =============================================================================
// RATE LIMIT KEY GENERATION
// =============================================================================

/**
 * Generate rate limit key
 */
function generateKey(
  identifier: string,
  window: 'minute' | 'hour' | 'day',
  endpoint?: string
): string {
  const parts = ['ratelimit', identifier, window];
  if (endpoint) {
    parts.push(endpoint.replace(/\//g, '_'));
  }
  return parts.join(':');
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) return `user:${userId}`;
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

// =============================================================================
// RATE LIMIT CHECKING
// =============================================================================

/**
 * Check rate limit for a window
 */
function checkWindow(
  store: Map<string, RateLimitEntry>,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);
  
  // No entry exists - first request
  if (!entry) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
      firstRequest: now,
    });
    
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetAt: new Date(now + windowMs),
    };
  }
  
  // Window expired - reset
  if (entry.resetTime < now) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
      firstRequest: now,
    });
    
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetAt: new Date(now + windowMs),
    };
  }
  
  // Window still active - increment
  entry.count++;
  
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: new Date(entry.resetTime),
      retryAfter,
    };
  }
  
  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    limit,
    resetAt: new Date(entry.resetTime),
  };
}

/**
 * Check all rate limit windows
 */
export async function checkRateLimit(
  identifier: string,
  tier: AccountTier = 'FREE',
  endpoint?: string
): Promise<RateLimitResult> {
  const config = TIER_RATE_LIMITS[tier];
  
  // Get endpoint-specific overrides
  let limits = { ...config };
  if (endpoint && ENDPOINT_LIMITS[endpoint]) {
    limits = { ...limits, ...ENDPOINT_LIMITS[endpoint] };
  }
  
  // Check minute limit
  const minuteKey = generateKey(identifier, 'minute', endpoint);
  const minuteResult = checkWindow(
    rateLimitStore.minute,
    minuteKey,
    limits.requestsPerMinute,
    60 * 1000
  );
  
  if (!minuteResult.allowed) {
    logger.warn('Rate limit exceeded (minute)', {
      identifier,
      tier,
      endpoint,
      limit: limits.requestsPerMinute,
    });
    return minuteResult;
  }
  
  // Check hour limit
  const hourKey = generateKey(identifier, 'hour', endpoint);
  const hourResult = checkWindow(
    rateLimitStore.hour,
    hourKey,
    limits.requestsPerHour,
    60 * 60 * 1000
  );
  
  if (!hourResult.allowed) {
    logger.warn('Rate limit exceeded (hour)', {
      identifier,
      tier,
      endpoint,
      limit: limits.requestsPerHour,
    });
    return hourResult;
  }
  
  // Check day limit (skip for unlimited)
  if (limits.requestsPerDay > 0) {
    const dayKey = generateKey(identifier, 'day', endpoint);
    const dayResult = checkWindow(
      rateLimitStore.day,
      dayKey,
      limits.requestsPerDay,
      24 * 60 * 60 * 1000
    );
    
    if (!dayResult.allowed) {
      logger.warn('Rate limit exceeded (day)', {
        identifier,
        tier,
        endpoint,
        limit: limits.requestsPerDay,
      });
      return dayResult;
    }
  }
  
  // Return minute result (most restrictive window for headers)
  return minuteResult;
}

/**
 * Get rate limit headers
 */
export async function getRateLimitHeaders(
  identifier: string,
  tier: AccountTier = 'FREE',
  endpoint?: string
): Promise<RateLimitHeaders> {
  const result = await checkRateLimit(identifier, tier, endpoint);
  
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
  
  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  
  return headers;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

export interface RateLimitMiddlewareOptions {
  /** Get user ID from request (for authenticated rate limiting) */
  getUserId?: (request: NextRequest) => Promise<string | undefined>;
  /** Get user tier from request */
  getUserTier?: (request: NextRequest) => Promise<AccountTier>;
  /** Custom error response */
  onRateLimitExceeded?: (result: RateLimitResult) => NextResponse;
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Get identifier
    const userId = options.getUserId 
      ? await options.getUserId(request)
      : undefined;
    const identifier = getClientIdentifier(request, userId);
    
    // Get tier
    const tier = options.getUserTier
      ? await options.getUserTier(request)
      : 'FREE';
    
    // Get endpoint for specific limits
    const endpoint = new URL(request.url).pathname;
    
    // Check rate limit
    const result = await checkRateLimit(identifier, tier, endpoint);
    
    // Get headers
    const rateLimitHeaders = await getRateLimitHeaders(identifier, tier, endpoint);
    
    if (!result.allowed) {
      logger.warn('Rate limit blocked request', {
        identifier,
        tier,
        endpoint,
        retryAfter: result.retryAfter,
      });
      
      // Custom handler or default
      if (options.onRateLimitExceeded) {
        return options.onRateLimitExceeded(result);
      }
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter,
            resetAt: result.resetAt.toISOString(),
          },
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }
    
    // Execute handler
    const response = await handler(request);
    
    // Add rate limit headers to response
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Reset rate limit for identifier
 */
export function resetRateLimit(identifier: string): void {
  // Clear all windows
  for (const [key] of rateLimitStore.minute.entries()) {
    if (key.includes(identifier)) {
      rateLimitStore.minute.delete(key);
    }
  }
  for (const [key] of rateLimitStore.hour.entries()) {
    if (key.includes(identifier)) {
      rateLimitStore.hour.delete(key);
    }
  }
  for (const [key] of rateLimitStore.day.entries()) {
    if (key.includes(identifier)) {
      rateLimitStore.day.delete(key);
    }
  }
  
  logger.info('Rate limit reset', { identifier });
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  tier: AccountTier = 'FREE'
): {
  minute: { count: number; limit: number; resetAt: Date | null };
  hour: { count: number; limit: number; resetAt: Date | null };
  day: { count: number; limit: number; resetAt: Date | null };
} {
  const config = TIER_RATE_LIMITS[tier];
  
  const minuteKey = generateKey(identifier, 'minute');
  const hourKey = generateKey(identifier, 'hour');
  const dayKey = generateKey(identifier, 'day');
  
  const minuteEntry = rateLimitStore.minute.get(minuteKey);
  const hourEntry = rateLimitStore.hour.get(hourKey);
  const dayEntry = rateLimitStore.day.get(dayKey);
  
  return {
    minute: {
      count: minuteEntry?.count || 0,
      limit: config.requestsPerMinute,
      resetAt: minuteEntry ? new Date(minuteEntry.resetTime) : null,
    },
    hour: {
      count: hourEntry?.count || 0,
      limit: config.requestsPerHour,
      resetAt: hourEntry ? new Date(hourEntry.resetTime) : null,
    },
    day: {
      count: dayEntry?.count || 0,
      limit: config.requestsPerDay,
      resetAt: dayEntry ? new Date(dayEntry.resetTime) : null,
    },
  };
}

/**
 * Check if identifier is currently rate limited
 */
export async function isRateLimited(
  identifier: string,
  tier: AccountTier = 'FREE',
  endpoint?: string
): Promise<boolean> {
  const result = await checkRateLimit(identifier, tier, endpoint);
  return !result.allowed;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  checkRateLimit,
  getRateLimitHeaders,
  withRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  isRateLimited,
  TIER_RATE_LIMITS,
  ENDPOINT_LIMITS,
};
