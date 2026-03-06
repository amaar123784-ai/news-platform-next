/**
 * RSS Feed XML Output (Next.js Route Handler)
 * Generates a standard RSS 2.0 XML feed of published articles.
 * Used by dlvr.it (or any RSS reader) to auto-publish to X/Twitter & Facebook.
 *
 * URL: /rss.xml
 */

import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';
const SITE_NAME = 'صوت تهامة';
const SITE_DESCRIPTION = 'منصة إخبارية يمنية شاملة - آخر الأخبار والتقارير';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Strip HTML tags for description
 */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '').trim();
}

export async function GET() {
    try {
        // Fetch latest published articles from the backend API
        const response = await fetch(`${API_URL}/articles?status=PUBLISHED&perPage=50&sortBy=publishedAt&sortOrder=desc`, {
            next: { revalidate: 900 }, // Cache for 15 minutes
            headers: {
                'Accept': 'application/json',
            },
        });

        let articles: any[] = [];

        if (response.ok) {
            const data = await response.json();
            articles = data.data || [];
        }

        // Build RSS XML
        const now = new Date().toUTCString();

        const items = articles.map((article: any) => {
            const title = escapeXml(article.title || '');
            const link = `${SITE_URL}/article/${article.slug || article.id}`;
            const description = escapeXml(stripHtml(article.excerpt || article.content || '').substring(0, 500));
            const pubDate = article.publishedAt
                ? new Date(article.publishedAt).toUTCString()
                : now;
            const category = article.category?.name ? `<category>${escapeXml(article.category.name)}</category>` : '';
            const author = article.author?.name ? `<dc:creator>${escapeXml(article.author.name)}</dc:creator>` : '';

            // Image as enclosure (for dlvr.it to include images)
            let enclosure = '';
            if (article.imageUrl) {
                const imageUrl = article.imageUrl.startsWith('http')
                    ? article.imageUrl
                    : `${SITE_URL}${article.imageUrl}`;
                enclosure = `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />`;
            }

            // Media content for better image support
            let mediaContent = '';
            if (article.imageUrl) {
                const imageUrl = article.imageUrl.startsWith('http')
                    ? article.imageUrl
                    : `${SITE_URL}${article.imageUrl}`;
                mediaContent = `<media:content url="${escapeXml(imageUrl)}" medium="image" />`;
            }

            return `    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <description><![CDATA[${stripHtml(article.excerpt || '')}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      ${category}
      ${author}
      ${enclosure}
      ${mediaContent}
    </item>`;
        }).join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ar</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
            },
        });
    } catch (error) {
        console.error('[RSS Feed] Error generating feed:', error);

        // Return empty valid RSS on error
        const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
  </channel>
</rss>`;

        return new NextResponse(emptyXml, {
            status: 200,
            headers: {
                'Content-Type': 'application/rss+xml; charset=utf-8',
            },
        });
    }
}
