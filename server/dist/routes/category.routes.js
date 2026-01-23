"use strict";
/**
 * Category Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const auth_js_1 = require("../middleware/auth.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
/**
 * GET /api/categories - List all categories (public)
 */
router.get('/', async (req, res, next) => {
    try {
        const categories = await index_js_1.prisma.category.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { articles: { where: { status: 'PUBLISHED' } } },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
        const data = categories.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            color: c.color,
            icon: c.icon,
            description: c.description,
            articleCount: c._count.articles,
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/categories/:slug
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const category = await index_js_1.prisma.category.findUnique({
            where: { slug: req.params.slug },
            include: {
                _count: { select: { articles: { where: { status: 'PUBLISHED' } } } },
            },
        });
        if (!category) {
            throw (0, errorHandler_js_1.createError)(404, 'القسم غير موجود', 'CATEGORY_NOT_FOUND');
        }
        res.json({
            success: true,
            data: {
                ...category,
                articleCount: category._count.articles,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/categories - Create category (admin)
 */
router.post('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = schemas_js_1.createCategorySchema.parse(req.body);
        const existing = await index_js_1.prisma.category.findUnique({ where: { slug: data.slug } });
        if (existing) {
            throw (0, errorHandler_js_1.createError)(400, 'الرابط مستخدم مسبقاً', 'SLUG_EXISTS');
        }
        const category = await index_js_1.prisma.category.create({ data });
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/categories/:id
 */
router.patch('/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = schemas_js_1.updateCategorySchema.parse(req.body);
        const category = await index_js_1.prisma.category.update({
            where: { id: req.params.id },
            data,
        });
        res.json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/categories/:id
 */
router.delete('/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if category has articles
        const articleCount = await index_js_1.prisma.article.count({ where: { categoryId: id } });
        if (articleCount > 0) {
            throw (0, errorHandler_js_1.createError)(400, 'لا يمكن حذف قسم يحتوي على مقالات', 'CATEGORY_HAS_ARTICLES');
        }
        await index_js_1.prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف القسم بنجاح' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=category.routes.js.map