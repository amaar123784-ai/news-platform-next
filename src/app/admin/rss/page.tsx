"use client";

/**
 * Admin RSS Sources Management Page
 * Manage external RSS feed sources for content aggregation
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Modal } from '@/components/atoms';
import { DataTable } from '@/components/organisms';
import { TableSkeleton, ConfirmModal } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import { rssService, type RSSSource, type CreateRSSSourceData } from '@/services/rss';
import { categoryService } from '@/services';

// Status labels
const statusLabels: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشط', color: 'bg-green-100 text-green-700' },
    PAUSED: { label: 'متوقف', color: 'bg-yellow-100 text-yellow-700' },
    ERROR: { label: 'خطأ', color: 'bg-red-100 text-red-700' },
};

export default function RSSSourcesPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<RSSSource | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RSSSource | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateRSSSourceData>({
        name: '',
        feedUrl: '',
        websiteUrl: '',
        logoUrl: '',
        description: '',
        categoryId: '',
        fetchInterval: 15,
        applyFilter: true,
    });

    // Fetch RSS sources
    const { data: sourcesData, isLoading, isError } = useQuery({
        queryKey: ['rss-sources'],
        queryFn: () => rssService.getSources(),
    });

    // Fetch categories for dropdown
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });

    // Create source mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateRSSSourceData) => rssService.createSource(data),
        onSuccess: () => {
            success('تم إضافة المصدر بنجاح');
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            setAddModalOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            showError(err.message || 'فشل إضافة المصدر');
        },
    });

    // Update source mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => rssService.updateSource(id, data),
        onSuccess: () => {
            success('تم تحديث المصدر بنجاح');
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            setEditingSource(null);
            resetForm();
        },
        onError: (err: any) => {
            showError(err.message || 'فشل تحديث المصدر');
        },
    });

    // Delete source mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => rssService.deleteSource(id),
        onSuccess: () => {
            success('تم حذف المصدر بنجاح');
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            setDeleteTarget(null);
        },
        onError: (err: any) => {
            showError(err.message || 'فشل حذف المصدر');
        },
    });

    // Fetch source mutation
    const fetchMutation = useMutation({
        mutationFn: (id: string) => rssService.fetchSource(id),
        onSuccess: (data) => {
            success(`تم جلب ${data.data?.newArticles || 0} مقال جديد`);
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
        },
        onError: (err: any) => {
            showError(err.message || 'فشل جلب المقالات');
        },
    });

    // Fetch all sources mutation
    const fetchAllMutation = useMutation({
        mutationFn: () => rssService.fetchAllFeeds(),
        onSuccess: (data) => {
            success(`تم جلب ${data.data?.totalNewArticles || 0} مقال جديد من ${data.data?.sourcesChecked || 0} مصدر`);
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل تحديث المصادر');
        },
    });

    const sources = sourcesData?.data || [];
    const categories = categoriesData || [];

    const resetForm = () => {
        setFormData({
            name: '',
            feedUrl: '',
            websiteUrl: '',
            logoUrl: '',
            description: '',
            categoryId: '',
            fetchInterval: 15,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSource) {
            updateMutation.mutate({ id: editingSource.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const openEditModal = (source: RSSSource) => {
        setFormData({
            name: source.name,
            feedUrl: source.feedUrl,
            websiteUrl: source.websiteUrl || '',
            logoUrl: source.logoUrl || '',
            description: source.description || '',
            categoryId: source.categoryId,
            fetchInterval: source.fetchInterval,
        });
        setEditingSource(source);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مصادر RSS</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        إدارة مصادر الأخبار المجمعة ({sources.length} مصدر)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => fetchAllMutation.mutate()}
                        disabled={fetchAllMutation.isPending}
                    >
                        <Icon name={fetchAllMutation.isPending ? "ri-loader-4-line" : "ri-refresh-line"} className={`ml-2 ${fetchAllMutation.isPending ? 'animate-spin' : ''}`} />
                        {fetchAllMutation.isPending ? 'جاري التحديث...' : 'تحديث الكل'}
                    </Button>
                    <Button variant="primary" onClick={() => setAddModalOpen(true)}>
                        <Icon name="ri-add-line" className="ml-2" />
                        مصدر جديد
                    </Button>
                </div>
            </div>

            {/* Quick Stats - At top */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{sources.length}</div>
                    <div className="text-sm text-gray-500">إجمالي المصادر</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">
                        {sources.filter((s: RSSSource) => s.status === 'ACTIVE').length}
                    </div>
                    <div className="text-sm text-gray-500">مصادر نشطة</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-red-600">
                        {sources.filter((s: RSSSource) => s.status === 'ERROR').length}
                    </div>
                    <div className="text-sm text-gray-500">بها أخطاء</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {sources.reduce((sum: number, s: RSSSource) => sum + (s._count?.articles || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-500">إجمالي المقالات</div>
                </div>
            </div>

            {/* Sources Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {isLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">
                        <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                        <p>حدث خطأ في تحميل المصادر</p>
                    </div>
                ) : sources.length === 0 ? (
                    <div className="p-12 text-center">
                        <Icon name="ri-rss-line" size="2xl" className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">لا توجد مصادر RSS</h3>
                        <p className="text-gray-500 mt-1 mb-4">ابدأ بإضافة مصدر أخبار جديد</p>
                        <Button variant="primary" onClick={() => setAddModalOpen(true)}>
                            <Icon name="ri-add-line" className="ml-2" />
                            إضافة مصدر
                        </Button>
                    </div>
                ) : (
                    <DataTable
                        data={sources}
                        columns={[
                            {
                                key: 'name',
                                header: 'المصدر',
                                render: (source: RSSSource) => (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {source.logoUrl ? (
                                                <img
                                                    src={source.logoUrl}
                                                    alt=""
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = '<i class="ri-rss-line text-gray-400"></i>';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Icon name="ri-rss-line" className="text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{source.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                {source.feedUrl}
                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'category',
                                header: 'التصنيف',
                                render: (source: RSSSource) => (
                                    <span
                                        className="px-2 py-1 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: `${source.category?.color || '#2563EB'}20`,
                                            color: source.category?.color || '#2563EB'
                                        }}
                                    >
                                        {source.category?.name}
                                    </span>
                                )
                            },
                            {
                                key: 'status',
                                header: 'الحالة',
                                render: (source: RSSSource) => {
                                    const statusConfig = statusLabels[source.status];

                                    if (!statusConfig) {
                                        return (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {source.status || 'غير معروف'}
                                            </span>
                                        );
                                    }

                                    return (
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} cursor-help`}
                                            title={source.status === 'ERROR' ? (source.lastError || 'خطأ غير معروف') : ''}
                                        >
                                            {statusConfig.label}
                                        </span>
                                    );
                                }
                            },
                            {
                                key: '_count',
                                header: 'المقالات',
                                render: (source: RSSSource) => (
                                    <span className="text-gray-600">{source._count?.articles || 0}</span>
                                )
                            },
                            {
                                key: 'lastFetchedAt',
                                header: 'آخر تحديث',
                                render: (source: RSSSource) => (
                                    <span className="text-sm text-gray-500">
                                        {source.lastFetchedAt
                                            ? new Date(source.lastFetchedAt).toLocaleString('ar-YE')
                                            : 'لم يتم بعد'}
                                    </span>
                                )
                            },
                        ]}
                        actions={(source: RSSSource) => (
                            <div className="flex gap-1">
                                {source.status === 'ERROR' && (
                                    <button
                                        onClick={() => updateMutation.mutate({
                                            id: source.id,
                                            data: { status: 'ACTIVE' }
                                        })}
                                        disabled={updateMutation.isPending}
                                        className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="إعادة تفعيل المصدر"
                                    >
                                        <Icon name="ri-restart-line" />
                                    </button>
                                )}
                                <button
                                    onClick={() => fetchMutation.mutate(source.id)}
                                    disabled={fetchMutation.isPending}
                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="جلب الأخبار"
                                >
                                    <Icon name="ri-download-line" />
                                </button>
                                <button
                                    onClick={() => openEditModal(source)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="تعديل"
                                >
                                    <Icon name="ri-edit-line" />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(source)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="حذف"
                                >
                                    <Icon name="ri-delete-bin-line" />
                                </button>
                            </div>
                        )}
                    />
                )}
            </div>


            {/* Add/Edit Modal */}
            <Modal
                isOpen={isAddModalOpen || !!editingSource}
                onClose={() => { setAddModalOpen(false); setEditingSource(null); resetForm(); }}
                title={editingSource ? 'تعديل المصدر' : 'إضافة مصدر جديد'}
                width="max-w-xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            اسم المصدر <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="مثال: BBC عربي"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            رابط RSS <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={formData.feedUrl}
                            onChange={(e) => setFormData({ ...formData, feedUrl: e.target.value })}
                            placeholder="https://example.com/rss.xml"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            dir="ltr"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                رابط الموقع
                            </label>
                            <input
                                type="url"
                                value={formData.websiteUrl || ''}
                                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                placeholder="https://example.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                رابط الشعار
                            </label>
                            <input
                                type="url"
                                value={formData.logoUrl || ''}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                placeholder="https://example.com/logo.webp"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Category Selection - Choose 'منوع' for mixed sources with auto-classification */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            التصنيف <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        >
                            <option value="">اختر التصنيف</option>
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            اختر &quot;منوع&quot; للمصادر متعددة الفئات - سيتم تصنيف المقالات تلقائياً
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                فترة التحديث (دقائق)
                            </label>
                            <input
                                type="number"
                                value={formData.fetchInterval}
                                onChange={(e) => setFormData({ ...formData, fetchInterval: Number(e.target.value) })}
                                min={5}
                                max={1440}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                فلترة اليمن الذكية
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.applyFilter !== false}
                                    onChange={(e) => setFormData({ ...formData, applyFilter: e.target.checked })}
                                    className="h-5 w-5 text-primary rounded focus:ring-primary border-gray-300"
                                />
                                <span className="text-gray-700">تفعيل الفلترة</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                عند التعطيل، سيتم استيراد جميع المقالات دون فحص.
                            </p>
                        </div>
                    </div>

                    {/* Description HIDDEN */}
                    {/*
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            الوصف
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    */}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-1"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => { setAddModalOpen(false); setEditingSource(null); resetForm(); }}
                        >
                            إلغاء
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                title="حذف المصدر"
                message={`هل أنت متأكد من حذف مصدر "${deleteTarget?.name}"؟ سيتم حذف جميع المقالات المرتبطة به.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
