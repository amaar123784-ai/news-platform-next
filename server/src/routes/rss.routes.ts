/**
 * RSS Management Routes
 * Admin endpoints for managing RSS sources and moderation queue
 * Public endpoint for fetching aggregated news
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { fetchRSSFeed, fetchAllActiveFeeds, cleanupOldArticles, getRSSStats, downloadRSSImage } from '../services/rss.service.js';
import { rewriteArticle, isAIEnabled } from '../services/ai.service.js';
import { automationService } from '../services/automation.service.js';
import { z } from 'zod';

const router = Router();

// ============= VALIDATION SCHEMAS =============

const createSourceSchema = z.object({
    name: z.string().min(1, 'اسم المصدر مطلوب').max(100),
    feedUrl: z.string().url('رابط RSS غير صالح'),
    websiteUrl: z.string().url().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid('معرف التصنيف غير صالح'),
    fetchInterval: z.number().min(5).max(1440).default(15),
    applyFilter: z.boolean().default(true),
});

const updateSourceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    feedUrl: z.string().url().optional(),
    websiteUrl: z.string().url().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional(),
    fetchInterval: z.number().min(5).max(1440).optional(),
    isActive: z.boolean().optional(),
    applyFilter: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'PAUSED']).optional(),
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
 * Returns approved articles from all RSS sources
 */
router.get('/articles', async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
        const categoryId = req.query.categoryId as string | undefined;
        const categorySlug = req.query.category as string | undefined;

        const where: any = { status: 'APPROVED' };

        // Filter by category ID or slug
        if (categoryId) {
            where.source = { categoryId };
        } else if (categorySlug) {
            where.source = { category: { slug: categorySlug } };
        }

        const [articles, total] = await Promise.all([
            prisma.rSSArticle.findMany({
                where,
                include: {
                    source: {
                        select: {
                            name: true,
                            logoUrl: true,
                            websiteUrl: true,
                            category: {
                                select: { id: true, name: true, slug: true }
                            }
                        },
                    },
                },
                orderBy: { publishedAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma.rSSArticle.count({ where }),
        ]);

        res.json({
            success: true,
            data: articles,
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

// ============= ADMIN: SOURCES MANAGEMENT =============

/**
 * GET /api/rss/sources - List all RSS sources
 */
router.get('/sources', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const sources = await prisma.rSSSource.findMany({
            include: {
                category: { select: { id: true, name: true, slug: true, color: true } },
                _count: { select: { articles: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: sources });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/rss/sources/:id - Get single RSS source details
 */
router.get('/sources/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const source = await prisma.rSSSource.findUnique({
            where: { id: req.params.id },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { articles: true } },
                articles: {
                    take: 10,
                    orderBy: { publishedAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        publishedAt: true,
                    },
                },
            },
        });

        if (!source) {
            throw createError(404, 'المصدر غير موجود', 'RSS_SOURCE_NOT_FOUND');
        }

        res.json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/sources - Add new RSS source
 */
router.post('/sources', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = createSourceSchema.parse(req.body);

        // Check if feed URL already exists
        const existing = await prisma.rSSSource.findUnique({
            where: { feedUrl: data.feedUrl },
        });

        if (existing) {
            throw createError(400, 'هذا المصدر موجود بالفعل', 'RSS_SOURCE_EXISTS');
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            throw createError(400, 'التصنيف غير موجود', 'CATEGORY_NOT_FOUND');
        }

        const source = await prisma.rSSSource.create({
            data: {
                name: data.name,
                feedUrl: data.feedUrl,
                websiteUrl: data.websiteUrl,
                logoUrl: data.logoUrl,
                description: data.description,
                categoryId: data.categoryId,
                fetchInterval: data.fetchInterval,
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'CREATE',
                targetType: 'rss_source',
                targetId: source.id,
                targetTitle: source.name,
                userId: req.user!.userId,
            },
        });

        res.status(201).json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/rss/sources/:id - Update RSS source
 */
router.patch('/sources/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = updateSourceSchema.parse(req.body);

        const source = await prisma.rSSSource.update({
            where: { id: req.params.id },
            data,
            include: {
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        res.json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/rss/sources/:id - Remove RSS source and its articles
 */
router.delete('/sources/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const source = await prisma.rSSSource.findUnique({
            where: { id: req.params.id },
        });

        if (!source) {
            throw createError(404, 'المصدر غير موجود', 'RSS_SOURCE_NOT_FOUND');
        }

        await prisma.rSSSource.delete({
            where: { id: req.params.id },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'DELETE',
                targetType: 'rss_source',
                targetId: source.id,
                targetTitle: source.name,
                userId: req.user!.userId,
            },
        });

        res.json({ success: true, message: 'تم حذف المصدر بنجاح' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/sources/:id/fetch - Manually trigger feed fetch
 */
router.post('/sources/:id/fetch', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const result = await fetchRSSFeed(req.params.id);

        res.json({
            success: result.success,
            data: {
                newArticles: result.newArticles,
                errors: result.errors,
            },
            message: result.success
                ? `تم جلب ${result.newArticles} مقال جديد`
                : 'فشل جلب الأخبار',
        });
    } catch (error) {
        next(error);
    }
});

// ============= ADMIN: MODERATION =============

/**
```
    }
});

// ============= ADMIN: SOURCES MANAGEMENT =============

/**
 * GET /api/rss/sources - List all RSS sources
 */
router.get('/sources', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const sources = await prisma.rSSSource.findMany({
            include: {
                category: { select: { id: true, name: true, slug: true, color: true } },
                _count: { select: { articles: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: sources });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/rss/sources/:id - Get single RSS source details
 */
router.get('/sources/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const source = await prisma.rSSSource.findUnique({
            where: { id: req.params.id },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { articles: true } },
                articles: {
                    take: 10,
                    orderBy: { publishedAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        publishedAt: true,
                    },
                },
            },
        });

        if (!source) {
            throw createError(404, 'المصدر غير موجود', 'RSS_SOURCE_NOT_FOUND');
        }

        res.json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/sources - Add new RSS source
 */
router.post('/sources', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = createSourceSchema.parse(req.body);

        // Check if feed URL already exists
        const existing = await prisma.rSSSource.findUnique({
            where: { feedUrl: data.feedUrl },
        });

        if (existing) {
            throw createError(400, 'هذا المصدر موجود بالفعل', 'RSS_SOURCE_EXISTS');
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            throw createError(400, 'التصنيف غير موجود', 'CATEGORY_NOT_FOUND');
        }

        const source = await prisma.rSSSource.create({
            data: {
                name: data.name,
                feedUrl: data.feedUrl,
                websiteUrl: data.websiteUrl,
                logoUrl: data.logoUrl,
                description: data.description,
                categoryId: data.categoryId,
                fetchInterval: data.fetchInterval,
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'CREATE',
                targetType: 'rss_source',
                targetId: source.id,
                targetTitle: source.name,
                userId: req.user!.userId,
            },
        });

        res.status(201).json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/rss/sources/:id - Update RSS source
 */
router.patch('/sources/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const data = updateSourceSchema.parse(req.body);

        const source = await prisma.rSSSource.update({
            where: { id: req.params.id },
            data,
            include: {
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        res.json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/rss/sources/:id - Remove RSS source and its articles
 */
router.delete('/sources/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const source = await prisma.rSSSource.findUnique({
            where: { id: req.params.id },
        });

        if (!source) {
            throw createError(404, 'المصدر غير موجود', 'RSS_SOURCE_NOT_FOUND');
        }

        await prisma.rSSSource.delete({
            where: { id: req.params.id },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'DELETE',
                targetType: 'rss_source',
                targetId: source.id,
                targetTitle: source.name,
                userId: req.user!.userId,
            },
        });

        res.json({ success: true, message: 'تم حذف المصدر بنجاح' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/sources/:id/fetch - Manually trigger feed fetch
 */
router.post('/sources/:id/fetch', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const result = await fetchRSSFeed(req.params.id);

        res.json({
            success: result.success,
            data: {
                newArticles: result.newArticles,
                errors: result.errors,
            },
            message: result.success
                ? `تم جلب ${result.newArticles} مقال جديد`
                : 'فشل جلب الأخبار',
        });
    } catch (error) {
        next(error);
    }
});

// ============= ADMIN: MODERATION =============

/**
 * GET /api/rss/moderation/sources - Get sources with pending articles
 */
router.get('/moderation/sources', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const sources = await prisma.rSSSource.findMany({
            where: {
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                category: { select: { id: true, name: true, color: true } },
                _count: {
                    select: {
                        articles: { where: { status: 'PENDING' } }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({ success: true, data: sources });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/rss/moderation - Articles pending review
 */
router.get('/moderation', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 50));
        const status = (req.query.status as string) || 'PENDING';
        const sourceId = req.query.sourceId as string | undefined;
        const categoryId = req.query.categoryId as string | undefined;

        const where: any = { status };

        if (sourceId) {
            where.sourceId = sourceId;
        }

        if (categoryId) {
            where.source = {
                ...where.source,
                categoryId
            };
        }

        const [articles, total] = await Promise.all([
            prisma.rSSArticle.findMany({
                where,
                include: {
                    source: {
                        select: {
                            id: true,
                            name: true,
                            logoUrl: true,
                            category: { select: { name: true, color: true } }
                        }
                    },
                },
                orderBy: { fetchedAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma.rSSArticle.count({ where }),
        ]);

        res.json({
            success: true,
            data: articles,
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
 * GET /api/rss/articles/:id - Get single RSS article details
 */
router.get('/articles/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const article = await prisma.rSSArticle.findUnique({
            where: { id: req.params.id },
            include: {
                source: {
                    select: {
                        name: true,
                        logoUrl: true,
                        category: { select: { id: true, name: true, slug: true } }
                    }
                }
            }
        });

        if (!article) {
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/rss/articles/:id - Approve/reject single article
 */
router.patch('/articles/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { status } = updateArticleStatusSchema.parse(req.body);

        const article = await prisma.rSSArticle.update({
            where: { id: req.params.id },
            data: {
                status,
                approvedAt: status === 'APPROVED' ? new Date() : null,
                approvedById: status === 'APPROVED' ? req.user!.userId : null,
            },
            include: {
                source: { select: { name: true } },
            },
        });

        // Trigger automation pipeline for approved articles
        if (status === 'APPROVED') {
            // Download image locally only when article is approved (saves storage)
            if (article.imageUrl && article.imageUrl.startsWith('http')) {
                try {
                    const localImageUrl = await downloadRSSImage(article.imageUrl);
                    if (localImageUrl && localImageUrl !== article.imageUrl) {
                        await prisma.rSSArticle.update({
                            where: { id: req.params.id },
                            data: { imageUrl: localImageUrl }
                        });
                        console.log(`[RSS] Downloaded image for approved article: ${article.id}`);
                    }
                } catch (err: any) {
                    console.error(`[RSS] Failed to download image for ${article.id}:`, err.message);
                }
            }

            automationService.startAutomation(req.params.id).catch(err => {
                console.error('[RSS] Failed to start automation:', err.message);
            });
        }

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/articles/bulk - Bulk approve/reject articles
 */
router.post('/articles/bulk', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { ids, status } = bulkUpdateSchema.parse(req.body);

        const result = await prisma.rSSArticle.updateMany({
            where: { id: { in: ids } },
            data: {
                status,
                approvedAt: status === 'APPROVED' ? new Date() : null,
                approvedById: status === 'APPROVED' ? req.user!.userId : null,
            },
        });

        res.json({
            success: true,
            message: `تم تحديث ${result.count} مقال`,
            data: { updatedCount: result.count },
        });

        // Trigger automation pipeline for all approved articles
        if (status === 'APPROVED') {
            ids.forEach(id => {
                automationService.startAutomation(id).catch(err => {
                    console.error(`[RSS] Failed to start automation for ${id}:`, err.message);
                });
            });
        }
    } catch (error) {
        next(error);
    }
});

// ============= ADMIN: AI REWRITING =============

/**
 * POST /api/rss/articles/:id/rewrite - Rewrite single article with AI
 */
router.post('/articles/:id/rewrite', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        if (!isAIEnabled()) {
            throw createError(400, 'خدمة الذكاء الاصطناعي غير مفعلة', 'AI_NOT_ENABLED');
        }

        const article = await prisma.rSSArticle.findUnique({
            where: { id: req.params.id },
        });

        if (!article) {
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }

        // Use fullContent if available for better AI rewriting
        const contentToRewrite = article.fullContent || article.excerpt || '';
        const result = await rewriteArticle(article.title, contentToRewrite);

        if (!result) {
            throw createError(500, 'فشل إعادة صياغة المقال', 'REWRITE_FAILED');
        }

        const updated = await prisma.rSSArticle.update({
            where: { id: req.params.id },
            data: {
                rewrittenTitle: result.rewrittenTitle,
                rewrittenExcerpt: result.rewrittenExcerpt,
                isRewritten: true,
                rewrittenAt: new Date(),
            },
        });

        res.json({
            success: true,
            message: 'تم إعادة صياغة المقال بنجاح',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/articles/bulk-rewrite - Bulk rewrite articles with AI
 */
router.post('/articles/bulk-rewrite', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        if (!isAIEnabled()) {
            throw createError(400, 'خدمة الذكاء الاصطناعي غير مفعلة', 'AI_NOT_ENABLED');
        }

        const { ids } = z.object({
            ids: z.array(z.string().uuid()).min(1).max(10, 'الحد الأقصى 10 مقالات'),
        }).parse(req.body);

        const articles = await prisma.rSSArticle.findMany({
            where: { id: { in: ids } },
        });

        let successCount = 0;
        const results: any[] = [];

        for (const article of articles) {
            try {
                const result = await rewriteArticle(article.title, article.excerpt || '');
                if (result) {
                    await prisma.rSSArticle.update({
                        where: { id: article.id },
                        data: {
                            rewrittenTitle: result.rewrittenTitle,
                            rewrittenExcerpt: result.rewrittenExcerpt,
                            isRewritten: true,
                            rewrittenAt: new Date(),
                        },
                    });
                    successCount++;
                    results.push({ id: article.id, success: true });
                } else {
                    results.push({ id: article.id, success: false, error: 'فشل الصياغة' });
                }
            } catch (err: any) {
                results.push({ id: article.id, success: false, error: err.message });
            }

            // Small delay between API calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        res.json({
            success: true,
            message: `تم إعادة صياغة ${successCount} من ${articles.length} مقال`,
            data: { successCount, totalCount: articles.length, results },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/rss/ai-status - Check AI service status
 */
router.get('/ai-status', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res) => {
    res.json({
        success: true,
        data: { enabled: isAIEnabled() },
    });
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
            message: `تم جلب ${result.totalNewArticles} مقال جديد من ${result.sourcesChecked} مصدر`,
            data: result,
        });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
        next(error);
    }
});

export default router;
