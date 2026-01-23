/**
 * Category Routes
 */
import { Router } from 'express';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createCategorySchema, updateCategorySchema } from '../validators/schemas.js';
const router = Router();
/**
 * GET /api/categories - List all categories (public)
 */
router.get('/', async (req, res, next) => {
    try {
        const { all } = req.query;
        const isAdminView = all === 'true';
        const categories = await prisma.category.findMany({
            where: isAdminView ? {} : { isActive: true },
            include: {
                _count: {
                    select: {
                        articles: isAdminView ? true : { where: { status: 'PUBLISHED' } }
                    },
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
            isActive: c.isActive,
            articlesCount: c._count.articles,
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
        const category = await prisma.category.findUnique({
            where: { slug: req.params.slug },
            include: {
                _count: { select: { articles: { where: { status: 'PUBLISHED' } } } },
            },
        });
        if (!category) {
            throw createError(404, 'القسم غير موجود', 'CATEGORY_NOT_FOUND');
        }
        res.json({
            success: true,
            data: {
                ...category,
                articlesCount: category._count.articles,
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
router.post('/', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = createCategorySchema.parse(req.body);
        const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
        if (existing) {
            throw createError(400, 'الرابط مستخدم مسبقاً', 'SLUG_EXISTS');
        }
        const category = await prisma.category.create({ data });
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/categories/:id
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = updateCategorySchema.parse(req.body);
        const category = await prisma.category.update({
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
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if category has articles
        const articleCount = await prisma.article.count({ where: { categoryId: id } });
        if (articleCount > 0) {
            throw createError(400, 'لا يمكن حذف قسم يحتوي على مقالات', 'CATEGORY_HAS_ARTICLES');
        }
        await prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف القسم بنجاح' });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=category.routes.js.map