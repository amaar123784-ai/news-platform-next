/**
 * Web Scraper Service
 * Fetches full article content from original news URLs
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import pLimit from 'p-limit';
import { prisma } from '../index.js';

// User agents for rotation to avoid blocking
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];

// Site-specific content selectors for major Arabic news sources
interface SiteConfig {
    contentSelector?: string;
    removeSelectors?: string[];
    titleSelector?: string;
}

const SITE_CONFIGS: Record<string, SiteConfig> = {
    'aljazeera.net': {
        contentSelector: '.wysiwyg--all-content, .article-p-wrapper',
        removeSelectors: ['.article-aside', '.social-buttons', '.related-articles', 'script', 'style'],
    },
    'bbc.com': {
        contentSelector: 'article[data-component="text-block"], .ssrcss-pv1rh6-ArticleWrapper',
        removeSelectors: ['.ssrcss-1ocoo3l-Placeholder', 'script', 'style'],
    },
    'alarabiya.net': {
        contentSelector: '.article-text, .article_text',
        removeSelectors: ['.related-news', '.social-share', 'script', 'style'],
    },
    'skynewsarabia.com': {
        contentSelector: '.article-body, .ArticleBody',
        removeSelectors: ['.related-articles', 'script', 'style'],
    },
    'rt.com': {
        contentSelector: '.article__text, .article-body',
        removeSelectors: ['.article__share', 'script', 'style'],
    },
    'france24.com': {
        contentSelector: '.t-content__body, .article__text',
        removeSelectors: ['.m-interstitial', 'script', 'style'],
    },
    'koraplus.com': {
        contentSelector: '.article-body, .article-content, .news-content, .post-content',
        removeSelectors: ['.related-articles', '.social-share', '.ads', 'script', 'style'],
    },
};

// Universal selectors for unknown sites (fallback)
const UNIVERSAL_CONTENT_SELECTORS = [
    'article',
    '.article-body',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.news-content',
    '.story-body',
    '.content-body',
    '[itemprop="articleBody"]',
    'main article',
    '.main-content article',
];

/**
 * Get random user agent
 */
function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Get site config based on URL
 */
function getSiteConfig(url: string): SiteConfig | null {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
            if (hostname.includes(domain)) {
                return config;
            }
        }
    } catch {
        // Invalid URL
    }
    return null;
}

/**
 * Fetch page HTML with retry logic
 */
async function fetchPageHTML(url: string, retries = 3): Promise<string | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'max-age=0',
                    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'Referer': 'https://www.google.com/',
                },
                maxRedirects: 5,
            });

            if (response.status === 200 && response.data) {
                return response.data;
            }
        } catch (error: any) {
            console.warn(`[Scraper] Attempt ${attempt}/${retries} failed for ${url}: ${error.message}`);

            if (attempt < retries) {
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    return null;
}

/**
 * Extract high-resolution image from Open Graph meta tags
 */
function extractOgImage(html: string, url: string): string | null {
    try {
        const $ = cheerio.load(html);

        // Priority order: og:image, twitter:image, article:image
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            return ensureAbsoluteUrl(ogImage, url);
        }

        const twitterImage = $('meta[name="twitter:image"]').attr('content');
        if (twitterImage) {
            return ensureAbsoluteUrl(twitterImage, url);
        }

        const articleImage = $('meta[property="article:image"]').attr('content');
        if (articleImage) {
            return ensureAbsoluteUrl(articleImage, url);
        }

        // Fallback: look for large images in the article
        const largeImage = $('article img[src], .article-body img[src], .post-content img[src]').first().attr('src');
        if (largeImage) {
            return ensureAbsoluteUrl(largeImage, url);
        }
    } catch (error) {
        console.warn('[Scraper] OG image extraction failed:', error);
    }
    return null;
}

/**
 * Helper to ensure absolute URL
 */
function ensureAbsoluteUrl(imageUrl: string, baseUrl: string): string | null {
    if (!imageUrl) return null;
    try {
        return new URL(imageUrl, baseUrl).toString();
    } catch {
        return null;
    }
}

/**
 * Extract article content using site-specific selectors
 */
function extractWithSelectors(html: string, config: SiteConfig): string | null {
    try {
        const $ = cheerio.load(html);

        // Remove unwanted elements
        if (config.removeSelectors) {
            config.removeSelectors.forEach(selector => $(selector).remove());
        }

        // Extract content using selector
        if (config.contentSelector) {
            const content = $(config.contentSelector);
            if (content.length > 0) {
                // Get text content, preserving paragraphs
                const paragraphs: string[] = [];
                content.find('p').each((_, el) => {
                    const text = $(el).text().trim();
                    if (text.length > 20) { // Filter out short/empty paragraphs
                        paragraphs.push(text);
                    }
                });

                if (paragraphs.length > 0) {
                    return paragraphs.join('\n\n');
                }

                // Fallback to full text
                return content.text().trim();
            }
        }
    } catch (error) {
        console.warn('[Scraper] Selector extraction failed:', error);
    }
    return null;
}

/**
 * Extract article content using Mozilla Readability (fallback)
 * Uses try-finally to ensure JSDOM resources are properly released
 */
function extractWithReadability(html: string, url: string): string | null {
    const dom = new JSDOM(html, { url });
    try {
        const reader = new Readability(dom.window.document.cloneNode(true) as Document);
        const article = reader.parse();

        if (article && article.textContent) {
            // Clean up the text content
            return article.textContent
                .replace(/\s+/g, ' ')
                .replace(/\n\s*\n/g, '\n\n')
                .trim();
        }
        return null;
    } catch (error) {
        console.warn('[Scraper] Readability extraction failed:', error);
        return null;
    } finally {
        // Explicitly release JSDOM resources to prevent memory leaks
        dom.window.close();
    }
}

/**
 * Main scraping function for a single article
 */
export async function scrapeArticle(articleId: string): Promise<{
    success: boolean;
    content: string | null;
    error: string | null;
}> {
    try {
        const article = await prisma.rSSArticle.findUnique({
            where: { id: articleId },
        });

        if (!article) {
            return { success: false, content: null, error: 'المقال غير موجود' };
        }

        if (!article.sourceUrl) {
            return { success: false, content: null, error: 'رابط المقال غير متوفر' };
        }

        console.log(`[Scraper] Fetching: ${article.sourceUrl}`);

        // Fetch page HTML
        const html = await fetchPageHTML(article.sourceUrl);
        if (!html) {
            await updateArticleScrapeStatus(articleId, null, 'فشل تحميل الصفحة');
            return { success: false, content: null, error: 'فشل تحميل الصفحة' };
        }

        let content: string | null = null;

        // Try site-specific extraction first
        const siteConfig = getSiteConfig(article.sourceUrl);
        if (siteConfig) {
            console.log(`[Scraper] Using site-specific config for ${article.sourceUrl}`);
            content = extractWithSelectors(html, siteConfig);
        }

        // Fallback: Try universal selectors
        if (!content) {
            console.log(`[Scraper] Trying universal selectors for ${article.sourceUrl}`);
            const $ = cheerio.load(html);

            // Remove common noise elements first
            $('script, style, nav, header, footer, aside, .sidebar, .ads, .comments, .social-share, .related-articles').remove();

            for (const selector of UNIVERSAL_CONTENT_SELECTORS) {
                const el = $(selector);
                if (el.length > 0) {
                    const paragraphs: string[] = [];
                    el.find('p').each((_: number, p: any) => {
                        const text = $(p).text().trim();
                        if (text.length > 30) paragraphs.push(text);
                    });

                    if (paragraphs.length >= 2) {
                        content = paragraphs.join('\n\n');
                        console.log(`[Scraper] Found content with selector: ${selector}`);
                        break;
                    }
                }
            }
        }

        // Final fallback: Readability
        if (!content) {
            console.log(`[Scraper] Using Readability for ${article.sourceUrl}`);
            content = extractWithReadability(html, article.sourceUrl);
        }

        // Extract high-resolution image from og:image
        const highResImage = extractOgImage(html, article.sourceUrl);
        if (highResImage) {
            console.log(`[Scraper] Found high-res image: ${highResImage}`);
        }

        if (content && content.length > 100) {
            await updateArticleScrapeStatus(articleId, content, null, highResImage);
            console.log(`[Scraper] Success: ${content.length} chars for ${article.title.substring(0, 50)}`);
            return { success: true, content, error: null };
        } else {
            await updateArticleScrapeStatus(articleId, null, 'فشل استخراج المحتوى', highResImage);
            return { success: false, content: null, error: 'فشل استخراج المحتوى' };
        }

    } catch (error: any) {
        console.error(`[Scraper] Error scraping ${articleId}:`, error.message);
        await updateArticleScrapeStatus(articleId, null, error.message);
        return { success: false, content: null, error: error.message };
    }
}

/**
 * Update article with scrape results
 */
async function updateArticleScrapeStatus(
    articleId: string,
    content: string | null,
    error: string | null,
    newImageUrl: string | null = null
): Promise<void> {
    const updateData: any = {
        fullContent: content,
        contentScraped: !!content,
        scrapeError: error,
        scrapedAt: new Date(),
    };

    // Only update imageUrl if we found a high-res image
    if (newImageUrl) {
        updateData.imageUrl = newImageUrl;
    }

    await prisma.rSSArticle.update({
        where: { id: articleId },
        data: updateData,
    });
}

/**
 * Process scrape queue - fetch unscraped articles
 * Uses concurrent processing with rate limiting for efficiency
 */
export async function processScrapeQueue(batchSize = 10): Promise<{
    processed: number;
    successful: number;
}> {
    console.log('[Scraper] Processing scrape queue...');

    const articles = await prisma.rSSArticle.findMany({
        where: {
            contentScraped: false,
            scrapeError: null,
            sourceUrl: { not: '' },
        },
        orderBy: { fetchedAt: 'desc' },
        take: batchSize,
        select: { id: true, title: true },
    });

    if (articles.length === 0) {
        console.log('[Scraper] No articles to process');
        return { processed: 0, successful: 0 };
    }

    // Limit concurrent requests to 3 for rate limiting
    const limit = pLimit(3);

    const results = await Promise.all(
        articles.map(article =>
            limit(async () => {
                const result = await scrapeArticle(article.id);
                // Delay after each request to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1500));
                return result;
            })
        )
    );

    const successful = results.filter(r => r.success).length;
    console.log(`[Scraper] Queue complete: ${successful}/${articles.length} successful`);
    return { processed: articles.length, successful };
}

/**
 * Retry failed scrapes
 */
export async function retryFailedScrapes(limit = 5): Promise<number> {
    const failedArticles = await prisma.rSSArticle.findMany({
        where: {
            contentScraped: false,
            scrapeError: { not: null },
        },
        orderBy: { scrapedAt: 'asc' },
        take: limit,
        select: { id: true },
    });

    // Clear error to allow retry
    await prisma.rSSArticle.updateMany({
        where: { id: { in: failedArticles.map(a => a.id) } },
        data: { scrapeError: null },
    });

    return failedArticles.length;
}
