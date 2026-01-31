'use client';

/**
 * AggregatedNewsCard Component
 * Displays a single RSS article with source attribution
 * Links to external source URL
 */

import { RSSArticle } from '@/services/rss';

interface AggregatedNewsCardProps {
    article: RSSArticle;
    variant?: 'default' | 'compact' | 'featured';
}

export function AggregatedNewsCard({ article, variant = 'default' }: AggregatedNewsCardProps) {
    const formattedDate = new Date(article.publishedAt).toLocaleDateString('ar-YE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const formattedTime = new Date(article.publishedAt).toLocaleTimeString('ar-YE', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (variant === 'compact') {
        return (
            <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
            >
                {/* Compact Image */}
                {article.imageUrl && (
                    <div className="flex-shrink-0 w-20 h-16 overflow-hidden rounded-md">
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Source Badge */}
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                            منصة الأخبار
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{formattedTime}</span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                    </h4>
                </div>
            </a>
        );
    }

    if (variant === 'featured') {
        return (
            <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
                {/* Featured Image */}
                {article.imageUrl && (
                    <div className="relative h-56 overflow-hidden">
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Source Badge on Image - UPDATED */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-full">
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] text-white font-bold">
                                Y
                            </div>
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                منصة الأخبار
                            </span>
                        </div>
                    </div>
                )}

                <div className="p-5">
                    {/* Category & Date */}
                    <div className="flex items-center justify-between mb-3">
                        {article.feed?.category && (
                            <span
                                className="text-xs font-medium px-2 py-1 rounded-full"
                                style={{
                                    backgroundColor: `${article.feed.category.color || '#2563EB'}15`,
                                    color: article.feed.category.color || '#2563EB'
                                }}
                            >
                                {article.feed.category.name}
                            </span>
                        )}
                        <span className="text-xs text-gray-500">{formattedDate}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors mb-3">
                        {article.title}
                    </h3>

                    {/* Excerpt */}
                    {article.excerpt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                            {article.excerpt}
                        </p>
                    )}

                    {/* External Link Indicator */}
                    <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        قراءة المزيد من المصدر
                    </div>
                </div>
            </a>
        );
    }

    // Default variant
    return (
        <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
        >
            {/* Image */}
            {article.imageUrl && (
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                </div>
            )}

            <div className="p-4">
                {/* Source Attribution - UPDATED: Show Platform Name */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                        Y
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        منصة الأخبار
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formattedDate}</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                </h3>

                {/* Excerpt */}
                {article.excerpt && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article.excerpt}
                    </p>
                )}

                {/* External Link Indicator */}
                <div className="mt-3 flex items-center text-xs text-gray-500">
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    قراءة المزيد من المصدر
                </div>
            </div>
        </a>
    );
}

export default AggregatedNewsCard;
