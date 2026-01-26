/**
 * FeaturedNews Component
 * 
 * Hero-style featured article with large image and overlay content.
 * 
 * @see components.cards.featuredNews in design-system.json
 * 
 * @example
 * <FeaturedNews
 *   title="عنوان الخبر الرئيسي"
 *   excerpt="ملخص تفصيلي للخبر..."
 *   category="politics"
 *   imageUrl="/hero.jpg"
 *   author="المحرر السياسي"
 *   timeAgo="منذ 30 دقيقة"
 *   views={15240}
 * />
 */

import React from 'react';
import { Icon, Badge } from '@/components/atoms';
import { categoryBadges, type CategoryType } from '@/design-system/tokens';

export interface FeaturedNewsProps {
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
    /** Time since publication */
    timeAgo?: string;
    /** View count */
    views?: number;
    /** Whether this is breaking news */
    isBreaking?: boolean;
    /** Link URL (deprecated) */
    href?: string;
}

export const FeaturedNews: React.FC<FeaturedNewsProps> = ({
    id,
    title,
    excerpt,
    category,
    imageUrl,
    author,
    timeAgo,
    views,
    isBreaking = false,
    href,
}) => {
    const categoryInfo = categoryBadges[category] || categoryBadges.politics || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'عام' };
    const link = id ? `/article/${id}` : href || '#';

    // Handle image URL with environment variable
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000';
    const displayImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${apiBaseUrl}${imageUrl}`;

    return (
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
            <a href={link} className="block relative">
                {/* Large Image */}
                <img
                    src={displayImageUrl}
                    alt={title}
                    className="w-full h-96 object-contain object-center bg-gray-50"
                    loading="eager"
                />

                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent p-6 pt-24">
                    {/* Badges */}
                    <div className="flex items-center gap-3 mb-4">
                        <Badge variant="primary">{categoryInfo.label}</Badge>
                        {isBreaking && <Badge variant="breaking">عاجل</Badge>}
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-white mb-3">{title}</h2>

                    {/* Excerpt */}
                    {excerpt && (
                        <p className="text-gray-200 mb-4 text-lg line-clamp-2">{excerpt}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-6 text-sm text-white font-medium">
                        {timeAgo && (
                            <div className="flex items-center gap-2 bg-black/20 px-2 py-1 md:px-3 md:py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                                <Icon name="ri-time-line" size="sm" className="text-secondary" />
                                <span>{timeAgo}</span>
                            </div>
                        )}
                        {author && (
                            <div className="flex items-center gap-2 bg-black/20 px-2 py-1 md:px-3 md:py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                                <Icon name="ri-user-line" size="sm" className="text-secondary" />
                                <span>{author}</span>
                            </div>
                        )}
                        {views !== undefined && (
                            <div className="flex items-center gap-2 bg-black/20 px-2 py-1 md:px-3 md:py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                                <Icon name="ri-eye-line" size="sm" className="text-secondary" />
                                <span>{views.toLocaleString('ar-YE')} مشاهدة</span>
                            </div>
                        )}
                    </div>
                </div>
            </a>
        </article>
    );
};

export default FeaturedNews;
