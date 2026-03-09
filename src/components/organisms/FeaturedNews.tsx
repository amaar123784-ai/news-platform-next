/**
 * FeaturedNews Component — Redesigned
 * 
 * Premium hero-style layout:
 * - Main large article (left/top on mobile)
 * - 2 smaller articles stacked on the right
 * - Gradient overlays with elegant typography
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon, Badge } from '@/components/atoms';
import { categoryBadges, type CategoryType } from '@/design-system/tokens';
import { getImageUrl } from '@/lib/api';

export interface FeaturedNewsProps {
    id?: string;
    title: string;
    excerpt?: string;
    category: CategoryType;
    imageUrl: string;
    author?: string;
    timeAgo?: string;
    views?: number;
    isBreaking?: boolean;
    href?: string;
}

/** Single featured article card */
const FeaturedCard: React.FC<FeaturedNewsProps & { variant: 'large' | 'small' }> = ({
    id, title, excerpt, category, imageUrl, author, timeAgo, views, isBreaking, href, variant,
}) => {
    const categoryInfo = categoryBadges[category] || categoryBadges.politics || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'عام' };
    const link = id ? `/article/${id}` : href || '#';
    const displayImageUrl = getImageUrl(imageUrl);

    if (variant === 'large') {
        return (
            <article className="relative h-full min-h-[420px] lg:min-h-[500px] rounded-2xl overflow-hidden group">
                <Link href={link} className="block h-full">
                    <Image
                        src={displayImageUrl}
                        alt={title}
                        fill
                        priority
                        fetchPriority="high"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 60vw"
                    />
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 right-0 left-0 p-5 md:p-8">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="primary">{categoryInfo.label}</Badge>
                            {isBreaking && <Badge variant="breaking">عاجل</Badge>}
                        </div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight line-clamp-3">
                            {title}
                        </h2>
                        {excerpt && (
                            <p className="text-gray-200 text-sm md:text-base line-clamp-2 mb-4 hidden md:block max-w-xl">
                                {excerpt}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-white/80">
                            {timeAgo && (
                                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                    <Icon name="ri-time-line" size="sm" className="text-secondary" />
                                    {timeAgo}
                                </span>
                            )}
                            {views !== undefined && views > 0 && (
                                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                    <Icon name="ri-eye-line" size="sm" className="text-secondary" />
                                    {views.toLocaleString('ar-YE')} مشاهدة
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            </article>
        );
    }

    // Small variant
    return (
        <article className="relative h-full min-h-[200px] lg:min-h-[240px] rounded-2xl overflow-hidden group">
            <Link href={link} className="block h-full">
                <Image
                    src={displayImageUrl}
                    alt={title}
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                <div className="absolute bottom-0 right-0 left-0 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="primary" className="text-xs">{categoryInfo.label}</Badge>
                        {isBreaking && <Badge variant="breaking" className="text-xs">عاجل</Badge>}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white leading-snug line-clamp-2 mb-2">
                        {title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-white/70">
                        {timeAgo && (
                            <span className="flex items-center gap-1">
                                <Icon name="ri-time-line" size="sm" className="text-secondary" />
                                {timeAgo}
                            </span>
                        )}
                        {views !== undefined && views > 0 && (
                            <span className="flex items-center gap-1">
                                <Icon name="ri-eye-line" size="sm" className="text-secondary" />
                                {views.toLocaleString('ar-YE')}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </article>
    );
};

/** Grid layout: 1 large + 2 small */
export const FeaturedNews: React.FC<FeaturedNewsProps> = (props) => {
    return <FeaturedCard {...props} variant="large" />;
};

/** Main export: Featured News Grid with 1 large + 2 small */
export const FeaturedNewsGrid: React.FC<{ articles: FeaturedNewsProps[] }> = ({ articles }) => {
    if (!articles || articles.length === 0) return null;

    const mainArticle = articles[0];
    const sideArticles = articles.slice(1, 3);

    return (
        <section className="mb-6 sm:mb-8">
            {/* Section Header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <Icon name="ri-fire-fill" size="xl" className="text-primary" />
                <h2 className="text-lg sm:text-xl font-bold">مقالات مميزة</h2>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Icon name="ri-refresh-line" size="sm" />
                    تحديث تلقائي
                </span>
            </div>

            {/* Grid: 1 large + 2 stacked small */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Main Article — 3/5 width */}
                <div className="lg:col-span-3">
                    <FeaturedCard {...mainArticle} variant="large" />
                </div>

                {/* Side Articles — 2/5 width, stacked */}
                {sideArticles.length > 0 && (
                    <div className="lg:col-span-2 grid grid-cols-1 gap-4">
                        {sideArticles.map((article, i) => (
                            <FeaturedCard key={article.id || i} {...article} variant="small" />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedNews;
