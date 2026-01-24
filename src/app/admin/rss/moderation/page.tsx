"use client";

/**
 * Admin RSS Moderation Page
 * Review and approve/reject pending RSS articles
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon } from '@/components/atoms';
import { TableSkeleton, ConfirmModal, FullContentModal } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import { rssService, type RSSArticle } from '@/services/rss';

// Helper component for rendering rows (prevents code duplication)
const ArticleRow = ({ article, selected, onToggle, onApprove, onReject, onRewrite, onConvert, onViewContent, isProcessing }: any) => (
    <div className="p-4 hover:bg-gray-50 flex flex-col gap-4 group">
        <div className="flex gap-4">
            <input
                type="checkbox"
                checked={selected}
                onChange={onToggle}
                className="w-4 h-4 mt-1 text-primary rounded border-gray-300 cursor-pointer"
            />

            {article.imageUrl && (
                <img
                    src={article.imageUrl}
                    alt=""
                    className="w-24 h-16 object-cover rounded flex-shrink-0"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue-600 font-medium">
                        {article.source.name}
                    </span>
                    {article.source.category && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: `${article.source.category.color || '#2563EB'}20`,
                                color: article.source.category.color || '#2563EB'
                            }}
                        >
                            {article.source.category.name}
                        </span>
                    )}
                    <span className="text-xs text-gray-400">
                        {new Date(article.publishedAt).toLocaleString('ar-YE')}
                    </span>
                </div>

                <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {article.rewrittenTitle || article.title}
                    {article.isRewritten && (
                        <span className="inline-flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mr-2">
                            ✨ تمت الصياغة
                        </span>
                    )}
                    {article.contentScraped && (
                        <span className="inline-flex items-center text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mr-2">
                            📄 محتوى كامل
                        </span>
                    )}
                    {article.scrapeError && (
                        <span className="inline-flex items-center text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded mr-2" title={article.scrapeError}>
                            ⚠️ فشل الجلب
                        </span>
                    )}
                </h3>

                {(article.rewrittenExcerpt || article.excerpt) && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                        {article.rewrittenExcerpt || article.excerpt}
                    </p>
                )}

                <div className="flex gap-3 mt-2">
                    <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-500 hover:underline"
                    >
                        <Icon name="ri-external-link-line" className="ml-1" size="sm" />
                        عرض المصدر
                    </a>
                    {article.contentScraped && (
                        <button
                            onClick={onViewContent}
                            className="inline-flex items-center text-xs text-green-600 hover:underline"
                        >
                            <Icon name="ri-file-text-line" className="ml-1" size="sm" />
                            عرض المحتوى الكامل
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 justify-end pt-2 border-t border-gray-100">
            <Button
                variant="primary"
                size="sm"
                onClick={onApprove}
                disabled={isProcessing.approve}
                title="قبول ونشر"
            >
                <Icon name="ri-check-line" className="ml-1" />
                <span>قبول</span>
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={onRewrite}
                disabled={isProcessing.rewrite || article.isRewritten}
                className="text-purple-600 hover:bg-purple-50"
                title="إعادة صياغة"
            >
                <Icon name="ri-magic-line" className="ml-1" />
                <span>إعادة صياغة</span>
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={onConvert}
                className="text-blue-600 hover:bg-blue-50"
                title="تحويل لمقال"
            >
                <Icon name="ri-edit-box-line" className="ml-1" />
                <span>تحويل</span>
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={onReject}
                disabled={isProcessing.reject}
                className="text-red-600 hover:bg-red-50"
                title="رفض وحذف"
            >
                <Icon name="ri-close-line" className="ml-1" />
                <span>رفض</span>
            </Button>
        </div>
    </div>
);

export default function RSSModerationPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
    const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
    const [sourceSearch, setSourceSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [viewArticle, setViewArticle] = useState<RSSArticle | null>(null);

    // Reset page when source or category changes
    React.useEffect(() => {
        setPage(1);
    }, [activeSourceId, selectedCategoryId]);

    // Reset source when category changes
    React.useEffect(() => {
        setActiveSourceId(null);
    }, [selectedCategoryId]);

    // Fetch moderation sources
    const { data: sourcesData } = useQuery({
        queryKey: ['rss-moderation-sources'],
        queryFn: () => rssService.getModerationSources(),
    });

    const uniqueSources = sourcesData?.data || [];

    // Extract unique categories from sources
    const categories = React.useMemo(() => {
        const cats = new Map();
        uniqueSources.forEach((source: any) => {
            if (source.category) {
                cats.set(source.category.id, source.category);
            }
        });
        return Array.from(cats.values());
    }, [uniqueSources]);

    // Filter sources tabs based on search and category
    const displayedSources = uniqueSources.filter((source: any) => {
        const matchesSearch = source.name.toLowerCase().includes(sourceSearch.toLowerCase());
        const matchesCategory = selectedCategoryId ? source.category?.id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });

    // Fetch pending articles
    const { data, isLoading, isError } = useQuery({
        queryKey: ['rss-moderation', page, activeSourceId, selectedCategoryId],
        queryFn: () => rssService.getModerationQueue({
            page,
            perPage: 20,
            sourceId: activeSourceId || undefined,
            categoryId: selectedCategoryId || undefined
        }),
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: (id: string) => rssService.updateArticleStatus(id, 'APPROVED'),
        onSuccess: () => {
            success('تم قبول المقال');
            queryClient.invalidateQueries({ queryKey: ['rss-moderation'] });
        },
        onError: (err: any) => showError(err.message || 'فشل قبول المقال'),
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: (id: string) => rssService.updateArticleStatus(id, 'REJECTED'),
        onSuccess: () => {
            success('تم رفض المقال');
            queryClient.invalidateQueries({ queryKey: ['rss-moderation'] });
        },
        onError: (err: any) => showError(err.message || 'فشل رفض المقال'),
    });

    // Bulk approve mutation
    const bulkApproveMutation = useMutation({
        mutationFn: (ids: string[]) => rssService.bulkUpdateArticles(ids, 'APPROVED'),
        onSuccess: (data) => {
            success(`تم قبول ${data.data?.updatedCount || 0} مقال`);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['rss-moderation'] });
        },
        onError: (err: any) => showError(err.message || 'فشل قبول المقالات'),
    });

    // Bulk reject mutation
    const bulkRejectMutation = useMutation({
        mutationFn: (ids: string[]) => rssService.bulkUpdateArticles(ids, 'REJECTED'),
        onSuccess: (data) => {
            success(`تم رفض ${data.data?.updatedCount || 0} مقال`);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['rss-moderation'] });
        },
        onError: (err: any) => showError(err.message || 'فشل رفض المقالات'),
    });

    // AI Rewrite mutation (single)
    const rewriteMutation = useMutation({
        mutationFn: (id: string) => rssService.rewriteArticle(id),
        onSuccess: () => {
            success('تم إعادة صياغة المقال بالذكاء الاصطناعي');
            queryClient.invalidateQueries({ queryKey: ['rss-moderation'] });
        },
        onError: (err: any) => showError(err.message || 'فشل إعادة الصياغة'),
    });

    // Bulk AI Rewrite mutation
    const bulkRewriteMutation = useMutation({
        mutationFn: (ids: string[]) => rssService.bulkRewriteArticles(ids),
        onSuccess: (data) => {
            success(`تم إعادة صياغة ${data.data?.successCount || 0} مقال`);
            queryClient.invalidateQueries({ queryKey: ['rss-moderation'] });
        },
        onError: (err: any) => showError(err.message || 'فشل إعادة الصياغة'),
    });

    const articles = data?.data || [];
    const meta = data?.meta;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (articles.length > 0 && articles.every((a: RSSArticle) => selectedIds.includes(a.id))) {
            const allIds = articles.map((a: RSSArticle) => a.id);
            setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
        } else {
            const allIds = articles.map((a: RSSArticle) => a.id);
            setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
        }
    };

    const handleConvertToArticle = (article: RSSArticle) => {
        // Use fullContent if available, otherwise fall back to excerpt
        const articleContent = article.fullContent || article.rewrittenExcerpt || article.excerpt || '';

        const params = new URLSearchParams({
            title: article.rewrittenTitle || article.title,
            content: articleContent,
            imageUrl: article.imageUrl || '',
            sourceUrl: article.sourceUrl,
            sourceName: article.source.name,
            rssArticleId: article.id, // Track source for image processing
        });
        router.push(`/admin/articles/create?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">مراجعة المقالات</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            مقالات RSS في انتظار المراجعة ({meta?.totalItems || 0} مقال)
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                title="عرض القائمة"
                            >
                                <Icon name="ri-list-check" />
                            </button>
                            <button
                                onClick={() => setViewMode('grouped')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grouped' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                title="تجميع حسب المصدر"
                            >
                                <Icon name="ri-folders-line" />
                            </button>
                        </div>

                        {/* Bulk Actions */}
                        {selectedIds.length > 0 && (
                            <div className="flex gap-2 items-center border-r border-gray-200 pr-3 mr-1">
                                <span className="text-sm text-gray-600 hidden sm:inline">
                                    {selectedIds.length} محدد
                                </span>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => bulkApproveMutation.mutate(selectedIds)}
                                    disabled={bulkApproveMutation.isPending}
                                >
                                    <Icon name="ri-check-line" className="ml-1" />
                                    <span className="hidden sm:inline">قبول</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => bulkRejectMutation.mutate(selectedIds)}
                                    disabled={bulkRejectMutation.isPending}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Icon name="ri-close-line" className="ml-1" />
                                    <span className="hidden sm:inline">رفض</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => bulkRewriteMutation.mutate(selectedIds.slice(0, 10))}
                                    disabled={bulkRewriteMutation.isPending || selectedIds.length > 10}
                                    className="text-purple-600 hover:bg-purple-50"
                                >
                                    <Icon name="ri-magic-line" className="ml-1" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters Section */}
                {uniqueSources.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            {/* Category Filter Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategoryId(null)}
                                    className={`
                                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${selectedCategoryId === null
                                            ? 'bg-gray-800 text-white shadow-sm'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                    `}
                                >
                                    كل التصنيفات
                                </button>
                                {categories.map((cat: any) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                            ${selectedCategoryId === cat.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                        style={selectedCategoryId === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Icon name="ri-search-line" className="absolute top-2.5 right-3 text-gray-400" size="sm" />
                                <input
                                    type="text"
                                    value={sourceSearch}
                                    onChange={(e) => setSourceSearch(e.target.value)}
                                    placeholder="ابحث عن مصدر..."
                                    className="w-full pr-9 pl-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        {/* Source Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                            <button
                                onClick={() => setActiveSourceId(null)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                                    ${activeSourceId === null
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <Icon name="ri-apps-line" />
                                الكل
                            </button>
                            {displayedSources.map((source: any) => (
                                <button
                                    key={source.id}
                                    onClick={() => setActiveSourceId(source.id === activeSourceId ? null : source.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border
                                        ${activeSourceId === source.id
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                    `}
                                >
                                    {source.logoUrl ? (
                                        <img src={source.logoUrl} alt="" className="w-5 h-5 rounded object-contain" />
                                    ) : (
                                        <Icon name="ri-rss-line" />
                                    )}
                                    {source.name}
                                    <span className={`mr-1 px-1.5 py-0.5 rounded-full text-xs ${activeSourceId === source.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                        {source._count?.articles || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Articles List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {isLoading ? (
                    <TableSkeleton rows={5} columns={4} />
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">
                        <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                        <p>حدث خطأ في تحميل المقالات</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="p-12 text-center">
                        <Icon name="ri-check-double-line" size="2xl" className="text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">لا توجد مقالات للمراجعة</h3>
                        <p className="text-gray-500 mt-1">
                            {activeSourceId ? 'لا توجد مقالات من هذا المصدر' : 'جميع المقالات تمت مراجعتها'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Select All Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectedIds.length === articles.length}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 text-primary rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-600">تحديد الكل</span>
                        </div>

                        {/* Articles */}
                        {/* Articles */}
                        {viewMode === 'list' ? (
                            <div className="divide-y divide-gray-200">
                                {articles.map((article: RSSArticle) => (
                                    <ArticleRow
                                        key={article.id}
                                        article={article}
                                        selected={selectedIds.includes(article.id)}
                                        onToggle={() => toggleSelect(article.id)}
                                        onApprove={() => approveMutation.mutate(article.id)}
                                        onReject={() => rejectMutation.mutate(article.id)}
                                        onRewrite={() => rewriteMutation.mutate(article.id)}
                                        onConvert={() => handleConvertToArticle(article)}
                                        onViewContent={() => setViewArticle(article)}
                                        isProcessing={{
                                            approve: approveMutation.isPending,
                                            reject: rejectMutation.isPending,
                                            rewrite: rewriteMutation.isPending
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {/* Group by Source */}
                                {Object.entries(
                                    articles.reduce((groups: Record<string, { source: any, articles: RSSArticle[] }>, article: RSSArticle) => {
                                        const sourceId = article.source.id || 'unknown';
                                        if (!groups[sourceId]) {
                                            groups[sourceId] = {
                                                source: article.source,
                                                articles: []
                                            };
                                        }
                                        groups[sourceId].articles.push(article);
                                        return groups;
                                    }, {})
                                ).map(([sourceId, group]: [string, any]) => (
                                    <div key={sourceId} className="bg-white">
                                        <div className="px-4 py-3 bg-gray-50 border-y border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {group.source.logoUrl ? (
                                                    <img src={group.source.logoUrl} alt="" className="w-6 h-6 object-contain rounded" />
                                                ) : <Icon name="ri-rss-line" className="text-gray-400" />}
                                                <h3 className="font-bold text-gray-800">{group.source.name}</h3>
                                                <span className="text-xs bg-white border px-2 py-0.5 rounded text-gray-500">
                                                    {group.articles.length} مقال
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        const ids = group.articles.map((a: RSSArticle) => a.id);
                                                        const allSelected = ids.every((id: string) => selectedIds.includes(id));
                                                        if (allSelected) {
                                                            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                                                        } else {
                                                            setSelectedIds(prev => [...new Set([...prev, ...ids])]);
                                                        }
                                                    }}
                                                >
                                                    تحديد المجموعة
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {group.articles.map((article: RSSArticle) => (
                                                <ArticleRow
                                                    key={article.id}
                                                    article={article}
                                                    selected={selectedIds.includes(article.id)}
                                                    onToggle={() => toggleSelect(article.id)}
                                                    onApprove={() => approveMutation.mutate(article.id)}
                                                    onReject={() => rejectMutation.mutate(article.id)}
                                                    onRewrite={() => rewriteMutation.mutate(article.id)}
                                                    onConvert={() => handleConvertToArticle(article)}
                                                    onViewContent={() => setViewArticle(article)}
                                                    isProcessing={{
                                                        approve: approveMutation.isPending,
                                                        reject: rejectMutation.isPending,
                                                        rewrite: rewriteMutation.isPending
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        السابق
                    </Button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                        صفحة {page} من {meta.totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages}
                    >
                        التالي
                    </Button>
                </div>
            )}

            <FullContentModal
                isOpen={!!viewArticle}
                onClose={() => setViewArticle(null)}
                article={viewArticle}
            />
        </div>
    );
}
