/**
 * NewsCardSmall Component — Redesigned
 * 
 * Compact news card for sidebar lists and related articles.
 * Uses next/image for optimization, gradient rank badge, improved spacing.
 */

import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/atoms';
import { getImageUrl } from '@/lib/api';

export interface NewsCardSmallProps {
    title: string;
    imageUrl?: string;
    timeAgo?: string;
    views?: number;
    rank?: number;
    onClick?: () => void;
    className?: string;
}

export const NewsCardSmall: React.FC<NewsCardSmallProps> = ({
    title,
    imageUrl,
    timeAgo,
    views,
    rank,
    onClick,
    className = '',
}) => {
    // Handle image URL
    const displayImageUrl = imageUrl ? getImageUrl(imageUrl) : null;

    return (
        <article
            className={`
                flex gap-3 py-3 border-b border-gray-100/80
                last:border-b-0 last:pb-0
                cursor-pointer hover:bg-gray-50/60 rounded-lg px-2 -mx-2
                transition-colors duration-200
                ${className}
            `}
            onClick={onClick}
            role="article"
        >
            {/* Rank Badge */}
            {rank && (
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-sm shrink-0 mt-0.5"
                    aria-label={`المرتبة ${rank}`}
                >
                    {rank}
                </span>
            )}

            {/* Thumbnail */}
            {displayImageUrl && (
                <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image
                        src={displayImageUrl}
                        alt={title}
                        fill
                        sizes="80px"
                        className="object-cover"
                        loading="lazy"
                    />
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1.5 line-clamp-2 leading-relaxed text-gray-800">
                    {title}
                </h4>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    {views !== undefined && (
                        <span className="flex items-center gap-1">
                            <Icon name="ri-eye-line" size="sm" />
                            <span>{views.toLocaleString('ar-YE')}</span>
                        </span>
                    )}
                    {timeAgo && (
                        <span className="flex items-center gap-1">
                            <Icon name="ri-time-line" size="sm" />
                            <span>{timeAgo}</span>
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
};

export default NewsCardSmall;
