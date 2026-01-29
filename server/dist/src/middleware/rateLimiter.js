/**
 * Rate Limiter Middleware
 */
import rateLimit from 'express-rate-limit';
// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';
export const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        success: false,
        message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Stricter limit for auth routes (enabled in production)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 5 : 1000, // 5 attempts in production, 1000 in development
    message: {
        success: false,
        message: 'محاولات تسجيل دخول كثيرة. يرجى الانتظار 15 دقيقة.',
        code: 'AUTH_RATE_LIMIT',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false, // Count failed requests for security
});
//# sourceMappingURL=rateLimiter.js.map