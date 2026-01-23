"use strict";
/**
 * Auth Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../index.js");
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const auth_js_1 = require("../middleware/auth.js");
const rateLimiter_js_1 = require("../middleware/rateLimiter.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
// Helper to generate tokens
function generateTokens(user) {
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, env_js_1.env.JWT_SECRET, { expiresIn: env_js_1.env.JWT_EXPIRES_IN });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_js_1.env.JWT_REFRESH_SECRET, { expiresIn: env_js_1.env.JWT_REFRESH_EXPIRES_IN });
    return { accessToken, refreshToken };
}
/**
 * POST /api/auth/register
 */
router.post('/register', rateLimiter_js_1.authLimiter, async (req, res, next) => {
    try {
        const data = schemas_js_1.registerSchema.parse(req.body);
        // Check if email exists
        const existing = await index_js_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw (0, errorHandler_js_1.createError)(400, 'البريد الإلكتروني مسجل مسبقاً', 'EMAIL_EXISTS');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        // Create user
        const user = await index_js_1.prisma.user.create({
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
        await index_js_1.prisma.refreshToken.create({
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/auth/login
 */
router.post('/login', rateLimiter_js_1.authLimiter, async (req, res, next) => {
    try {
        const data = schemas_js_1.loginSchema.parse(req.body);
        // Find user
        const user = await index_js_1.prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw (0, errorHandler_js_1.createError)(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS');
        }
        // Check if active
        if (!user.isActive) {
            throw (0, errorHandler_js_1.createError)(403, 'تم تعطيل هذا الحساب', 'ACCOUNT_DISABLED');
        }
        // Verify password
        const validPassword = await bcryptjs_1.default.compare(data.password, user.password);
        if (!validPassword) {
            throw (0, errorHandler_js_1.createError)(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'INVALID_CREDENTIALS');
        }
        const { accessToken, refreshToken } = generateTokens(user);
        // Store refresh token
        await index_js_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        // Log activity
        await index_js_1.prisma.activityLog.create({
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/auth/logout
 */
router.post('/logout', auth_js_1.authenticate, async (req, res, next) => {
    try {
        // Delete all refresh tokens for this user
        await index_js_1.prisma.refreshToken.deleteMany({
            where: { userId: req.user.userId },
        });
        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    }
    catch (error) {
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
            throw (0, errorHandler_js_1.createError)(400, 'رمز التحديث مطلوب', 'REFRESH_TOKEN_REQUIRED');
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, env_js_1.env.JWT_REFRESH_SECRET);
        // Check if token exists in DB
        const storedToken = await index_js_1.prisma.refreshToken.findFirst({
            where: { token: refreshToken, userId: decoded.userId },
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw (0, errorHandler_js_1.createError)(401, 'رمز التحديث غير صالح أو منتهي', 'INVALID_REFRESH_TOKEN');
        }
        // Get user
        const user = await index_js_1.prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive) {
            throw (0, errorHandler_js_1.createError)(401, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }
        // Generate new tokens
        const tokens = generateTokens(user);
        // Update refresh token
        await index_js_1.prisma.refreshToken.update({
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/auth/me
 */
router.get('/me', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const user = await index_js_1.prisma.user.findUnique({
            where: { id: req.user.userId },
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/auth/me
 */
router.patch('/me', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { name, avatar, bio } = req.body;
        const user = await index_js_1.prisma.user.update({
            where: { id: req.user.userId },
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/auth/change-password
 */
router.post('/change-password', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const data = schemas_js_1.changePasswordSchema.parse(req.body);
        const user = await index_js_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            throw (0, errorHandler_js_1.createError)(404, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }
        const validPassword = await bcryptjs_1.default.compare(data.currentPassword, user.password);
        if (!validPassword) {
            throw (0, errorHandler_js_1.createError)(400, 'كلمة المرور الحالية غير صحيحة', 'INVALID_PASSWORD');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.newPassword, 12);
        await index_js_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map