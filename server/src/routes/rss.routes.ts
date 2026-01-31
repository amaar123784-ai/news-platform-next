/**
 * RSS Management Routes
 * Admin endpoints for managing RSS sources and moderation queue
 * Public endpoint for fetching aggregated news
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { fetchRSSFeed, fetchAllActiveFeeds, cleanupOldArticles, getRSSStats, downloadRSSImage } from '../services/rss.service.js';
import { rewriteArticle, isAIEnabled } from '../services/ai.service.js';
import { automationService } from '../services/automation.service.js';
import { z } from 'zod';

const router = Router();

// ============= VALIDATION SCHEMAS =============

// Feed schema for creating/updating individual feeds
const feedSchema = z.object({
    feedUrl: z.string().url('رابط RSS غير صالح'),
    categoryId: z.string().uuid('معرف التصنيف غير صالح'),
    fetchInterval: z.number().min(5).max(1440).default(15),
    applyFilter: z.boolean().default(true),
});

// Source with feeds - for creating new source with its feeds
const createSourceSchema = z.object({
    name: z.string().min(1, 'اسم المصدر مطلوب').max(100),
    websiteUrl: z.string().url().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    feeds: z.array(feedSchema).min(1, 'يجب إضافة رابط واحد على الأقل'),
});

// Update source (metadata only)
const updateSourceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    websiteUrl: z.string().url().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});

// Update feed
const updateFeedSchema = z.object({
    feedUrl: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
    fetchInterval: z.number().min(5).max(1440).optional(),
    applyFilter: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});

// Add feed to existing source
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
 * Returns approved articles from all RSS feeds
 */
router.get('/articles', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
        const categoryId = req.query.categoryId as string | undefined;
        const categorySlug = req.query.category as string | undefined;

        const where: any = { status: 'APPROVED' };

        // Filter by category ID or slug via feed relation
        if (categoryId) {
            where.feed = { categoryId };
        } else if (categorySlug) {
            where.feed = { category: { slug: categorySlug } };
        }

        const [articles, total] = await Promise.all([
            prisma.rSSArticle.findMany({
                where,
                include: {
                    feed: {
                        select: {
                            categoryId: true,
                            category: { select: { id: true, name: true, slug: true, color: true } },
                            source: { select: { name: true, logoUrl: true, websiteUrl: true } }
                        }
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

// ============= ADMIN: SOURCE MANAGEMENT =============

/**
 * GET /api/rss/sources - List all RSS sources with their feeds
 */
router.get('/sources', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sources = await prisma.rSSSource.findMany({
            include: {
                feeds: {
                    include: {
                        category: { select: { id: true, name: true, slug: true, color: true } },
                        _count: { select: { articles: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { name: 'asc' },
        });

        // Add computed stats for each source
        const sourcesWithStats = sources.map((source: any) => ({
            ...source,
            _count: {
                articles: source.feeds.reduce((sum: number, feed: any) => sum + feed._count.articles, 0),
                feeds: source.feeds.length
            }
        }));

        res.json({ success: true, data: sourcesWithStats });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/rss/sources/:id - Get single source with feeds
 */
router.get('/sources/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const source = await prisma.rSSSource.findUnique({
            where: { id: req.params.id },
            include: {
                feeds: {
                    include: {
                        category: { select: { id: true, name: true, slug: true } },
                        _count: { select: { articles: true } }
                    }
                }
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
 * POST /api/rss/sources - Create new RSS source with feeds
 */
router.post('/sources', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = createSourceSchema.parse(req.body);

        // Check for duplicate feed URLs
        const existingFeeds = await prisma.rSSFeed.findMany({
            where: { feedUrl: { in: data.feeds.map((f: any) => f.feedUrl) } },
            select: { feedUrl: true }
        });

        if (existingFeeds.length > 0) {
            throw createError(400, `رابط RSS موجود مسبقاً: ${existingFeeds.map((f: any) => f.feedUrl).join(', ')}`, 'DUPLICATE_FEED_URL');
        }

        // Create source with nested feeds
        const source = await prisma.rSSSource.create({
            data: {
                name: data.name,
                websiteUrl: data.websiteUrl,
                logoUrl: data.logoUrl,
                description: data.description,
                feeds: {
                    create: data.feeds.map((feed: any) => ({
                        feedUrl: feed.feedUrl,
                        categoryId: feed.categoryId,
                        fetchInterval: feed.fetchInterval,
                        applyFilter: feed.applyFilter,
                        status: 'ACTIVE',
                    }))
                }
            },
            include: {
                feeds: {
                    include: {
                        category: { select: { id: true, name: true, slug: true } }
                    }
                }
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'CREATE',
                targetType: 'rss_source',
                targetId: source.id,
                targetTitle: source.name,
                userId: (req as any).user!.userId,
            },
        });

        res.status(201).json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/rss/sources/:id - Update source metadata
 */
router.patch('/sources/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateSourceSchema.parse(req.body);

        const source = await prisma.rSSSource.update({
            where: { id: req.params.id },
            data,
            include: {
                feeds: {
                    include: {
                        category: { select: { id: true, name: true, slug: true } }
                    }
                }
            },
        });

        res.json({ success: true, data: source });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/rss/sources/:id - Delete source and all its feeds/articles
 */
router.delete('/sources/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
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
                userId: (req as any).user!.userId,
            },
        });

        res.json({ success: true, message: 'تم حذف المصدر بنجاح' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/sources/:id/fetch - Fetch all feeds for a source
 */
router.post('/sources/:id/fetch', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get all feeds for this source
        const feeds = await prisma.rSSFeed.findMany({
            where: { sourceId: req.params.id, status: 'ACTIVE' }
        });

        if (feeds.length === 0) {
            throw createError(404, 'لا توجد روابط نشطة لهذا المصدر', 'NO_ACTIVE_FEEDS');
        }

        const results = await Promise.all(
            feeds.map((f: any) => fetchRSSFeed(f.id))
        );

        const totalNewArticles = results.reduce((sum: number, r: any) => sum + (r.newArticles || 0), 0);
        const successCount = results.filter((r: any) => r.success).length;
        const errors = results.flatMap((r: any) => r.errors || []);

        res.json({
            success: true,
            data: {
                feedsChecked: feeds.length,
                successCount,
                newArticles: totalNewArticles,
                errors,
            },
            message: `تم جلب ${totalNewArticles} مقال جديد من ${successCount} رابط`,
        });
    } catch (error) {
        next(error);
    }
});

// ============= ADMIN: FEED MANAGEMENT =============

/**
 * POST /api/rss/sources/:id/feeds - Add new feed to existing source
 */
router.post('/sources/:id/feeds', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = addFeedSchema.parse(req.body);

        // Check source exists
        const source = await prisma.rSSSource.findUnique({
            where: { id: req.params.id }
        });

        if (!source) {
            throw createError(404, 'المصدر غير موجود', 'RSS_SOURCE_NOT_FOUND');
        }

        // Check for duplicate
        const existingFeed = await prisma.rSSFeed.findUnique({
            where: { feedUrl: data.feedUrl }
        });

        if (existingFeed) {
            throw createError(400, 'رابط RSS موجود مسبقاً', 'DUPLICATE_FEED_URL');
        }

        const feed = await prisma.rSSFeed.create({
            data: {
                feedUrl: data.feedUrl,
                sourceId: req.params.id,
                categoryId: data.categoryId,
                fetchInterval: data.fetchInterval,
                applyFilter: data.applyFilter,
                status: 'ACTIVE',
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        res.status(201).json({ success: true, data: feed });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/rss/feeds/:id - Update feed settings
 */
router.patch('/feeds/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateFeedSchema.parse(req.body);

        const feed = await prisma.rSSFeed.update({
            where: { id: req.params.id },
            data,
            include: {
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        res.json({ success: true, data: feed });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/rss/feeds/:id - Delete a feed
 */
router.delete('/feeds/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const feed = await prisma.rSSFeed.findUnique({
            where: { id: req.params.id },
            include: { source: { select: { name: true } } },
        });

        if (!feed) {
            throw createError(404, 'الرابط غير موجود', 'FEED_NOT_FOUND');
        }

        await prisma.rSSFeed.delete({
            where: { id: req.params.id },
        });

        res.json({ success: true, message: 'تم حذف الرابط بنجاح' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/feeds/:id/fetch - Fetch a single feed
 */
router.post('/feeds/:id/fetch', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
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
 * GET /api/rss/moderation/sources - Get sources with pending articles count
 */
router.get('/moderation/sources', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sources = await prisma.rSSSource.findMany({
            where: { isActive: true },
            include: {
                feeds: {
                    include: {
                        category: { select: { id: true, name: true, color: true } },
                        _count: { select: { articles: { where: { status: 'PENDING' } } } }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        const formattedSources = sources.map((source: any) => ({
            id: source.id,
            name: source.name,
            logoUrl: source.logoUrl,
            _count: {
                articles: source.feeds.reduce((sum: number, feed: any) => sum + feed._count.articles, 0)
            }
        }));

        res.json({ success: true, data: formattedSources });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/rss/moderation - Articles for review
 */
router.get('/moderation', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 50));
        const status = (req.query.status as string) || 'PENDING';
        const sourceId = req.query.sourceId as string | undefined;
        const categoryId = req.query.categoryId as string | undefined;

        const where: any = { status };

        if (sourceId) {
            where.feed = { sourceId };
        }

        if (categoryId) {
            where.feed = { ...where.feed, categoryId };
        }

        const [articles, total] = await Promise.all([
            prisma.rSSArticle.findMany({
                where,
                include: {
                    feed: {
                        select: {
                            id: true,
                            source: { select: { id: true, name: true, logoUrl: true } },
                            category: { select: { id: true, name: true, color: true } }
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
router.get('/articles/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await prisma.rSSArticle.findUnique({
            where: { id: req.params.id },
            include: {
                feed: {
                    select: {
                        id: true,
                        source: { select: { name: true, logoUrl: true } },
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
router.patch('/articles/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = updateArticleStatusSchema.parse(req.body);

        const article = await prisma.rSSArticle.update({
            where: { id: req.params.id },
            data: {
                status,
                approvedAt: status === 'APPROVED' ? new Date() : null,
                approvedById: status === 'APPROVED' ? (req as any).user!.userId : null,
            },
            include: {
                feed: { select: { source: { select: { name: true } } } },
            },
        });

        // Trigger automation pipeline for approved articles
        if (status === 'APPROVED') {
            // Download image locally when article is approved
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

            automationService.startAutomation(req.params.id).catch((err: any) => {
                console.error('[RSS] Failed to start automation:', err.message);
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: status === 'APPROVED' ? 'approve' : 'reject',
                targetType: 'rss_article',
                targetId: article.id,
                targetTitle: article.title,
                userId: (req as any).user!.userId,
            },
        });

        res.json({
            success: true,
            data: article,
            message: status === 'APPROVED' ? 'تم اعتماد المقال' : 'تم رفض المقال',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/articles/bulk-update - Bulk approve/reject articles
 */
router.post('/articles/bulk-update', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids, status } = bulkUpdateSchema.parse(req.body);

        const result = await prisma.rSSArticle.updateMany({
            where: { id: { in: ids } },
            data: {
                status,
                approvedAt: status === 'APPROVED' ? new Date() : null,
                approvedById: status === 'APPROVED' ? (req as any).user!.userId : null,
            },
        });

        // Trigger automation for all approved articles
        if (status === 'APPROVED') {
            for (const id of ids) {
                automationService.startAutomation(id).catch((err: any) => {
                    console.error(`[RSS] Failed to start automation for ${id}:`, err.message);
                });
            }
        }

        res.json({
            success: true,
            message: `تم ${status === 'APPROVED' ? 'اعتماد' : 'رفض'} ${result.count} مقال`,
            data: { count: result.count },
        });
    } catch (error) {
        next(error);
    }
});

// ============= AI REWRITE =============

/**
 * POST /api/rss/articles/:id/rewrite - AI rewrite single article
 */
router.post('/articles/:id/rewrite', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await prisma.rSSArticle.findUnique({
            where: { id: req.params.id },
        });

        if (!article) {
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }

        const result = await rewriteArticle(article.title, article.excerpt || '');

        if (result) {
            await prisma.rSSArticle.update({
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
                message: 'تم إعادة صياغة المقال',
                data: result,
            });
        } else {
            throw createError(500, 'فشل إعادة الصياغة', 'REWRITE_FAILED');
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/articles/bulk-rewrite - Bulk AI rewrite
 */
router.post('/articles/bulk-rewrite', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(req.body);

        const articles = await prisma.rSSArticle.findMany({
            where: { id: { in: ids } },
        });

        const results: { id: string; success: boolean; error?: string }[] = [];
        let successCount = 0;

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

            // Small delay between API calls
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
router.get('/ai-status', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
    res.json({
        success: true,
        data: { enabled: isAIEnabled() },
    });
});

// ============= ADMIN: OPERATIONS =============

/**
 * POST /api/rss/fetch-all - Fetch all active feeds
 */
router.post('/fetch-all', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await fetchAllActiveFeeds();

        res.json({
            success: true,
            message: `تم جلب ${result.totalNewArticles} مقال جديد من ${result.feedsChecked} رابط`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rss/cleanup - Cleanup old articles
 */
router.post('/cleanup', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/stats', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await getRSSStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

export default router;
