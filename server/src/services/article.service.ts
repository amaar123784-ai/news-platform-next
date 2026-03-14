/**
 * Article Service
 * 
 * Business logic for article CRUD, publishing, caching, and social distribution.
 * Extracted from article.routes.ts to follow Single Responsibility Principle.
 */

import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { cache, cacheKeys, cacheTTL } from './cache.service.js';
import { sanitizeHtml, sanitizeText } from '../utils/sanitize.js';
import { ArticleStatus, CommentStatus } from '@prisma/client';

// ============= TYPES =============

interface ArticleQuery {
    page: number;
    perPage: number;
    category?: string;
    tag?: string;
    status?: string;
    authorId?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
    isBreaking?: boolean;
    isFeatured?: boolean;
}

interface ArticleUser {
    userId: string;
    role: string;
}

interface CreateArticleData {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
    status?: string;
    imageUrl?: string | null;
    tags?: string[];
    seoTitle?: string;
    seoDesc?: string;
    isBreaking?: boolean;
}

interface UpdateArticleData {
    title?: string;
    excerpt?: string;
    content?: string;
    categoryId?: string;
    tags?: string[];
    status?: string;
    imageUrl?: string | null;
    seoTitle?: string;
    seoDesc?: string;
    isBreaking?: boolean;
    isFeatured?: boolean;
    [key: string]: any;
}

// ============= HELPERS =============

/**
 * Generate a URL-friendly slug from a title (supports Arabic)
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\u0621-\u064Aa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);
}

// Common article includes
const ARTICLE_LIST_INCLUDE = {
    author: { select: { id: true, name: true, avatar: true } },
    category: { select: { id: true, name: true, slug: true, color: true } },
    tags: { include: { tag: true } },
    _count: { select: { comments: true } },
};

const ARTICLE_DETAIL_INCLUDE = {
    author: { select: { id: true, name: true, avatar: true, bio: true } },
    category: { select: { id: true, name: true, slug: true, color: true } },
    tags: { include: { tag: true } },
    comments: {
        where: { status: CommentStatus.APPROVED, parentId: null },
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            replies: {
                where: { status: CommentStatus.APPROVED },
                include: { author: { select: { id: true, name: true, avatar: true } } },
            },
        },
        orderBy: { createdAt: 'desc' } as const,
        take: 20,
    },
};

const ARTICLE_BASIC_INCLUDE = {
    author: { select: { id: true, name: true } },
    category: { select: { id: true, name: true, slug: true } },
};

// ============= SERVICE METHODS =============

/**
 * List articles with filtering, pagination, and search
 */
export async function listArticles(query: ArticleQuery, user?: ArticleUser | null) {
    const { page, perPage, category, tag, status, authorId, search, sortBy, sortOrder, isBreaking, isFeatured } = query;

    // Build where clause
    const where: any = {};

    // Public users can only see published articles
    if (!user || user.role === 'READER') {
        where.status = 'PUBLISHED';
    } else if (status) {
        where.status = status;
    }

    if (category) where.category = { slug: category };
    if (tag) {
        where.tags = {
            some: {
                tag: {
                    slug: tag
                }
            }
        };
    }
    if (authorId) where.authorId = authorId;

    // Filter by isBreaking or isFeatured
    if (isBreaking !== undefined) where.isBreaking = isBreaking;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    if (search) {
        // Use MySQL FULLTEXT search (@@fulltext index on title, excerpt, content)
        where.title = { search };
        where.excerpt = { search };
    }

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            include: ARTICLE_LIST_INCLUDE,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * perPage,
            take: perPage,
        }),
        prisma.article.count({ where }),
    ]);

    return {
        data: articles,
        meta: {
            currentPage: page,
            totalPages: Math.ceil(total / perPage),
            totalItems: total,
            perPage,
        },
    };
}

/**
 * Get featured articles with caching
 */
export async function getFeaturedArticles(limit: number) {
    const cacheKey = cacheKeys.featuredArticles(limit);

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED', isFeatured: true },
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            category: { select: { id: true, name: true, slug: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    await cache.set(cacheKey, articles, cacheTTL.featured);
    return articles;
}

/**
 * Get breaking news articles with caching
 */
export async function getBreakingNews(limit: number) {
    const cacheKey = cacheKeys.breakingNews();

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED', isBreaking: true },
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            category: { select: { id: true, name: true, slug: true, color: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });

    await cache.set(cacheKey, articles, cacheTTL.breaking);
    return articles;
}

/**
 * Get articles related to a given article (same category)
 */
export async function getRelatedArticles(idOrSlug: string, limit: number) {
    const article = await prisma.article.findFirst({
        where: {
            OR: [{ slug: idOrSlug }, { id: idOrSlug }]
        },
        select: { id: true, categoryId: true }
    });

    if (!article) {
        throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
    }

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

    return related;
}

/**
 * Get a single article by ID or slug, with access control and view tracking
 */
export async function getArticleByIdOrSlug(idOrSlug: string, user?: ArticleUser | null) {
    const article = await prisma.article.findFirst({
        where: {
            OR: [{ slug: idOrSlug }, { id: idOrSlug }]
        },
        include: ARTICLE_DETAIL_INCLUDE,
    });

    if (!article) {
        throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
    }

    // Check access for unpublished
    if (article.status !== 'PUBLISHED') {
        if (!user || (user.role === 'READER' && user.userId !== article.authorId)) {
            throw createError(403, 'ليس لديك صلاحية لعرض هذا المقال', 'FORBIDDEN');
        }
    }

    // Increment views via Redis (batched flush to DB)
    cache.incrementViewCount(article.id).catch(() => { });

    return article;
}

/**
 * Create a new article with sanitization, slug generation, and image processing
 */
export async function createArticle(data: CreateArticleData, userId: string) {
    // Sanitize content to prevent stored XSS
    const sanitizedContent = sanitizeHtml(data.content);
    const sanitizedTitle = sanitizeText(data.title);
    const sanitizedExcerpt = sanitizeText(data.excerpt);

    // Generate unique slug with retry on race condition
    let slug = generateSlug(sanitizedTitle);
    const baseSlug = slug;

    // Calculate read time (roughly 200 words per minute)
    const wordCount = sanitizedContent.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    // Handle external image - download to local media library
    let finalImageUrl = data.imageUrl;
    if (data.imageUrl && (data.imageUrl.startsWith('http://') || data.imageUrl.startsWith('https://')) && !data.imageUrl.includes('/uploads/')) {
        try {
            const { imageProcessor } = await import('./imageProcessor.js');
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

            console.log(`[Article] Downloaded external image: ${data.imageUrl} -> ${finalImageUrl}`);
        } catch (imgError: any) {
            console.warn(`[Article] Failed to download image: ${imgError.message}. Using original URL.`);
        }
    }

    // Wrap creation in a transaction — article + activity log must succeed together
    let article: any;
    let attempts = 0;
    while (attempts < 3) {
        try {
            article = await prisma.$transaction(async (tx) => {
                const created = await tx.article.create({
                    data: {
                        title: sanitizedTitle,
                        slug,
                        excerpt: sanitizedExcerpt,
                        content: sanitizedContent,
                        categoryId: data.categoryId,
                        authorId: userId,
                        status: (data.status as ArticleStatus) || ArticleStatus.DRAFT,
                        imageUrl: finalImageUrl,
                        seoTitle: data.seoTitle ? sanitizeText(data.seoTitle) : undefined,
                        seoDesc: data.seoDesc ? sanitizeText(data.seoDesc) : undefined,
                        isBreaking: data.isBreaking,
                        readTime,
                    },
                    include: ARTICLE_BASIC_INCLUDE,
                });

                await tx.activityLog.create({
                    data: {
                        action: 'CREATE',
                        targetType: 'article',
                        targetId: created.id,
                        targetTitle: created.title,
                        userId,
                    },
                });

                return created;
            });
            break; // success — exit retry loop
        } catch (err: any) {
            // Unique constraint on slug — retry with random suffix
            if (err.code === 'P2002' && err.meta?.target?.includes('slug')) {
                attempts++;
                slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
            } else {
                throw err; // re-throw unrelated errors
            }
        }
    }
    if (!article) throw createError(500, 'فشل إنشاء المقال بعد عدة محاولات', 'SLUG_CONFLICT');

    // Trigger Webhook and Social Posting if Published
    if (article.status === 'PUBLISHED') {
        await Promise.all([
            cache.invalidatePattern('articles:featured:*'),
            cache.invalidatePattern('articles:breaking'),
        ]);

        const { webhookService } = await import('./webhook.service.js');
        webhookService.notifyNewArticle(article.id).catch(err => {
            console.error(`[Webhook] Failed to notify n8n for article ${article.id}:`, err);
        });

        const { publishToSocialChannels } = await import('./socialPublisher.service.js');
        publishToSocialChannels(article).catch(console.error);
    }

    return article;
}

/**
 * Update an existing article with ownership checks and cache invalidation
 */
export async function updateArticle(id: string, data: UpdateArticleData, user: ArticleUser) {
    const { categoryId, tags, ...updateData } = data;

    // Check ownership (unless admin/editor) — exclude soft-deleted
    const existing = await prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
        throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
    }

    if (user.role === 'JOURNALIST' && existing.authorId !== user.userId) {
        throw createError(403, 'لا يمكنك تعديل مقالات الآخرين', 'FORBIDDEN');
    }

    // Sanitize updated content fields
    const sanitized: any = { ...updateData };
    if (sanitized.content) sanitized.content = sanitizeHtml(sanitized.content);
    if (sanitized.title) sanitized.title = sanitizeText(sanitized.title);
    if (sanitized.excerpt) sanitized.excerpt = sanitizeText(sanitized.excerpt);
    if (sanitized.seoTitle) sanitized.seoTitle = sanitizeText(sanitized.seoTitle);
    if (sanitized.seoDesc) sanitized.seoDesc = sanitizeText(sanitized.seoDesc);

    const article = await prisma.article.update({
        where: { id },
        data: {
            ...sanitized,
            ...(categoryId && { category: { connect: { id: categoryId } } }),
            ...(sanitized.content && { readTime: Math.max(1, Math.ceil(sanitized.content.split(/\s+/).length / 200)) }),
        },
        include: ARTICLE_BASIC_INCLUDE,
    });

    // Log activity (fire-and-forget for performance)
    prisma.activityLog.create({
        data: {
            action: 'UPDATE',
            targetType: 'article',
            targetId: article.id,
            targetTitle: article.title,
            userId: user.userId,
        },
    }).catch(console.error);

    // Trigger Webhook and Social Posting if status changed to PUBLISHED
    if (article.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
        const { webhookService } = await import('./webhook.service.js');
        webhookService.notifyNewArticle(article.id).catch(err => {
            console.error(`[Webhook] Failed to notify n8n for article ${article.id}:`, err);
        });

        const { publishToSocialChannels } = await import('./socialPublisher.service.js');
        publishToSocialChannels(article).catch(console.error);
    }

    // Invalidate caches
    await Promise.all([
        cache.invalidatePattern('articles:featured:*'),
        cache.invalidatePattern('articles:breaking'),
        cache.del(cacheKeys.article(existing.slug)),
        cache.del(cacheKeys.article(article.slug)), // In case slug changed
    ]);

    return article;
}

/**
 * Soft-delete an article
 */
export async function deleteArticle(id: string, userId: string) {
    const article = await prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) {
        throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
    }

    // Soft-delete: set deletedAt instead of destroying the record
    await prisma.article.update({ where: { id }, data: { deletedAt: new Date() } });

    // Log activity (fire-and-forget for performance)
    prisma.activityLog.create({
        data: {
            action: 'DELETE',
            targetType: 'article',
            targetId: id,
            targetTitle: article.title,
            userId,
        },
    }).catch(console.error);

    // Invalidate caches
    await Promise.all([
        cache.invalidatePattern('articles:featured:*'),
        cache.invalidatePattern('articles:breaking'),
        cache.del(cacheKeys.article(article.slug)),
    ]);
}

/**
 * Restore a soft-deleted article
 */
export async function restoreArticle(id: string, userId: string) {
    const article = await prisma.article.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!article) {
        throw createError(404, 'المقال غير موجود أو لم يتم حذفه', 'ARTICLE_NOT_FOUND');
    }

    const restored = await prisma.article.update({
        where: { id },
        data: { deletedAt: null as any },
        include: ARTICLE_BASIC_INCLUDE,
    });

    prisma.activityLog.create({
        data: {
            action: 'RESTORE',
            targetType: 'article',
            targetId: id,
            targetTitle: article.title,
            userId,
        },
    }).catch(console.error);

    return restored;
}

/**
 * Publish an article and trigger social distribution
 */
export async function publishArticle(id: string, userId: string) {
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
            userId,
        },
    }).catch(console.error);

    // Invalidate caches
    await Promise.all([
        cache.invalidatePattern('articles:featured:*'),
        cache.invalidatePattern('articles:breaking'),
        cache.del(cacheKeys.article(article.slug)),
    ]);

    // Publish to social channels
    const { publishToSocialChannels } = await import('./socialPublisher.service.js');
    publishToSocialChannels(article).catch(console.error);

    return article;
}

/**
 * Archive an article
 */
export async function archiveArticle(id: string, userId: string) {
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
            userId,
        },
    }).catch(console.error);

    // Invalidate caches
    await Promise.all([
        cache.invalidatePattern('articles:featured:*'),
        cache.invalidatePattern('articles:breaking'),
        cache.del(cacheKeys.article(article.slug)),
    ]);

    return article;
}
