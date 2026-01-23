/**
 * User Management Routes (Admin Only)
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createUserSchema, updateUserSchema, paginationSchema } from '../validators/schemas.js';

const router = Router();

// All routes require admin
router.use(authenticate, requireRole('ADMIN'));

/**
 * GET /api/users - List users
 */
router.get('/', async (req, res, next) => {
    try {
        const { page, perPage } = paginationSchema.parse(req.query);
        const { role, search } = req.query;

        const where: any = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search as string } },
                { email: { contains: search as string } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatar: true,
                    isActive: true,
                    createdAt: true,
                    _count: { select: { articles: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            data: users,
            meta: {
                currentPage: page,
                totalPages: Math.ceil(total / perPage),
                totalItems: total,
                perPage,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { articles: true, comments: true } },
            },
        });

        if (!user) {
            throw createError(404, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users - Create user
 */
router.post('/', async (req, res, next) => {
    try {
        const data = createUserSchema.parse(req.body);

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
                role: data.role,
                avatar: data.avatar,
                bio: data.bio,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'CREATE',
                targetType: 'user',
                targetId: user.id,
                targetTitle: user.name,
                userId: req.user!.userId,
            },
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/users/:id
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                isActive: true,
                updatedAt: true,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'UPDATE',
                targetType: 'user',
                targetId: user.id,
                targetTitle: user.name,
                userId: req.user!.userId,
            },
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/users/:id
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user!.userId) {
            throw createError(400, 'لا يمكنك حذف حسابك الخاص', 'CANNOT_DELETE_SELF');
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw createError(404, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }

        await prisma.user.delete({ where: { id } });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'DELETE',
                targetType: 'user',
                targetId: id,
                targetTitle: user.name,
                userId: req.user!.userId,
            },
        });

        res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/users/:id/toggle-status
 */
router.patch('/:id/toggle-status', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === req.user!.userId) {
            throw createError(400, 'لا يمكنك تعطيل حسابك الخاص', 'CANNOT_DISABLE_SELF');
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw createError(404, 'المستخدم غير موجود', 'USER_NOT_FOUND');
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: { id: true, name: true, isActive: true },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
                targetType: 'user',
                targetId: id,
                targetTitle: user.name,
                userId: req.user!.userId,
            },
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

export default router;
