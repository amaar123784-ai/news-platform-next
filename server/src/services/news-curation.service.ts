/**
 * News Curation Service
 * Auto-manages featured articles based on engagement and relevance scoring.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Local/regional category slugs that get a relevance boost */
const LOCAL_SLUGS = ['local', 'yemen', 'tihama', 'politics'];

/**
 * Score an article for featured ranking.
 * - views = primary factor
 * - has image = +1
 * - local category = +2
 */
function scoreArticle(article: {
    views: number;
    imageUrl: string | null;
    category: { slug: string } | null;
}): number {
    let score = article.views;
    if (article.imageUrl) score += 1;
    if (article.category && LOCAL_SLUGS.includes(article.category.slug)) score += 2;
    return score;
}

/**
 * Refresh featured articles.
 * - Fetches PUBLISHED articles from the last 24 hours
 * - Scores them and picks the top 5
 * - Preserves manually-pinned articles (featured for < 48h)
 */
export async function refreshFeaturedArticles(): Promise<{ featured: number }> {
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // 1. Get all published articles from the last 24 hours
    const recentArticles = await prisma.article.findMany({
        where: {
            status: 'PUBLISHED',
            publishedAt: { gte: cutoff24h },
        },
        select: {
            id: true,
            views: true,
            imageUrl: true,
            isFeatured: true,
            publishedAt: true,
            category: { select: { slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
    });

    // 2. Score and sort
    const scored = recentArticles.map(a => ({
        id: a.id,
        score: scoreArticle(a),
        wasFeatured: a.isFeatured,
        publishedAt: a.publishedAt,
    })).sort((a, b) => b.score - a.score);

    // 3. Pick top 5
    const topIds = scored.slice(0, 5).map(a => a.id);

    // 4. Find manually-pinned articles that are still within 48h window
    //    (articles that were featured BEFORE this run and are older than 24h but within 48h)
    const manuallyPinned = await prisma.article.findMany({
        where: {
            isFeatured: true,
            status: 'PUBLISHED',
            publishedAt: { gte: cutoff48h, lt: cutoff24h },
        },
        select: { id: true },
    });
    const pinnedIds = manuallyPinned.map(a => a.id);

    // 5. Combine: top 5 + manually pinned
    const featuredIds = [...new Set([...topIds, ...pinnedIds])];

    // 6. Unfeature everything, then feature the selected ones
    await prisma.article.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
    });

    if (featuredIds.length > 0) {
        await prisma.article.updateMany({
            where: { id: { in: featuredIds } },
            data: { isFeatured: true },
        });
    }

    console.log(`[Curation] Featured ${featuredIds.length} articles (${topIds.length} by score, ${pinnedIds.length} pinned)`);

    // 7. Invalidate cache
    try {
        const { cache } = await import('./cache.service.js');
        await cache.invalidatePattern('articles:featured:*');
    } catch {
        // Cache may not be available
    }

    return { featured: featuredIds.length };
}

/**
 * Expire breaking news older than the specified hours.
 */
export async function expireBreakingNews(maxAgeHours: number = 6): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    const result = await prisma.article.updateMany({
        where: {
            isBreaking: true,
            publishedAt: { lt: cutoff },
        },
        data: { isBreaking: false },
    });

    if (result.count > 0) {
        console.log(`[Curation] Expired ${result.count} breaking articles (older than ${maxAgeHours}h)`);

        try {
            const { cache } = await import('./cache.service.js');
            await cache.invalidatePattern('articles:breaking');
        } catch {
            // Cache may not be available
        }
    }

    return result.count;
}
