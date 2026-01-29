/**
 * Cache Service
 * Redis-based caching layer for high-traffic endpoints
 * Falls back to in-memory cache if Redis is unavailable
 */
/**
 * Cache Service API
 */
export declare const cache: {
    /**
     * Get cached data
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cached data with TTL
     */
    set(key: string, data: unknown, ttlSeconds?: number): Promise<void>;
    /**
     * Delete a specific cache key
     */
    del(key: string): Promise<void>;
    /**
     * Invalidate keys matching a pattern
     */
    invalidatePattern(pattern: string): Promise<void>;
    /**
     * Check if cache is using Redis or memory fallback
     */
    isUsingRedis(): boolean;
};
export declare const cacheKeys: {
    featuredArticles: (limit: number) => string;
    breakingNews: () => string;
    categories: () => string;
    publicSettings: () => string;
    article: (slug: string) => string;
    categoryArticles: (slug: string, page: number) => string;
};
export declare const cacheTTL: {
    featured: number;
    breaking: number;
    categories: number;
    settings: number;
    article: number;
    categoryPage: number;
};
//# sourceMappingURL=cache.service.d.ts.map