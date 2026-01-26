"use client";

/**
 * NewsCard Component
 * 
 * Standard news article card with image, category, title, excerpt, and metadata.
 * Uses Next.js for navigation.
 * 
 * @see components.cards.news in design-system.json
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/atoms';
import { categoryBadges, type CategoryType } from '@/design-system/tokens';

export interface NewsCardProps {
    /** Article ID for linking */
    id?: string;
    /** Article title */
    title: string;
    /** Article excerpt/summary */
    excerpt?: string;
    /** Category key from design system */
    category: CategoryType;
    /** Featured image URL */
    imageUrl: string;
    /** Author name */
    author?: string;
    /** Author ID for linking */
    authorId?: string;
    /** Time since publication */
    timeAgo?: string;
    /** Whether this is breaking news */
    isBreaking?: boolean;
    /** Legacy href (deprecated, use id) */
    href?: string;
    /** Click handler */
    onClick?: () => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
    id,
    title,
    excerpt,
    category,
    imageUrl,
    author,
    authorId,
    timeAgo,
    isBreaking = false,
    href,
    onClick,
}) => {
    const router = useRouter();
    const categoryInfo = categoryBadges[category] || categoryBadges.politics || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'عام' };

    // Determine article link
    const articleLink = id ? `/article/${id}` : href || '#';

    // Handle image URL with environment variable
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000';
    const displayImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${apiBaseUrl}${imageUrl}`;

    const handleCategoryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/category/${category}`);
    };

    const handleAuthorClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (authorId) {
            router.push(`/author/${authorId}`);
        }
    };

    return (
        <article className="news-card bg-white rounded-lg shadow-sm border-4 border-green-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Link href={articleLink} onClick={onClick} className="block">
                {/* Image */}
                <img
                    src={displayImageUrl}
                    alt={title}
                    className="w-full h-64 object-cover object-center"
                    loading="lazy"
                />

                {/* Content */}
                <div className="p-4">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                        <button onClick={handleCategoryClick}>
                            <Badge category={category}>{categoryInfo.label}</Badge>
                        </button>
                        {isBreaking && <Badge variant="breaking">عاجل</Badge>}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>

                    {/* Excerpt */}
                    {excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{excerpt}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        {timeAgo && <span>{timeAgo}</span>}
                        {author && (
                            <button
                                onClick={handleAuthorClick}
                                className="hover:text-primary transition-colors"
                            >
                                {author}
                            </button>
                        )}
                    </div>
                </div>
            </Link>
        </article>
    );
};

export default NewsCard;
