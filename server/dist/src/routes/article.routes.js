/**
 * Article Routes
 *
 * Thin controller layer — delegates all business logic to article.service.ts
 */
import { Router } from 'express';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { createArticleSchema, updateArticleSchema, articleQuerySchema } from '../validators/schemas.js';
import * as articleService from '../services/article.service.js';
const router = Router();
/**
 * GET /api/articles - List articles (public)
 */
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const query = articleQuerySchema.parse(req.query);
        const result = await articleService.listArticles(query, req.user);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/articles/featured - Featured articles (cached)
 */
router.get('/featured', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 20);
        const data = await articleService.getFeaturedArticles(limit);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/articles/breaking - Breaking news articles (cached)
 */
router.get('/breaking', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 10, 20);
        const data = await articleService.getBreakingNews(limit);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /:idOrSlug/related - Related articles
 */
router.get('/:idOrSlug/related', optionalAuth, async (req, res, next) => {
    try {
        const { idOrSlug } = req.params;
        const limit = Math.min(Number(req.query.limit) || 3, 10);
        const data = await articleService.getRelatedArticles(idOrSlug, limit);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/articles/:idOrSlug - Single article
 */
router.get('/:idOrSlug', optionalAuth, async (req, res, next) => {
    try {
        const data = await articleService.getArticleByIdOrSlug(req.params.idOrSlug, req.user);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/articles - Create article
 */
router.post('/', authenticate, requireRole('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const data = createArticleSchema.parse(req.body);
        const article = await articleService.createArticle(data, req.user.userId);
        res.status(201).json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/articles/:id - Update article
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const data = updateArticleSchema.parse(req.body);
        const article = await articleService.updateArticle(req.params.id, data, req.user);
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/articles/:id
 */
router.delete('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        await articleService.deleteArticle(req.params.id, req.user.userId);
        res.json({ success: true, message: 'تم حذف المقال بنجاح' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/articles/:id/restore — Restore soft-deleted article (admin only)
 */
router.post('/:id/restore', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const article = await articleService.restoreArticle(req.params.id, req.user.userId);
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/articles/:id/publish
 */
router.post('/:id/publish', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const article = await articleService.publishArticle(req.params.id, req.user.userId);
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/articles/:id/archive
 */
router.post('/:id/archive', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const article = await articleService.archiveArticle(req.params.id, req.user.userId);
        res.json({ success: true, data: article });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=article.routes.js.map