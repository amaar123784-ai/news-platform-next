/**
 * RSS Feed Service
 * Handles fetching, parsing, and storing RSS feed content
 */

import Parser from 'rss-parser';
import crypto from 'crypto';
import { prisma } from '../index.js';

// Custom parser with Arabic-friendly settings
const parser = new Parser({
    timeout: 30000,
    headers: {
        'User-Agent': 'YemenNewsBot/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
        ],
    },
});

/**
 * Hash title for duplicate detection
 * Normalizes Arabic text by removing diacritics and whitespace
 */
function hashTitle(title: string): string {
    const normalized = title
        .toLowerCase()
        .replace(/[\s\u200B-\u200D\uFEFF]/g, '') // Remove whitespace & zero-width chars
        .replace(/[\u064B-\u0652]/g, '')          // Remove Arabic diacritics
        .replace(/[^\u0600-\u06FF\w]/g, '');      // Keep Arabic + alphanumeric only
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Helper to ensure absolute URL
 */
function ensureAbsoluteUrl(url: string | undefined | null, baseUrl: string): string | null {
    if (!url) return null;
    try {
        return new URL(url, baseUrl).toString();
    } catch {
        return null;
    }
}

/**
 * Extract image URL from feed item
 * Checks multiple common feed image formats and resolves relative URLs
 */
function extractImage(item: any, feedLink: string): string | null {
    let imageUrl: string | null = null;

    // Check enclosure (common in podcasts and some feeds)
    if (item.enclosure?.url && item.enclosure?.type?.startsWith('image/')) {
        imageUrl = item.enclosure.url;
    }
    // Check media:content
    else if (item.mediaContent?.$?.url) {
        imageUrl = item.mediaContent.$.url;
    }
    // Check media:thumbnail
    else if (item.mediaThumbnail?.$?.url) {
        imageUrl = item.mediaThumbnail.$.url;
    }
    // Try to extract from content or description
    else {
        const content = item.content || item['content:encoded'] || item.description || '';
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
            imageUrl = imgMatch[1];
        }
    }

    return ensureAbsoluteUrl(imageUrl, feedLink);
}

/**
 * Truncate excerpt to specified length (Arabic-aware)
 */
function truncateExcerpt(text: string | undefined, maxLength = 200): string {
    if (!text) return '';

    // Remove HTML tags
    const cleaned = text.replace(/<[^>]*>/g, '').trim();

    if (cleaned.length <= maxLength) return cleaned;

    // Try to break at word boundary
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength - 50) {
        return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
}

/**
 * Fetch and parse a single RSS feed source
 */
export async function fetchRSSFeed(sourceId: string): Promise<{
    success: boolean;
    newArticles: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let newArticles = 0;

    try {
        const source = await prisma.rSSSource.findUnique({
            where: { id: sourceId },
        });

        if (!source) {
            return { success: false, newArticles: 0, errors: ['المصدر غير موجود'] };
        }

        if (source.status !== 'ACTIVE') {
            return { success: false, newArticles: 0, errors: ['المصدر متوقف أو به خطأ'] };
        }

        console.log(`[RSS] Fetching feed: ${source.name} (${source.feedUrl})`);

        const feed = await parser.parseURL(source.feedUrl);
        console.log(`[RSS] Parsed ${feed.items.length} items from ${source.name}`);

        for (const item of feed.items) {
            // Skip items without a unique identifier
            if (!item.guid && !item.link) {
                errors.push('تم تخطي مقال بدون معرف فريد');
                continue;
            }

            const guid = item.guid || item.link!;
            const title = item.title || 'بدون عنوان';
            const titleHash = hashTitle(title);

            // Check for duplicates by GUID
            const existingByGuid = await prisma.rSSArticle.findUnique({
                where: { guid },
            });

            if (existingByGuid) {
                continue; // Already have this article
            }

            // Check for duplicates by similar title (same source)
            const existingByTitle = await prisma.rSSArticle.findFirst({
                where: {
                    titleHash,
                    sourceId: source.id,
                },
            });

            if (existingByTitle) {
                continue; // Similar article already exists
            }

            try {
                await prisma.rSSArticle.create({
                    data: {
                        guid,
                        title,
                        excerpt: truncateExcerpt(item.contentSnippet || item.content || (item as any).description),
                        sourceUrl: item.link || '',
                        imageUrl: extractImage(item, source.websiteUrl || source.feedUrl),
                        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        titleHash,
                        sourceId: source.id,
                        status: source.autoApprove ? 'APPROVED' : 'PENDING',
                        approvedAt: source.autoApprove ? new Date() : null,
                    },
                });
                newArticles++;
            } catch (err: any) {
                const errorMsg = `فشل حفظ المقال: ${title.substring(0, 50)}`;
                errors.push(errorMsg);
                console.error(`[RSS] ${errorMsg}:`, err.message);
            }
        }

        // Update source with successful fetch
        await prisma.rSSSource.update({
            where: { id: sourceId },
            data: {
                lastFetchedAt: new Date(),
                errorCount: 0,
                lastError: null,
                status: 'ACTIVE',
            },
        });

        console.log(`[RSS] Completed ${source.name}: ${newArticles} new articles`);
        return { success: true, newArticles, errors };

    } catch (error: any) {
        console.error(`[RSS] Error fetching source ${sourceId}:`, error.message);

        // Update source with error information
        try {
            await prisma.rSSSource.update({
                where: { id: sourceId },
                data: {
                    lastError: error.message,
                    errorCount: { increment: 1 },
                    status: 'ERROR',
                },
            });
        } catch (updateError) {
            console.error('[RSS] Failed to update source error status');
        }

        return { success: false, newArticles: 0, errors: [error.message] };
    }
}

/**
 * Fetch all active RSS feeds that are due for update
 */
export async function fetchAllActiveFeeds(): Promise<{
    sourcesChecked: number;
    totalNewArticles: number;
}> {
    console.log('[RSS] Starting scheduled feed fetch...');

    const sources = await prisma.rSSSource.findMany({
        where: {
            status: 'ACTIVE',
            isActive: true,
        },
    });

    let totalNewArticles = 0;
    let sourcesChecked = 0;

    for (const source of sources) {
        // Check if enough time has passed since last fetch
        if (source.lastFetchedAt) {
            const minutesSinceLastFetch =
                (Date.now() - source.lastFetchedAt.getTime()) / 60000;

            if (minutesSinceLastFetch < source.fetchInterval) {
                continue; // Not time to fetch yet
            }
        }

        sourcesChecked++;
        const result = await fetchRSSFeed(source.id);
        totalNewArticles += result.newArticles;

        // Small delay between sources to avoid overwhelming external servers
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[RSS] Fetch complete: ${sourcesChecked} sources, ${totalNewArticles} new articles`);
    return { sourcesChecked, totalNewArticles };
}

/**
 * Clean up old RSS articles
 * Removes articles older than specified days that are not approved
 */
export async function cleanupOldArticles(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.rSSArticle.deleteMany({
        where: {
            publishedAt: { lt: cutoffDate },
            status: { in: ['PENDING', 'REJECTED', 'EXPIRED'] },
        },
    });

    console.log(`[RSS] Cleaned up ${result.count} old articles`);
    return result.count;
}

/**
 * Mark old approved articles as expired
 */
export async function expireOldArticles(daysOld = 60): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.rSSArticle.updateMany({
        where: {
            publishedAt: { lt: cutoffDate },
            status: 'APPROVED',
        },
        data: {
            status: 'EXPIRED',
        },
    });

    console.log(`[RSS] Expired ${result.count} old articles`);
    return result.count;
}

/**
 * Get feed statistics for monitoring
 */
export async function getRSSStats(): Promise<{
    totalSources: number;
    activeSources: number;
    errorSources: number;
    totalArticles: number;
    pendingArticles: number;
    approvedArticles: number;
}> {
    const [
        totalSources,
        activeSources,
        errorSources,
        totalArticles,
        pendingArticles,
        approvedArticles,
    ] = await Promise.all([
        prisma.rSSSource.count(),
        prisma.rSSSource.count({ where: { status: 'ACTIVE' } }),
        prisma.rSSSource.count({ where: { status: 'ERROR' } }),
        prisma.rSSArticle.count(),
        prisma.rSSArticle.count({ where: { status: 'PENDING' } }),
        prisma.rSSArticle.count({ where: { status: 'APPROVED' } }),
    ]);

    return {
        totalSources,
        activeSources,
        errorSources,
        totalArticles,
        pendingArticles,
        approvedArticles,
    };
}
