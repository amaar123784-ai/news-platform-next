"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { getRelatedArticles, getImageUrl, formatTimeAgo } from '@/lib/api';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';

interface ReadNextScrollProps {
    currentArticleId: string;
    categoryId: string;
}

export const ReadNextScroll: React.FC<ReadNextScrollProps> = ({ currentArticleId, categoryId }) => {
    const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: false,
    });

    const fetchMoreArticles = async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            // We fetch 2 articles at a time
            const data = await getRelatedArticles(currentArticleId, 2);
            
            // Filter out articles we already have in the list
            const existingIds = new Set(relatedArticles.map(a => a.id));
            const newArticles = data.filter((a: any) => !existingIds.has(a.id));

            if (newArticles.length === 0) {
                setHasMore(false);
            } else {
                setRelatedArticles(prev => [...prev, ...newArticles]);
                // For this implementation, we limit to 4 read-next articles to avoid infinite memory bloat
                if (relatedArticles.length + newArticles.length >= 4) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch more articles:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            fetchMoreArticles();
        }
    }, [inView, hasMore, isLoading]);

    return (
        <div className="mt-12 space-y-12">
            {relatedArticles.map((article, index) => (
                <div key={article.id} className="pt-12 border-t-2 border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gray-200"></div>
                        <span className="text-primary font-bold flex items-center gap-2 px-4 py-1 bg-primary/5 rounded-full text-sm">
                            <Icon name="ri-book-open-line" />
                            اقرأ أيضاً
                        </span>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>

                    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="flex flex-col md:flex-row">
                            {/* Image side */}
                            <div className="relative w-full md:w-1/3 h-48 md:h-auto min-h-[200px]">
                                <Image
                                    src={getImageUrl(article.imageUrl)}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Content side */}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div>
                                    <Badge category={article.category?.slug || 'politics'} className="mb-3">
                                        {article.category?.name || 'أخبار'}
                                    </Badge>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-tight font-arabic">
                                        {article.title}
                                    </h3>
                                    <p className="text-gray-600 line-clamp-2 mb-4 text-sm md:text-base leading-relaxed">
                                        {article.excerpt}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Icon name="ri-time-line" size="sm" />
                                        {formatTimeAgo(article.publishedAt || article.createdAt)}
                                    </span>
                                    <Link 
                                        href={`/article/${article.slug || article.id}`}
                                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors flex items-center gap-2"
                                    >
                                        قراءة المقال كاملاً
                                        <Icon name="ri-arrow-left-line" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            ))}

            {/* Intersection Observer Target & Loading State */}
            <div ref={ref} className="py-8 flex justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-400 text-sm">جاري تحميل المزيد...</span>
                    </div>
                )}
                {!hasMore && relatedArticles.length > 0 && (
                    <div className="text-center py-4 bg-gray-100 rounded-xl w-full">
                        <span className="text-gray-500 font-medium">وصلت إلى نهاية المقالات المقترحة</span>
                    </div>
                )}
            </div>
        </div>
    );
};
