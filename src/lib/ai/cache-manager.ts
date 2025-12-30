// ============================================================================
// src/lib/ai/cache-manager.ts
// 🗃️ PitchConnect Enterprise AI - Prediction Cache Manager
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// STRATEGY: Pre-computed predictions with time-based invalidation
// ============================================================================

import type {
  CachedPrediction,
  CacheConfig,
  MatchPrediction,
  PlayerPrediction,
  TeamPrediction,
  TeamRecommendation,
} from './types';
import type { PredictionType, Sport } from '@prisma/client';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  matchPredictionTTL: 60 * 60 * 4,      // 4 hours
  playerPredictionTTL: 60 * 60 * 6,     // 6 hours
  teamPredictionTTL: 60 * 60 * 12,      // 12 hours
  recommendationTTL: 60 * 60 * 24,      // 24 hours
  maxCacheSize: 10000,                  // entries
  cleanupInterval: 60 * 60,             // 1 hour
};

// ============================================================================
// IN-MEMORY CACHE STORE (Production should use Redis)
// ============================================================================

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

// Track cache stats
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  lastCleanup: Date;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  lastCleanup: new Date(),
};

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

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

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

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
  
  // Update hit count
  cached.hitCount++;
  cacheStats.hits++;
  
  return cached;
}

/**
 * Set cached match prediction
 */
export function setCachedMatchPrediction(
  cacheKey: string,
  prediction: MatchPrediction,
  ttlSeconds: number = DEFAULT_CACHE_CONFIG.matchPredictionTTL
): void {
  const cached: CachedPrediction<MatchPrediction> = {
    data: prediction,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    cacheKey,
    hitCount: 0,
  };
  
  // Enforce max cache size
  if (cacheStore.matches.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictOldestEntries(cacheStore.matches);
  }
  
  cacheStore.matches.set(cacheKey, cached);
}

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
  };
  
  if (cacheStore.players.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictOldestEntries(cacheStore.players);
  }
  
  cacheStore.players.set(cacheKey, cached);
}

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
  };
  
  if (cacheStore.teams.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictOldestEntries(cacheStore.teams);
  }
  
  cacheStore.teams.set(cacheKey, cached);
}

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
  };
  
  if (cacheStore.recommendations.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    evictOldestEntries(cacheStore.recommendations);
  }
  
  cacheStore.recommendations.set(cacheKey, cached);
}

// ============================================================================
// CACHE INVALIDATION
// ============================================================================

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
  
  // Scan and remove entries containing the entity ID
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
  
  // Reset stats
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.evictions = 0;
}

/**
 * Evict oldest entries from a cache map
 */
function evictOldestEntries<T>(
  map: Map<string, CachedPrediction<T>>,
  count: number = 100
): void {
  const entries = Array.from(map.entries());
  
  // Sort by cachedAt (oldest first)
  entries.sort((a, b) => a[1].cachedAt.getTime() - b[1].cachedAt.getTime());
  
  // Remove oldest entries
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    map.delete(entries[i][0]);
    cacheStats.evictions++;
  }
}

/**
 * Run cache cleanup (remove expired entries)
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
  
  return cleaned;
}

// ============================================================================
// CACHE STATISTICS
// ============================================================================

/**
 * Get cache statistics
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
      total: cacheStore.matches.size + cacheStore.players.size + 
             cacheStore.teams.size + cacheStore.recommendations.size,
    },
    hitRate: Math.round(hitRate * 100) / 100,
  };
}

/**
 * Get cache configuration
 */
export function getCacheConfig(): CacheConfig {
  return { ...DEFAULT_CACHE_CONFIG };
}

// ============================================================================
// BACKGROUND REFRESH (for pre-computed caching)
// ============================================================================

/**
 * Schedule prediction refresh before expiry
 * Call this from a background job/cron
 */
export function getExpiringSoonEntries(
  type: 'match' | 'player' | 'team' | 'recommendation',
  minutesBeforeExpiry: number = 30
): string[] {
  const threshold = new Date(Date.now() + minutesBeforeExpiry * 60 * 1000);
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
    if (cached.expiresAt <= threshold && cached.expiresAt > new Date()) {
      expiring.push(key);
    }
  }
  
  return expiring;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DEFAULT_CACHE_CONFIG,
  cacheStats,
};