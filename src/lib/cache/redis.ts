// ============================================================================
// FILE 3: src/lib/cache/redis.ts
// ============================================================================

import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl);

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
}

export async function setInCache<T>(key: string, data: T, expirationSeconds: number = 3600) {
  try {
    await redis.setex(key, expirationSeconds, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
}

export async function deleteFromCache(key: string) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
  }
}

export async function clearCacheByPattern(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Error clearing cache with pattern ${pattern}:`, error);
  }
}
