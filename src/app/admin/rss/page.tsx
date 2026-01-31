"use client";

/**
 * Admin RSS Sources Management Page
 * Manage external RSS feed sources with multi-feed support
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Modal } from '@/components/atoms';
import { DataTable } from '@/components/organisms';
import { TableSkeleton, ConfirmModal } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import {
    rssService,
    type RSSSource,
    type RSSFeed,
    type CreateRSSSourceData,
    type CreateFeedData,
    type UpdateRSSSourceData,
    type UpdateRSSFeedData
} from '@/services/rss';
import { categoryService } from '@/services';

// Status labels
const statusLabels: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشط', color: 'bg-green-100 text-green-700' },
    PAUSED: { label: 'متوقف', color: 'bg-yellow-100 text-yellow-700' },
    ERROR: { label: 'خطأ', color: 'bg-red-100 text-red-700' },
};

// Initial feed state
const emptyFeed: CreateFeedData = {
    feedUrl: '',
    categoryId: '',
    fetchInterval: 15,
    applyFilter: true,
};

export default function RSSSourcesPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Modal states
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<RSSSource | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RSSSource | null>(null);
    const [feedsModalSource, setFeedsModalSource] = useState<RSSSource | null>(null);
    const [editingFeed, setEditingFeed] = useState<RSSFeed | null>(null);
    const [deleteFeedTarget, setDeleteFeedTarget] = useState<RSSFeed | null>(null);

    // Form state for creating source
    const [sourceFormData, setSourceFormData] = useState({
        name: '',
        websiteUrl: '',
        logoUrl: '',
        description: '',
    });

    // Feeds list for new source
    const [newFeeds, setNewFeeds] = useState<CreateFeedData[]>([{ ...emptyFeed }]);

    // Feed form for adding/editing individual feed
    const [feedFormData, setFeedFormData] = useState<CreateFeedData>({ ...emptyFeed });

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
            resetSourceForm();
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل إضافة المصدر');
        },
    });

    // Update source mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateRSSSourceData }) => rssService.updateSource(id, data),
        onSuccess: () => {
            success('تم تحديث المصدر بنجاح');
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            setEditingSource(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل تحديث المصدر');
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
            showError(err.response?.data?.message || err.message || 'فشل حذف المصدر');
        },
    });

    // Fetch source (all feeds) mutation
    const fetchMutation = useMutation({
        mutationFn: (id: string) => rssService.fetchSource(id),
        onSuccess: (data) => {
            success(`تم جلب ${data.data?.totalNewArticles || 0} مقال جديد من ${data.data?.feedsCount || 0} رابط`);
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل جلب المقالات');
        },
    });

    // Fetch all sources mutation
    const fetchAllMutation = useMutation({
        mutationFn: () => rssService.fetchAllFeeds(),
        onSuccess: (data) => {
            success(`تم جلب ${data.data?.totalNewArticles || 0} مقال جديد من ${data.data?.feedsChecked || 0} رابط`);
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل تحديث المصادر');
        },
    });

    // Add feed to source mutation
    const addFeedMutation = useMutation({
        mutationFn: ({ sourceId, data }: { sourceId: string; data: CreateFeedData }) =>
            rssService.addFeed(sourceId, data),
        onSuccess: () => {
            success('تم إضافة الرابط بنجاح');
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            setFeedFormData({ ...emptyFeed });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل إضافة الرابط');
        },
    });

    // Update feed mutation
    const updateFeedMutation = useMutation({
        mutationFn: ({ feedId, data }: { feedId: string; data: UpdateRSSFeedData }) =>
            rssService.updateFeed(feedId, data),
        onSuccess: () => {
            success('تم تحديث الرابط بنجاح');
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            setEditingFeed(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل تحديث الرابط');
        },
    });

    // Delete feed mutation
    const deleteFeedMutation = useMutation({
        mutationFn: (feedId: string) => rssService.deleteFeed(feedId),
        onSuccess: () => {
            success('تم حذف الرابط بنجاح');
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            setDeleteFeedTarget(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل حذف الرابط');
        },
    });

    // Fetch single feed mutation
    const fetchFeedMutation = useMutation({
        mutationFn: (feedId: string) => rssService.fetchFeed(feedId),
        onSuccess: (data) => {
            success(`تم جلب ${data.data?.newArticles || 0} مقال جديد`);
            queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || err.message || 'فشل جلب المقالات');
        },
    });

    const sources = sourcesData?.data || [];
    const categories = categoriesData || [];

    // Calculate stats
    const totalFeeds = sources.reduce((sum: number, s: RSSSource) => sum + (s._count?.feeds || 0), 0);
    const totalArticles = sources.reduce((sum: number, s: RSSSource) => sum + (s._count?.articles || 0), 0);
    const activeFeeds = sources.reduce((sum: number, s: RSSSource) =>
        sum + (s.feeds?.filter(f => f.status === 'ACTIVE').length || 0), 0);
    const errorFeeds = sources.reduce((sum: number, s: RSSSource) =>
        sum + (s.feeds?.filter(f => f.status === 'ERROR').length || 0), 0);

    const resetSourceForm = () => {
        setSourceFormData({
            name: '',
            websiteUrl: '',
            logoUrl: '',
            description: '',
        });
        setNewFeeds([{ ...emptyFeed }]);
    };

    const handleCreateSource = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate feeds
        const validFeeds = newFeeds.filter(f => f.feedUrl && f.categoryId);
        if (validFeeds.length === 0) {
            showError('يجب إضافة رابط RSS واحد على الأقل');
            return;
        }

        createMutation.mutate({
            name: sourceFormData.name,
            websiteUrl: sourceFormData.websiteUrl || null,
            logoUrl: sourceFormData.logoUrl || null,
            description: sourceFormData.description || null,
            feeds: validFeeds,
        });
    };

    const handleUpdateSource = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSource) return;

        updateMutation.mutate({
            id: editingSource.id,
            data: {
                name: sourceFormData.name,
                websiteUrl: sourceFormData.websiteUrl || null,
                logoUrl: sourceFormData.logoUrl || null,
                description: sourceFormData.description || null,
            },
        });
    };

    const openEditSourceModal = (source: RSSSource) => {
        setSourceFormData({
            name: source.name,
            websiteUrl: source.websiteUrl || '',
            logoUrl: source.logoUrl || '',
            description: source.description || '',
        });
        setEditingSource(source);
    };

    const openFeedsModal = (source: RSSSource) => {
        setFeedsModalSource(source);
        setFeedFormData({ ...emptyFeed });
    };

    const addNewFeedRow = () => {
        setNewFeeds([...newFeeds, { ...emptyFeed }]);
    };

    const updateFeedRow = (index: number, field: keyof CreateFeedData, value: any) => {
        const updated = [...newFeeds];
        updated[index] = { ...updated[index], [field]: value };
        setNewFeeds(updated);
    };

    const removeFeedRow = (index: number) => {
        if (newFeeds.length > 1) {
            setNewFeeds(newFeeds.filter((_, i) => i !== index));
        }
    };

    const handleAddFeedToSource = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedsModalSource || !feedFormData.feedUrl || !feedFormData.categoryId) return;

        addFeedMutation.mutate({
            sourceId: feedsModalSource.id,
            data: feedFormData,
        });
    };

    const handleUpdateFeed = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFeed) return;

        updateFeedMutation.mutate({
            feedId: editingFeed.id,
            data: {
                feedUrl: feedFormData.feedUrl,
                categoryId: feedFormData.categoryId,
                fetchInterval: feedFormData.fetchInterval,
                applyFilter: feedFormData.applyFilter,
            },
        });
    };

    const openEditFeedModal = (feed: RSSFeed) => {
        setFeedFormData({
            feedUrl: feed.feedUrl,
            categoryId: feed.categoryId,
            fetchInterval: feed.fetchInterval,
            applyFilter: feed.applyFilter,
        });
        setEditingFeed(feed);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مصادر RSS</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        إدارة مصادر الأخبار ({sources.length} مصدر، {totalFeeds} رابط)
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{sources.length}</div>
                    <div className="text-sm text-gray-500">إجمالي المصادر</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{activeFeeds}</div>
                    <div className="text-sm text-gray-500">روابط نشطة</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-red-600">{errorFeeds}</div>
                    <div className="text-sm text-gray-500">بها أخطاء</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{totalArticles}</div>
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
                                                    }}
                                                />
                                            ) : (
                                                <Icon name="ri-rss-line" className="text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{source.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {source._count?.feeds || 0} رابط
                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'feeds',
                                header: 'الروابط والتصنيفات',
                                render: (source: RSSSource) => (
                                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                                        {source.feeds?.slice(0, 3).map((feed) => (
                                            <span
                                                key={feed.id}
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${feed.status === 'ERROR' ? 'bg-red-100 text-red-700' :
                                                        feed.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                                                            ''
                                                    }`}
                                                style={feed.status === 'ACTIVE' ? {
                                                    backgroundColor: `${feed.category?.color || '#2563EB'}20`,
                                                    color: feed.category?.color || '#2563EB'
                                                } : {}}
                                                title={feed.feedUrl}
                                            >
                                                {feed.category?.name}
                                            </span>
                                        ))}
                                        {(source.feeds?.length || 0) > 3 && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                +{(source.feeds?.length || 0) - 3}
                                            </span>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: '_count',
                                header: 'المقالات',
                                render: (source: RSSSource) => (
                                    <span className="text-gray-600">{source._count?.articles || 0}</span>
                                )
                            },
                        ]}
                        actions={(source: RSSSource) => (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openFeedsModal(source)}
                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="إدارة الروابط"
                                >
                                    <Icon name="ri-links-line" />
                                </button>
                                <button
                                    onClick={() => fetchMutation.mutate(source.id)}
                                    disabled={fetchMutation.isPending}
                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="جلب الأخبار"
                                >
                                    <Icon name="ri-download-line" />
                                </button>
                                <button
                                    onClick={() => openEditSourceModal(source)}
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


            {/* Add Source Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setAddModalOpen(false); resetSourceForm(); }}
                title="إضافة مصدر جديد"
                width="max-w-2xl"
            >
                <form onSubmit={handleCreateSource} className="space-y-4">
                    {/* Source Info */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                        <h3 className="font-medium text-gray-900">بيانات المصدر</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                اسم المصدر <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={sourceFormData.name}
                                onChange={(e) => setSourceFormData({ ...sourceFormData, name: e.target.value })}
                                placeholder="مثال: الجزيرة"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رابط الموقع</label>
                                <input
                                    type="url"
                                    value={sourceFormData.websiteUrl}
                                    onChange={(e) => setSourceFormData({ ...sourceFormData, websiteUrl: e.target.value })}
                                    placeholder="https://example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار</label>
                                <input
                                    type="url"
                                    value={sourceFormData.logoUrl}
                                    onChange={(e) => setSourceFormData({ ...sourceFormData, logoUrl: e.target.value })}
                                    placeholder="https://example.com/logo.webp"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Feeds */}
                    <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">روابط RSS</h3>
                            <Button type="button" variant="secondary" size="sm" onClick={addNewFeedRow}>
                                <Icon name="ri-add-line" className="ml-1" />
                                إضافة رابط
                            </Button>
                        </div>

                        {newFeeds.map((feed, index) => (
                            <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">رابط {index + 1}</span>
                                    {newFeeds.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeFeedRow(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Icon name="ri-close-line" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="url"
                                        value={feed.feedUrl}
                                        onChange={(e) => updateFeedRow(index, 'feedUrl', e.target.value)}
                                        placeholder="رابط RSS"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                        dir="ltr"
                                        required
                                    />
                                    <select
                                        value={feed.categoryId}
                                        onChange={(e) => updateFeedRow(index, 'categoryId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                        required
                                    >
                                        <option value="">اختر التصنيف</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={feed.applyFilter !== false}
                                            onChange={(e) => updateFeedRow(index, 'applyFilter', e.target.checked)}
                                            className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                                        />
                                        <span className="text-gray-600">تفعيل الفلترة</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <span className="text-gray-600">التحديث كل</span>
                                        <input
                                            type="number"
                                            value={feed.fetchInterval}
                                            onChange={(e) => updateFeedRow(index, 'fetchInterval', Number(e.target.value))}
                                            min={5}
                                            max={1440}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                        />
                                        <span className="text-gray-600">دقيقة</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createMutation.isPending}
                            className="flex-1"
                        >
                            {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ المصدر'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => { setAddModalOpen(false); resetSourceForm(); }}
                        >
                            إلغاء
                        </Button>
                    </div>
                </form>
            </Modal>


            {/* Edit Source Modal (metadata only) */}
            <Modal
                isOpen={!!editingSource}
                onClose={() => setEditingSource(null)}
                title="تعديل المصدر"
                width="max-w-xl"
            >
                <form onSubmit={handleUpdateSource} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            اسم المصدر <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={sourceFormData.name}
                            onChange={(e) => setSourceFormData({ ...sourceFormData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الموقع</label>
                            <input
                                type="url"
                                value={sourceFormData.websiteUrl}
                                onChange={(e) => setSourceFormData({ ...sourceFormData, websiteUrl: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار</label>
                            <input
                                type="url"
                                value={sourceFormData.logoUrl}
                                onChange={(e) => setSourceFormData({ ...sourceFormData, logoUrl: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        لإدارة روابط RSS، استخدم زر &quot;إدارة الروابط&quot; من القائمة.
                    </p>
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={updateMutation.isPending}
                            className="flex-1"
                        >
                            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingSource(null)}>
                            إلغاء
                        </Button>
                    </div>
                </form>
            </Modal>


            {/* Feeds Management Modal */}
            <Modal
                isOpen={!!feedsModalSource}
                onClose={() => { setFeedsModalSource(null); setFeedFormData({ ...emptyFeed }); }}
                title={`إدارة روابط "${feedsModalSource?.name || ''}"`}
                width="max-w-2xl"
            >
                <div className="space-y-4">
                    {/* Existing Feeds */}
                    <div className="space-y-2">
                        {feedsModalSource?.feeds?.map((feed) => (
                            <div key={feed.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[feed.status]?.color || 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {statusLabels[feed.status]?.label || feed.status}
                                        </span>
                                        <span
                                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: `${feed.category?.color || '#2563EB'}20`,
                                                color: feed.category?.color || '#2563EB'
                                            }}
                                        >
                                            {feed.category?.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ({feed._count?.articles || 0} مقال)
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-1" dir="ltr">
                                        {feed.feedUrl}
                                    </div>
                                </div>
                                <div className="flex gap-1 mr-2">
                                    <button
                                        onClick={() => fetchFeedMutation.mutate(feed.id)}
                                        disabled={fetchFeedMutation.isPending}
                                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="جلب الأخبار"
                                    >
                                        <Icon name="ri-download-line" size="sm" />
                                    </button>
                                    <button
                                        onClick={() => openEditFeedModal(feed)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="تعديل"
                                    >
                                        <Icon name="ri-edit-line" size="sm" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteFeedTarget(feed)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="حذف"
                                    >
                                        <Icon name="ri-delete-bin-line" size="sm" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!feedsModalSource?.feeds || feedsModalSource.feeds.length === 0) && (
                            <div className="text-center py-4 text-gray-500">
                                لا توجد روابط لهذا المصدر
                            </div>
                        )}
                    </div>

                    {/* Add New Feed */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">إضافة رابط جديد</h4>
                        <form onSubmit={handleAddFeedToSource} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="url"
                                    value={feedFormData.feedUrl}
                                    onChange={(e) => setFeedFormData({ ...feedFormData, feedUrl: e.target.value })}
                                    placeholder="رابط RSS"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                    dir="ltr"
                                    required
                                />
                                <select
                                    value={feedFormData.categoryId}
                                    onChange={(e) => setFeedFormData({ ...feedFormData, categoryId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                    required
                                >
                                    <option value="">اختر التصنيف</option>
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={feedFormData.applyFilter !== false}
                                        onChange={(e) => setFeedFormData({ ...feedFormData, applyFilter: e.target.checked })}
                                        className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                                    />
                                    <span className="text-gray-600">تفعيل الفلترة</span>
                                </label>
                                <Button type="submit" variant="primary" size="sm" disabled={addFeedMutation.isPending}>
                                    {addFeedMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>


            {/* Edit Feed Modal */}
            <Modal
                isOpen={!!editingFeed}
                onClose={() => setEditingFeed(null)}
                title="تعديل الرابط"
                width="max-w-md"
            >
                <form onSubmit={handleUpdateFeed} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رابط RSS</label>
                        <input
                            type="url"
                            value={feedFormData.feedUrl}
                            onChange={(e) => setFeedFormData({ ...feedFormData, feedUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            dir="ltr"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                        <select
                            value={feedFormData.categoryId}
                            onChange={(e) => setFeedFormData({ ...feedFormData, categoryId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        >
                            <option value="">اختر التصنيف</option>
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">فترة التحديث (دقائق)</label>
                            <input
                                type="number"
                                value={feedFormData.fetchInterval}
                                onChange={(e) => setFeedFormData({ ...feedFormData, fetchInterval: Number(e.target.value) })}
                                min={5}
                                max={1440}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الفلترة</label>
                            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={feedFormData.applyFilter !== false}
                                    onChange={(e) => setFeedFormData({ ...feedFormData, applyFilter: e.target.checked })}
                                    className="h-5 w-5 text-primary rounded focus:ring-primary border-gray-300"
                                />
                                <span className="text-gray-700">تفعيل</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={updateFeedMutation.isPending}
                            className="flex-1"
                        >
                            {updateFeedMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingFeed(null)}>
                            إلغاء
                        </Button>
                    </div>
                </form>
            </Modal>


            {/* Delete Source Confirmation */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                title="حذف المصدر"
                message={`هل أنت متأكد من حذف مصدر "${deleteTarget?.name}"؟ سيتم حذف جميع الروابط والمقالات المرتبطة به.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />

            {/* Delete Feed Confirmation */}
            <ConfirmModal
                isOpen={!!deleteFeedTarget}
                onClose={() => setDeleteFeedTarget(null)}
                onConfirm={() => deleteFeedTarget && deleteFeedMutation.mutate(deleteFeedTarget.id)}
                title="حذف الرابط"
                message={`هل أنت متأكد من حذف هذا الرابط؟ سيتم حذف جميع المقالات المرتبطة به.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
