"use client";

/**
 * NewsCard Component — Redesigned
 * 
 * Premium news article card with:
 * - Gradient overlay on image for badge contrast
 * - Primary accent border-top
 * - Hover ring + elevation
 * - Improved typography and spacing
 * - Reading time estimate
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge, Icon } from '@/components/atoms';
import { categoryBadges, type CategoryType } from '@/design-system/tokens';

export interface NewsCardProps {
    id?: string;
    title: string;
    excerpt?: string;
    category: CategoryType;
    imageUrl: string;
    author?: string;
    authorId?: string;
    timeAgo?: string;
    readTime?: number;
    isBreaking?: boolean;
    href?: string;
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
    readTime,
    isBreaking = false,
    href,
    onClick,
}) => {
    const categoryInfo = categoryBadges[category] || categoryBadges.politics || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'عام' };
    const articleLink = id ? `/article/${id}` : href || '#';

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000';
    const displayImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${apiBaseUrl}${imageUrl}`;

    return (
        <article
            className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden
                        hover:shadow-lg hover:ring-1 hover:ring-primary/15 hover:-translate-y-1
                        transition-all duration-300 ease-out relative h-full"
        >
            {/* Accent Top Border */}
            <div className="h-[3px] bg-gradient-to-l from-primary via-primary/60 to-transparent" />

            {/* Image Container — 16:9 */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 shrink-0">
                <Image
                    src={displayImageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Bottom Gradient for badge contrast */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

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

                {/* Clickable Overlay */}
                <Link
                    href={articleLink}
                    onClick={onClick}
                    className="absolute inset-0 z-10"
                    aria-label={`اقرأ المزيد عن: ${title}`}
                />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4">
                {/* Title */}
                <h3 className="font-bold text-base leading-snug mb-1.5 line-clamp-2">
                    <Link
                        href={articleLink}
                        onClick={onClick}
                        className="text-gray-900 group-hover:text-primary transition-colors duration-200 after:absolute after:inset-0 after:z-0"
                    >
                        {title}
                    </Link>
                </h3>

                {/* Excerpt */}
                {excerpt && (
                    <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">
                        {excerpt}
                    </p>
                )}

                {/* Metadata Footer */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium relative z-10">
                    <div className="flex items-center gap-2">
                        {timeAgo && (
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <Icon name="ri-time-line" size="sm" />
                                {timeAgo}
                            </span>
                        )}
                    </div>
                    {readTime && (
                        <span className="flex items-center gap-1 text-gray-300">
                            <Icon name="ri-book-open-line" size="sm" />
                            {readTime} د
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
};

export default NewsCard;
