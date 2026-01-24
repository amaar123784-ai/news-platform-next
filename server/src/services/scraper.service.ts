/**
 * Web Scraper Service
 * Fetches full article content from original news URLs
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { prisma } from '../index.js';

// User agents for rotation to avoid blocking
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
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
};

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
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ar,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
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
 */
function extractWithReadability(html: string, url: string): string | null {
    try {
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (article && article.textContent) {
            // Clean up the text content
            return article.textContent
                .replace(/\s+/g, ' ')
                .replace(/\n\s*\n/g, '\n\n')
                .trim();
        }
    } catch (error) {
        console.warn('[Scraper] Readability extraction failed:', error);
    }
    return null;
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

        // Fallback to Readability
        if (!content) {
            console.log(`[Scraper] Using Readability for ${article.sourceUrl}`);
            content = extractWithReadability(html, article.sourceUrl);
        }

        if (content && content.length > 100) {
            await updateArticleScrapeStatus(articleId, content, null);
            console.log(`[Scraper] Success: ${content.length} chars for ${article.title.substring(0, 50)}`);
            return { success: true, content, error: null };
        } else {
            await updateArticleScrapeStatus(articleId, null, 'فشل استخراج المحتوى');
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
    error: string | null
): Promise<void> {
    await prisma.rSSArticle.update({
        where: { id: articleId },
        data: {
            fullContent: content,
            contentScraped: !!content,
            scrapeError: error,
            scrapedAt: new Date(),
        },
    });
}

/**
 * Process scrape queue - fetch unscraped articles
 */
export async function processScrapeQueue(limit = 10): Promise<{
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
        take: limit,
        select: { id: true, title: true },
    });

    let successful = 0;

    for (const article of articles) {
        const result = await scrapeArticle(article.id);
        if (result.success) {
            successful++;
        }

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

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
