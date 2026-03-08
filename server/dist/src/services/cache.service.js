/**
 * Cache Service
 * Redis-based caching layer for high-traffic endpoints
 * Falls back to in-memory cache if Redis is unavailable
 */
// @ts-ignore - ioredis ESM export typing workaround
import Redis from 'ioredis';
// Redis client with graceful fallback
let redis = null;
let useMemoryFallback = false;
// Simple in-memory cache fallback
const memoryCache = new Map();
// Initialize Redis connection
function initRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
        // @ts-ignore - ioredis constructor
        const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn('[Cache] Redis unavailable, falling back to memory cache');
                    useMemoryFallback = true;
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 3000);
            },
            lazyConnect: true,
        });
        client.on('error', (err) => {
            console.warn('[Cache] Redis error:', err.message);
            useMemoryFallback = true;
        });
        client.on('connect', () => {
            console.log('✅ Redis connected');
            useMemoryFallback = false;
        });
        return client;
    }
    catch (error) {
        console.warn('[Cache] Failed to initialize Redis, using memory cache');
        useMemoryFallback = true;
        return null;
    }
}
// Lazy init Redis
function getRedis() {
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
    async get(key) {
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
        }
        catch (error) {
            console.warn('[Cache] Get error:', error);
            return null;
        }
    },
    /**
     * Set cached data with TTL
     */
    async set(key, data, ttlSeconds = 300) {
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
        }
        catch (error) {
            console.warn('[Cache] Set error:', error);
        }
    },
    /**
     * Delete a specific cache key
     */
    async del(key) {
        try {
            const client = getRedis();
            if (client && !useMemoryFallback) {
                await client.del(key);
                return;
            }
            // Memory fallback
            memoryCache.delete(key);
        }
        catch (error) {
            console.warn('[Cache] Del error:', error);
        }
    },
    /**
     * Invalidate keys matching a pattern
     */
    async invalidatePattern(pattern) {
        try {
            const client = getRedis();
            if (client && !useMemoryFallback) {
                // Use SCAN instead of KEYS to avoid blocking Redis
                const stream = client.scanStream({ match: pattern, count: 100 });
                const pipeline = client.pipeline();
                let keyCount = 0;
                await new Promise((resolve, reject) => {
                    stream.on('data', (keys) => {
                        if (keys.length > 0) {
                            keys.forEach((key) => pipeline.del(key));
                            keyCount += keys.length;
                        }
                    });
                    stream.on('end', async () => {
                        if (keyCount > 0) {
                            await pipeline.exec();
                        }
                        resolve();
                    });
                    stream.on('error', reject);
                });
                return;
            }
            // Memory fallback - simple prefix match
            const prefix = pattern.replace('*', '');
            for (const key of memoryCache.keys()) {
                if (key.startsWith(prefix)) {
                    memoryCache.delete(key);
                }
            }
        }
        catch (error) {
            console.warn('[Cache] Invalidate error:', error);
        }
    },
    /**
     * Check if cache is using Redis or memory fallback
     */
    isUsingRedis() {
        return !useMemoryFallback && redis !== null;
    },
    /**
     * Increment article view count in Redis (batched flush to DB)
     */
    async incrementViewCount(articleId) {
        try {
            const client = getRedis();
            if (client && !useMemoryFallback) {
                await client.incr(`views:${articleId}`);
                return;
            }
            // Memory fallback
            const key = `views:${articleId}`;
            const current = memoryCache.get(key);
            const count = current ? parseInt(current.data) + 1 : 1;
            memoryCache.set(key, { data: String(count), expiry: Date.now() + 86400000 });
        }
        catch (error) {
            console.warn('[Cache] View increment error:', error);
        }
    },
    /**
     * Flush accumulated view counts from Redis to the database
     */
    async flushViewCounts(prisma) {
        let flushed = 0;
        try {
            const client = getRedis();
            if (client && !useMemoryFallback) {
                const stream = client.scanStream({ match: 'views:*', count: 100 });
                const keys = [];
                await new Promise((resolve, reject) => {
                    stream.on('data', (batch) => keys.push(...batch));
                    stream.on('end', resolve);
                    stream.on('error', reject);
                });
                for (const key of keys) {
                    // Use GET + DEL instead of GETDEL for Redis < 6.2 compatibility
                    const [[, count]] = await client.pipeline().get(key).del(key).exec();
                    if (count && parseInt(count) > 0) {
                        const articleId = key.replace('views:', '');
                        await prisma.article.update({
                            where: { id: articleId },
                            data: { views: { increment: parseInt(count) } },
                        }).catch(() => { });
                        flushed++;
                    }
                }
            }
            else {
                // Memory fallback
                for (const [key, value] of memoryCache.entries()) {
                    if (key.startsWith('views:')) {
                        const articleId = key.replace('views:', '');
                        const count = parseInt(value.data);
                        if (count > 0) {
                            await prisma.article.update({
                                where: { id: articleId },
                                data: { views: { increment: count } },
                            }).catch(() => { });
                            flushed++;
                        }
                        memoryCache.delete(key);
                    }
                }
            }
        }
        catch (error) {
            console.warn('[Cache] Flush view counts error:', error);
        }
        return flushed;
    },
};
// Cache key builders for consistent naming
export const cacheKeys = {
    featuredArticles: (limit) => `articles:featured:${limit}`,
    breakingNews: () => 'articles:breaking',
    categories: () => 'categories:all',
    publicSettings: () => 'settings:public',
    article: (slug) => `article:${slug}`,
    categoryArticles: (slug, page) => `category:${slug}:page:${page}`,
};
// Default TTLs in seconds
export const cacheTTL = {
    featured: 300, // 5 minutes
    breaking: 120, // 2 minutes (more frequent updates)
    categories: 3600, // 1 hour
    settings: 600, // 10 minutes
    article: 300, // 5 minutes
    categoryPage: 300, // 5 minutes
};
//# sourceMappingURL=cache.service.js.map