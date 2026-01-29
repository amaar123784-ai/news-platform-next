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
import Image from 'next/image';
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
        <article className="news-card bg-white rounded-lg shadow-sm border-2 sm:border-4 border-green-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Link href={articleLink} onClick={onClick} className="block">
                {/* Image Container with Blurred Background */}
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
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <button onClick={handleCategoryClick}>
                            <Badge category={category}>{categoryInfo.label}</Badge>
                        </button>
                        {isBreaking && <Badge variant="breaking">عاجل</Badge>}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 leading-relaxed">{title}</h3>

                    {/* Excerpt */}
                    {excerpt && (
                        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{excerpt}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                        {timeAgo && <span className="whitespace-nowrap">{timeAgo}</span>}
                        {author && (
                            <button
                                onClick={handleAuthorClick}
                                className="hover:text-primary transition-colors truncate max-w-[120px]"
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
