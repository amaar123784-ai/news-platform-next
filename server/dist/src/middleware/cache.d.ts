/**
 * Redis Cache Middleware
 *
 * Production-ready caching layer for high-traffic endpoints.
 * Reduces MySQL load by caching frequently accessed data.
 *
 * @module middleware/cache
 */
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
declare let redis: Redis | null;
/**
 * Default TTL values for different content types (in seconds)
 */
export declare const CacheTTL: {
    /** Breaking news - short cache, update frequently */
    readonly BREAKING_NEWS: 30;
    /** Featured articles - medium cache */
    readonly FEATURED_ARTICLES: 60;
    /** Article list - medium cache */
    readonly ARTICLE_LIST: 120;
    /** Single article - longer cache */
    readonly ARTICLE_DETAIL: 300;
    /** Categories - rarely change */
    readonly CATEGORIES: 600;
    /** User profile - short cache for freshness */
    readonly USER_PROFILE: 60;
    /** Analytics - longer cache */
    readonly ANALYTICS: 300;
};
/**
 * Generate cache key based on request
 */
export declare function generateCacheKey(prefix: string, req: Request): string;
/**
 * Check if caching is available
 */
export declare function isCacheAvailable(): boolean;
interface CacheOptions {
    /** Time-to-live in seconds */
    ttl?: number;
    /** Custom key prefix */
    prefix?: string;
    /** Skip cache for authenticated users */
    skipForAuth?: boolean;
    /** Custom key generator */
    keyGenerator?: (req: Request) => string;
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
export declare function cache(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Invalidate cache by pattern
 * Use with caution - scans can be expensive on large datasets
 */
export declare function invalidateCache(pattern: string): Promise<number>;
/**
 * Invalidate specific cache key
 */
export declare function invalidateCacheKey(key: string): Promise<boolean>;
/**
 * Clear all article-related cache
 * Call this when articles are created/updated/deleted
 */
export declare function invalidateArticleCache(): Promise<void>;
/**
 * Clear all category-related cache
 */
export declare function invalidateCategoryCache(): Promise<void>;
/**
 * Preload frequently accessed data into cache
 * Call this on server startup or scheduled intervals
 */
export declare function preloadCache(key: string, fetcher: () => Promise<any>, ttl?: number): Promise<void>;
export { redis };
export default cache;
//# sourceMappingURL=cache.d.ts.map