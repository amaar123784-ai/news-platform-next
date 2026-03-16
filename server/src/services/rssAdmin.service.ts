/**
 * RSS Admin Service
 * 
 * Business logic for RSS source/feed management, moderation queue,
 * and AI rewrite operations. The existing rss.service.ts handles
 * low-level feed fetching/parsing and remains unchanged.
 */

import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { fetchRSSFeed, downloadRSSImage } from './rss.service.js';
import { rewriteArticle } from './ai.service.js';
import { automationService } from './automation.service.js';

// ============= TYPES =============

interface CreateSourceData {
    name: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    feeds: Array<{
        feedUrl: string;
        categoryId: string;
        fetchInterval: number;
        applyFilter: boolean;
    }>;
}

interface UpdateSourceData {
    name?: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    isActive?: boolean;
}

interface AddFeedData {
    feedUrl: string;
    categoryId: string;
    fetchInterval: number;
    applyFilter: boolean;
}

interface UpdateFeedData {
    feedUrl?: string;
    categoryId?: string;
    fetchInterval?: number;
    applyFilter?: boolean;
    status?: 'ACTIVE' | 'PAUSED';
}

// ============= PUBLIC =============

/**
 * List approved RSS articles (public endpoint)
 */
export async function listPublicArticles(
    page: number,
    perPage: number,
    categoryId?: string,
    categorySlug?: string
) {
    const where: any = { status: 'APPROVED' };

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

// ============= SOURCE MANAGEMENT =============

/**
 * List all RSS sources with computed stats
 */
export async function listSources() {
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

    return sources.map((source: any) => ({
        ...source,
        _count: {
            articles: source.feeds.reduce((sum: number, feed: any) => sum + feed._count.articles, 0),
            feeds: source.feeds.length
        }
    }));
}

/**
 * Get a single source with its feeds
 */
export async function getSource(id: string) {
    const source = await prisma.rSSSource.findUnique({
        where: { id },
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

    return source;
}

/**
 * Create a new RSS source with feeds
 */
export async function createSource(data: CreateSourceData, userId: string) {
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
            userId,
        },
    });

    return source;
}

/**
 * Update source metadata
 */
export async function updateSource(id: string, data: UpdateSourceData) {
    return prisma.rSSSource.update({
        where: { id },
        data,
        include: {
            feeds: {
                include: {
                    category: { select: { id: true, name: true, slug: true } }
                }
            }
        },
    });
}

/**
 * Delete a source and all its feeds/articles
 */
export async function deleteSource(id: string, userId: string) {
    const source = await prisma.rSSSource.findUnique({
        where: { id },
    });

    if (!source) {
        throw createError(404, 'المصدر غير موجود', 'RSS_SOURCE_NOT_FOUND');
    }

    await prisma.rSSSource.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
        data: {
            action: 'DELETE',
            targetType: 'rss_source',
            targetId: source.id,
            targetTitle: source.name,
            userId,
        },
    });
}

/**
 * Fetch all active feeds for a source
 */
export async function fetchSourceFeeds(sourceId: string) {
    const feeds = await prisma.rSSFeed.findMany({
        where: { sourceId, status: 'ACTIVE' }
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

    return {
        feedsChecked: feeds.length,
        successCount,
        newArticles: totalNewArticles,
        errors,
    };
}

// ============= FEED MANAGEMENT =============

/**
 * Add a new feed to an existing source
 */
export async function addFeed(sourceId: string, data: AddFeedData) {
    // Check source exists
    const source = await prisma.rSSSource.findUnique({ where: { id: sourceId } });
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

    return prisma.rSSFeed.create({
        data: {
            feedUrl: data.feedUrl,
            sourceId,
            categoryId: data.categoryId,
            fetchInterval: data.fetchInterval,
            applyFilter: data.applyFilter,
            status: 'ACTIVE',
        },
        include: {
            category: { select: { id: true, name: true, slug: true } },
        },
    });
}

/**
 * Update feed settings
 */
export async function updateFeed(feedId: string, data: UpdateFeedData) {
    return prisma.rSSFeed.update({
        where: { id: feedId },
        data,
        include: {
            category: { select: { id: true, name: true, slug: true } },
        },
    });
}

/**
 * Delete a feed
 */
export async function deleteFeed(feedId: string) {
    const feed = await prisma.rSSFeed.findUnique({
        where: { id: feedId },
        include: { source: { select: { name: true } } },
    });

    if (!feed) {
        throw createError(404, 'الرابط غير موجود', 'FEED_NOT_FOUND');
    }

    await prisma.rSSFeed.delete({ where: { id: feedId } });
}

// ============= MODERATION =============

/**
 * Get sources with pending article counts for moderation sidebar
 */
export async function getModerationSources() {
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

    return sources.map((source: any) => ({
        id: source.id,
        name: source.name,
        logoUrl: source.logoUrl,
        _count: {
            articles: source.feeds.reduce((sum: number, feed: any) => sum + feed._count.articles, 0)
        }
    }));
}

/**
 * List articles for moderation review
 */
export async function getModerationArticles(
    page: number,
    perPage: number,
    status: string,
    sourceId?: string,
    categoryId?: string
) {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const where: any = { 
        status,
        fetchedAt: {
            gte: fortyEightHoursAgo
        }
    };

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
 * Get a single RSS article by ID
 */
export async function getArticle(id: string) {
    const article = await prisma.rSSArticle.findUnique({
        where: { id },
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

    return article;
}

/**
 * Approve or reject a single article
 */
export async function updateArticleStatus(id: string, status: 'APPROVED' | 'REJECTED', userId: string) {
    const article = await prisma.rSSArticle.update({
        where: { id },
        data: {
            status,
            approvedAt: status === 'APPROVED' ? new Date() : null,
            approvedById: status === 'APPROVED' ? userId : null,
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
                        where: { id },
                        data: { imageUrl: localImageUrl }
                    });
                    console.log(`[RSS] Downloaded image for approved article: ${article.id}`);
                }
            } catch (err: any) {
                console.error(`[RSS] Failed to download image for ${article.id}:`, err.message);
            }
        }

        automationService.startAutomation(id).catch((err: any) => {
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
            userId,
        },
    });

    return article;
}

/**
 * Bulk approve/reject articles
 */
export async function bulkUpdateStatus(ids: string[], status: 'APPROVED' | 'REJECTED', userId: string) {
    const result = await prisma.rSSArticle.updateMany({
        where: { id: { in: ids } },
        data: {
            status,
            approvedAt: status === 'APPROVED' ? new Date() : null,
            approvedById: status === 'APPROVED' ? userId : null,
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

    return result.count;
}

// ============= AI REWRITE =============

/**
 * AI rewrite a single article
 */
export async function rewriteSingleArticle(id: string) {
    const article = await prisma.rSSArticle.findUnique({
        where: { id },
    });

    if (!article) {
        throw createError(404, 'المقال غير موجود', 'ARTICLE_NOT_FOUND');
    }

    const result = await rewriteArticle(article.title, article.excerpt || '');

    if (!result) {
        throw createError(500, 'فشل إعادة الصياغة', 'REWRITE_FAILED');
    }

    await prisma.rSSArticle.update({
        where: { id },
        data: {
            rewrittenTitle: result.rewrittenTitle,
            rewrittenExcerpt: result.rewrittenExcerpt,
            isRewritten: true,
            rewrittenAt: new Date(),
        },
    });

    return result;
}

/**
 * Bulk AI rewrite multiple articles
 */
export async function bulkRewrite(ids: string[]) {
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

    return { successCount, totalCount: articles.length, results };
}

// ============= FEED VALIDATION =============

/**
 * Validate an RSS feed URL by attempting to parse it
 */
export async function validateFeedUrl(url: string) {
    const Parser = (await import('rss-parser')).default;
    const parser = new Parser({
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YemenNewsBot/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
    });

    const feed = await parser.parseURL(url);

    return {
        title: feed.title,
        description: feed.description,
        itemCount: feed.items?.length || 0,
        lastItem: feed.items?.[0] ? {
            title: feed.items[0].title,
            pubDate: feed.items[0].pubDate,
        } : null,
    };
}
