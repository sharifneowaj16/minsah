import Redis from 'ioredis';

// Redis singleton pattern
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('REDIS_URL not set. Using default localhost:6379');
    return new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Cache helper functions

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

/**
 * Set a value in cache with optional TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (error) {
    console.error('Redis DEL pattern error:', error);
    return 0;
  }
}

/**
 * Get or set a cached value (cache-aside pattern)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const value = await fetchFn();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

/**
 * Increment a counter
 */
export async function cacheIncrement(
  key: string,
  ttlSeconds?: number
): Promise<number> {
  try {
    const value = await redis.incr(key);
    if (ttlSeconds && value === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return value;
  } catch (error) {
    console.error('Redis INCR error:', error);
    return 0;
  }
}

/**
 * Rate limiting helper
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `ratelimit:${identifier}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetIn: ttl > 0 ? ttl : windowSeconds,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: maxRequests,
      resetIn: windowSeconds,
    };
  }
}

/**
 * Session management helpers
 */
export const sessionCache = {
  async set(sessionId: string, data: Record<string, unknown>, ttlSeconds: number = 86400) {
    return cacheSet(`session:${sessionId}`, data, ttlSeconds);
  },

  async get(sessionId: string): Promise<Record<string, unknown> | null> {
    return cacheGet(`session:${sessionId}`);
  },

  async delete(sessionId: string) {
    return cacheDelete(`session:${sessionId}`);
  },

  async refresh(sessionId: string, ttlSeconds: number = 86400): Promise<boolean> {
    try {
      await redis.expire(`session:${sessionId}`, ttlSeconds);
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  },
};

/**
 * Invalidate cache for specific entities
 */
export const invalidateCache = {
  async user(userId: string) {
    await cacheDeletePattern(`user:${userId}:*`);
  },

  async product(productId: string) {
    await cacheDeletePattern(`product:${productId}:*`);
    await cacheDelete('products:list');
    await cacheDelete('products:featured');
  },

  async category(categoryId: string) {
    await cacheDeletePattern(`category:${categoryId}:*`);
    await cacheDelete('categories:list');
  },

  async order(orderId: string) {
    await cacheDeletePattern(`order:${orderId}:*`);
  },

  async cart(userId: string) {
    await cacheDelete(`cart:${userId}`);
  },
};

export default redis;
