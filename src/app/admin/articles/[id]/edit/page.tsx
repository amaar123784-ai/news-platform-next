"use client";

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArticleForm } from '@/components/templates/ArticleForm';
import { articleService, categoryService } from '@/services';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const { data: categories = [], isLoading: isCatLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });

    const { data: article, isLoading: isArtLoading, isError } = useQuery({
        queryKey: ['article', id],
        queryFn: () => articleService.getArticle(id),
    });

    if (isCatLoading || isArtLoading) {
        return <div className="p-8 text-center">جاري التحميل...</div>;
    }

    if (isError || !article) {
        return <div className="p-8 text-center text-red-500">فشل تحميل المقال</div>;
    }

    return (
        <ArticleForm
            categories={categories}
            isEditMode
            initialData={{
                ...article,
                categoryId: article.category.id
            }}
        />
    );
}
