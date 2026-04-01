import { MetadataRoute } from 'next';

const API_URL = process.env.API_URL || "http://127.0.0.1:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";
const ITEMS_PER_SITEMAP = 1000;

/**
 * Generate multiple sitemap IDs based on total article count
 */
export async function generateSitemaps() {
    try {
        const res = await fetch(`${API_URL}/articles?status=PUBLISHED&perPage=1`);
        const json = await res.json();
        const total = json.pagination?.total || 2000; // Fallback to 2000
        const numberOfSitemaps = Math.ceil(total / ITEMS_PER_SITEMAP);
        
        return Array.from({ length: numberOfSitemaps }, (_, id) => ({ id }));
    } catch (error) {
        return [{ id: 0 }];
    }
}

/**
 * Dynamic Sitemap Generator
 */
export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
        { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ];

    const categories = ['politics', 'economy', 'sports', 'culture', 'technology', 'society', 'miscellaneous'];
    const categoryRoutes: MetadataRoute.Sitemap = categories.map(slug => ({
        url: `${SITE_URL}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.6,
    }));

    try {
        const page = id + 1;
        const res = await fetch(`${API_URL}/articles?status=PUBLISHED&page=${page}&perPage=${ITEMS_PER_SITEMAP}`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) return id === 0 ? [...staticRoutes, ...categoryRoutes] : [];

        const json = await res.json();
        const articles = json.data || [];

        const articleRoutes: MetadataRoute.Sitemap = articles.map((article: any) => ({
            url: `${SITE_URL}/article/${article.slug || article.id}`,
            lastModified: new Date(article.updatedAt || article.createdAt || new Date()),
            changeFrequency: 'daily',
            priority: 0.8,
        }));

        // Include static and category routes only in the first sitemap chunk
        if (id === 0) {
            return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
        }

        return articleRoutes;
    } catch (error) {
        console.error('Sitemap fetch error:', error);
        return id === 0 ? [...staticRoutes, ...categoryRoutes] : [];
    }
}
