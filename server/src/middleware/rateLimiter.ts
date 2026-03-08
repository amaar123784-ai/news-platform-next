/**
 * Rate Limiter Middleware
 * Uses Redis store for PM2 cluster compatibility when available.
 * Falls back to in-memory store if Redis is unavailable.
 */

import rateLimit from 'express-rate-limit';

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Build Redis store if Redis is configured
let storeOption: any = undefined; // undefined = use default MemoryStore

async function initRedisStore(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    if (!redisUrl) return;

    try {
        // Dynamic import to avoid hard dependency
        const { default: RedisStore } = await import('rate-limit-redis');
        const ioredis = await import('ioredis');
        const Redis = ioredis.default || ioredis;

        const client = new (Redis as any)(process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`, {
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
        });

        client.on('error', (err: Error) => {
            console.warn('[RateLimiter] Redis error, falling back to memory store:', err.message);
        });

        storeOption = new RedisStore({
            // @ts-ignore - ioredis compatible with sendCommand
            sendCommand: (...args: string[]) => client.call(...args),
            prefix: 'rl:',
        });

        console.log('✅ Rate limiter using Redis store');
    } catch (error: any) {
        console.warn('[RateLimiter] Redis store unavailable, using memory store:', error.message);
    }
}

// Try to init Redis store (non-blocking)
initRedisStore().catch(() => { });

export const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute (generous for SPA with many API calls)
    message: {
        success: false,
        message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health', // Don't rate-limit health checks
    ...(storeOption && { store: storeOption }),
});

// Stricter limit for auth routes (enabled in production)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 30 : 1000, // 30 attempts in production, 1000 in development
    message: {
        success: false,
        message: 'محاولات تسجيل دخول كثيرة. يرجى الانتظار 15 دقيقة.',
        code: 'AUTH_RATE_LIMIT',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false, // Count failed requests for security
    ...(storeOption && { store: storeOption }),
});

