/**
 * RSS Feed Service
 * Handles fetching, parsing, and storing RSS feed content
 */

import Parser from 'rss-parser';
import { XMLParser } from 'fast-xml-parser';
import crypto from 'crypto';
import path from 'path';
import pLimit from 'p-limit';
import axios from 'axios';
import * as iconv from 'iconv-lite';
import * as cheerio from 'cheerio';
import { prisma } from '../index.js';
import { classifyArticle, isMixedCategory } from './categoryClassifier.service.js';

/** Maximum number of feeds fetched simultaneously to protect DB and network */
const FEED_CONCURRENCY = 5;
/** Maximum size of RSS feed to process (5MB) to prevent memory exhaustion */
const MAX_FEED_SIZE = 5 * 1024 * 1024;

// FilterResult type for article processing (filter disabled globally)
type FilterResult = {
    status: 'ACCEPTED' | 'REJECTED' | 'FLAGGED' | 'MERGED';
    relevanceScore: number;
    tierCategory: 1 | 2 | 3;
    reasoning: string;
    action: 'PUBLISH' | 'MERGE' | 'HOLD' | 'DROP';
    mergeWithId?: string;
};

// ============= FALLBACK XML PARSER FOR NON-STANDARD FEEDS =============

interface ParsedFeedItem {
    guid: string;
    title: string;
    link: string;
    description?: string;
    contentSnippet?: string;
    pubDate?: string;
    imageUrl?: string;
    categories?: string[];
}

interface ParsedFeed {
    items: ParsedFeedItem[];
    title?: string;
}

/**
 * Fallback parser for non-standard XML feeds using fast-xml-parser
 */
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function parseNonStandardFeed(feedUrl: string): Promise<ParsedFeed> {
    const response = await axios.get(feedUrl, {
        timeout: 30000,
        headers: {
            'User-Agent': BROWSER_UA,
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        responseType: 'arraybuffer',
        maxContentLength: MAX_FEED_SIZE, // Prevent large file attacks
    });

    const buffer = Buffer.from(response.data);
    let xml = '';
    
    // Auto-detect encoding
    const contentType = response.headers['content-type']?.toLowerCase() || '';
    const xmlHeader = buffer.subarray(0, 100).toString('ascii').toLowerCase();
    
    if (contentType.includes('windows-1256') || xmlHeader.includes('windows-1256') || xmlHeader.includes('cp1256')) {
        xml = iconv.decode(buffer, 'windows-1256');
    } else {
        xml = buffer.toString('utf8');
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        cdataPropName: "__cdata",
    });

    const jsonObj = parser.parse(xml);
    const items: ParsedFeedItem[] = [];

    const getValue = (obj: any) => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj.trim();
        if (obj.__cdata) return obj.__cdata.trim();
        if (obj['#text']) return obj['#text'].trim();
        return '';
    };

    // Traverse to find items
    const channel = jsonObj.rss?.channel || jsonObj.feed || jsonObj.urlset || jsonObj;
    const rawItems = channel.item || channel.entry || channel.url || [];
    const normalizedItems = Array.isArray(rawItems) ? rawItems : [rawItems];

    for (const raw of normalizedItems) {
        const title = getValue(raw.title);
        let link = '';
        
        if (raw.link) {
            if (typeof raw.link === 'string') link = raw.link;
            else if (raw.link['@_href']) link = raw.link['@_href'];
            else if (raw.link['#text']) link = raw.link['#text'];
        } else if (raw.loc) {
            link = getValue(raw.loc);
        }

        if (!title && !link) continue;

        const description = getValue(raw.description || raw.content || raw.summary);
        const pubDate = getValue(raw.pubDate || raw.published || raw.updated || raw.lastmod);
        
        let imageUrl: string | undefined;
        const media = raw['media:content'] || raw.enclosure || raw['media:thumbnail'];
        if (media && media['@_url']) {
            imageUrl = media['@_url'];
        }

        // Extract categories
        let categories: string[] = [];
        if (raw.category) {
            const rawCats = Array.isArray(raw.category) ? raw.category : [raw.category];
            categories = rawCats.map((c: any) => getValue(c)).filter(Boolean);
        }

        items.push({
            guid: link || crypto.createHash('md5').update(title).digest('hex'),
            title,
            link,
            description,
            contentSnippet: description?.replace(/<[^>]*>/g, '').substring(0, 200),
            pubDate,
            imageUrl,
            categories
        });
    }

    return { items, title: getValue(channel.title) };
}

// Custom parser with Arabic-friendly settings
const parser = new Parser({
    timeout: 30000,
    headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'application/rss+xml, application/xml, text/xml',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
            ['category', 'categories', { keepArray: true }],
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

/**
 * Download and process external image
 * Uses realistic browser headers to bypass anti-bot / hotlink protections
 */
async function downloadAndProcessImage(url: string | null, baseUrl: string): Promise<string | null> {
    if (!url) return null;

    const absoluteUrl = ensureAbsoluteUrl(url, baseUrl);
    if (!absoluteUrl) return null;

    // Extract the origin from the image URL to use as Referer
    let referer = baseUrl;
    try { referer = new URL(absoluteUrl).origin; } catch {}

    try {
        // Download image with 15s timeout and realistic browser headers
        const response = await axios.get(absoluteUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': referer,
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
            },
            maxContentLength: 10 * 1024 * 1024, // 10MB limit
            maxRedirects: 5,
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
            responseType: 'arraybuffer',
            maxContentLength: 5 * 1024 * 1024, // 5MB limit
        });

        const buffer = Buffer.from(response.data);
        const firstChunk = buffer.subarray(0, 1024).toString('ascii').toLowerCase();
        const contentType = (response.headers['content-type'] || '').toLowerCase();
        
        let html = '';
        if (contentType.includes('windows-1256') || firstChunk.includes('windows-1256') || firstChunk.includes('cp1256')) {
            console.log(`[RSS] Detected windows-1256 encoding for page ${articleUrl}`);
            html = iconv.decode(buffer, 'windows-1256');
        } else if (contentType.includes('iso-8859-6') || firstChunk.includes('iso-8859-6')) {
            html = iconv.decode(buffer, 'iso-8859-6');
        } else {
             html = buffer.toString('utf8');
        }

        // Use safe cheerio/readability instead of manual regex for content extraction
        const $ = cheerio.load(html);
        result.ogImage = $('meta[property="og:image"]').attr('content') || null;

        // Try common article selectors
        const contentSelectors = ['article', '.article-body', '.post-content', '.entry-content', '.content-body'];
        for (const selector of contentSelectors) {
            const el = $(selector);
            if (el.length > 0) {
                result.fullContent = el.html();
                break;
            }
        }

    } catch (error: any) {
        console.warn(`[RSS] ⚠️ Failed to scrape page ${articleUrl}: ${error.message}`);
    }

    return result;
}

/**
 * Extract image URL from feed item
 */
function extractImage(item: any): string | null {
    let imageUrl: string | null = null;

    if (item.enclosure?.url && item.enclosure?.type?.startsWith('image/')) {
        imageUrl = item.enclosure.url;
    }
    else if (item.mediaContent?.$?.url) {
        imageUrl = item.mediaContent.$.url;
    }
    else if (item.mediaThumbnail?.$?.url) {
        imageUrl = item.mediaThumbnail.$.url;
    }
    else {
        // Safe regex for simple img tag extraction
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
    const cleaned = text.replace(/<[^>]*>/g, '').trim();
    if (cleaned.length <= maxLength) return cleaned;
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength - 50) {
        return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
}

/**
 * Fetch and parse a single RSS feed
 */
export async function fetchRSSFeed(feedId: string): Promise<{
    success: boolean;
    newArticles: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let newArticles = 0;

    try {
        const feed = await prisma.rSSFeed.findUnique({
            where: { id: feedId },
            include: {
                category: { select: { slug: true } },
                source: { select: { id: true, name: true, websiteUrl: true } },
            },
        });

        if (!feed) {
            return { success: false, newArticles: 0, errors: ['الرابط غير موجود'] };
        }

        if (feed.status !== 'ACTIVE') {
            return { success: false, newArticles: 0, errors: ['الرابط متوقف أو به خطأ'] };
        }

        console.log(`[RSS] Fetching feed: ${feed.source.name} (${feed.feedUrl})`);

        let feedItems: any[] = [];

        try {
            const response = await axios.get(feed.feedUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': BROWSER_UA,
                    'Accept': 'application/rss+xml, application/xml, text/xml',
                },
                responseType: 'arraybuffer',
                maxContentLength: MAX_FEED_SIZE
            });

            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type']?.toLowerCase() || '';
            const xmlHeader = buffer.subarray(0, 100).toString('ascii').toLowerCase();
            
            let xmlString = '';
            if (contentType.includes('windows-1256') || xmlHeader.includes('windows-1256') || xmlHeader.includes('cp1256')) {
                xmlString = iconv.decode(buffer, 'windows-1256');
            } else {
                xmlString = buffer.toString('utf8');
            }

            const parsedFeed = await parser.parseString(xmlString);
            feedItems = parsedFeed.items;
        } catch (parseError: any) {
            try {
                const fallbackFeed = await parseNonStandardFeed(feed.feedUrl);
                feedItems = fallbackFeed.items;
            } catch (fallbackError: any) {
                errors.push(`فشل تحليل الخلاصة: ${parseError.message}`);
                return { success: false, newArticles: 0, errors };
            }
        }

        const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
        const nowMs = Date.now();

        for (const item of feedItems) {
            if (!item.guid && !item.link) continue;

            // تخطي الأخبار التي مضى عليها أكثر من 48 ساعة
            if (item.pubDate) {
                const pubDateMs = new Date(item.pubDate).getTime();
                if (!isNaN(pubDateMs) && (nowMs - pubDateMs > maxAgeMs)) {
                    continue; 
                }
            }

            // Enforce max length of 500 characters for GUID to prevent DB constraint errors
            const rawGuid = item.guid || item.link!;
            const guid = rawGuid.length > 500 ? rawGuid.substring(0, 500) : rawGuid;
            
            const title = item.title || 'بدون عنوان';
            const titleHash = hashTitle(title);

            // 1. GLOBAL DEDUPLICATION (Cross-feed)
            const existingByGuid = await prisma.rSSArticle.findUnique({ where: { guid } });
            if (existingByGuid) continue;

            const existingByTitle = await prisma.rSSArticle.findFirst({
                where: { titleHash } // REMOVED feedId to make it global
            });
            if (existingByTitle) continue;

            let articleCategoryId: string | null = null;
            let targetCategorySlug = feed.category?.slug || '';
            const excerpt = item.contentSnippet || item.content || (item as any).description || '';

            if (isMixedCategory(targetCategorySlug)) {
                const classification = classifyArticle(title, excerpt);
                if (classification.categorySlug) {
                    const matchedCategory = await prisma.category.findUnique({
                        where: { slug: classification.categorySlug },
                        select: { id: true },
                    });
                    if (matchedCategory) articleCategoryId = matchedCategory.id;
                }
            } else {
                articleCategoryId = feed.categoryId;
            }

            try {
                const baseFeedUrl = feed.source.websiteUrl || feed.feedUrl;
                let rawImageUrl = extractImage(item);
                let articleContent = item.content || item['content:encoded'] || (item as any).description || '';

                // 2. POSTPONE FULL-TEXT SCRAPING
                // Scraper call removed. Content will be basic RSS text.
                
                const remoteImageUrl = rawImageUrl ? ensureAbsoluteUrl(rawImageUrl, baseFeedUrl) : null;

                // 3. CAPTURE CATEGORY METADATA
                const categories = item.categories || [];
                const rawCategories = Array.isArray(categories) ? categories.join(', ') : '';

                await prisma.rSSArticle.create({
                    data: {
                        guid,
                        title,
                        excerpt: truncateExcerpt(articleContent),
                        sourceUrl: item.link || '',
                        imageUrl: remoteImageUrl,
                        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        titleHash,
                        feedId: feed.id,
                        status: 'PENDING',
                        approvedAt: null,
                        categoryId: articleCategoryId,
                    },
                });

                newArticles++;
            } catch (err: any) {
                errors.push(`فشل حفظ المقال: ${title.substring(0, 50)}`);
            }
        }

        await prisma.rSSFeed.update({
            where: { id: feedId },
            data: { lastFetchedAt: new Date(), errorCount: 0, lastError: null, status: 'ACTIVE' },
        });

        return { success: true, newArticles, errors };

    } catch (error: any) {
        try {
            await prisma.rSSFeed.update({
                where: { id: feedId },
                data: { lastError: error.message, errorCount: { increment: 1 }, status: 'ERROR' },
            });
        } catch (updateError) {}
        return { success: false, newArticles: 0, errors: [error.message] };
    }
}

/**
 * Fetch all active RSS feeds that are due for update
 */
export async function fetchAllActiveFeeds(): Promise<{
    feedsChecked: number;
    totalNewArticles: number;
    successful: number;
    failed: number;
}> {
    const feeds = await prisma.rSSFeed.findMany({
        where: { status: 'ACTIVE', source: { isActive: true } },
        include: { source: { select: { name: true } } },
    });

    const dueFeeds = feeds.filter(feed => {
        if (!feed.lastFetchedAt) return true;
        const minutesSinceLastFetch = (Date.now() - feed.lastFetchedAt.getTime()) / 60000;
        return minutesSinceLastFetch >= feed.fetchInterval;
    });

    if (dueFeeds.length === 0) return { feedsChecked: 0, totalNewArticles: 0, successful: 0, failed: 0 };

    const limit = pLimit(FEED_CONCURRENCY);
    const results = await Promise.allSettled(dueFeeds.map(feed => limit(() => fetchRSSFeed(feed.id))));

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const totalNewArticles = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value.newArticles)
        .reduce((sum, count) => sum + count, 0);

    return { feedsChecked: dueFeeds.length, totalNewArticles, successful, failed };
}

/**
 * Clean up old RSS articles
 */
export async function cleanupOldArticles(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma.rSSArticle.deleteMany({
        where: { publishedAt: { lt: cutoffDate }, status: { in: ['PENDING', 'REJECTED', 'EXPIRED'] } },
    });
    return result.count;
}

/**
 * Mark old approved articles as expired
 */
export async function expireOldArticles(daysOld = 60): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma.rSSArticle.updateMany({
        where: { publishedAt: { lt: cutoffDate }, status: 'APPROVED' },
        data: { status: 'EXPIRED' },
    });
    return result.count;
}

/**
 * Get feed statistics
 */
export async function getRSSStats(): Promise<any> {
    const [totalSources, totalFeeds, activeFeeds, errorFeeds, totalArticles, pendingArticles, approvedArticles] = await Promise.all([
        prisma.rSSSource.count(),
        prisma.rSSFeed.count(),
        prisma.rSSFeed.count({ where: { status: 'ACTIVE' } }),
        prisma.rSSFeed.count({ where: { status: 'ERROR' } }),
        prisma.rSSArticle.count(),
        prisma.rSSArticle.count({ where: { status: 'PENDING' } }),
        prisma.rSSArticle.count({ where: { status: 'APPROVED' } }),
    ]);

    return { totalSources, totalFeeds, activeFeeds, errorFeeds, totalArticles, pendingArticles, approvedArticles };
}

/**
 * Download and store image locally
 */
export async function downloadRSSImage(imageUrl: string | null): Promise<string | null> {
    if (!imageUrl || imageUrl.startsWith('/uploads/')) return imageUrl;
    return await downloadAndProcessImage(imageUrl, imageUrl);
}
