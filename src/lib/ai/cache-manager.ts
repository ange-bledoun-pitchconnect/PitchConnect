/**
 * ============================================================================
 * 🗃️ PITCHCONNECT AI - PREDICTION CACHE MANAGER v7.10.1
 * ============================================================================
 * Enterprise caching for AI predictions with TTL, LRU eviction, and Redis-ready
 * Supports pre-computed predictions with background refresh
 * ============================================================================
 */

import type {
  CachedPrediction,
  CacheConfig,
  MatchPrediction,
  PlayerPrediction,
  TeamPrediction,
  TeamRecommendation,
  Sport,
  PredictionType,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  matchPredictionTTL: 60 * 60 * 4,      // 4 hours
  playerPredictionTTL: 60 * 60 * 6,     // 6 hours
  teamPredictionTTL: 60 * 60 * 12,      // 12 hours
  recommendationTTL: 60 * 60 * 24,      // 24 hours
  maxCacheSize: 10000,                  // entries per store
  cleanupInterval: 60 * 60,             // 1 hour
};

// Dynamic TTL based on proximity to match
export const DYNAMIC_MATCH_TTL = {
  DAYS_BEFORE_7: 60 * 60 * 24,          // 24 hours
  DAYS_BEFORE_3: 60 * 60 * 12,          // 12 hours
  DAYS_BEFORE_1: 60 * 60 * 4,           // 4 hours
  HOURS_BEFORE_6: 60 * 60 * 1,          // 1 hour
  HOURS_BEFORE_1: 60 * 15,              // 15 minutes
  LIVE: 60 * 5,                         // 5 minutes (live updates)
};

// =============================================================================
// CACHE STORE (In-Memory - Production should use Redis)
// =============================================================================

interface CacheStore {
  matches: Map<string, CachedPrediction<MatchPrediction>>;
  players: Map<string, CachedPrediction<PlayerPrediction>>;
  teams: Map<string, CachedPrediction<TeamPrediction>>;
  recommendations: Map<string, CachedPrediction<TeamRecommendation[]>>;
}

const cacheStore: CacheStore = {
  matches: new Map(),
  players: new Map(),
  teams: new Map(),
  recommendations: new Map(),
};

// =============================================================================
// CACHE STATISTICS
// =============================================================================

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  lastCleanup: Date;
  totalSize: number;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  lastCleanup: new Date(),
  totalSize: 0,
};

// =============================================================================
// CACHE KEY GENERATORS
// =============================================================================

/**
 * Generate cache key for match prediction
 */
export function generateMatchCacheKey(matchId: string, sport: Sport): string {
  return `match:${sport}:${matchId}`;
}

/**
 * Generate cache key for player prediction
 */
export function generatePlayerCacheKey(
  playerId: string,
  sport: Sport,
  predictionType?: PredictionType
): string {
  const typeKey = predictionType ? `:${predictionType}` : '';
  return `player:${sport}:${playerId}${typeKey}`;
}

/**
 * Generate cache key for team prediction
 */
export function generateTeamCacheKey(
  teamId: string,
  sport: Sport,
  competitionId?: string
): string {
  const compKey = competitionId ? `:${competitionId}` : '';
  return `team:${sport}:${teamId}${compKey}`;
}

/**
 * Generate cache key for recommendations
 */
export function generateRecommendationCacheKey(
  teamId: string,
  category: string,
  context?: string
): string {
  const ctxKey = context ? `:${context}` : '';
  return `rec:${teamId}:${category}${ctxKey}`;
}

/**
 * Parse cache key to extract components
 */
export function parseCacheKey(cacheKey: string): {
  type: 'match' | 'player' | 'team' | 'rec';
  sport?: Sport;
  entityId: string;
  extra?: string;
} | null {
  const parts = cacheKey.split(':');
  if (parts.length < 3) return null;
  
  return {
    type: parts[0] as 'match' | 'player' | 'team' | 'rec',
    sport: parts[1] as Sport,
    entityId: parts[2],
    extra: parts[3],
  };
}

// =============================================================================
// MATCH PREDICTION CACHE
// =============================================================================

/**
 * Get cached match prediction
 */
export function getCachedMatchPrediction(
  cacheKey: string
): CachedPrediction<MatchPrediction> | null {
  const cached = cacheStore.matches.get(cacheKey);
  
  if (!cached) {
    cacheStats.misses++;
    return null;
  }
  
  // Check expiration
  if (new Date() > cached.expiresAt) {
    cacheStore.matches.delete(cacheKey);
    cacheStats.misses++;
    return null;
  }
  
  // Update access tracking
  cached.hitCount++;
  cached.lastAccessed = new Date();
  cacheStats.hits++;
  
  return cached;
}

/**
 * Set cached match prediction with dynamic TTL
 */
export function setCachedMatchPrediction(
  cacheKey: string,
  prediction: MatchPrediction,
  matchDateTime?: Date,
  ttlSeconds?: number
): void {
  // Calculate dynamic TTL based on match proximity
  let ttl = ttlSeconds ?? DEFAULT_CACHE_CONFIG.matchPredictionTTL;
  
  if (matchDateTime) {
    const hoursUntilMatch = (matchDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (hoursUntilMatch <= 0) {
      ttl = DYNAMIC_MATCH_TTL.LIVE;
    } else if (hoursUntilMatch <= 1) {
      ttl = DYNAMIC_MATCH_TTL.HOURS_BEFORE_1;
    } else if (hoursUntilMatch <= 6) {
      ttl = DYNAMIC_MATCH_TTL.HOURS_BEFORE_6;
    } else if (hoursUntilMatch <= 24) {
      ttl = DYNAMIC_MATCH_TTL.DAYS_BEFORE_1;
    } else if (hoursUntilMatch <= 72) {
      ttl = DYNAMIC_MATCH_TTL.DAYS_BEFORE_3;
    }
  }
  
  const cached: CachedPrediction<MatchPrediction> = {
    data: prediction,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + ttl * 1000),
    cacheKey,
    hitCount: 0,
    lastAccessed: new Date(),
  };
  
  // Enforce max cache size with LRU eviction
  if (cacheStore.matches.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictLRUEntries(cacheStore.matches);
  }
  
  cacheStore.matches.set(cacheKey, cached);
  updateCacheSize();
}

// =============================================================================
// PLAYER PREDICTION CACHE
// =============================================================================

/**
 * Get cached player prediction
 */
export function getCachedPlayerPrediction(
  cacheKey: string
): CachedPrediction<PlayerPrediction> | null {
  const cached = cacheStore.players.get(cacheKey);
  
  if (!cached) {
    cacheStats.misses++;
    return null;
  }
  
  if (new Date() > cached.expiresAt) {
    cacheStore.players.delete(cacheKey);
    cacheStats.misses++;
    return null;
  }
  
  cached.hitCount++;
  cached.lastAccessed = new Date();
  cacheStats.hits++;
  
  return cached;
}

/**
 * Set cached player prediction
 */
export function setCachedPlayerPrediction(
  cacheKey: string,
  prediction: PlayerPrediction,
  ttlSeconds: number = DEFAULT_CACHE_CONFIG.playerPredictionTTL
): void {
  const cached: CachedPrediction<PlayerPrediction> = {
    data: prediction,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    cacheKey,
    hitCount: 0,
    lastAccessed: new Date(),
  };
  
  if (cacheStore.players.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictLRUEntries(cacheStore.players);
  }
  
  cacheStore.players.set(cacheKey, cached);
  updateCacheSize();
}

// =============================================================================
// TEAM PREDICTION CACHE
// =============================================================================

/**
 * Get cached team prediction
 */
export function getCachedTeamPrediction(
  cacheKey: string
): CachedPrediction<TeamPrediction> | null {
  const cached = cacheStore.teams.get(cacheKey);
  
  if (!cached) {
    cacheStats.misses++;
    return null;
  }
  
  if (new Date() > cached.expiresAt) {
    cacheStore.teams.delete(cacheKey);
    cacheStats.misses++;
    return null;
  }
  
  cached.hitCount++;
  cached.lastAccessed = new Date();
  cacheStats.hits++;
  
  return cached;
}

/**
 * Set cached team prediction
 */
export function setCachedTeamPrediction(
  cacheKey: string,
  prediction: TeamPrediction,
  ttlSeconds: number = DEFAULT_CACHE_CONFIG.teamPredictionTTL
): void {
  const cached: CachedPrediction<TeamPrediction> = {
    data: prediction,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    cacheKey,
    hitCount: 0,
    lastAccessed: new Date(),
  };
  
  if (cacheStore.teams.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictLRUEntries(cacheStore.teams);
  }
  
  cacheStore.teams.set(cacheKey, cached);
  updateCacheSize();
}

// =============================================================================
// RECOMMENDATIONS CACHE
// =============================================================================

/**
 * Get cached recommendations
 */
export function getCachedRecommendations(
  cacheKey: string
): CachedPrediction<TeamRecommendation[]> | null {
  const cached = cacheStore.recommendations.get(cacheKey);
  
  if (!cached) {
    cacheStats.misses++;
    return null;
  }
  
  if (new Date() > cached.expiresAt) {
    cacheStore.recommendations.delete(cacheKey);
    cacheStats.misses++;
    return null;
  }
  
  cached.hitCount++;
  cached.lastAccessed = new Date();
  cacheStats.hits++;
  
  return cached;
}

/**
 * Set cached recommendations
 */
export function setCachedRecommendations(
  cacheKey: string,
  recommendations: TeamRecommendation[],
  ttlSeconds: number = DEFAULT_CACHE_CONFIG.recommendationTTL
): void {
  const cached: CachedPrediction<TeamRecommendation[]> = {
    data: recommendations,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    cacheKey,
    hitCount: 0,
    lastAccessed: new Date(),
  };
  
  if (cacheStore.recommendations.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictLRUEntries(cacheStore.recommendations);
  }
  
  cacheStore.recommendations.set(cacheKey, cached);
  updateCacheSize();
}

// =============================================================================
// CACHE INVALIDATION
// =============================================================================

/**
 * Invalidate specific cache entry
 */
export function invalidateCacheEntry(
  type: 'match' | 'player' | 'team' | 'recommendation',
  cacheKey: string
): boolean {
  switch (type) {
    case 'match':
      return cacheStore.matches.delete(cacheKey);
    case 'player':
      return cacheStore.players.delete(cacheKey);
    case 'team':
      return cacheStore.teams.delete(cacheKey);
    case 'recommendation':
      return cacheStore.recommendations.delete(cacheKey);
    default:
      return false;
  }
}

/**
 * Invalidate all cache entries for an entity
 */
export function invalidateEntityCache(entityId: string): number {
  let invalidated = 0;
  
  // Scan all stores for matching entity
  for (const [key] of cacheStore.matches) {
    if (key.includes(entityId)) {
      cacheStore.matches.delete(key);
      invalidated++;
    }
  }
  
  for (const [key] of cacheStore.players) {
    if (key.includes(entityId)) {
      cacheStore.players.delete(key);
      invalidated++;
    }
  }
  
  for (const [key] of cacheStore.teams) {
    if (key.includes(entityId)) {
      cacheStore.teams.delete(key);
      invalidated++;
    }
  }
  
  for (const [key] of cacheStore.recommendations) {
    if (key.includes(entityId)) {
      cacheStore.recommendations.delete(key);
      invalidated++;
    }
  }
  
  updateCacheSize();
  return invalidated;
}

/**
 * Invalidate cache entries by sport
 */
export function invalidateSportCache(sport: Sport): number {
  let invalidated = 0;
  const sportKey = `:${sport}:`;
  
  for (const [key] of cacheStore.matches) {
    if (key.includes(sportKey)) {
      cacheStore.matches.delete(key);
      invalidated++;
    }
  }
  
  for (const [key] of cacheStore.players) {
    if (key.includes(sportKey)) {
      cacheStore.players.delete(key);
      invalidated++;
    }
  }
  
  for (const [key] of cacheStore.teams) {
    if (key.includes(sportKey)) {
      cacheStore.teams.delete(key);
      invalidated++;
    }
  }
  
  updateCacheSize();
  return invalidated;
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cacheStore.matches.clear();
  cacheStore.players.clear();
  cacheStore.teams.clear();
  cacheStore.recommendations.clear();
  
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.evictions = 0;
  cacheStats.totalSize = 0;
}

// =============================================================================
// CACHE EVICTION & CLEANUP
// =============================================================================

/**
 * Evict entries using LRU (Least Recently Used) strategy
 */
function evictLRUEntries<T>(
  map: Map<string, CachedPrediction<T>>,
  count: number = 100
): void {
  const entries = Array.from(map.entries());
  
  // Sort by lastAccessed (oldest first)
  entries.sort((a, b) => {
    const aTime = a[1].lastAccessed?.getTime() ?? a[1].cachedAt.getTime();
    const bTime = b[1].lastAccessed?.getTime() ?? b[1].cachedAt.getTime();
    return aTime - bTime;
  });
  
  // Remove oldest entries
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    map.delete(entries[i][0]);
    cacheStats.evictions++;
  }
}

/**
 * Run cache cleanup - remove expired entries
 */
export function runCacheCleanup(): number {
  const now = new Date();
  let cleaned = 0;
  
  for (const [key, cached] of cacheStore.matches) {
    if (now > cached.expiresAt) {
      cacheStore.matches.delete(key);
      cleaned++;
    }
  }
  
  for (const [key, cached] of cacheStore.players) {
    if (now > cached.expiresAt) {
      cacheStore.players.delete(key);
      cleaned++;
    }
  }
  
  for (const [key, cached] of cacheStore.teams) {
    if (now > cached.expiresAt) {
      cacheStore.teams.delete(key);
      cleaned++;
    }
  }
  
  for (const [key, cached] of cacheStore.recommendations) {
    if (now > cached.expiresAt) {
      cacheStore.recommendations.delete(key);
      cleaned++;
    }
  }
  
  cacheStats.lastCleanup = now;
  updateCacheSize();
  
  return cleaned;
}

/**
 * Update total cache size
 */
function updateCacheSize(): void {
  cacheStats.totalSize =
    cacheStore.matches.size +
    cacheStore.players.size +
    cacheStore.teams.size +
    cacheStore.recommendations.size;
}

// =============================================================================
// CACHE STATISTICS & MONITORING
// =============================================================================

/**
 * Get comprehensive cache statistics
 */
export function getCacheStats(): {
  stats: CacheStats;
  sizes: {
    matches: number;
    players: number;
    teams: number;
    recommendations: number;
    total: number;
  };
  hitRate: number;
  config: CacheConfig;
} {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0;
  
  return {
    stats: { ...cacheStats },
    sizes: {
      matches: cacheStore.matches.size,
      players: cacheStore.players.size,
      teams: cacheStore.teams.size,
      recommendations: cacheStore.recommendations.size,
      total: cacheStats.totalSize,
    },
    hitRate: Math.round(hitRate * 100) / 100,
    config: { ...DEFAULT_CACHE_CONFIG },
  };
}

/**
 * Get cache health status
 */
export function getCacheHealth(): {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const stats = getCacheStats();
  
  // Check hit rate
  if (stats.hitRate < 50 && (cacheStats.hits + cacheStats.misses) > 100) {
    issues.push(`Low cache hit rate: ${stats.hitRate}%`);
    recommendations.push('Consider pre-warming cache for popular entities');
  }
  
  // Check eviction rate
  const evictionRate = cacheStats.evictions / Math.max(stats.sizes.total, 1);
  if (evictionRate > 0.2) {
    issues.push('High eviction rate - cache may be undersized');
    recommendations.push('Consider increasing maxCacheSize');
  }
  
  // Check store balance
  const maxStore = Math.max(
    stats.sizes.matches,
    stats.sizes.players,
    stats.sizes.teams,
    stats.sizes.recommendations
  );
  const minStore = Math.min(
    stats.sizes.matches,
    stats.sizes.players,
    stats.sizes.teams,
    stats.sizes.recommendations
  );
  if (maxStore > minStore * 10 && minStore > 0) {
    issues.push('Unbalanced cache usage across stores');
  }
  
  // Determine status
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (issues.length > 2 || stats.hitRate < 30) {
    status = 'CRITICAL';
  } else if (issues.length > 0) {
    status = 'WARNING';
  }
  
  return { status, issues, recommendations };
}

// =============================================================================
// BACKGROUND REFRESH SUPPORT
// =============================================================================

/**
 * Get entries expiring soon (for background refresh)
 */
export function getExpiringSoonEntries(
  type: 'match' | 'player' | 'team' | 'recommendation',
  minutesBeforeExpiry: number = 30
): string[] {
  const threshold = new Date(Date.now() + minutesBeforeExpiry * 60 * 1000);
  const now = new Date();
  const expiring: string[] = [];
  
  let store: Map<string, CachedPrediction<any>>;
  
  switch (type) {
    case 'match':
      store = cacheStore.matches;
      break;
    case 'player':
      store = cacheStore.players;
      break;
    case 'team':
      store = cacheStore.teams;
      break;
    case 'recommendation':
      store = cacheStore.recommendations;
      break;
    default:
      return [];
  }
  
  for (const [key, cached] of store) {
    if (cached.expiresAt <= threshold && cached.expiresAt > now) {
      expiring.push(key);
    }
  }
  
  return expiring;
}

/**
 * Get most frequently accessed entries (for prioritized refresh)
 */
export function getHotEntries(
  type: 'match' | 'player' | 'team' | 'recommendation',
  limit: number = 50
): { key: string; hits: number }[] {
  let store: Map<string, CachedPrediction<any>>;
  
  switch (type) {
    case 'match':
      store = cacheStore.matches;
      break;
    case 'player':
      store = cacheStore.players;
      break;
    case 'team':
      store = cacheStore.teams;
      break;
    case 'recommendation':
      store = cacheStore.recommendations;
      break;
    default:
      return [];
  }
  
  const entries = Array.from(store.entries())
    .map(([key, cached]) => ({ key, hits: cached.hitCount }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit);
  
  return entries;
}

// =============================================================================
// CACHE WARMING
// =============================================================================

/**
 * Pre-warm cache with predictions for upcoming matches
 */
export async function warmMatchCache(
  matchIds: string[],
  sport: Sport,
  generatePrediction: (matchId: string, sport: Sport) => Promise<MatchPrediction>
): Promise<{ warmed: number; failed: number }> {
  let warmed = 0;
  let failed = 0;
  
  for (const matchId of matchIds) {
    const cacheKey = generateMatchCacheKey(matchId, sport);
    
    // Skip if already cached
    if (getCachedMatchPrediction(cacheKey)) {
      continue;
    }
    
    try {
      const prediction = await generatePrediction(matchId, sport);
      setCachedMatchPrediction(cacheKey, prediction);
      warmed++;
    } catch {
      failed++;
    }
  }
  
  return { warmed, failed };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DEFAULT_CACHE_CONFIG,
  DYNAMIC_MATCH_TTL,
  cacheStats,
};
