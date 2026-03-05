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
        <article className="group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative h-full">
            {/* Image Container — 16:9 Aspect Ratio */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100 shrink-0">
                {/* Main Image with Hover Scale */}
                <Image
                    src={displayImageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badges — Floating Top Right */}
                <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-20">
                    <Link
                        href={`/category/${category}`}
                        className="hover:scale-105 transition-transform shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Badge category={category}>{categoryInfo.label}</Badge>
                    </Link>
                    {isBreaking && <Badge variant="breaking" className="shadow-sm">عاجل</Badge>}
                </div>

                {/* Title Link Overlay (to make image clickable safely) */}
                <Link
                    href={articleLink}
                    onClick={onClick}
                    className="absolute inset-0 z-10"
                    aria-label={`اقرأ المزيد عن: ${title}`}
                />
            </div>

            {/* Content Container */}
            <div className="flex flex-col flex-1 p-4 sm:p-5">
                {/* Title */}
                <h3 className="font-bold text-lg sm:text-xl mb-3 line-clamp-2 leading-snug">
                    <Link
                        href={articleLink}
                        onClick={onClick}
                        className="text-gray-900 group-hover:text-primary transition-colors after:absolute after:inset-0 after:z-0"
                    >
                        {title}
                    </Link>
                </h3>

                {/* Excerpt */}
                {excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed flex-1 text-balance">
                        {excerpt}
                    </p>
                )}

                {/* Metadata Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium relative z-10">
                    <div className="flex items-center gap-2">
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
                        {author && timeAgo && <span className="text-gray-300">•</span>}
                        {timeAgo && <span className="whitespace-nowrap">{timeAgo}</span>}
                    </div>
                </div>
            </div>
        </article>
    );
};

export default NewsCard;
