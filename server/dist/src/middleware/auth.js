/**
 * Authentication Middleware
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createError } from './errorHandler.js';
import { prisma } from '../index.js';
/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createError(401, 'غير مصرح بالوصول. يرجى تسجيل الدخول.', 'UNAUTHORIZED');
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            // Verify user still exists and is active
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, isActive: true },
            });
            if (!user || !user.isActive) {
                throw createError(401, 'المستخدم غير موجود أو تم تعطيل الحساب.', 'USER_INACTIVE');
            }
            req.user = decoded;
            next();
        }
        catch (jwtError) {
            throw createError(401, 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.', 'TOKEN_EXPIRED');
        }
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
 * Optional auth - attach user if token exists, continue otherwise
 */
export async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
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
//# sourceMappingURL=auth.js.map