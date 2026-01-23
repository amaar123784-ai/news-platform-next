"use strict";
/**
 * Article Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const auth_js_1 = require("../middleware/auth.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
// Helper to generate slug
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^\u0621-\u064Aa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);
}
/**
 * GET /api/articles - List articles (public)
 */
router.get('/', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const query = schemas_js_1.articleQuerySchema.parse(req.query);
        const { page, perPage, category, status, authorId, search, sortBy, sortOrder } = query;
        // Build where clause
        const where = {};
        // Public users can only see published articles
        if (!req.user || req.user.role === 'READER') {
            where.status = 'PUBLISHED';
        }
        else if (status) {
            where.status = status;
        }
        if (category)
            where.category = { slug: category };
        if (authorId)
            where.authorId = authorId;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { excerpt: { contains: search } },
            ];
        }
        const [articles, total] = await Promise.all([
            index_js_1.prisma.article.findMany({
                where,
                include: {
                    author: { select: { id: true, name: true, avatar: true } },
                    category: { select: { id: true, name: true, slug: true, color: true } },
                    _count: { select: { comments: true } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            index_js_1.prisma.article.count({ where }),
        ]);
        res.json({
            data: articles,
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
 * GET /api/articles/featured - Featured articles
 */
router.get('/featured', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 20);
        const articles = await index_js_1.prisma.article.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                category: { select: { id: true, name: true, slug: true, color: true } },
            },
            orderBy: { views: 'desc' },
            take: limit,
        });
        res.json({ success: true, data: articles });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/articles/:slug - Single article
 */
router.get('/:slug', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const article = await index_js_1.prisma.article.findUnique({
            where: { slug: req.params.slug },
            include: {
                author: { select: { id: true, name: true, avatar: true, bio: true } },
                category: { select: { id: true, name: true, slug: true, color: true } },
                tags: { include: { tag: true } },
                comments: {
                    where: { status: 'APPROVED', parentId: null },
                    include: {
                        author: { select: { id: true, name: true, avatar: true } },
                        replies: {
                            where: { status: 'APPROVED' },
                            include: { author: { select: { id: true, name: true, avatar: true } } },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!article) {
            throw (0, errorHandler_js_1.createError)(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }
        // Check access for unpublished
        if (article.status !== 'PUBLISHED') {
            if (!req.user || (req.user.role === 'READER' && req.user.userId !== article.authorId)) {
                throw (0, errorHandler_js_1.createError)(403, 'ليس لديك صلاحية لعرض هذا المقال', 'FORBIDDEN');
            }
        }
        // Increment views (don't await)
        index_js_1.prisma.article.update({
            where: { id: article.id },
            data: { views: { increment: 1 } },
        }).catch(() => { });
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/articles - Create article
 */
router.post('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const data = schemas_js_1.createArticleSchema.parse(req.body);
        // Generate unique slug
        let slug = generateSlug(data.title);
        const existing = await index_js_1.prisma.article.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }
        // Calculate read time (roughly 200 words per minute)
        const wordCount = data.content.split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));
        const article = await index_js_1.prisma.article.create({
            data: {
                title: data.title,
                slug,
                excerpt: data.excerpt,
                content: data.content,
                categoryId: data.categoryId,
                authorId: req.user.userId,
                status: data.status || 'DRAFT',
                imageUrl: data.imageUrl,
                seoTitle: data.seoTitle,
                seoDesc: data.seoDesc,
                readTime,
            },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });
        // Log activity
        await index_js_1.prisma.activityLog.create({
            data: {
                action: 'CREATE',
                targetType: 'article',
                targetId: article.id,
                targetTitle: article.title,
                userId: req.user.userId,
            },
        });
        res.status(201).json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/articles/:id - Update article
 */
router.patch('/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = schemas_js_1.updateArticleSchema.parse(req.body);
        // Check ownership (unless admin/editor)
        const existing = await index_js_1.prisma.article.findUnique({ where: { id } });
        if (!existing) {
            throw (0, errorHandler_js_1.createError)(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }
        if (req.user.role === 'JOURNALIST' && existing.authorId !== req.user.userId) {
            throw (0, errorHandler_js_1.createError)(403, 'لا يمكنك تعديل مقالات الآخرين', 'FORBIDDEN');
        }
        const article = await index_js_1.prisma.article.update({
            where: { id },
            data: {
                ...data,
                ...(data.content && { readTime: Math.max(1, Math.ceil(data.content.split(/\s+/).length / 200)) }),
            },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });
        // Log activity
        await index_js_1.prisma.activityLog.create({
            data: {
                action: 'UPDATE',
                targetType: 'article',
                targetId: article.id,
                targetTitle: article.title,
                userId: req.user.userId,
            },
        });
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/articles/:id
 */
router.delete('/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const article = await index_js_1.prisma.article.findUnique({ where: { id } });
        if (!article) {
            throw (0, errorHandler_js_1.createError)(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }
        await index_js_1.prisma.article.delete({ where: { id } });
        // Log activity
        await index_js_1.prisma.activityLog.create({
            data: {
                action: 'DELETE',
                targetType: 'article',
                targetId: id,
                targetTitle: article.title,
                userId: req.user.userId,
            },
        });
        res.json({ success: true, message: 'تم حذف المقال بنجاح' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/articles/:id/publish
 */
router.post('/:id/publish', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const article = await index_js_1.prisma.article.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });
        // Log activity
        await index_js_1.prisma.activityLog.create({
            data: {
                action: 'PUBLISH',
                targetType: 'article',
                targetId: id,
                targetTitle: article.title,
                userId: req.user.userId,
            },
        });
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/articles/:id/archive
 */
router.post('/:id/archive', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const article = await index_js_1.prisma.article.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
        // Log activity
        await index_js_1.prisma.activityLog.create({
            data: {
                action: 'ARCHIVE',
                targetType: 'article',
                targetId: id,
                targetTitle: article.title,
                userId: req.user.userId,
            },
        });
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=article.routes.js.map