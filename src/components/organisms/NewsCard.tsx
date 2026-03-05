"use client";

/**
 * NewsCard Component
 * 
 * Standard news article card with image, category, title, excerpt, and metadata.
 * Refactored to avoid nested interactive elements (no <button> inside <a>).
 * 
 * Structure:
 * - Card wrapper: <article>
 * - Title link: <Link> (main clickable area)
 * - Category/author: separate interactive elements outside the link scope
 * 
 * @see components.cards.news in design-system.json
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    const categoryInfo = categoryBadges[category] || categoryBadges.politics || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'عام' };

    // Determine article link
    const articleLink = id ? `/article/${id}` : href || '#';

    // Handle image URL with environment variable
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000';
    const displayImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${apiBaseUrl}${imageUrl}`;

    return (
        <article className="news-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
            {/* Image Container with Blurred Background — entire area is clickable via stretched link */}
            <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-gray-100">
                {/* Blurred Background Image */}
                <Image
                    src={displayImageUrl}
                    alt=""
                    fill
                    className="object-cover blur-xl opacity-60 scale-110"
                    aria-hidden="true"
                />

                {/* Main Image */}
                <Image
                    src={displayImageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="relative object-contain object-center z-10 p-1 sm:p-2"
                />
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4">
                {/* Badges — separate from the main link */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 relative z-10">
                    <Link
                        href={`/category/${category}`}
                        className="hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Badge category={category}>{categoryInfo.label}</Badge>
                    </Link>
                    {isBreaking && <Badge variant="breaking">عاجل</Badge>}
                </div>

                {/* Title — main card link with stretched pseudo-element */}
                <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 leading-relaxed">
                    <Link
                        href={articleLink}
                        onClick={onClick}
                        className="hover:text-primary transition-colors after:absolute after:inset-0 after:z-0"
                    >
                        {title}
                    </Link>
                </h3>

                {/* Excerpt */}
                {excerpt && (
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{excerpt}</p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 relative z-10">
                    {timeAgo && <span className="whitespace-nowrap">{timeAgo}</span>}
                    {author && (
                        authorId ? (
                            <Link
                                href={`/author/${authorId}`}
                                className="hover:text-primary transition-colors truncate max-w-[120px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {author}
                            </Link>
                        ) : (
                            <span className="truncate max-w-[120px]">{author}</span>
                        )
                    )}
                </div>
            </div>
        </article>
    );
};

export default NewsCard;
