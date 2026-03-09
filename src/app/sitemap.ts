import { MetadataRoute } from 'next'

const API_URL = process.env.API_URL || "http://127.0.0.1:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";

// Maximum URLs per sitemap (Google recommends max 50,000)
const ARTICLES_PER_SITEMAP = 1000;

/**
 * Generate sitemap index entries.
 * Next.js calls this to discover all sitemap segments: /sitemap/0.xml, /sitemap/1.xml, etc.
 */
export async function generateSitemaps() {
    let totalArticles = 0;
    try {
        const res = await fetch(`${API_URL}/articles?status=PUBLISHED&perPage=1`, {
            next: { revalidate: 600 }, // 10 minutes freshness for news
        });
        if (res.ok) {
            const data = await res.json();
            totalArticles = data.meta?.totalItems || 0;
        }
    } catch {
        totalArticles = 0;
    }

    // At least 1 sitemap (for static + categories), plus one per batch of articles
    const articleSitemaps = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_SITEMAP));

    return Array.from({ length: articleSitemaps }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [];

    // Only include static pages and categories in the first sitemap (id=0)
    if (id === 0) {
        entries.push(
            {
                url: SITE_URL,
                lastModified: new Date(),
                changeFrequency: 'always',
                priority: 1,
            },
            {
                url: `${SITE_URL}/about`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.5,
            },
            {
                url: `${SITE_URL}/contact`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.5,
            },
            {
                url: `${SITE_URL}/privacy`,
                lastModified: new Date(),
                changeFrequency: 'yearly',
                priority: 0.3,
            },
            {
                url: `${SITE_URL}/terms`,
                lastModified: new Date(),
                changeFrequency: 'yearly',
                priority: 0.3,
            },
        );

        // Category pages (fetched dynamically)
        let categories: string[] = [];
        try {
            const catRes = await fetch(`${API_URL}/categories`, {
                next: { revalidate: 3600 },
            });
            if (catRes.ok) {
                const catData = await catRes.json();
                categories = (catData.data || []).map((c: any) => c.slug).filter(Boolean);
            }
        } catch {
            categories = ['politics', 'economy', 'sports', 'culture', 'technology'];
        }
        if (categories.length === 0) {
            categories = ['politics', 'economy', 'sports', 'culture', 'technology'];
        }

        for (const cat of categories) {
            entries.push({
                url: `${SITE_URL}/category/${cat}`,
                lastModified: new Date(),
                changeFrequency: 'always',
                priority: 0.8,
            });
        }
    }

    // Fetch paginated articles for this sitemap segment
    const page = id + 1;
    try {
        const res = await fetch(
            `${API_URL}/articles?status=PUBLISHED&perPage=${ARTICLES_PER_SITEMAP}&page=${page}`,
            { next: { revalidate: 600 } }, // 10 minutes freshness for articles
        );

        if (res.ok) {
            const data = await res.json();
            for (const article of (data.data || [])) {
                
                const sitemapEntry: any = {
                    url: `${SITE_URL}/article/${article.slug || article.id}`,
                    lastModified: new Date(article.updatedAt || article.createdAt),
                    changeFrequency: 'daily',
                    priority: 0.7,
                };
                
                // Add image metadata if available
                if (article.imageUrl) {
                    const imgUrl = article.imageUrl.startsWith('http') 
                        ? article.imageUrl 
                        : `${SITE_URL}${article.imageUrl}`;
                        
                    sitemapEntry.images = [imgUrl];
                }
                
                entries.push(sitemapEntry);
            }
        }
    } catch (error) {
        console.error(`Failed to fetch articles for sitemap segment ${id}:`, error);
    }

    return entries;
}
