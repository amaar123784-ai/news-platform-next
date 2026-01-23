import { MetadataRoute } from 'next'

const API_URL = process.env.API_URL || "http://127.0.0.1:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'hourly',
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
    ];

    // Category pages
    const categories = ['politics', 'economy', 'sports', 'culture', 'technology'];
    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
        url: `${SITE_URL}/category/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
    }));

    // Fetch published articles
    let articlePages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${API_URL}/articles?status=PUBLISHED&perPage=1000`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (res.ok) {
            const data = await res.json();
            articlePages = data.data.map((article: any) => ({
                url: `${SITE_URL}/article/${article.slug || article.id}`,
                lastModified: new Date(article.updatedAt || article.createdAt),
                changeFrequency: 'daily' as const,
                priority: 0.7,
            }));
        }
    } catch (error) {
        console.error('Failed to fetch articles for sitemap:', error);
    }

    return [...staticPages, ...categoryPages, ...articlePages];
}
