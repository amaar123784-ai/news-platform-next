import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || "http://localhost:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";
const FETCH_TIMEOUT = 5000;

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildEmptySitemap(): string {
    return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>';
}

export async function GET() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const res = await fetch(`${API_URL}/articles?status=PUBLISHED&perPage=1000&sortBy=publishedAt&sortOrder=desc`, {
            signal: controller.signal,
            next: { revalidate: 600 },
        });
        clearTimeout(timeout);

        let articles: any[] = [];
        if (res.ok) {
            const data = await res.json();
            articles = data.data || [];
        } else {
            console.error(`[NewsSitemap] API responded with ${res.status}`);
            return new NextResponse(buildEmptySitemap(), {
                status: 200,
                headers: { 'Content-Type': 'application/xml' },
            });
        }

        // Google News sitemap only allows articles from the last 48 hours
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const recentArticles = articles.filter((article: any) => {
            const pubDate = new Date(article.publishedAt || article.createdAt);
            return pubDate >= twoDaysAgo;
        });

        const urlEntries = recentArticles.map((article: any) => {
            const loc = `${SITE_URL}/article/${article.slug || article.id}`;
            const pubDate = new Date(article.publishedAt || article.createdAt).toISOString();
            const title = escapeXml(article.title || '');
            return `
    <url>
        <loc>${loc}</loc>
        <news:news>
            <news:publication>
                <news:name>صوت تهامة</news:name>
                <news:language>ar</news:language>
            </news:publication>
            <news:publication_date>${pubDate}</news:publication_date>
            <news:title>${title}</news:title>
        </news:news>
    </url>`;
        }).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urlEntries}
</urlset>`;

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('[NewsSitemap] Error:', error);
        return new NextResponse(buildEmptySitemap(), {
            status: 200,
            headers: { 'Content-Type': 'application/xml' },
        });
    }
}