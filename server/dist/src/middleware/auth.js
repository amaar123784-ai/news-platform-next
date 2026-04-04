import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createError } from './errorHandler.js';
import { prisma } from '../index.js';
import { cache } from '../services/cache.service.js';
/**
 * Cache keys for user session/status
 */
const USER_CACHE_KEY = (userId) => `user:status:${userId}`;
const USER_CACHE_TTL = 3600; // 1 hour - safe for role/active checks
/**
 * Extract JWT string from request.
 * Priority: HttpOnly cookie → Authorization: Bearer header
 */
function extractToken(req) {
    // Prefer the HttpOnly cookie (set by auth routes' setAuthCookies helper)
    if (req.cookies?.access_token) {
        return req.cookies.access_token;
    }
    // Fall back to Authorization header for non-browser clients
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
}
/**
 * Verify JWT token and attach user to request
 * Optimized with Redis caching to prevent per-request DB hits
 */
export async function authenticate(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            throw createError(401, 'غير مصرح بالوصول. يرجى تسجيل الدخول.', 'UNAUTHORIZED');
        }
        let decoded;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET);
        }
        catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                throw createError(401, 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.', 'TOKEN_EXPIRED');
            }
            throw createError(401, 'رمز الدخول غير صالح.', 'INVALID_TOKEN');
        }
        // --- OPTIMIZATION: Check Redis Cache First ---
        const cacheKey = USER_CACHE_KEY(decoded.userId);
        let cachedStatus = await cache.get(cacheKey);
        if (!cachedStatus) {
            // Cache Miss: Verify user exists and is active in DB
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, isActive: true, role: true },
            });
            if (!user) {
                throw createError(401, 'المستخدم غير موجود.', 'USER_NOT_FOUND');
            }
            cachedStatus = { isActive: user.isActive, role: user.role };
            // Populate Cache
            await cache.set(cacheKey, cachedStatus, USER_CACHE_TTL);
        }
        // Final Validation from (Cached) Data
        if (!cachedStatus.isActive) {
            throw createError(401, 'تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة.', 'USER_INACTIVE');
        }
        // Ensure token role matches DB role (prevents elevation if role changed)
        if (cachedStatus.role !== decoded.role) {
            throw createError(401, 'تم تحديث صلاحياتك. يرجى تسجيل الدخول مجدداً.', 'ROLE_CHANGED');
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Check if user has required role
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError(401, 'غير مصرح بالوصول.', 'UNAUTHORIZED'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(createError(403, 'ليس لديك صلاحية لهذا الإجراء.', 'FORBIDDEN'));
        }
        next();
    };
}
/**
 * Optional auth - attach user if token exists (cookie or header), continue otherwise
 */
export async function optionalAuth(req, res, next) {
    const token = extractToken(req);
    if (token) {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            req.user = decoded;
        }
        catch {
            // Token invalid, continue without user
        }
    }
    next();
}
/**
 * Manual Cache Invalidation Helper
 * Call this from controllers whenever user status, role, or credentials change.
 */
export async function invalidateUserCache(userId) {
    await cache.del(USER_CACHE_KEY(userId));
}
//# sourceMappingURL=auth.js.map