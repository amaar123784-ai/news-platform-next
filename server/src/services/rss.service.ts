/**
 * RSS Feed Service
 * Handles fetching, parsing, and storing RSS feed content
 */

import Parser from 'rss-parser';
import crypto from 'crypto';
import path from 'path';
import { prisma } from '../index.js';
import { processYemenFilter, type FilterResult } from './yemenFilter.service.js';
import { classifyArticle, isMixedCategory } from './categoryClassifier.service.js';

// ============= FALLBACK XML PARSER FOR NON-STANDARD FEEDS =============

interface ParsedFeedItem {
    guid: string;
    title: string;
    link: string;
    description?: string;
    contentSnippet?: string;
    pubDate?: string;
    imageUrl?: string;
}

interface ParsedFeed {
    items: ParsedFeedItem[];
    title?: string;
}

/**
 * Fallback parser for non-standard XML feeds (sitemap-style, custom formats)
 * Handles: <urlset>, <channel><item>, <feed><entry>, and other variations
 */
async function parseNonStandardFeed(feedUrl: string): Promise<ParsedFeed> {
    const response = await axios.get(feedUrl, {
        timeout: 30000,
        headers: {
            'User-Agent': 'YemenNewsBot/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        responseType: 'text',
    });

    const xml = response.data;
    const items: ParsedFeedItem[] = [];

    // Extract feed title
    const titleMatch = xml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const feedTitle = titleMatch ? titleMatch[1].trim() : undefined;

    // Strategy 1: Look for <item> tags (standard RSS structure inside urlset or channel)
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        const item = extractItemFromXml(itemXml);
        if (item) items.push(item);
    }

    // Strategy 2: If no items found, try <entry> tags (Atom format)
    if (items.length === 0) {
        const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
        while ((match = entryRegex.exec(xml)) !== null) {
            const itemXml = match[1];
            const item = extractItemFromXml(itemXml, true);
            if (item) items.push(item);
        }
    }

    // Strategy 3: If still no items, try <url> tags (sitemap format - less likely for articles)
    if (items.length === 0) {
        const urlRegex = /<url[^>]*>([\s\S]*?)<\/url>/gi;
        while ((match = urlRegex.exec(xml)) !== null) {
            const itemXml = match[1];
            const item = extractItemFromXml(itemXml);
            if (item) items.push(item);
        }
    }

    console.log(`[RSS Fallback] Parsed ${items.length} items from ${feedUrl}`);
    return { items, title: feedTitle };
}

/**
 * Extract a single item from XML fragment
 */
function extractItemFromXml(xml: string, isAtom = false): ParsedFeedItem | null {
    // Extract link
    let link = '';
    if (isAtom) {
        const linkMatch = xml.match(/<link[^>]+href=["']([^"']+)["']/i);
        link = linkMatch ? linkMatch[1] : '';
    } else {
        const linkMatch = xml.match(/<link[^>]*>([^<]+)<\/link>/i);
        link = linkMatch ? linkMatch[1].trim() : '';
    }

    // Extract title
    const titleMatch = xml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : '';

    // Skip if no title or link
    if (!title && !link) return null;

    // Extract description/content
    const descMatch = xml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
        || xml.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i)
        || xml.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
    const description = descMatch ? descMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : undefined;

    // Extract pubDate
    const pubMatch = xml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i)
        || xml.match(/<published[^>]*>([^<]+)<\/published>/i)
        || xml.match(/<updated[^>]*>([^<]+)<\/updated>/i)
        || xml.match(/<lastmod[^>]*>([^<]+)<\/lastmod>/i);
    const pubDate = pubMatch ? pubMatch[1].trim() : undefined;

    // Extract image
    let imageUrl: string | undefined;
    const imgMatch = xml.match(/<image[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i)
        || xml.match(/<image[^>]*>[\s\S]*?<url[^>]*>([^<]+)<\/url>/i)
        || xml.match(/<media:content[^>]+url=["']([^"']+)["']/i)
        || xml.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
        || xml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) imageUrl = imgMatch[1];

    // Generate guid from link or title
    const guid = link || crypto.createHash('md5').update(title).digest('hex');

    return {
        guid,
        title,
        link,
        description,
        contentSnippet: description?.replace(/<[^>]*>/g, '').substring(0, 200),
        pubDate,
        imageUrl,
    };
}

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

import { imageProcessor } from './imageProcessor.js';
import axios from 'axios';

/**
 * Download and process external image
 */
async function downloadAndProcessImage(url: string | null, baseUrl: string): Promise<string | null> {
    if (!url) return null;

    const absoluteUrl = ensureAbsoluteUrl(url, baseUrl);
    if (!absoluteUrl) return null;

    try {
        // Download image with 10s timeout
        const response = await axios.get(absoluteUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'YemenNewsBot/1.0',
            },
            maxContentLength: 10 * 1024 * 1024 // 10MB limit for external images
        });

        const buffer = Buffer.from(response.data);
        const originalName = path.basename(new URL(absoluteUrl).pathname) || 'rss-image.jpg';

        // Process and save locally
        const processed = await imageProcessor.process(buffer, originalName);
        return processed.url;
    } catch (error: any) {
        console.warn(`[RSS] Failed to download image ${absoluteUrl}:`, error.message);
        return absoluteUrl; // Fallback to original URL if download fails
    }
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
 * Scrape article page to extract og:image and full content
 * Called when RSS feed doesn't provide sufficient data
 */
interface ScrapedPageData {
    ogImage: string | null;
    fullContent: string | null;
}

async function scrapeArticlePage(articleUrl: string): Promise<ScrapedPageData> {
    const result: ScrapedPageData = { ogImage: null, fullContent: null };

    if (!articleUrl) return result;

    try {
        const response = await axios.get(articleUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; YemenNewsBot/1.0; +https://voiceoftihama.com)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'ar,en;q=0.9',
            },
            maxContentLength: 5 * 1024 * 1024, // 5MB limit
        });

        const html = response.data as string;

        // Extract image using multiple fallback patterns
        const imagePatterns = [
            // og:image (most common)
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
            // twitter:image
            /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
            // Schema.org itemprop
            /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i,
            /<link[^>]+itemprop=["']image["'][^>]+href=["']([^"']+)["']/i,
            // JSON-LD schema (common in news sites)
            /"image"\s*:\s*"([^"]+)"/i,
            /"image"\s*:\s*\[\s*"([^"]+)"/i,
            // First large image in article body as last resort
            /<img[^>]+src=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i,
        ];

        for (const pattern of imagePatterns) {
            const match = html.match(pattern);
            if (match && match[1] && match[1].startsWith('http')) {
                result.ogImage = match[1];
                console.log(`[RSS] 🖼️ Found image via pattern: ${result.ogImage.substring(0, 60)}...`);
                break;
            }
        }

        if (!result.ogImage) {
            console.log(`[RSS] ⚠️ No image found in page: ${articleUrl.substring(0, 50)}...`);
        }

        // Extract full content using common article selectors
        // Try multiple common article container patterns
        const contentPatterns = [
            /<article[^>]*>([\s\S]*?)<\/article>/i,
            /<div[^>]+class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]+class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]+class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]+class=["'][^"']*content-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]+id=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
        ];

        for (const pattern of contentPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                // Clean HTML: remove scripts, styles, and excessive whitespace
                let content = match[1]
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
                    .replace(/<!--[\s\S]*?-->/g, '')
                    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                    .trim();

                // Only use if we got meaningful content (more than 100 chars after stripping tags)
                const textOnly = content.replace(/<[^>]+>/g, '').trim();
                if (textOnly.length > 100) {
                    result.fullContent = content;
                    console.log(`[RSS] 📄 Extracted full content: ${textOnly.length} chars`);
                    break;
                }
            }
        }

    } catch (error: any) {
        console.warn(`[RSS] ⚠️ Failed to scrape page ${articleUrl}: ${error.message}`);
    }

    return result;
}

/**
 * Extract image URL from feed item
 * Checks multiple common feed image formats and resolves relative URLs
 */
function extractImage(item: any): string | null {
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

    return imageUrl;
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
            include: {
                category: { select: { slug: true } },
            },
        });

        if (!source) {
            return { success: false, newArticles: 0, errors: ['المصدر غير موجود'] };
        }

        if (source.status !== 'ACTIVE') {
            return { success: false, newArticles: 0, errors: ['المصدر متوقف أو به خطأ'] };
        }

        console.log(`[RSS] Fetching feed: ${source.name} (${source.feedUrl})`);

        // Try standard RSS parser first, fallback to custom parser if it fails
        let feedItems: any[] = [];
        let usedFallback = false;

        try {
            const feed = await parser.parseURL(source.feedUrl);
            feedItems = feed.items;
            console.log(`[RSS] Parsed ${feedItems.length} items from ${source.name}`);
        } catch (parseError: any) {
            console.log(`[RSS] Standard parser failed for ${source.name}: ${parseError.message}`);
            console.log(`[RSS] Trying fallback parser...`);

            try {
                const fallbackFeed = await parseNonStandardFeed(source.feedUrl);
                feedItems = fallbackFeed.items;
                usedFallback = true;
                console.log(`[RSS] Fallback parsed ${feedItems.length} items from ${source.name}`);
            } catch (fallbackError: any) {
                console.error(`[RSS] Both parsers failed for ${source.name}`);
                errors.push(`فشل تحليل الخلاصة: ${parseError.message}`);
                return { success: false, newArticles: 0, errors };
            }
        }

        for (const item of feedItems) {
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

            // ========== 1. CLASSIFICATION & CATEGORY DETERMINATION ==========
            let articleCategoryId: string | null = null;
            let targetCategorySlug = source.category?.slug || '';
            const excerpt = item.contentSnippet || item.content || (item as any).description || '';

            // If source is Mixed, try to auto-classify first
            if (isMixedCategory(targetCategorySlug)) {
                const classification = classifyArticle(title, excerpt);
                if (classification.categorySlug) {
                    targetCategorySlug = classification.categorySlug;
                    // Find ID for the classified category
                    const matchedCategory = await prisma.category.findUnique({
                        where: { slug: classification.categorySlug },
                        select: { id: true },
                    });
                    if (matchedCategory) {
                        articleCategoryId = matchedCategory.id;
                    }
                }
            } else {
                // Non-mixed source: inherit source category ID
                articleCategoryId = source.categoryId;
            }

            // ========== 2. YEMEN FILTER GATE (Conditional) ==========
            // Global categories bypass the filter (News is considered global unless it's politics)
            // Allowed Global: Economy, Sports, Technology, Culture
            const GLOBAL_CATEGORIES = ['economy', 'sports', 'technology', 'culture'];
            const isGlobalCategory = GLOBAL_CATEGORIES.includes(targetCategorySlug);

            let filterResult: FilterResult;

            if (isGlobalCategory) {
                // BYPASS FILTER: Accept immediately for global categories
                filterResult = {
                    status: 'ACCEPTED',
                    relevanceScore: 1.0,
                    tierCategory: 1, // Treat as high relevance
                    reasoning: `Global category (${targetCategorySlug}) - Bypass Yemen Filter`,
                    action: 'PUBLISH',
                };
                console.log(`[RSS] 🌍 Global Content (${targetCategorySlug}): ${title.substring(0, 40)}...`);
            } else {
                // APPLY FILTER: For Politics, Mixed (unclassified), or others
                filterResult = processYemenFilter({
                    guid,
                    title,
                    description: excerpt,
                    sourceUrl: item.link || '',
                    publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                    sourceId: source.id,
                    sourceName: source.name,
                });
            }

            // Handle filter decisions
            if (filterResult.status === 'REJECTED') {
                console.log(`[RSS] ❌ Rejected: ${title.substring(0, 40)}... (${filterResult.reasoning})`);
                continue; // Skip non-Yemen content
            }

            if (filterResult.status === 'MERGED' && filterResult.mergeWithId) {
                console.log(`[RSS] 🔗 Merged with existing article: ${title.substring(0, 40)}...`);
                continue; // Duplicate detected
            }

            try {
                // Extract image from RSS feed first
                const baseFeedUrl = source.websiteUrl || source.feedUrl;
                let rawImageUrl = extractImage(item);
                let articleContent = item.content || item['content:encoded'] || (item as any).description || '';

                // If no image in RSS or content is too short, scrape the article page
                const articleLink = item.link || '';
                if (!rawImageUrl || articleContent.replace(/<[^>]+>/g, '').length < 200) {
                    console.log(`[RSS] 🔍 Scraping page for missing data: ${articleLink.substring(0, 50)}...`);
                    const scraped = await scrapeArticlePage(articleLink);

                    // Use scraped image if RSS didn't have one
                    if (!rawImageUrl && scraped.ogImage) {
                        rawImageUrl = scraped.ogImage;
                    }

                    // Use scraped content if it's richer
                    if (scraped.fullContent && scraped.fullContent.replace(/<[^>]+>/g, '').length > articleContent.replace(/<[^>]+>/g, '').length) {
                        articleContent = scraped.fullContent;
                    }
                }

                // Download and process image locally
                const localImageUrl = await downloadAndProcessImage(rawImageUrl, baseFeedUrl);

                // Determine status based on filter result
                // Note: FLAGGED articles go to PENDING but are logged for attention
                const articleStatus = 'PENDING' as const;

                await prisma.rSSArticle.create({
                    data: {
                        guid,
                        title,
                        excerpt: truncateExcerpt(articleContent),
                        sourceUrl: articleLink,
                        imageUrl: localImageUrl,
                        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        titleHash,
                        sourceId: source.id,
                        status: articleStatus,
                        approvedAt: null,
                        categoryId: articleCategoryId,
                    },
                });

                // Webhook trigger removed as per user request (only manual publish triggers social post)
                // webhookService.notifyNewArticle(newArticle.id)...

                if (filterResult.status === 'FLAGGED') {
                    console.log(`[RSS] ⚠️ Flagged for review: ${title.substring(0, 40)}... (${filterResult.reasoning})`);
                } else {
                    console.log(`[RSS] ✅ Accepted: ${title.substring(0, 40)}... (Score: ${filterResult.relevanceScore}, Tier: ${filterResult.tierCategory})`);
                }

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
 * Uses Promise.allSettled for graceful error handling per source
 */
export async function fetchAllActiveFeeds(): Promise<{
    sourcesChecked: number;
    totalNewArticles: number;
    successful: number;
    failed: number;
}> {
    console.log('[RSS] Starting scheduled feed fetch...');

    const sources = await prisma.rSSSource.findMany({
        where: {
            status: 'ACTIVE',
            isActive: true,
        },
    });

    // Filter sources that are due for fetching
    const dueSources = sources.filter(source => {
        if (!source.lastFetchedAt) return true;
        const minutesSinceLastFetch = (Date.now() - source.lastFetchedAt.getTime()) / 60000;
        return minutesSinceLastFetch >= source.fetchInterval;
    });

    if (dueSources.length === 0) {
        console.log('[RSS] No sources due for fetching');
        return { sourcesChecked: 0, totalNewArticles: 0, successful: 0, failed: 0 };
    }

    // Fetch all sources in parallel with error isolation
    const results = await Promise.allSettled(
        dueSources.map(async (source, index) => {
            // Stagger requests to avoid thundering herd
            await new Promise(resolve => setTimeout(resolve, index * 500));
            return fetchRSSFeed(source.id);
        })
    );

    // Count results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const totalNewArticles = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<{ success: boolean; newArticles: number; errors: string[] }>).value.newArticles)
        .reduce((sum, count) => sum + count, 0);

    console.log(`[RSS] Fetch complete: ${dueSources.length} sources (${successful} ok, ${failed} failed), ${totalNewArticles} new articles`);
    return { sourcesChecked: dueSources.length, totalNewArticles, successful, failed };
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
