import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || "http://127.0.0.1:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";

export async function GET() {
    try {
        // Fetch published articles
        const res = await fetch(`${API_URL}/articles?status=PUBLISHED&perPage=1000&sortBy=publishedAt&sortOrder=desc`, {
            next: { revalidate: 600 }, // 10 minutes cache
        });

        let articles = [];
        if (res.ok) {
            const data = await res.json();
            articles = data.data || [];
        }

        // Google News sitemap only allows articles from the last 48 hours
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const recentArticles = articles.filter((article: any) => {
            const pubDate = new Date(article.publishedAt || article.createdAt);
            return pubDate >= twoDaysAgo;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    ${recentArticles.map((article: any) => `
    <url>
        <loc>${SITE_URL}/article/${article.slug || article.id}</loc>
        <news:news>
            <news:publication>
                <news:name>صوت تهامة</news:name>
                <news:language>ar</news:language>
            </news:publication>
            <news:publication_date>${new Date(article.publishedAt || article.createdAt).toISOString()}</news:publication_date>
            <news:title>${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</news:title>
        </news:news>
    </url>`).join('')}
</urlset>`;

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('Error generating Google News sitemap:', error);
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>', {
            status: 200,
            headers: { 'Content-Type': 'application/xml' },
        });
    }
}