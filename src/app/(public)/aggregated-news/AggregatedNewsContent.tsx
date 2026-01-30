'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rssService, RSSArticle } from '@/services/rss';
import { AggregatedNewsCard } from '@/components/molecules';
import { Button, Icon } from '@/components/atoms';

export default function AggregatedNewsContent() {
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['rss-articles-page', page],
        queryFn: () => rssService.getArticles({
            page,
            perPage: PER_PAGE,
        }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const articles = data?.data || [];
    const meta = data?.meta;

    // Scroll to top on page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Page Header */}
                    <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            أخبار من مصادر موثوقة
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            تغطية شاملة للأحداث من المصادر العالمية والمحلية الموثوقة
                            <span className="text-xs mr-2 px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                                تحديث تلقائي
                            </span>
                        </p>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <Icon name="ri-error-warning-line" size="2xl" className="text-red-500 mb-4 mx-auto" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">حدث خطأ في تحميل الأخبار</h3>
                            <Button
                                variant="primary"
                                onClick={() => window.location.reload()}
                                className="mt-4"
                            >
                                إعادة المحاولة
                            </Button>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <Icon name="ri-file-list-3-line" size="2xl" className="text-gray-400 mb-4 mx-auto" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">لا توجد أخبار حالياً</h3>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {articles.map((article: RSSArticle) => (
                                    <AggregatedNewsCard
                                        key={article.id}
                                        article={article}
                                        variant="default"
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {meta && meta.totalPages > 1 && (
                                <div className="mt-10 flex justify-center items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                    >
                                        <Icon name="ri-arrow-right-line" className="ml-1" />
                                        السابق
                                    </Button>

                                    <div className="flex items-center gap-1 px-4">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {page}
                                        </span>
                                        <span className="text-gray-500">/</span>
                                        <span className="text-sm text-gray-500">
                                            {meta.totalPages}
                                        </span>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        onClick={() => handlePageChange(Math.min(meta.totalPages, page + 1))}
                                        disabled={page === meta.totalPages}
                                    >
                                        التالي
                                        <Icon name="ri-arrow-left-line" className="mr-1" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-blue-50 dark:bg-gray-800 p-6 rounded-xl sticky top-24">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            عن الخدمة
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                            تقدم منصة الأخبار خدمة تجميع الأخبار من مصادر موثوقة متعددة لتضعك في قلب الحدث لحظة بلحظة.
                        </p>

                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
                            المصادر المعتمدة:
                        </h4>
                        <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <Icon name="ri-check-line" className="text-green-500" />
                                وكالات أنباء عالمية
                            </li>
                            <li className="flex items-center gap-2">
                                <Icon name="ri-check-line" className="text-green-500" />
                                صحف عربية كبرى
                            </li>
                            <li className="flex items-center gap-2">
                                <Icon name="ri-check-line" className="text-green-500" />
                                شبكات إخبارية محلية
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
