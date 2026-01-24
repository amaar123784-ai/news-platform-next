/**
 * Auth Routes
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { env } from '../config/env.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/schemas.js';
import { verifyGoogleToken, verifyFacebookToken, findOrCreateSocialUser } from '../services/oauth.service.js';

const router = Router();

// Helper to generate tokens
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

/**
 * POST /api/auth/register
 */
router.post('/register', authLimiter, async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if email exists
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw createError(400, 'البريد الإلكتروني مسجل مسبقاً', 'EMAIL_EXISTS');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user
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

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        res.status(201).json({
            success: true,
            data: { user, token: accessToken, refreshToken },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/google
 */
router.post('/google', authLimiter, async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw createError(400, 'رمز جوجل مطلوب', 'GOOGLE_TOKEN_REQUIRED');

        const profile = await verifyGoogleToken(token);
        if (!profile) throw createError(401, 'فشل التحقق من حساب جوجل', 'GOOGLE_AUTH_FAILED');

        const user = await findOrCreateSocialUser(profile);
        if (!user.isActive) throw createError(403, 'تم تعطيل هذا الحساب', 'ACCOUNT_DISABLED');

        const tokens = generateTokens(user);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/facebook
 */
router.post('/facebook', authLimiter, async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw createError(400, 'رمز فيسبوك مطلوب', 'FACEBOOK_TOKEN_REQUIRED');

        const profile = await verifyFacebookToken(token);
        if (!profile) throw createError(401, 'فشل التحقق من حساب فيسبوك', 'FACEBOOK_AUTH_FAILED');

        const user = await findOrCreateSocialUser(profile);
        if (!user.isActive) throw createError(403, 'تم تعطيل هذا الحساب', 'ACCOUNT_DISABLED');

        const tokens = generateTokens(user);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/login
 */
router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw createError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS');
        }

        // Check if active
        if (!user.isActive) {
            throw createError(403, 'تم تعطيل هذا الحساب', 'ACCOUNT_DISABLED');
        }

        // Verify password
        if (!user.password) {
            throw createError(401, 'هذا الحساب يستخدم الدخول الاجتماعي. يرجى تسجيل الدخول عبر جوجل أو فيسبوك', 'SOCIAL_AUTH_ONLY');
        }

        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            throw createError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS');
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Log activity
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
                token: accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        // Delete all refresh tokens for this user
        await prisma.refreshToken.deleteMany({
            where: { userId: req.user!.userId },
        });

        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw createError(400, 'رمز التحديث مطلوب', 'REFRESH_TOKEN_REQUIRED');
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };

        // Check if token exists in DB
        const storedToken = await prisma.refreshToken.findFirst({
            where: { token: refreshToken, userId: decoded.userId },
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw createError(401, 'رمز التحديث غير صالح أو منتهي', 'INVALID_REFRESH_TOKEN');
        }

        // Get user
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive) {
            throw createError(401, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                token: tokens.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.json({
            success: true,
            data: { token: tokens.accessToken, refreshToken: tokens.refreshToken },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/me
 */
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

/**
 * PATCH /api/auth/me
 */
router.patch('/me', authenticate, async (req, res, next) => {
    try {
        const { name, avatar, bio } = req.body;

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

/**
 * POST /api/auth/change-password
 */
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
