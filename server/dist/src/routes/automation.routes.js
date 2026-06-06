/**
 * Automation Routes
 * API endpoints for automation queue management
 */
import { Router } from 'express';
import { automationService } from '../services/automation.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
// ============= ADMIN ROUTES =============
/**
 * GET /api/automation/queue - List automation queue
 */
router.get('/queue', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
        const status = req.query.status;
        const result = await automationService.getQueue({ page, perPage, status });
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/automation/queue/:id/retry - Retry failed automation
 */
router.post('/queue/:id/retry', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        await automationService.retryAutomation(req.params.id);
        res.json({
            success: true,
            message: 'تم إعادة تشغيل الأتمتة'
        });
    }
    catch (error) {
        next(error);
    }
});
// ============= N8N INTERNAL ROUTES =============
/**
 * GET /api/automation/pending-social - Get posts ready for social media
 * Called by n8n to fetch posts that need to be published
 */
router.get('/pending-social', async (req, res, next) => {
    try {
        // Simple API key auth for n8n
        const apiKey = req.headers['x-api-key'];
        const expectedKey = process.env.N8N_API_KEY || 'n8n-secret-key';
        if (apiKey !== expectedKey) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const posts = await automationService.getPendingSocialPosts();
        // Format posts for n8n
        const formattedPosts = posts.map((post) => ({
            queueId: post.id,
            articleId: post.createdArticleId,
            title: post.aiRewrittenTitle || post.rssArticle.title,
            excerpt: post.aiRewrittenExcerpt || post.rssArticle.excerpt,
            imageUrl: post.rssArticle.imageUrl,
            category: post.rssArticle.source.category?.name || 'أخبار',
            categorySlug: post.rssArticle.source.category?.slug || 'news',
            articleUrl: `https://voiceoftihama.com/article/${post.createdArticleId}`, // Will need to be slug
            platform: post.socialPlatform
        }));
        res.json({
            success: true,
            data: formattedPosts,
            count: formattedPosts.length
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/automation/social-callback - Callback from n8n after posting
 */
router.post('/social-callback', async (req, res, next) => {
    try {
        // Simple API key auth for n8n
        const apiKey = req.headers['x-api-key'];
        const expectedKey = process.env.N8N_API_KEY || 'n8n-secret-key';
        if (apiKey !== expectedKey) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { queueId, success, postId, error } = req.body;
        if (!queueId) {
            return res.status(400).json({ success: false, error: 'queueId is required' });
        }
        if (success) {
            await automationService.markSocialPosted(queueId, postId || '');
        }
        else {
            await automationService.markSocialFailed(queueId, error || 'Unknown error');
        }
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=automation.routes.js.map