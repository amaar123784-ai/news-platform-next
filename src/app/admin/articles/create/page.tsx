"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArticleForm } from '@/components/templates/ArticleForm';
import { categoryService } from '@/services';

function CreateArticleContent() {
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });

    const searchParams = useSearchParams();

    // Construct initial data from URL parameters (e.g. from RSS conversion)
    const getInitialData = () => {
        if (!searchParams.toString()) return undefined;

        const title = searchParams.get('title') || '';
        const rawContent = searchParams.get('content') || '';
        const rawImageUrl = searchParams.get('imageUrl') || '';
        const imageUrl = rawImageUrl ? decodeURIComponent(rawImageUrl) : '';
        const sourceUrl = searchParams.get('sourceUrl');
        const sourceName = searchParams.get('sourceName');

        const content = rawContent;


        return {
            title,
            excerpt: rawContent,
            content,
            imageUrl,
            status: 'draft' as const,
        };
    };

    if (isLoading) {
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
