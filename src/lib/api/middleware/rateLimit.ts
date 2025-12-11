import { Redis } from '@upstash/redis';
import { RateLimitError } from '../errors';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  default: { requests: 1000, window: 60 }, // 1000 per minute
  auth: { requests: 5, window: 900 }, // 5 per 15 minutes
  upload: { requests: 10, window: 3600 }, // 10 per hour
};

export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMIT_CONFIG = 'default'
): Promise<boolean> {
  const config = RATE_LIMIT_CONFIG[limitType];
  const key = `ratelimit:${limitType}:${identifier}`;
  
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, config.window);
  }

  if (current > config.requests) {
    throw new RateLimitError();
  }

  return true;
}

export async function getRateLimitHeaders(
  identifier: string,
  limitType: keyof typeof RATE_LIMIT_CONFIG = 'default'
) {
  const config = RATE_LIMIT_CONFIG[limitType];
  const key = `ratelimit:${limitType}:${identifier}`;
  
  const current = (await redis.get(key) as number) || 0;
  const ttl = await redis.ttl(key);

  return {
    'X-RateLimit-Limit': config.requests.toString(),
    'X-RateLimit-Remaining': Math.max(0, config.requests - current).toString(),
    'X-RateLimit-Reset': (Date.now() + ttl * 1000).toString(),
  };
}
