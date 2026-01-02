// src/lib/cache.ts
// ============================================================================
// ENTERPRISE REDIS CACHE - PitchConnect Multi-Sport Platform
// ============================================================================
// Advanced caching with:
// - Query caching with automatic invalidation
// - Session caching with sliding expiration
// - Rate limiting (token bucket algorithm)
// - Pub/Sub for real-time updates
// - Multi-sport cache patterns
// - Cache warming strategies
// - Analytics and monitoring
// ============================================================================

import { Redis } from '@upstash/redis';
import { Sport } from '@prisma/client';

// ============================================================================
// REDIS CLIENT INITIALIZATION
// ============================================================================

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Secondary Redis for Pub/Sub (if different instance needed)
const pubsubRedis = process.env.REDIS_PUBSUB_URL
  ? new Redis({
      url: process.env.REDIS_PUBSUB_URL,
      token: process.env.REDIS_PUBSUB_TOKEN!,
    })
  : redis;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE_CONFIG = {
  // TTL values in seconds
  TTL: {
    SHORT: 60,              // 1 minute - frequently changing data
    MEDIUM: 300,            // 5 minutes - standard cache
    LONG: 3600,             // 1 hour - stable data
    VERY_LONG: 86400,       // 24 hours - rarely changing data
    SESSION: 1800,          // 30 minutes - user sessions
    RATE_LIMIT: 60,         // 1 minute - rate limit windows
  },
  
  // Cache key prefixes for organization
  PREFIX: {
    QUERY: 'query:',
    SESSION: 'session:',
    RATE_LIMIT: 'ratelimit:',
    USER: 'user:',
    TEAM: 'team:',
    MATCH: 'match:',
    PLAYER: 'player:',
    LEAGUE: 'league:',
    STATS: 'stats:',
    SPORT: 'sport:',
    LOCK: 'lock:',
    PUBSUB: 'pubsub:',
  },
  
  // Rate limit configurations
  RATE_LIMITS: {
    API_DEFAULT: { requests: 100, window: 60 },      // 100 req/min
    API_AUTHENTICATED: { requests: 300, window: 60 }, // 300 req/min
    API_PREMIUM: { requests: 1000, window: 60 },      // 1000 req/min
    LOGIN_ATTEMPTS: { requests: 5, window: 300 },     // 5 attempts/5min
    PASSWORD_RESET: { requests: 3, window: 3600 },    // 3 req/hour
    SIGNUP: { requests: 3, window: 3600 },            // 3 signups/hour
    EXPORT: { requests: 10, window: 3600 },           // 10 exports/hour
  },
} as const;

// ============================================================================
// CACHE KEY BUILDERS
// ============================================================================

/**
 * Build cache keys with consistent patterns
 */
export const CacheKeys = {
  // User-related keys
  user: (userId: string) => `${CACHE_CONFIG.PREFIX.USER}${userId}`,
  userSession: (sessionId: string) => `${CACHE_CONFIG.PREFIX.SESSION}${sessionId}`,
  userTeams: (userId: string) => `${CACHE_CONFIG.PREFIX.USER}${userId}:teams`,
  userPermissions: (userId: string) => `${CACHE_CONFIG.PREFIX.USER}${userId}:permissions`,
  
  // Team-related keys
  team: (teamId: string) => `${CACHE_CONFIG.PREFIX.TEAM}${teamId}`,
  teamPlayers: (teamId: string) => `${CACHE_CONFIG.PREFIX.TEAM}${teamId}:players`,
  teamMatches: (teamId: string) => `${CACHE_CONFIG.PREFIX.TEAM}${teamId}:matches`,
  teamStats: (teamId: string, season?: string) => 
    `${CACHE_CONFIG.PREFIX.TEAM}${teamId}:stats${season ? `:${season}` : ''}`,
  
  // Match-related keys
  match: (matchId: string) => `${CACHE_CONFIG.PREFIX.MATCH}${matchId}`,
  matchLineup: (matchId: string) => `${CACHE_CONFIG.PREFIX.MATCH}${matchId}:lineup`,
  matchEvents: (matchId: string) => `${CACHE_CONFIG.PREFIX.MATCH}${matchId}:events`,
  matchStats: (matchId: string) => `${CACHE_CONFIG.PREFIX.MATCH}${matchId}:stats`,
  liveMatch: (matchId: string) => `${CACHE_CONFIG.PREFIX.MATCH}live:${matchId}`,
  
  // Player-related keys
  player: (playerId: string) => `${CACHE_CONFIG.PREFIX.PLAYER}${playerId}`,
  playerStats: (playerId: string, season?: string) =>
    `${CACHE_CONFIG.PREFIX.PLAYER}${playerId}:stats${season ? `:${season}` : ''}`,
  playerHistory: (playerId: string) => `${CACHE_CONFIG.PREFIX.PLAYER}${playerId}:history`,
  
  // League-related keys
  league: (leagueId: string) => `${CACHE_CONFIG.PREFIX.LEAGUE}${leagueId}`,
  leagueTable: (leagueId: string, season?: string) =>
    `${CACHE_CONFIG.PREFIX.LEAGUE}${leagueId}:table${season ? `:${season}` : ''}`,
  leagueFixtures: (leagueId: string) => `${CACHE_CONFIG.PREFIX.LEAGUE}${leagueId}:fixtures`,
  
  // Sport-specific keys
  sportConfig: (sport: Sport) => `${CACHE_CONFIG.PREFIX.SPORT}${sport}:config`,
  sportPositions: (sport: Sport) => `${CACHE_CONFIG.PREFIX.SPORT}${sport}:positions`,
  sportStats: (sport: Sport) => `${CACHE_CONFIG.PREFIX.SPORT}${sport}:stats`,
  
  // Query cache keys
  query: (namespace: string, params: Record<string, unknown>) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}:${JSON.stringify(params[k])}`)
      .join('|');
    return `${CACHE_CONFIG.PREFIX.QUERY}${namespace}:${Buffer.from(sortedParams).toString('base64').slice(0, 32)}`;
  },
  
  // Rate limit keys
  rateLimit: (identifier: string, action: string) =>
    `${CACHE_CONFIG.PREFIX.RATE_LIMIT}${action}:${identifier}`,
  
  // Distributed lock keys
  lock: (resource: string) => `${CACHE_CONFIG.PREFIX.LOCK}${resource}`,
};

// ============================================================================
// BASIC CACHE OPERATIONS
// ============================================================================

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error('[Cache] Read error:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function setCachedData<T>(
  key: string,
  value: T,
  ttl: number = CACHE_CONFIG.TTL.MEDIUM
): Promise<boolean> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('[Cache] Write error:', error);
    return false;
  }
}

/**
 * Delete cached data
 */
export async function deleteCachedData(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('[Cache] Delete error:', error);
    return false;
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
    return 0;
  }
}

// ============================================================================
// QUERY CACHING - Automatic caching for database queries
// ============================================================================

/**
 * Cache wrapper for database queries with automatic invalidation
 */
export async function cachedQuery<T>(
  namespace: string,
  params: Record<string, unknown>,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const {
    ttl = CACHE_CONFIG.TTL.MEDIUM,
    tags = [],
    forceRefresh = false,
  } = options;

  const cacheKey = CacheKeys.query(namespace, params);

  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = await getCachedData<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Execute query
  const result = await queryFn();

  // Cache result
  await setCachedData(cacheKey, result, ttl);

  // Store tags for invalidation
  if (tags.length > 0) {
    for (const tag of tags) {
      await redis.sadd(`cache:tags:${tag}`, cacheKey);
    }
  }

  return result;
}

/**
 * Invalidate cache by tags
 */
export async function invalidateByTags(tags: string[]): Promise<number> {
  let invalidated = 0;

  for (const tag of tags) {
    try {
      const keys = await redis.smembers(`cache:tags:${tag}`);
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(`cache:tags:${tag}`);
        invalidated += keys.length;
      }
    } catch (error) {
      console.error(`[Cache] Tag invalidation error for ${tag}:`, error);
    }
  }

  return invalidated;
}

// ============================================================================
// SESSION CACHING - User session management
// ============================================================================

export interface CachedSession {
  userId: string;
  email: string;
  roles: string[];
  teamIds: string[];
  permissions: string[];
  subscriptionTier: string;
  createdAt: string;
  lastActiveAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get user session with sliding expiration
 */
export async function getSession(sessionId: string): Promise<CachedSession | null> {
  const key = CacheKeys.userSession(sessionId);
  const session = await getCachedData<CachedSession>(key);

  if (session) {
    // Update last active time and extend TTL (sliding expiration)
    session.lastActiveAt = new Date().toISOString();
    await setCachedData(key, session, CACHE_CONFIG.TTL.SESSION);
  }

  return session;
}

/**
 * Set user session
 */
export async function setSession(
  sessionId: string,
  session: Omit<CachedSession, 'createdAt' | 'lastActiveAt'>
): Promise<boolean> {
  const key = CacheKeys.userSession(sessionId);
  const now = new Date().toISOString();

  return setCachedData(
    key,
    {
      ...session,
      createdAt: now,
      lastActiveAt: now,
    },
    CACHE_CONFIG.TTL.SESSION
  );
}

/**
 * Delete user session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  return deleteCachedData(CacheKeys.userSession(sessionId));
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<number> {
  return invalidateCache(`${CACHE_CONFIG.PREFIX.SESSION}*:${userId}`);
}

// ============================================================================
// RATE LIMITING - Token Bucket Algorithm
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit using token bucket algorithm
 */
export async function checkRateLimit(
  identifier: string,
  action: keyof typeof CACHE_CONFIG.RATE_LIMITS
): Promise<RateLimitResult> {
  const config = CACHE_CONFIG.RATE_LIMITS[action];
  const key = CacheKeys.rateLimit(identifier, action);
  const now = Date.now();

  try {
    // Get current state
    const [count, timestamp] = await Promise.all([
      redis.get<number>(`${key}:count`),
      redis.get<number>(`${key}:timestamp`),
    ]);

    const currentCount = count || 0;
    const windowStart = timestamp || now;
    const windowEnd = windowStart + config.window * 1000;

    // Check if window has expired
    if (now >= windowEnd) {
      // Reset window
      await Promise.all([
        redis.setex(`${key}:count`, config.window, 1),
        redis.setex(`${key}:timestamp`, config.window, now),
      ]);

      return {
        allowed: true,
        remaining: config.requests - 1,
        resetAt: now + config.window * 1000,
      };
    }

    // Check if limit exceeded
    if (currentCount >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
        retryAfter: Math.ceil((windowEnd - now) / 1000),
      };
    }

    // Increment counter
    await redis.incr(`${key}:count`);

    return {
      allowed: true,
      remaining: config.requests - currentCount - 1,
      resetAt: windowEnd,
    };
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: now + config.window * 1000,
    };
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  identifier: string,
  action: keyof typeof CACHE_CONFIG.RATE_LIMITS
): Promise<void> {
  const key = CacheKeys.rateLimit(identifier, action);
  await Promise.all([
    redis.del(`${key}:count`),
    redis.del(`${key}:timestamp`),
  ]);
}

// ============================================================================
// PUB/SUB - Real-time Updates
// ============================================================================

export type PubSubChannel =
  | `match:${string}:events`
  | `match:${string}:score`
  | `team:${string}:updates`
  | `user:${string}:notifications`
  | `league:${string}:updates`
  | `global:announcements`;

export interface PubSubMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  sender?: string;
}

/**
 * Publish message to channel
 */
export async function publishMessage<T>(
  channel: PubSubChannel,
  message: Omit<PubSubMessage<T>, 'timestamp'>
): Promise<boolean> {
  try {
    const fullMessage: PubSubMessage<T> = {
      ...message,
      timestamp: new Date().toISOString(),
    };
    
    await pubsubRedis.publish(channel, JSON.stringify(fullMessage));
    return true;
  } catch (error) {
    console.error('[PubSub] Publish error:', error);
    return false;
  }
}

/**
 * Publish match event (live scoring)
 */
export async function publishMatchEvent(
  matchId: string,
  event: {
    type: 'GOAL' | 'CARD' | 'SUBSTITUTION' | 'INJURY' | 'VAR' | 'PENALTY' | 'OTHER';
    playerId?: string;
    teamId: string;
    minute: number;
    details?: Record<string, unknown>;
  }
): Promise<boolean> {
  return publishMessage(`match:${matchId}:events`, {
    type: 'MATCH_EVENT',
    payload: event,
  });
}

/**
 * Publish score update
 */
export async function publishScoreUpdate(
  matchId: string,
  score: {
    homeScore: number;
    awayScore: number;
    homeScoreET?: number;
    awayScoreET?: number;
  }
): Promise<boolean> {
  return publishMessage(`match:${matchId}:score`, {
    type: 'SCORE_UPDATE',
    payload: score,
  });
}

/**
 * Publish team update
 */
export async function publishTeamUpdate(
  teamId: string,
  update: {
    type: 'PLAYER_ADDED' | 'PLAYER_REMOVED' | 'LINEUP_CHANGED' | 'ANNOUNCEMENT';
    data: Record<string, unknown>;
  }
): Promise<boolean> {
  return publishMessage(`team:${teamId}:updates`, {
    type: 'TEAM_UPDATE',
    payload: update,
  });
}

/**
 * Publish user notification
 */
export async function publishUserNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    action?: { label: string; url: string };
  }
): Promise<boolean> {
  return publishMessage(`user:${userId}:notifications`, {
    type: 'NOTIFICATION',
    payload: notification,
  });
}

// ============================================================================
// DISTRIBUTED LOCKING
// ============================================================================

/**
 * Acquire distributed lock
 */
export async function acquireLock(
  resource: string,
  ttl: number = 30
): Promise<string | null> {
  const lockId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const key = CacheKeys.lock(resource);

  try {
    const result = await redis.set(key, lockId, { nx: true, ex: ttl });
    return result ? lockId : null;
  } catch (error) {
    console.error('[Lock] Acquire error:', error);
    return null;
  }
}

/**
 * Release distributed lock
 */
export async function releaseLock(
  resource: string,
  lockId: string
): Promise<boolean> {
  const key = CacheKeys.lock(resource);

  try {
    const currentLockId = await redis.get<string>(key);
    if (currentLockId === lockId) {
      await redis.del(key);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Lock] Release error:', error);
    return false;
  }
}

/**
 * Execute with lock
 */
export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  options: { ttl?: number; retries?: number; retryDelay?: number } = {}
): Promise<T | null> {
  const { ttl = 30, retries = 3, retryDelay = 100 } = options;

  for (let i = 0; i < retries; i++) {
    const lockId = await acquireLock(resource, ttl);
    if (lockId) {
      try {
        return await fn();
      } finally {
        await releaseLock(resource, lockId);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
  }

  return null;
}

// ============================================================================
// CACHE WARMING
// ============================================================================

/**
 * Warm cache for a team
 */
export async function warmTeamCache(teamId: string): Promise<void> {
  // This would typically fetch data and cache it
  // Implementation depends on your data access layer
  console.log(`[Cache] Warming cache for team ${teamId}`);
}

/**
 * Warm cache for a match
 */
export async function warmMatchCache(matchId: string): Promise<void> {
  console.log(`[Cache] Warming cache for match ${matchId}`);
}

/**
 * Warm cache for sport configuration
 */
export async function warmSportCache(sport: Sport): Promise<void> {
  const { SPORT_POSITIONS, SPORT_VALIDATION_CONFIG } = await import('./validation');
  
  await Promise.all([
    setCachedData(
      CacheKeys.sportPositions(sport),
      SPORT_POSITIONS[sport],
      CACHE_CONFIG.TTL.VERY_LONG
    ),
    setCachedData(
      CacheKeys.sportConfig(sport),
      SPORT_VALIDATION_CONFIG[sport],
      CACHE_CONFIG.TTL.VERY_LONG
    ),
  ]);
}

// ============================================================================
// CACHE ANALYTICS
// ============================================================================

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memoryUsage?: string;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const [hits, misses, keys] = await Promise.all([
      redis.get<number>('cache:stats:hits') || 0,
      redis.get<number>('cache:stats:misses') || 0,
      redis.dbsize(),
    ]);

    const total = (hits || 0) + (misses || 0);
    const hitRate = total > 0 ? ((hits || 0) / total) * 100 : 0;

    return {
      hits: hits || 0,
      misses: misses || 0,
      hitRate: Math.round(hitRate * 100) / 100,
      keys,
    };
  } catch (error) {
    console.error('[Cache] Stats error:', error);
    return { hits: 0, misses: 0, hitRate: 0, keys: 0 };
  }
}

/**
 * Record cache hit
 */
export async function recordCacheHit(): Promise<void> {
  await redis.incr('cache:stats:hits');
}

/**
 * Record cache miss
 */
export async function recordCacheMiss(): Promise<void> {
  await redis.incr('cache:stats:misses');
}

// ============================================================================
// MULTI-SPORT CACHE HELPERS
// ============================================================================

/**
 * Get sport-specific positions from cache
 */
export async function getCachedSportPositions(sport: Sport): Promise<readonly string[] | null> {
  const cached = await getCachedData<string[]>(CacheKeys.sportPositions(sport));
  if (cached) return cached;

  // Warm cache and return
  await warmSportCache(sport);
  return getCachedData<string[]>(CacheKeys.sportPositions(sport));
}

/**
 * Invalidate all caches for a sport
 */
export async function invalidateSportCache(sport: Sport): Promise<number> {
  return invalidateCache(`${CACHE_CONFIG.PREFIX.SPORT}${sport}`);
}

/**
 * Invalidate all caches for a team
 */
export async function invalidateTeamCache(teamId: string): Promise<number> {
  return invalidateCache(`${CACHE_CONFIG.PREFIX.TEAM}${teamId}`);
}

/**
 * Invalidate all caches for a user
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  return invalidateCache(`${CACHE_CONFIG.PREFIX.USER}${userId}`);
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check Redis connection health
 */
export async function checkCacheHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    await redis.ping();
    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  redis,
  pubsubRedis,
};

export default {
  // Configuration
  CACHE_CONFIG,
  CacheKeys,
  
  // Basic operations
  getCachedData,
  setCachedData,
  deleteCachedData,
  invalidateCache,
  
  // Query caching
  cachedQuery,
  invalidateByTags,
  
  // Session management
  getSession,
  setSession,
  deleteSession,
  deleteUserSessions,
  
  // Rate limiting
  checkRateLimit,
  resetRateLimit,
  
  // Pub/Sub
  publishMessage,
  publishMatchEvent,
  publishScoreUpdate,
  publishTeamUpdate,
  publishUserNotification,
  
  // Locking
  acquireLock,
  releaseLock,
  withLock,
  
  // Cache warming
  warmTeamCache,
  warmMatchCache,
  warmSportCache,
  
  // Analytics
  getCacheStats,
  recordCacheHit,
  recordCacheMiss,
  
  // Multi-sport helpers
  getCachedSportPositions,
  invalidateSportCache,
  invalidateTeamCache,
  invalidateUserCache,
  
  // Health
  checkCacheHealth,
};