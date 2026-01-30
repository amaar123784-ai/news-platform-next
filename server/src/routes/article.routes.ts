/**
 * Article Routes
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { createArticleSchema, updateArticleSchema, articleQuerySchema } from '../validators/schemas.js';
import { cache, cacheKeys, cacheTTL } from '../services/cache.service.js';

const router = Router();

// Helper to generate slug
function generateSlug(title: string): string {
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
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const query = articleQuerySchema.parse(req.query);
        const { page, perPage, category, status, authorId, search, sortBy, sortOrder, isBreaking, isFeatured } = query;

        // Build where clause
        const where: any = {};

        // Public users can only see published articles
        if (!req.user || req.user.role === 'READER') {
            where.status = 'PUBLISHED';
        } else if (status) {
            where.status = status;
        }

        if (category) where.category = { slug: category };
        if (authorId) where.authorId = authorId;

        // Filter by isBreaking or isFeatured
        if (isBreaking !== undefined) where.isBreaking = isBreaking;
        if (isFeatured !== undefined) where.isFeatured = isFeatured;

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { excerpt: { contains: search } },
            ];
        }

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
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
            prisma.article.count({ where }),
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
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/featured - Featured articles (cached)
 */
router.get('/featured', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 20);
        const cacheKey = cacheKeys.featuredArticles(limit);

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached });
        }

        const articles = await prisma.article.findMany({
            where: {
                status: 'PUBLISHED',
                isFeatured: true
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                category: { select: { id: true, name: true, slug: true, color: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // Cache result
        await cache.set(cacheKey, articles, cacheTTL.featured);

        res.json({ success: true, data: articles });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/breaking - Breaking news articles (cached)
 */
router.get('/breaking', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 10, 20);
        const cacheKey = cacheKeys.breakingNews();

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached });
        }

        const articles = await prisma.article.findMany({
            where: {
                status: 'PUBLISHED',
                isBreaking: true
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                category: { select: { id: true, name: true, slug: true, color: true } },
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        });

        // Cache result (shorter TTL for breaking news)
        await cache.set(cacheKey, articles, cacheTTL.breaking);

        res.json({ success: true, data: articles });
    } catch (error) {
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

        // Find source article to get category
        const article = await prisma.article.findFirst({
            where: {
                OR: [
                    { slug: idOrSlug },
                    { id: idOrSlug }
                ]
            },
            select: { id: true, categoryId: true }
        });

        if (!article) {
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }

        // Find related articles (same category)
        const related = await prisma.article.findMany({
            where: {
                categoryId: article.categoryId,
                id: { not: article.id },
                status: 'PUBLISHED'
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                category: { select: { id: true, name: true, slug: true, color: true } },
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        });

        res.json({ success: true, data: related });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/:idOrSlug - Single article
 */
router.get('/:idOrSlug', optionalAuth, async (req, res, next) => {
    try {
        const { idOrSlug } = req.params;

        const article = await prisma.article.findFirst({
            where: {
                OR: [
                    { slug: idOrSlug },
                    { id: idOrSlug }
                ]
            },
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
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }

        // Check access for unpublished
        if (article.status !== 'PUBLISHED') {
            if (!req.user || (req.user.role === 'READER' && req.user.userId !== article.authorId)) {
                throw createError(403, 'ليس لديك صلاحية لعرض هذا المقال', 'FORBIDDEN');
            }
        }

        // Increment views (don't await)
        prisma.article.update({
            where: { id: article.id },
            data: { views: { increment: 1 } },
        }).catch(() => { });

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/articles - Create article
 */
router.post('/', authenticate, requireRole('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const data = createArticleSchema.parse(req.body);

        // Generate unique slug
        let slug = generateSlug(data.title);
        const existing = await prisma.article.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        // Calculate read time (roughly 200 words per minute)
        const wordCount = data.content.split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        // Handle external image - download to local media library
        let finalImageUrl = data.imageUrl;
        if (data.imageUrl && (data.imageUrl.startsWith('http://') || data.imageUrl.startsWith('https://')) && !data.imageUrl.includes('/uploads/')) {
            try {
                const { imageProcessor } = await import('../services/imageProcessor.js');
                const axios = (await import('axios')).default;

                const response = await axios.get(data.imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: { 'User-Agent': 'YemenNewsBot/1.0' },
                    maxContentLength: 10 * 1024 * 1024
                });

                const buffer = Buffer.from(response.data);
                const originalName = 'rss-image-' + Date.now() + '.jpg';
                const processed = await imageProcessor.process(buffer, originalName);
                finalImageUrl = processed.url;

                // Save to Media library
                await prisma.media.create({
                    data: {
                        filename: processed.filename,
                        url: processed.url,
                        type: processed.mimeType,
                        size: processed.size,
                        uploaderId: req.user!.userId, // Associate with current user
                        alt: data.title // Use article title as alt text default
                    }
                });

                console.log(`[Article] Downloaded external image: ${data.imageUrl} -> ${finalImageUrl} (Saved to Media Library)`);
            } catch (imgError: any) {
                console.warn(`[Article] Failed to download image: ${imgError.message}. Using original URL.`);
                // Keep original URL as fallback
            }
        }

        const article = await prisma.article.create({
            data: {
                title: data.title,
                slug,
                excerpt: data.excerpt,
                content: data.content,
                categoryId: data.categoryId,
                authorId: req.user!.userId,
                status: data.status || 'DRAFT',
                imageUrl: finalImageUrl,
                seoTitle: data.seoTitle,
                seoDesc: data.seoDesc,
                isBreaking: data.isBreaking,
                readTime,
            },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        // Log activity (fire-and-forget for performance)
        prisma.activityLog.create({
            data: {
                action: 'CREATE',
                targetType: 'article',
                targetId: article.id,
                targetTitle: article.title,
                userId: req.user!.userId,
            },
        }).catch(console.error);

        // Trigger Webhook if Published
        if (article.status === 'PUBLISHED') {
            // Invalidate caches
            await Promise.all([
                cache.invalidatePattern('articles:featured:*'),
                cache.invalidatePattern('articles:breaking'),
            ]);

            const { webhookService } = await import('../services/webhook.service.js');
            webhookService.notifyNewArticle(article.id).catch(err => {
                console.error(`[Webhook] Failed to notify n8n for article ${article.id}:`, err);
            });
        }

        res.status(201).json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/articles/:id - Update article
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { categoryId, tags, ...updateData } = updateArticleSchema.parse(req.body);

        // Check ownership (unless admin/editor)
        const existing = await prisma.article.findUnique({ where: { id } });
        if (!existing) {
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }

        if (req.user!.role === 'JOURNALIST' && existing.authorId !== req.user!.userId) {
            throw createError(403, 'لا يمكنك تعديل مقالات الآخرين', 'FORBIDDEN');
        }

        const article = await prisma.article.update({
            where: { id },
            data: {
                ...updateData,
                ...(categoryId && { category: { connect: { id: categoryId } } }),
                ...(updateData.content && { readTime: Math.max(1, Math.ceil(updateData.content.split(/\s+/).length / 200)) }),
            },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        // Log activity (fire-and-forget for performance)
        prisma.activityLog.create({
            data: {
                action: 'UPDATE',
                targetType: 'article',
                targetId: article.id,
                targetTitle: article.title,
                userId: req.user!.userId,
            },
        }).catch(console.error);

        // Trigger Webhook if status changed to PUBLISHED
        if (article.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
            const { webhookService } = await import('../services/webhook.service.js');
            webhookService.notifyNewArticle(article.id).catch(err => {
                console.error(`[Webhook] Failed to notify n8n for article ${article.id}:`, err);
            });
        }

        // Invalidate caches
        await Promise.all([
            cache.invalidatePattern('articles:featured:*'),
            cache.invalidatePattern('articles:breaking'),
            cache.del(cacheKeys.article(existing.slug)),
            cache.del(cacheKeys.article(article.slug)), // In case slug changed
        ]);

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/articles/:id
 */
router.delete('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const article = await prisma.article.findUnique({ where: { id } });
        if (!article) {
            throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
        }

        await prisma.article.delete({ where: { id } });

        // Log activity (fire-and-forget for performance)
        prisma.activityLog.create({
            data: {
                action: 'DELETE',
                targetType: 'article',
                targetId: id,
                targetTitle: article.title,
                userId: req.user!.userId,
            },
        }).catch(console.error);

        // Invalidate caches
        await Promise.all([
            cache.invalidatePattern('articles:featured:*'),
            cache.invalidatePattern('articles:breaking'),
            cache.del(cacheKeys.article(article.slug)),
        ]);

        res.json({ success: true, message: 'تم حذف المقال بنجاح' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/articles/:id/publish
 */
router.post('/:id/publish', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const article = await prisma.article.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });

        // Log activity (fire-and-forget for performance)
        prisma.activityLog.create({
            data: {
                action: 'PUBLISH',
                targetType: 'article',
                targetId: id,
                targetTitle: article.title,
                userId: req.user!.userId,
            },
        }).catch(console.error);

        // Invalidate caches
        await Promise.all([
            cache.invalidatePattern('articles:featured:*'),
            cache.invalidatePattern('articles:breaking'),
            cache.del(cacheKeys.article(article.slug)),
        ]);

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/articles/:id/archive
 */
router.post('/:id/archive', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const article = await prisma.article.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });

        // Log activity (fire-and-forget for performance)
        prisma.activityLog.create({
            data: {
                action: 'ARCHIVE',
                targetType: 'article',
                targetId: id,
                targetTitle: article.title,
                userId: req.user!.userId,
            },
        }).catch(console.error);

        // Invalidate caches
        await Promise.all([
            cache.invalidatePattern('articles:featured:*'),
            cache.invalidatePattern('articles:breaking'),
            cache.del(cacheKeys.article(article.slug)),
        ]);

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

export default router;
