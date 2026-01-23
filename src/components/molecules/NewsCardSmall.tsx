/**
 * NewsCardSmall Component
 * 
 * Compact news card for sidebar lists and related articles.
 * 
 * @see components.cards in design-system.json
 * 
 * @example
 * <NewsCardSmall
 *   title="عنوان الخبر"
 *   timeAgo="منذ ساعة"
 *   views={1500}
 *   rank={1}
 * />
 */

import React from 'react';
import { Icon } from '@/components/atoms';

export interface NewsCardSmallProps {
    /** Article title */
    title: string;
    /** Image URL (optional) */
    imageUrl?: string;
    /** Time since publication */
    timeAgo?: string;
    /** View count */
    views?: number;
    /** Rank number for "most read" lists */
    rank?: number;
    /** onClick handler */
    onClick?: () => void;
    /** Additional CSS classes */
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
    return (
        <article
            className={`
        flex gap-3 pb-4 border-b border-gray-100 
        last:border-b-0 last:pb-0 
        cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2
        ${className}
      `}
            onClick={onClick}
            role="article"
        >
            {rank && (
                <span className="text-2xl font-bold text-primary" aria-label={`المرتبة ${rank}`}>
                    {rank}
                </span>
            )}

            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-20 h-15 object-cover rounded-lg"
                    loading="lazy"
                />
            )}

            <div className="flex-1">
                <h4 className="font-medium text-sm mb-1 line-clamp-2">{title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {views !== undefined && (
                        <span className="flex items-center gap-1">
                            <Icon name="ri-eye-line" size="sm" />
                            <span>{views.toLocaleString('ar-YE')} مشاهدة</span>
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
