import { MetadataRoute } from 'next'

// Configuration
const API_URL = process.env.API_URL || "http://127.0.0.1:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";

/**
 * Dynamic Sitemap Generator
 * This function generates a comprehensive sitemap listing static pages
 * and dynamically fetched articles to fix 404 errors in Search Console.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Define static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    // Fetch latest published articles from backend API
    // We fetch a large batch (up to 1000) to ensure good coverage
    const res = await fetch(`${API_URL}/articles?status=PUBLISHED&perPage=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!res.ok) {
      console.error('Sitemap: Failed to fetch articles from API');
      return staticRoutes;
    }

    const json = await res.json();
    const articles = json.data || [];

    // Map articles to sitemap format
    const dynamicRoutes: MetadataRoute.Sitemap = articles.map((article: any) => ({
      url: `${SITE_URL}/article/${article.slug || article.id}`,
      lastModified: new Date(article.updatedAt || article.createdAt || new Date()),
      changeFrequency: 'hourly',
      priority: 0.8,
    }));

    // Return combined array
    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    // Graceful fallback: if API/DB is down, return only static routes to prevent 500 error
    console.error('Sitemap Error:', error);
    return staticRoutes;
  }
}
