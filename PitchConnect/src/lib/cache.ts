// src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export async function getCachedData(key: string) {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function setCachedData(key: string, value: any, ttl = 3600) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}
