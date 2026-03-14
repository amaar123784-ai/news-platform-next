import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/login',
                    '/register',
                    '/forgot-password',
                    '/search',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/admin/', '/api/', '/search'],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
