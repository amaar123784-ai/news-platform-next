/**
 * Rate Limiter Middleware
 */
import rateLimit from 'express-rate-limit';
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
// Stricter limit for auth routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts
    message: {
        success: false,
        message: 'محاولات تسجيل دخول كثيرة. يرجى الانتظار 15 دقيقة.',
        code: 'AUTH_RATE_LIMIT',
    },
});
//# sourceMappingURL=rateLimiter.js.map