/**
 * Rate Limiter Middleware
 * Uses Redis store for PM2 cluster compatibility when available.
 * Falls back to in-memory store if Redis is unavailable.
 */
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map