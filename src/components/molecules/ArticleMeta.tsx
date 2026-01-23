/**
 * ArticleMeta Component
 * 
 * Displays article metadata: author, date, views, read time.
 * 
 * @example
 * <ArticleMeta 
 *   author="أحمد الشرعبي" 
 *   date="15 يناير 2026"
 *   views={15240}
 *   readTime={5}
 * />
 */

import React from 'react';
import { Icon, Avatar } from '@/components/atoms';

export interface ArticleMetaProps {
    /** Author name */
    author?: string;
    /** Author avatar URL */
    authorImage?: string;
    /** Publication date */
    date?: string;
    /** View count */
    views?: number;
    /** Estimated read time in minutes */
    readTime?: number;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show avatar */
    showAvatar?: boolean;
    /** Additional CSS classes */
    className?: string;
}

const sizeClasses = {
    sm: 'text-xs gap-3',
    md: 'text-sm gap-4',
    lg: 'text-base gap-6',
};

export const ArticleMeta: React.FC<ArticleMetaProps> = ({
    author,
    authorImage,
    date,
    views,
    readTime,
    size = 'sm',
    showAvatar = false,
    className = '',
}) => {
    return (
        <div className={`flex items-center flex-wrap text-gray-500 ${sizeClasses[size]} ${className}`}>
            {/* Author */}
            {author && (
                <div className="flex items-center gap-2">
                    {showAvatar && authorImage && (
                        <Avatar
                            size="sm"
                            src={authorImage}
                            alt={author}
                            placeholder={false}
                        />
                    )}
                    {!showAvatar && <Icon name="ri-user-line" size="sm" />}
                    <span>{author}</span>
                </div>
            )}

            {/* Date */}
            {date && (
                <div className="flex items-center gap-1">
                    <Icon name="ri-time-line" size="sm" />
                    <span>{date}</span>
                </div>
            )}

            {/* Views */}
            {views !== undefined && (
                <div className="flex items-center gap-1">
                    <Icon name="ri-eye-line" size="sm" />
                    <span>{views.toLocaleString('ar-YE')} مشاهدة</span>
                </div>
            )}

            {/* Read Time */}
            {readTime && (
                <div className="flex items-center gap-1">
                    <Icon name="ri-book-open-line" size="sm" />
                    <span>{readTime} دقائق قراءة</span>
                </div>
            )}
        </div>
    );
};

export default ArticleMeta;
