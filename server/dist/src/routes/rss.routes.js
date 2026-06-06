/**
 * RSS Management Routes
 *
 * Thin controller layer — delegates all business logic to rssAdmin.service.ts
 * and rss.service.ts. Validation schemas remain here as part of request parsing.
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { fetchAllActiveFeeds, cleanupOldArticles, getRSSStats } from '../services/rss.service.js';
import { isAIEnabled } from '../services/ai.service.js';
import * as rssAdmin from '../services/rssAdmin.service.js';
import { z } from 'zod';
const router = Router();
// ============= VALIDATION SCHEMAS =============
const feedSchema = z.object({
    feedUrl: z.string().url('رابط RSS غير صالح'),
    categoryId: z.string().uuid('معرف التصنيف غير صالح'),
    fetchInterval: z.number().min(5).max(1440).default(15),
    applyFilter: z.boolean().default(true),
});
const createSourceSchema = z.object({
    name: z.string().min(1, 'اسم المصدر مطلوب').max(100),
    websiteUrl: z.string().url().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    feeds: z.array(feedSchema).min(1, 'يجب إضافة رابط واحد على الأقل'),
});
const updateSourceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    websiteUrl: z.string().url().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});
const updateFeedSchema = z.object({
    feedUrl: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
    fetchInterval: z.number().min(5).max(1440).optional(),
    applyFilter: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});
const addFeedSchema = z.object({
    feedUrl: z.string().url('رابط RSS غير صالح'),
    categoryId: z.string().uuid('معرف التصنيف غير صالح'),
    fetchInterval: z.number().min(5).max(1440).default(15),
    applyFilter: z.boolean().default(true),
});
const updateArticleStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
});
const bulkUpdateSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'يجب تحديد مقال واحد على الأقل'),
    status: z.enum(['APPROVED', 'REJECTED']),
});
// ============= PUBLIC ROUTES =============
/**
 * GET /api/rss/articles - Public aggregated news
 */
router.get('/articles', async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
        const categoryId = req.query.categoryId;
        const categorySlug = req.query.category;
        const result = await rssAdmin.listPublicArticles(page, perPage, categoryId, categorySlug);
        res.json({ success: true, ...result });
    }
    catch (error) {
        next(error);
    }
});
// ============= ADMIN: SOURCE MANAGEMENT =============
/**
 * GET /api/rss/sources - List all RSS sources with their feeds
 */
router.get('/sources', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = await rssAdmin.listSources();
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/rss/sources/:id - Get single source with feeds
 */
router.get('/sources/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = await rssAdmin.getSource(req.params.id);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/rss/sources - Create new RSS source with feeds
 */
router.post('/sources', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = createSourceSchema.parse(req.body);
        const source = await rssAdmin.createSource(data, req.user.userId);
        res.status(201).json({ success: true, data: source });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/rss/sources/:id - Update source metadata
 */
router.patch('/sources/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = updateSourceSchema.parse(req.body);
        const source = await rssAdmin.updateSource(req.params.id, data);
        res.json({ success: true, data: source });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/rss/sources/:id - Delete source and all its feeds/articles
 */
router.delete('/sources/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        await rssAdmin.deleteSource(req.params.id, req.user.userId);
        res.json({ success: true, message: 'تم حذف المصدر بنجاح' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/rss/sources/:id/fetch - Fetch all feeds for a source
 */
router.post('/sources/:id/fetch', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const result = await rssAdmin.fetchSourceFeeds(req.params.id);
        res.json({
            success: true,
            data: result,
            message: `تم جلب ${result.newArticles} مقال جديد من ${result.successCount} رابط`,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============= ADMIN: FEED MANAGEMENT =============
/**
 * POST /api/rss/sources/:id/feeds - Add new feed to existing source
 */
router.post('/sources/:id/feeds', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = addFeedSchema.parse(req.body);
        const feed = await rssAdmin.addFeed(req.params.id, data);
        res.status(201).json({ success: true, data: feed });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/rss/feeds/:id - Update feed settings
 */
router.patch('/feeds/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = updateFeedSchema.parse(req.body);
        const feed = await rssAdmin.updateFeed(req.params.id, data);
        res.json({ success: true, data: feed });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/rss/feeds/:id - Delete a feed
 */
router.delete('/feeds/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        await rssAdmin.deleteFeed(req.params.id);
        res.json({ success: true, message: 'تم حذف الرابط بنجاح' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/rss/feeds/:id/fetch - Fetch a single feed
 */
router.post('/feeds/:id/fetch', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { fetchRSSFeed } = await import('../services/rss.service.js');
        const result = await fetchRSSFeed(req.params.id);
        res.json({
            success: result.success,
            data: { newArticles: result.newArticles, errors: result.errors },
            message: result.success
                ? `تم جلب ${result.newArticles} مقال جديد`
                : 'فشل جلب الأخبار',
        });
    }
    catch (error) {
        next(error);
    }
});
// ============= ADMIN: MODERATION =============
/**
 * GET /api/rss/moderation/sources - Get sources with pending articles count
 */
router.get('/moderation/sources', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = await rssAdmin.getModerationSources();
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/rss/moderation - Articles for review
 */
router.get('/moderation', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 50));
        const status = req.query.status || 'PENDING';
        const sourceId = req.query.sourceId;
        const categoryId = req.query.categoryId;
        const result = await rssAdmin.getModerationArticles(page, perPage, status, sourceId, categoryId);
        res.json({ success: true, ...result });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/rss/articles/:id - Get single RSS article details
 */
router.get('/articles/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const data = await rssAdmin.getArticle(req.params.id);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/rss/articles/:id - Approve/reject single article
 */
router.patch('/articles/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { status } = updateArticleStatusSchema.parse(req.body);
        const article = await rssAdmin.updateArticleStatus(req.params.id, status, req.user.userId);
        res.json({
            success: true,
            data: article,
            message: status === 'APPROVED' ? 'تم اعتماد المقال' : 'تم رفض المقال',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/rss/articles/bulk-update - Bulk approve/reject articles
 */
router.post('/articles/bulk-update', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { ids, status } = bulkUpdateSchema.parse(req.body);
        const count = await rssAdmin.bulkUpdateStatus(ids, status, req.user.userId);
        res.json({
            success: true,
            message: `تم ${status === 'APPROVED' ? 'اعتماد' : 'رفض'} ${count} مقال`,
            data: { count },
        });
    }
    catch (error) {
        next(error);
    }
});
// ============= AI REWRITE =============
/**
 * POST /api/rss/articles/:id/rewrite - AI rewrite single article
 */
router.post('/articles/:id/rewrite', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const result = await rssAdmin.rewriteSingleArticle(req.params.id);
        res.json({ success: true, message: 'تم إعادة صياغة المقال', data: result });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/rss/articles/bulk-rewrite - Bulk AI rewrite
 */
router.post('/articles/bulk-rewrite', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(req.body);
        const result = await rssAdmin.bulkRewrite(ids);
        res.json({
            success: true,
            message: `تم إعادة صياغة ${result.successCount} من ${result.totalCount} مقال`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/rss/ai-status - Check AI service status
 */
router.get('/ai-status', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res) => {
    res.json({ success: true, data: { enabled: isAIEnabled() } });
});
// ============= ADMIN: OPERATIONS =============
/**
 * POST /api/rss/fetch-all - Fetch all active feeds
 */
router.post('/fetch-all', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const result = await fetchAllActiveFeeds();
        res.json({
            success: true,
            message: `تم جلب ${result.totalNewArticles} مقال جديد من ${result.feedsChecked} رابط`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/rss/cleanup - Cleanup old articles
 */
router.post('/cleanup', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const daysOld = Math.min(365, Math.max(7, Number(req.query.days) || 30));
        const count = await cleanupOldArticles(daysOld);
        res.json({
            success: true,
            message: `تم حذف ${count} مقال قديم`,
            data: { deletedCount: count },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/rss/stats - Get RSS statistics
 */
router.get('/stats', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const stats = await getRSSStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/rss/feeds/validate - Validate an RSS feed URL before saving
 */
router.post('/feeds/validate', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const { url } = z.object({ url: z.string().url() }).parse(req.body);
        const data = await rssAdmin.validateFeedUrl(url);
        res.json({
            success: true,
            data,
            message: `✅ رابط صالح - ${data.itemCount} مقال`,
        });
    }
    catch (error) {
        res.json({
            success: false,
            message: `❌ رابط غير صالح: ${error.message}`,
        });
    }
});
export default router;
//# sourceMappingURL=rss.routes.js.map