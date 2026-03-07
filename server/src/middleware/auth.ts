/**
 * Authentication Middleware
 *
 * Reads the JWT from the `access_token` HttpOnly cookie (set by auth routes).
 * Falls back to the Authorization: Bearer header for non-browser clients.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createError } from './errorHandler.js';
import { prisma } from '../index.js';

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Extract JWT string from request.
 * Priority: HttpOnly cookie → Authorization: Bearer header
 */
function extractToken(req: Request): string | null {
    // Prefer the HttpOnly cookie (set by auth routes' setAuthCookies helper)
    if (req.cookies?.access_token) {
        return req.cookies.access_token as string;
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
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const token = extractToken(req);

        if (!token) {
            throw createError(401, 'غير مصرح بالوصول. يرجى تسجيل الدخول.', 'UNAUTHORIZED');
        }

        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        } catch (jwtError: any) {
            if (jwtError.name === 'TokenExpiredError') {
                throw createError(401, 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.', 'TOKEN_EXPIRED');
            }
            throw createError(401, 'رمز الدخول غير صالح.', 'INVALID_TOKEN');
        }

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
    } catch (error) {
        next(error);
    }
}

/**
 * Check if user has required role
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
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
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const token = extractToken(req);
    if (token) {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
            req.user = decoded;
        } catch {
            // Token invalid, continue without user
        }
    }
    next();
}
