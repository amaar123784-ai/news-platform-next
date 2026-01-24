/**
 * Standalone Scraper Trigger Script
 * Does NOT import from main server to avoid port conflicts
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const prisma = new PrismaClient();

// Site configs for extraction
const SITE_CONFIGS: Record<string, { selector: string; remove?: string[] }> = {
    'aljazeera.net': { selector: '.wysiwyg--all-content, .article-p-wrapper', remove: ['.article-aside', 'script'] },
    'bbc.com': { selector: 'article[data-component="text-block"]' },
    'alarabiya.net': { selector: '.article-text' },
};

function getSiteConfig(url: string) {
    try {
        const host = new URL(url).hostname.replace('www.', '');
        for (const [domain, cfg] of Object.entries(SITE_CONFIGS)) {
            if (host.includes(domain)) return cfg;
        }
    } catch { }
    return null;
}

async function fetchHTML(url: string): Promise<string | null> {
    try {
        const res = await axios.get(url, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
        });
        return res.data;
    } catch (e: any) {
        console.log(`   ⚠️ Fetch failed: ${e.message}`);
        return null;
    }
}

function extractContent(html: string, url: string): string | null {
    // Try site-specific selectors first
    const cfg = getSiteConfig(url);
    if (cfg) {
        const $ = cheerio.load(html);
        cfg.remove?.forEach(sel => $(sel).remove());
        const content = $(cfg.selector);
        if (content.length) {
            const paragraphs: string[] = [];
            content.find('p').each((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 20) paragraphs.push(text);
            });
            if (paragraphs.length > 0) return paragraphs.join('\n\n');
        }
    }

    // Fallback to Readability
    try {
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        if (article?.textContent) {
            return article.textContent.replace(/\s+/g, ' ').trim();
        }
    } catch { }

    return null;
}

async function scrapeArticle(id: string, url: string, title: string) {
    console.log(`\n📰 Scraping: ${title.substring(0, 50)}...`);

    const html = await fetchHTML(url);
    if (!html) {
        await prisma.rSSArticle.update({
            where: { id },
            data: { scrapeError: 'فشل تحميل الصفحة', scrapedAt: new Date() }
        });
        return false;
    }

    const content = extractContent(html, url);

    if (content && content.length > 100) {
        await prisma.rSSArticle.update({
            where: { id },
            data: {
                fullContent: content,
                contentScraped: true,
                scrapeError: null,
                scrapedAt: new Date()
            }
        });
        console.log(`   ✅ Success! ${content.length} chars`);
        return true;
    } else {
        await prisma.rSSArticle.update({
            where: { id },
            data: { scrapeError: 'فشل استخراج المحتوى', scrapedAt: new Date() }
        });
        console.log(`   ❌ Extraction failed`);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting manual scrape (standalone)...\n');

    const articles = await prisma.rSSArticle.findMany({
        where: {
            status: 'PENDING',
            contentScraped: false,
            sourceUrl: { not: '' },
        },
        orderBy: { fetchedAt: 'desc' },
        take: 30,
        select: { id: true, title: true, sourceUrl: true },
    });

    console.log(`📦 Found ${articles.length} articles to scrape.\n`);

    let success = 0;
    for (const [i, art] of articles.entries()) {
        console.log(`[${i + 1}/${articles.length}]`);
        const ok = await scrapeArticle(art.id, art.sourceUrl, art.title);
        if (ok) success++;
        await new Promise(r => setTimeout(r, 1500)); // Delay
    }

    console.log('\n==========================================');
    console.log(`✅ Successful: ${success} / ${articles.length}`);
    console.log('==========================================');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
