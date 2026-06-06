/**
 * Redis Cache Middleware
 *
 * Production-ready caching layer for high-traffic endpoints.
 * Reduces MySQL load by caching frequently accessed data.
 *
 * @module middleware/cache
 */
import { Redis } from 'ioredis';
// Check if Redis is configured
const isRedisEnabled = () => {
    return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
};
// Create Redis client with fallback
let redis = null;
const createRedisClient = () => {
    if (!isRedisEnabled()) {
        console.log('📦 Redis not configured - caching disabled');
        return null;
    }
    try {
        const config = {
            keyPrefix: 'news:',
            enableOfflineQueue: false,
            maxRetriesPerRequest: 3,
        };
        if (process.env.REDIS_URL) {
            redis = new Redis(process.env.REDIS_URL, config);
        }
        else {
            redis = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '0'),
                ...config,
            });
        }
        redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });
        redis.on('error', (err) => {
            console.error('❌ Redis connection error:', err.message);
        });
        return redis;
    }
    catch (error) {
        console.error('❌ Failed to create Redis client:', error);
        return null;
    }
};
// Initialize Redis client
redis = createRedisClient();
// ============= CACHE UTILITIES =============
/**
 * Default TTL values for different content types (in seconds)
 */
export const CacheTTL = {
    /** Breaking news - short cache, update frequently */
    BREAKING_NEWS: 30,
    /** Featured articles - medium cache */
    FEATURED_ARTICLES: 60,
    /** Article list - medium cache */
    ARTICLE_LIST: 120,
    /** Single article - longer cache */
    ARTICLE_DETAIL: 300,
    /** Categories - rarely change */
    CATEGORIES: 600,
    /** User profile - short cache for freshness */
    USER_PROFILE: 60,
    /** Analytics - longer cache */
    ANALYTICS: 300,
};
/**
 * Generate cache key based on request
 */
export function generateCacheKey(prefix, req) {
    const baseKey = `${prefix}:${req.originalUrl}`;
    // Include user ID for personalized content
    const userId = req.user?.userId;
    if (userId) {
        return `${baseKey}:user:${userId}`;
    }
    return baseKey;
}
/**
 * Check if caching is available
 */
export function isCacheAvailable() {
    return redis !== null && redis.status === 'ready';
}
/**
 * Cache middleware factory
 *
 * @example
 * // Cache articles for 2 minutes
 * router.get('/articles', cache({ ttl: 120 }), articlesHandler);
 *
 * // Cache with custom key
 * router.get('/featured', cache({
 *   ttl: 60,
 *   prefix: 'featured',
 *   skipForAuth: true
 * }), featuredHandler);
 */
export function cache(options = {}) {
    const { ttl = CacheTTL.ARTICLE_LIST, prefix = 'api', skipForAuth = false, keyGenerator, } = options;
    return async (req, res, next) => {
        // Skip caching if Redis not available
        if (!isCacheAvailable()) {
            return next();
        }
        // Skip for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }
        // Optionally skip for authenticated users
        if (skipForAuth && req.user) {
            return next();
        }
        try {
            const cacheKey = keyGenerator
                ? keyGenerator(req)
                : generateCacheKey(prefix, req);
            // Try to get from cache
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                // Cache hit - return cached response
                const parsed = JSON.parse(cachedData);
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Key', cacheKey);
                res.json(parsed);
                return;
            }
            // Cache miss - intercept response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Store in cache (don't await - fire and forget)
                    redis.setex(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
                        console.error('Cache write error:', err.message);
                    });
                }
                res.setHeader('X-Cache', 'MISS');
                res.setHeader('X-Cache-TTL', ttl.toString());
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            // On cache error, continue without caching
            console.error('Cache middleware error:', error);
            next();
        }
    };
}
// ============= CACHE INVALIDATION =============
/**
 * Invalidate cache by pattern
 * Use with caution - scans can be expensive on large datasets
 */
export async function invalidateCache(pattern) {
    if (!isCacheAvailable())
        return 0;
    try {
        const keys = await redis.keys(`news:${pattern}`);
        if (keys.length > 0) {
            const deleted = await redis.del(...keys);
            console.log(`🗑️ Invalidated ${deleted} cache entries for pattern: ${pattern}`);
            return deleted;
        }
        return 0;
    }
    catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
    }
}
/**
 * Invalidate specific cache key
 */
export async function invalidateCacheKey(key) {
    if (!isCacheAvailable())
        return false;
    try {
        const result = await redis.del(key);
        return result > 0;
    }
    catch (error) {
        console.error('Cache key invalidation error:', error);
        return false;
    }
}
/**
 * Clear all article-related cache
 * Call this when articles are created/updated/deleted
 */
export async function invalidateArticleCache() {
    await invalidateCache('api:/api/articles*');
    await invalidateCache('featured:*');
    await invalidateCache('breaking:*');
}
/**
 * Clear all category-related cache
 */
export async function invalidateCategoryCache() {
    await invalidateCache('api:/api/categories*');
}
// ============= PRELOADING CACHE =============
/**
 * Preload frequently accessed data into cache
 * Call this on server startup or scheduled intervals
 */
export async function preloadCache(key, fetcher, ttl = CacheTTL.FEATURED_ARTICLES) {
    if (!isCacheAvailable())
        return;
    try {
        const data = await fetcher();
        await redis.setex(key, ttl, JSON.stringify(data));
        console.log(`📦 Preloaded cache: ${key}`);
    }
    catch (error) {
        console.error(`Preload cache error for ${key}:`, error);
    }
}
// ============= EXPORTS =============
export { redis };
export default cache;
//# sourceMappingURL=cache.js.map