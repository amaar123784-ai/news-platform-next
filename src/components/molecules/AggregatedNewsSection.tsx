'use client';

/**
 * AggregatedNewsSection Component
 * Displays a grid of RSS articles with source attribution and filtering
 */

import { useQuery } from '@tanstack/react-query';
import { rssService, RSSArticle } from '@/services/rss';
import { AggregatedNewsCard } from './AggregatedNewsCard';

interface AggregatedNewsSectionProps {
    /** Filter by category ID */
    categoryId?: string;
    /** Filter by category slug */
    categorySlug?: string;
    /** Maximum number of articles to display */
    limit?: number;
    /** Section title */
    title?: string;
    /** Show section header */
    showHeader?: boolean;
    /** Layout variant */
    layout?: 'grid' | 'list' | 'featured';
    /** Custom className */
    className?: string;
}

export function AggregatedNewsSection({
    categoryId,
    categorySlug,
    limit = 6,
    title = 'أخبار من مصادر موثوقة',
    showHeader = true,
    layout = 'grid',
    className = '',
}: AggregatedNewsSectionProps) {
    const { data, isLoading, error, isError } = useQuery({
        queryKey: ['rss-articles', categoryId, categorySlug],
        queryFn: () => rssService.getArticles({
            categoryId,
            category: categorySlug,
            perPage: limit,
        }),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // 10 minutes
    });

    // Loading skeleton
    if (isLoading) {
        return (
            <section className={`py-6 ${className}`}>
                {showHeader && (
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                    </div>
                )}

                <div className={`
          ${layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}
          ${layout === 'list' ? 'space-y-3' : ''}
          ${layout === 'featured' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}
        `}>
                    {[...Array(layout === 'list' ? 5 : limit)].map((_, i) => (
                        <div
                            key={i}
                            className={`
                bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse
                ${layout === 'list' ? 'h-20' : 'h-64'}
              `}
                        />
                    ))}
                </div>
            </section>
        );
    }

    // Error or empty state - don't render section
    if (isError || !data?.data?.length) {
        return null;
    }

    const articles = data.data.slice(0, limit);

    return (
        <section className={`py-6 ${className}`}>
            {/* Header */}
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                            مصادر خارجية
                        </span>
                    </div>

                    {data.meta.totalItems > limit && (
                        <a
                            href="/aggregated-news"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            عرض المزيد
                        </a>
                    )}
                </div>
            )}

            {/* Content based on layout */}
            {layout === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map((article: RSSArticle) => (
                        <AggregatedNewsCard key={article.id} article={article} variant="default" />
                    ))}
                </div>
            )}

            {layout === 'list' && (
                <div className="space-y-3">
                    {articles.map((article: RSSArticle) => (
                        <AggregatedNewsCard key={article.id} article={article} variant="compact" />
                    ))}
                </div>
            )}

            {layout === 'featured' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* First article as featured */}
                    {articles[0] && (
                        <div className="lg:row-span-2">
                            <AggregatedNewsCard article={articles[0]} variant="featured" />
                        </div>
                    )}

                    {/* Remaining articles as compact */}
                    <div className="space-y-3">
                        {articles.slice(1).map((article: RSSArticle) => (
                            <AggregatedNewsCard key={article.id} article={article} variant="compact" />
                        ))}
                    </div>
                </div>
            )}

            {/* Attribution notice */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                    الأخبار مجمعة من مصادر خارجية موثوقة • يتم التحديث كل 15 دقيقة
                </p>
            </div>
        </section>
    );
}

export default AggregatedNewsSection;
