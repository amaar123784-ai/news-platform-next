"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArticleForm } from '@/components/templates/ArticleForm';
import { categoryService, rssService } from '@/services';

function CreateArticleContent() {
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });

    const searchParams = useSearchParams();
    const rssArticleId = searchParams.get('rssArticleId');

    // Fetch RSS article details if converting
    const { data: rssData, isLoading: isLoadingRSS } = useQuery({
        queryKey: ['rss-article', rssArticleId],
        queryFn: () => rssArticleId ? rssService.getArticle(rssArticleId) : null,
        enabled: !!rssArticleId,
    });

    // Determine initial data
    const getInitialData = () => {
        if (rssData?.data) {
            const article = rssData.data;
            return {
                title: article.rewrittenTitle || article.title,
                excerpt: article.rewrittenExcerpt || article.excerpt || '',
                content: article.fullContent || article.rewrittenExcerpt || article.excerpt || '',
                imageUrl: article.imageUrl || '',
                status: 'draft' as const,
                // Pass source info potentially as tags or extra meta if needed
            };
        }

        // Fallback for legacy URL params or empty state
        const title = searchParams.get('title') || '';
        const rawContent = searchParams.get('content') || '';
        const rawImageUrl = searchParams.get('imageUrl') || '';
        const imageUrl = rawImageUrl ? decodeURIComponent(rawImageUrl) : '';

        if (!title && !rawContent) return undefined;

        return {
            title,
            excerpt: rawContent,
            content: rawContent,
            imageUrl,
            status: 'draft' as const,
        };
    };

    if (isLoadingCategories || isLoadingRSS) {
        return <div className="p-8 text-center">جاري التحميل...</div>;
    }

    return (
        <ArticleForm categories={categories} initialData={getInitialData()} />
    );
}

export default function CreateArticlePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}>
            <CreateArticleContent />
        </Suspense>
    );
}
