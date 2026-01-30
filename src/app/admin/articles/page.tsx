"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, StatusBadge, Input, Modal } from '@/components/atoms';
import { DataTable, useToast } from '@/components/organisms';
import { ConfirmModal } from '@/components/molecules';
import { articleService, categoryService } from '@/services';
import type { StatusType, Article } from '@/types/api.types';

export default function ArticleListPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [breakingFilter, setBreakingFilter] = useState<'all' | 'breaking' | 'featured'>('all');

    // Selection states
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

    const [page, setPage] = useState(1);

    // Fetch categories for filter
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });
    const categories = categoriesData || [];

    // Fetch articles from API
    const { data, isLoading, isError } = useQuery({
        queryKey: ['articles', 'admin-list', {
            page,
            search: searchTerm,
            status: statusFilter,
            category: categoryFilter,
            breaking: breakingFilter
        }],
        queryFn: () => articleService.getArticles({
            page,
            perPage: 20,
            search: searchTerm || undefined,
            status: (statusFilter as any) || undefined,
            categoryId: categoryFilter || undefined,
            isBreaking: breakingFilter === 'breaking' ? true : undefined,
            isFeatured: breakingFilter === 'featured' ? true : undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        }),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => articleService.deleteArticle(id),
        onSuccess: () => {
            success('تم حذف المقال بنجاح');
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            setDeleteModalOpen(false);
            setArticleToDelete(null);
        },
        onError: () => {
            error('فشل حذف المقال');
        },
    });

    // Bulk delete mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            // Delete articles one by one
            for (const id of ids) {
                await articleService.deleteArticle(id);
            }
            return { deletedCount: ids.length };
        },
        onSuccess: (data) => {
            success(`تم حذف ${data.deletedCount} مقال بنجاح`);
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            setBulkDeleteModalOpen(false);
            setSelectedIds([]);
        },
        onError: () => {
            error('فشل حذف المقالات');
        },
    });

    // Bulk status update mutation
    const bulkStatusMutation = useMutation({
        mutationFn: async ({ ids, status }: { ids: string[], status: string }) => {
            for (const id of ids) {
                await articleService.updateArticle(id, { status } as any);
            }
            return { updatedCount: ids.length };
        },
        onSuccess: (data, variables) => {
            const statusLabel = variables.status === 'PUBLISHED' ? 'نشر' :
                variables.status === 'ARCHIVED' ? 'أرشفة' : 'تحديث';
            success(`تم ${statusLabel} ${data.updatedCount} مقال بنجاح`);
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            setSelectedIds([]);
        },
        onError: () => {
            error('فشل تحديث المقالات');
        },
    });

    const articles = data?.data || [];
    const meta = data?.meta;

    const handleDeleteClick = (id: string) => {
        setArticleToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (articleToDelete) {
            deleteMutation.mutate(articleToDelete);
        }
    };

    // Selection handlers
    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (articles.length > 0 && articles.every((a: Article) => selectedIds.includes(a.id))) {
            const allIds = articles.map((a: Article) => a.id);
            setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
        } else {
            const allIds = articles.map((a: Article) => a.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...allIds])));
        }
    };

    // Map API status to StatusType
    const mapStatus = (status: string): StatusType => {
        const statusMap: Record<string, StatusType> = {
            'PUBLISHED': 'published',
            'DRAFT': 'draft',
            'REVIEW': 'review',
            'ARCHIVED': 'archived',
        };
        return statusMap[status] || 'draft';
    };

    // Reset page when filters change
    React.useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter, categoryFilter, breakingFilter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">إدارة المحتوى</h1>
                    <p className="text-gray-500 text-sm mt-1">تصفح وإدارة جميع المقالات ({meta?.totalItems || 0} مقال)</p>
                </div>
                <Link href="/admin/articles/create">
                    <Button variant="primary">
                        <Icon name="ri-add-line" className="ml-2" />
                        إضافة مقال
                    </Button>
                </Link>
            </div>

            {/* Quick Filters - Breaking/Featured */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setBreakingFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${breakingFilter === 'all'
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Icon name="ri-article-line" className="ml-2" />
                    كل المقالات
                </button>
                <button
                    onClick={() => setBreakingFilter('breaking')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${breakingFilter === 'breaking'
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                >
                    <Icon name="ri-flashlight-line" className="ml-2" />
                    أخبار عاجلة
                </button>
                <button
                    onClick={() => setBreakingFilter('featured')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${breakingFilter === 'featured'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
                        }`}
                >
                    <Icon name="ri-star-line" className="ml-2" />
                    مقالات مهمة
                </button>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                {/* Search */}
                <div className="w-full md:w-80">
                    <Input
                        type="search"
                        placeholder="بحث في العنوان..."
                        icon="ri-search-line"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Filter */}
                <select
                    className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">جميع الأقسام</option>
                    {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">جميع الحالات</option>
                    <option value="PUBLISHED">منشور</option>
                    <option value="DRAFT">مسودة</option>
                    <option value="REVIEW">مراجعة</option>
                    <option value="ARCHIVED">مؤرشف</option>
                </select>

                <div className="flex-1"></div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                        <span className="text-sm text-gray-600 font-medium">
                            {selectedIds.length} محدد
                        </span>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'PUBLISHED' })}
                            disabled={bulkStatusMutation.isPending}
                        >
                            <Icon name="ri-check-line" className="ml-1" />
                            نشر
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'ARCHIVED' })}
                            disabled={bulkStatusMutation.isPending}
                            className="text-yellow-600 hover:bg-yellow-50"
                        >
                            <Icon name="ri-archive-line" className="ml-1" />
                            أرشفة
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setBulkDeleteModalOpen(true)}
                            disabled={bulkDeleteMutation.isPending}
                            className="text-red-600 hover:bg-red-50"
                        >
                            <Icon name="ri-delete-bin-line" className="ml-1" />
                            حذف
                        </Button>
                    </div>
                )}
            </div>

            {/* Articles Table with selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Select All Header */}
                {articles.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
                        <input
                            type="checkbox"
                            checked={articles.length > 0 && articles.every((a: Article) => selectedIds.includes(a.id))}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-primary rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">تحديد الكل</span>
                    </div>
                )}

                {/* Articles List */}
                <div className="divide-y divide-gray-200">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                    ) : isError ? (
                        <div className="p-8 text-center text-red-500">
                            <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                            <p>حدث خطأ في تحميل المقالات</p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="p-12 text-center">
                            <Icon name="ri-article-line" size="2xl" className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">لا توجد مقالات</h3>
                            <p className="text-gray-500 mt-1 mb-4">جرب تغيير الفلاتر أو أضف مقالاً جديداً</p>
                        </div>
                    ) : (
                        articles.map((article: any) => (
                            <div key={article.id} className="p-4 hover:bg-gray-50 flex items-start gap-4 group">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(article.id)}
                                    onChange={() => toggleSelect(article.id)}
                                    className="w-4 h-4 mt-1 text-primary rounded border-gray-300 cursor-pointer"
                                />

                                {/* Article Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        {/* Badges */}
                                        {article.isBreaking && (
                                            <span className="inline-flex items-center text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                                                <Icon name="ri-flashlight-line" size="xs" className="ml-1" />
                                                عاجل
                                            </span>
                                        )}
                                        {article.isFeatured && (
                                            <span className="inline-flex items-center text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
                                                <Icon name="ri-star-line" size="xs" className="ml-1" />
                                                مهم
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                            {article.category?.name || 'غير مصنف'}
                                        </span>
                                        <StatusBadge status={mapStatus(article.status)} />
                                    </div>

                                    <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                                        {article.title}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Icon name="ri-user-line" size="xs" />
                                            {article.author?.name || 'المحرر'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icon name="ri-calendar-line" size="xs" />
                                            {new Date(article.createdAt).toLocaleDateString('ar-YE')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icon name="ri-eye-line" size="xs" />
                                            {(article.views || 0).toLocaleString()} مشاهدة
                                        </span>
                                    </div>
                                </div>

                                {/* Actions - Always visible */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <Link href={`/admin/articles/${article.id}/edit`}>
                                        <button
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <Icon name="ri-edit-line" size="lg" />
                                        </button>
                                    </Link>
                                    <button
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="حذف"
                                        onClick={() => handleDeleteClick(article.id)}
                                    >
                                        <Icon name="ri-delete-bin-line" size="lg" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
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

            {/* Single Delete Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="تأكيد الحذف"
                message={`هل أنت متأكد أنك تريد حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={bulkDeleteModalOpen}
                onClose={() => setBulkDeleteModalOpen(false)}
                onConfirm={() => bulkDeleteMutation.mutate(selectedIds)}
                title="تأكيد حذف المقالات"
                message={`هل أنت متأكد من حذف ${selectedIds.length} مقال؟ لا يمكن التراجع عن هذا الإجراء.`}
                confirmLabel="حذف الكل"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
