/**
 * Auth Routes
 *
 * Security hardening (S1, S3, S15):
 *   - Access token is set as HttpOnly, Secure, SameSite=Strict cookie
 *   - Refresh token is ALSO set as HttpOnly cookie (never exposed in response body)
 *   - Refresh token is ALWAYS hashed with SHA-256 before being stored in DB
 *   - /refresh reads the refresh token from its HttpOnly cookie, so JavaScript
 *     can never access it (XSS-proof)
 */

import { Router, Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { env } from '../config/env.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/schemas.js';
import { z } from 'zod';
import { verifyGoogleToken, verifyFacebookToken, findOrCreateSocialUser } from '../services/oauth.service.js';

const router = Router();

// ---------------------------------------------------------------------------
// Cookie configuration
// When behind a reverse proxy (e.g. Nginx), the backend may see Host as 127.0.0.1,
// so cookies would be set for that host and the browser would not send them to
// the public domain. Set COOKIE_DOMAIN (e.g. voiceoftihama.com) so cookies work.
// ---------------------------------------------------------------------------
const IS_PROD = env.NODE_ENV === 'production';
const cookieDomain = env.COOKIE_DOMAIN || undefined;

const ACCESS_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: IS_PROD,          // HTTPS-only in production
    sameSite: 'strict',       // CSRF protection
    path: '/',
    maxAge: 15 * 60 * 1000,  // 15 minutes (matches access token lifetime)
    ...(cookieDomain && { domain: cookieDomain }),
};

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/api/auth',        // Scoped to auth endpoints only
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    ...(cookieDomain && { domain: cookieDomain }),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateTokens(user: { id: string; email: string; role: string }) {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.JWT_SECRET as jwt.Secret,
        { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
        { userId: user.id },
        env.JWT_REFRESH_SECRET as jwt.Secret,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    return { accessToken, refreshToken };
}

/** SHA-256 hash of the raw token — stored in DB so the plaintext never rests on disk */
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/** Set both tokens as HttpOnly cookies on the response */
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
}

/** Clear both auth cookies (used by logout). Must match domain/path used when setting. */
function clearAuthCookies(res: Response) {
    const domainOpt = cookieDomain ? { domain: cookieDomain } : {};
    res.clearCookie('access_token', { path: '/', ...domainOpt });
    res.clearCookie('refresh_token', { path: '/api/auth', ...domainOpt });
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', authLimiter, async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);

        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw createError(400, 'البريد الإلكتروني مسجل مسبقاً', 'EMAIL_EXISTS');
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'READER',
            },
            select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
        });

        const { accessToken, refreshToken } = generateTokens(user);

        // Hash before storing — plaintext refresh token never persisted
        await prisma.refreshToken.create({
            data: {
                token: hashToken(refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        setAuthCookies(res, accessToken, refreshToken);

        res.status(201).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// POST /api/auth/google
// ---------------------------------------------------------------------------
router.post('/google', authLimiter, async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw createError(400, 'رمز جوجل مطلوب', 'GOOGLE_TOKEN_REQUIRED');

        const profile = await verifyGoogleToken(token);
        if (!profile) throw createError(401, 'فشل التحقق من حساب جوجل', 'GOOGLE_AUTH_FAILED');

        const user = await findOrCreateSocialUser(profile);
        if (!user.isActive) throw createError(403, 'تم تعطيل هذا الحساب', 'ACCOUNT_DISABLED');

        const tokens = generateTokens(user);

        await prisma.refreshToken.create({
            data: {
                token: hashToken(tokens.refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            },
        });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// POST /api/auth/facebook
// ---------------------------------------------------------------------------
router.post('/facebook', authLimiter, async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw createError(400, 'رمز فيسبوك مطلوب', 'FACEBOOK_TOKEN_REQUIRED');

        const profile = await verifyFacebookToken(token);
        if (!profile) throw createError(401, 'فشل التحقق من حساب فيسبوك', 'FACEBOOK_AUTH_FAILED');

        const user = await findOrCreateSocialUser(profile);
        if (!user.isActive) throw createError(403, 'تم تعطيل هذا الحساب', 'ACCOUNT_DISABLED');

        const tokens = generateTokens(user);

        await prisma.refreshToken.create({
            data: {
                token: hashToken(tokens.refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            },
        });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const data = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw createError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS');
        }

        if (!user.isActive) {
            throw createError(403, 'تم تعطيل هذا الحساب', 'ACCOUNT_DISABLED');
        }

        if (!user.password) {
            throw createError(401, 'هذا الحساب يستخدم الدخول الاجتماعي. يرجى تسجيل الدخول عبر جوجل أو فيسبوك', 'SOCIAL_AUTH_ONLY');
        }

        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            throw createError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS');
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Hash the refresh token before storing — plaintext never stored
        await prisma.refreshToken.create({
            data: {
                token: hashToken(refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        await prisma.activityLog.create({
            data: {
                action: 'LOGIN',
                targetType: 'user',
                targetId: user.id,
                targetTitle: user.name,
                userId: user.id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

        // Set tokens as HttpOnly cookies — never exposed to JavaScript
        setAuthCookies(res, accessToken, refreshToken);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        await prisma.refreshToken.deleteMany({
            where: { userId: req.user!.userId },
        });

        clearAuthCookies(res);

        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// Reads the refresh token from the HttpOnly cookie — JavaScript cannot access it
// ---------------------------------------------------------------------------
router.post('/refresh', async (req, res, next) => {
    try {
        // Read from HttpOnly cookie (secure path). Fall back to body for any non-browser clients.
        const refreshToken: string | undefined = req.cookies?.refresh_token ?? req.body?.refreshToken;

        if (!refreshToken) {
            throw createError(400, 'رمز التحديث مطلوب', 'REFRESH_TOKEN_REQUIRED');
        }

        // Verify signature
        const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };

        // Hash the incoming token and look it up in the DB
        const hashedIncoming = hashToken(refreshToken);
        const storedToken = await prisma.refreshToken.findFirst({
            where: { token: hashedIncoming, userId: decoded.userId },
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            clearAuthCookies(res);
            throw createError(401, 'رمز التحديث غير صالح أو منتهي', 'INVALID_REFRESH_TOKEN');
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive) {
            clearAuthCookies(res);
            throw createError(401, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }

        const tokens = generateTokens(user);

        // Rotate refresh token (old one replaced, new one hashed)
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                token: hashToken(tokens.refreshToken),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            },
        });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// PATCH /api/auth/me
// ---------------------------------------------------------------------------
router.patch('/me', authenticate, async (req, res, next) => {
    try {
        const updateProfileSchema = z.object({
            name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100).optional(),
            avatar: z.string().url('رابط الصورة غير صالح').optional().nullable(),
            bio: z.string().max(500, 'النبذة يجب ألا تتجاوز 500 حرف').optional(),
        });
        const { name, avatar, bio } = updateProfileSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: req.user!.userId },
            data: { name, avatar, bio },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                updatedAt: true,
            },
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
// ---------------------------------------------------------------------------
router.post('/change-password', authenticate, async (req, res, next) => {
    try {
        const data = changePasswordSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        if (!user) {
            throw createError(404, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }

        if (!user.password) {
            throw createError(400, 'هذا الحساب لا يمتلك كلمة مرور (دخول اجتماعي)', 'SOCIAL_AUTH_ONLY');
        }

        const validPassword = await bcrypt.compare(data.currentPassword, user.password);
        if (!validPassword) {
            throw createError(400, 'كلمة المرور الحالية غير صحيحة', 'INVALID_PASSWORD');
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        next(error);
    }
});

export default router;
