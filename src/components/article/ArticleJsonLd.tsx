import React from 'react';
import { getImageUrl } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";

interface ArticleJsonLdProps {
    article: any;
}

/**
 * ArticleJsonLd - NewsArticle Structured Data
 * Injects NewsArticle JSON-LD schema following schema.org standards.
 */
export default function ArticleJsonLd({ article }: ArticleJsonLdProps) {
    const imageUrl = getImageUrl(article.imageUrl);
    const absoluteImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
    
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.seoTitle || article.title,
        "image": [
            absoluteImageUrl || `${SITE_URL}/images/logo.png`
        ],
        "datePublished": article.publishedAt || article.createdAt,
        "dateModified": article.updatedAt || article.createdAt,
        "author": [{
            "@type": "Person",
            "name": article.author?.name || "محرر صوت تهامة",
            "url": article.author?.slug ? `${SITE_URL}/author/${article.author.slug}` : SITE_URL
        }],
        "publisher": {
            "@type": "Organization",
            "name": "صوت تهامة",
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/images/logo.png`
            }
        },
        "description": article.seoDesc || article.excerpt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${SITE_URL}/article/${article.slug || article.id}`
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
