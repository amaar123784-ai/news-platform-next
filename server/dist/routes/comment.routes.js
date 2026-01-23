"use strict";
/**
 * Comment Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const auth_js_1 = require("../middleware/auth.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
/**
 * GET /api/comments - List comments (admin/moderation)
 */
router.get('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { page, perPage } = schemas_js_1.paginationSchema.parse(req.query);
        const { status, articleId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (articleId)
            where.articleId = articleId;
        const [comments, total] = await Promise.all([
            index_js_1.prisma.comment.findMany({
                where,
                include: {
                    author: { select: { id: true, name: true, avatar: true } },
                    article: { select: { id: true, title: true, slug: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            index_js_1.prisma.comment.count({ where }),
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
router.post('/', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const data = schemas_js_1.createCommentSchema.parse(req.body);
        // Verify article exists
        const article = await index_js_1.prisma.article.findUnique({ where: { id: data.articleId } });
        if (!article || article.status !== 'PUBLISHED') {
            throw (0, errorHandler_js_1.createError)(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }
        // Verify parent comment if provided
        if (data.parentId) {
            const parent = await index_js_1.prisma.comment.findUnique({ where: { id: data.parentId } });
            if (!parent || parent.articleId !== data.articleId) {
                throw (0, errorHandler_js_1.createError)(400, 'التعليق الأب غير صالح', 'INVALID_PARENT');
            }
        }
        const comment = await index_js_1.prisma.comment.create({
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
router.patch('/:id/moderate', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = schemas_js_1.moderateCommentSchema.parse(req.body);
        const comment = await index_js_1.prisma.comment.update({
            where: { id: req.params.id },
            data: { status: data.status },
            include: {
                author: { select: { id: true, name: true } },
                article: { select: { id: true, title: true } },
            },
        });
        // Log activity
        await index_js_1.prisma.activityLog.create({
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
router.delete('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const comment = await index_js_1.prisma.comment.findUnique({ where: { id: req.params.id } });
        if (!comment) {
            throw (0, errorHandler_js_1.createError)(404, 'التعليق غير موجود', 'COMMENT_NOT_FOUND');
        }
        // Only author or admin/editor can delete
        if (comment.authorId !== req.user.userId && !['ADMIN', 'EDITOR'].includes(req.user.role)) {
            throw (0, errorHandler_js_1.createError)(403, 'ليس لديك صلاحية', 'FORBIDDEN');
        }
        await index_js_1.prisma.comment.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'تم حذف التعليق' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/comments/:id/like
 */
router.post('/:id/like', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const comment = await index_js_1.prisma.comment.update({
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
exports.default = router;
//# sourceMappingURL=comment.routes.js.map