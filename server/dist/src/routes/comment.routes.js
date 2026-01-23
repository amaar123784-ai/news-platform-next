/**
 * Comment Routes
 */
import { Router } from 'express';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { createCommentSchema, moderateCommentSchema, paginationSchema } from '../validators/schemas.js';
const router = Router();
/**
 * GET /api/comments - List comments (admin/moderation)
 */
router.get('/', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { page, perPage } = paginationSchema.parse(req.query);
        const { status, articleId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (articleId)
            where.articleId = articleId;
        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                include: {
                    author: { select: { id: true, name: true, avatar: true } },
                    article: { select: { id: true, title: true, slug: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma.comment.count({ where }),
        ]);
        res.json({
            data: comments,
            meta: {
                currentPage: page,
                totalPages: Math.ceil(total / perPage),
                totalItems: total,
                perPage,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/comments - Add comment
 */
router.post('/', authenticate, async (req, res, next) => {
    try {
        const data = createCommentSchema.parse(req.body);
        // Verify article exists
        const article = await prisma.article.findUnique({ where: { id: data.articleId } });
        if (!article || article.status !== 'PUBLISHED') {
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }
        // Verify parent comment if provided
        if (data.parentId) {
            const parent = await prisma.comment.findUnique({ where: { id: data.parentId } });
            if (!parent || parent.articleId !== data.articleId) {
                throw createError(400, 'التعليق الأب غير صالح', 'INVALID_PARENT');
            }
        }
        const comment = await prisma.comment.create({
            data: {
                content: data.content,
                articleId: data.articleId,
                authorId: req.user.userId,
                parentId: data.parentId,
                // Auto-approve for editors+
                status: ['ADMIN', 'EDITOR'].includes(req.user.role) ? 'APPROVED' : 'PENDING',
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
        });
        res.status(201).json({ success: true, data: comment });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/comments/:id/moderate - Approve/Reject
 */
router.patch('/:id/moderate', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = moderateCommentSchema.parse(req.body);
        const comment = await prisma.comment.update({
            where: { id: req.params.id },
            data: { status: data.status },
            include: {
                author: { select: { id: true, name: true } },
                article: { select: { id: true, title: true } },
            },
        });
        // Log activity
        await prisma.activityLog.create({
            data: {
                action: data.status === 'APPROVED' ? 'APPROVE_COMMENT' : 'REJECT_COMMENT',
                targetType: 'comment',
                targetId: comment.id,
                targetTitle: `تعليق على: ${comment.article.title}`,
                userId: req.user.userId,
            },
        });
        res.json({ success: true, data: comment });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/comments/:id
 */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
        if (!comment) {
            throw createError(404, 'التعليق غير موجود', 'COMMENT_NOT_FOUND');
        }
        // Only author or admin/editor can delete
        if (comment.authorId !== req.user.userId && !['ADMIN', 'EDITOR'].includes(req.user.role)) {
            throw createError(403, 'ليس لديك صلاحية', 'FORBIDDEN');
        }
        await prisma.comment.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'تم حذف التعليق' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/comments/:id/like
 */
router.post('/:id/like', optionalAuth, async (req, res, next) => {
    try {
        const comment = await prisma.comment.update({
            where: { id: req.params.id },
            data: { likes: { increment: 1 } },
            select: { id: true, likes: true },
        });
        res.json({ success: true, data: comment });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=comment.routes.js.map