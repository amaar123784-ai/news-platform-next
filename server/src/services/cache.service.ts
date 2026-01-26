/**
 * Cache Service
 * Redis-based caching layer for high-traffic endpoints
 * Falls back to in-memory cache if Redis is unavailable
 */

// @ts-ignore - ioredis ESM export typing workaround
import Redis from 'ioredis';

// Redis client with graceful fallback
let redis: any = null;
let useMemoryFallback = false;

// Simple in-memory cache fallback
const memoryCache = new Map<string, { data: string; expiry: number }>();

// Initialize Redis connection
function initRedis(): any {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
        // @ts-ignore - ioredis constructor
        const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
                if (times > 3) {
                    console.warn('[Cache] Redis unavailable, falling back to memory cache');
                    useMemoryFallback = true;
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 3000);
            },
            lazyConnect: true,
        });

        client.on('error', (err: Error) => {
            console.warn('[Cache] Redis error:', err.message);
            useMemoryFallback = true;
        });

        client.on('connect', () => {
            console.log('✅ Redis connected');
            useMemoryFallback = false;
        });

        return client;
    } catch (error) {
        console.warn('[Cache] Failed to initialize Redis, using memory cache');
        useMemoryFallback = true;
        return null;
    }
}

// Lazy init Redis
function getRedis(): any {
    if (!redis && !useMemoryFallback) {
        redis = initRedis();
    }
    return redis;
}


// Clean expired memory cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
        if (value.expiry < now) {
            memoryCache.delete(key);
        }
    }
}, 60000); // Every minute

/**
 * Cache Service API
 */
export const cache = {
    /**
     * Get cached data
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const client = getRedis();

            if (client && !useMemoryFallback) {
                const data = await client.get(key);
                return data ? JSON.parse(data) : null;
            }

            // Memory fallback
            const cached = memoryCache.get(key);
            if (cached && cached.expiry > Date.now()) {
                return JSON.parse(cached.data);
            }
            return null;
        } catch (error) {
            console.warn('[Cache] Get error:', error);
            return null;
        }
    },

    /**
     * Set cached data with TTL
     */
    async set(key: string, data: unknown, ttlSeconds = 300): Promise<void> {
        try {
            const serialized = JSON.stringify(data);
            const client = getRedis();

            if (client && !useMemoryFallback) {
                await client.set(key, serialized, 'EX', ttlSeconds);
                return;
            }

            // Memory fallback
            memoryCache.set(key, {
                data: serialized,
                expiry: Date.now() + ttlSeconds * 1000,
            });
        } catch (error) {
            console.warn('[Cache] Set error:', error);
        }
    },

    /**
     * Delete a specific cache key
     */
    async del(key: string): Promise<void> {
        try {
            const client = getRedis();

            if (client && !useMemoryFallback) {
                await client.del(key);
                return;
            }

            // Memory fallback
            memoryCache.delete(key);
        } catch (error) {
            console.warn('[Cache] Del error:', error);
        }
    },

    /**
     * Invalidate keys matching a pattern
     */
    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const client = getRedis();

            if (client && !useMemoryFallback) {
                const keys = await client.keys(pattern);
                if (keys.length > 0) {
                    await client.del(...keys);
                }
                return;
            }

            // Memory fallback - simple prefix match
            const prefix = pattern.replace('*', '');
            for (const key of memoryCache.keys()) {
                if (key.startsWith(prefix)) {
                    memoryCache.delete(key);
                }
            }
        } catch (error) {
            console.warn('[Cache] Invalidate error:', error);
        }
    },

    /**
     * Check if cache is using Redis or memory fallback
     */
    isUsingRedis(): boolean {
        return !useMemoryFallback && redis !== null;
    },
};

// Cache key builders for consistent naming
export const cacheKeys = {
    featuredArticles: (limit: number) => `articles:featured:${limit}`,
    breakingNews: () => 'articles:breaking',
    categories: () => 'categories:all',
    publicSettings: () => 'settings:public',
    article: (slug: string) => `article:${slug}`,
    categoryArticles: (slug: string, page: number) => `category:${slug}:page:${page}`,
};

// Default TTLs in seconds
export const cacheTTL = {
    featured: 300,      // 5 minutes
    breaking: 120,      // 2 minutes (more frequent updates)
    categories: 3600,   // 1 hour
    settings: 600,      // 10 minutes
    article: 300,       // 5 minutes
    categoryPage: 300,  // 5 minutes
};
