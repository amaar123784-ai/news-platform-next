"use client";

/**
 * Admin RSS Sources Management Page — thin orchestrator.
 *
 * All UI state is managed by useRssPageReducer (replaces 11 useState calls).
 * Data fetching / mutations remain here; components are imported from _components/.
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon } from '@/components/atoms';
import { ConfirmModal } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import {
    rssService,
    type CreateRSSSourceData,
    type UpdateRSSSourceData,
} from '@/services/rss';
import { categoryService } from '@/services';

import { useRssPageReducer } from './_components/useRssPageReducer';
import { StatsCards } from './_components/StatsCards';
import { SourceTable } from './_components/SourceTable';
import { AddSourceModal } from './_components/AddSourceModal';
import { EditSourceModal } from './_components/EditSourceModal';
import { FeedsModal } from './_components/FeedsModal';
import { EditFeedModal } from './_components/EditFeedModal';

export default function RSSSourcesPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [state, dispatch] = useRssPageReducer();

    // ── Queries ────────────────────────────────────────────────────────────────
    const { data: sourcesData, isLoading, isError } = useQuery({
        queryKey: ['rss-sources'],
        queryFn: () => rssService.getSources(),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });

    const sources = sourcesData?.data ?? [];
    const categories: Array<{ id: string; name: string }> = categoriesData ?? [];

    // ── Mutations ──────────────────────────────────────────────────────────────
    const invalidateSources = () => queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
    const apiError = (err: any, fallback: string) =>
        showError(err.response?.data?.message || err.message || fallback);

    const createMutation = useMutation({
        mutationFn: (data: CreateRSSSourceData) => rssService.createSource(data),
        onSuccess: () => { success('تم إضافة المصدر بنجاح'); invalidateSources(); dispatch({ type: 'CLOSE_ADD_MODAL' }); },
        onError: (err: any) => apiError(err, 'فشل إضافة المصدر'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateRSSSourceData }) => rssService.updateSource(id, data),
        onSuccess: () => { success('تم تحديث المصدر بنجاح'); invalidateSources(); dispatch({ type: 'CLOSE_EDIT_SOURCE' }); },
        onError: (err: any) => apiError(err, 'فشل تحديث المصدر'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rssService.deleteSource(id),
        onSuccess: () => { success('تم حذف المصدر بنجاح'); invalidateSources(); dispatch({ type: 'CLOSE_DELETE_SOURCE' }); },
        onError: (err: any) => apiError(err, 'فشل حذف المصدر'),
    });

    const fetchMutation = useMutation({
        mutationFn: (id: string) => rssService.fetchSource(id),
        onSuccess: (data) => { success(`تم جلب ${data.data?.totalNewArticles || 0} مقال جديد`); invalidateSources(); },
        onError: (err: any) => apiError(err, 'فشل جلب المقالات'),
    });

    const fetchAllMutation = useMutation({
        mutationFn: () => rssService.fetchAllFeeds(),
        onSuccess: (data) => { success(`تم جلب ${data.data?.totalNewArticles || 0} مقال من ${data.data?.feedsChecked || 0} رابط`); invalidateSources(); },
        onError: (err: any) => apiError(err, 'فشل تحديث المصادر'),
    });

    const addFeedMutation = useMutation({
        mutationFn: ({ sourceId, data }: { sourceId: string; data: Parameters<typeof rssService.addFeed>[1] }) =>
            rssService.addFeed(sourceId, data),
        onSuccess: () => { success('تم إضافة الرابط بنجاح'); invalidateSources(); dispatch({ type: 'RESET_FEED_FORM' }); },
        onError: (err: any) => apiError(err, 'فشل إضافة الرابط'),
    });

    const updateFeedMutation = useMutation({
        mutationFn: ({ feedId, data }: { feedId: string; data: Parameters<typeof rssService.updateFeed>[1] }) =>
            rssService.updateFeed(feedId, data),
        onSuccess: () => { success('تم تحديث الرابط بنجاح'); invalidateSources(); dispatch({ type: 'CLOSE_EDIT_FEED' }); },
        onError: (err: any) => apiError(err, 'فشل تحديث الرابط'),
    });

    const deleteFeedMutation = useMutation({
        mutationFn: (feedId: string) => rssService.deleteFeed(feedId),
        onSuccess: () => { success('تم حذف الرابط بنجاح'); invalidateSources(); dispatch({ type: 'CLOSE_DELETE_FEED' }); },
        onError: (err: any) => apiError(err, 'فشل حذف الرابط'),
    });

    const fetchFeedMutation = useMutation({
        mutationFn: (feedId: string) => rssService.fetchFeed(feedId),
        onSuccess: (data) => { success(`تم جلب ${data.data?.newArticles || 0} مقال جديد`); invalidateSources(); },
        onError: (err: any) => apiError(err, 'فشل جلب المقالات'),
    });

    // ── Form submit handlers ───────────────────────────────────────────────────
    const handleCreateSource = (e: React.FormEvent) => {
        e.preventDefault();
        const validFeeds = state.newFeeds.filter(f => f.feedUrl && f.categoryId);
        if (validFeeds.length === 0) { showError('يجب إضافة رابط RSS واحد على الأقل'); return; }
        createMutation.mutate({
            name: state.sourceFormData.name,
            websiteUrl: state.sourceFormData.websiteUrl || null,
            logoUrl: state.sourceFormData.logoUrl || null,
            description: state.sourceFormData.description || null,
            feeds: validFeeds,
        });
    };

    const handleUpdateSource = (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.editingSource) return;
        updateMutation.mutate({
            id: state.editingSource.id,
            data: {
                name: state.sourceFormData.name,
                websiteUrl: state.sourceFormData.websiteUrl || null,
                logoUrl: state.sourceFormData.logoUrl || null,
                description: state.sourceFormData.description || null,
            },
        });
    };

    const handleAddFeed = (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.feedsModalSource || !state.feedFormData.feedUrl || !state.feedFormData.categoryId) return;
        addFeedMutation.mutate({ sourceId: state.feedsModalSource.id, data: state.feedFormData });
    };

    const handleUpdateFeed = (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.editingFeed) return;
        updateFeedMutation.mutate({ feedId: state.editingFeed.id, data: state.feedFormData });
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const totalFeeds = sources.reduce((s, src) => s + (src._count?.feeds || 0), 0);

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
                    <Button variant="secondary" onClick={() => fetchAllMutation.mutate()} disabled={fetchAllMutation.isPending}>
                        <Icon
                            name={fetchAllMutation.isPending ? 'ri-loader-4-line' : 'ri-refresh-line'}
                            className={`ml-2 ${fetchAllMutation.isPending ? 'animate-spin' : ''}`}
                        />
                        {fetchAllMutation.isPending ? 'جاري التحديث...' : 'تحديث الكل'}
                    </Button>
                    <Button variant="primary" onClick={() => dispatch({ type: 'OPEN_ADD_MODAL' })}>
                        <Icon name="ri-add-line" className="ml-2" />
                        مصدر جديد
                    </Button>
                </div>
            </div>

            <StatsCards sources={sources} />

            {/* Sources Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <SourceTable
                    sources={sources}
                    isLoading={isLoading}
                    isError={isError}
                    isFetchPending={fetchMutation.isPending}
                    onAdd={() => dispatch({ type: 'OPEN_ADD_MODAL' })}
                    onOpenFeeds={(src) => dispatch({ type: 'OPEN_FEEDS_MODAL', payload: src })}
                    onEdit={(src) => dispatch({ type: 'OPEN_EDIT_SOURCE', payload: src })}
                    onDelete={(src) => dispatch({ type: 'SET_DELETE_SOURCE', payload: src })}
                    onFetchSource={(id) => fetchMutation.mutate(id)}
                />
            </div>

            {/* Modals */}
            <AddSourceModal
                isOpen={state.isAddModalOpen}
                onClose={() => dispatch({ type: 'CLOSE_ADD_MODAL' })}
                formData={state.sourceFormData}
                newFeeds={state.newFeeds}
                categories={categories}
                isPending={createMutation.isPending}
                onChangeForm={(patch) => dispatch({ type: 'UPDATE_SOURCE_FORM', payload: patch })}
                onAddFeedRow={() => dispatch({ type: 'ADD_FEED_ROW' })}
                onUpdateFeedRow={(i, f, v) => dispatch({ type: 'UPDATE_FEED_ROW', payload: { index: i, field: f, value: v } })}
                onRemoveFeedRow={(i) => dispatch({ type: 'REMOVE_FEED_ROW', payload: i })}
                onSubmit={handleCreateSource}
            />

            <EditSourceModal
                isOpen={!!state.editingSource}
                onClose={() => dispatch({ type: 'CLOSE_EDIT_SOURCE' })}
                formData={state.sourceFormData}
                isPending={updateMutation.isPending}
                onChangeForm={(patch) => dispatch({ type: 'UPDATE_SOURCE_FORM', payload: patch })}
                onSubmit={handleUpdateSource}
            />

            <FeedsModal
                isOpen={!!state.feedsModalSource}
                source={state.feedsModalSource}
                onClose={() => dispatch({ type: 'CLOSE_FEEDS_MODAL' })}
                feedFormData={state.feedFormData}
                categories={categories}
                isAddPending={addFeedMutation.isPending}
                isFetchFeedPending={fetchFeedMutation.isPending}
                onChangeFeedForm={(patch) => dispatch({ type: 'UPDATE_FEED_FORM', payload: patch })}
                onAddFeed={handleAddFeed}
                onFetchFeed={(id) => fetchFeedMutation.mutate(id)}
                onEditFeed={(feed) => dispatch({ type: 'OPEN_EDIT_FEED', payload: feed })}
                onDeleteFeed={(feed) => dispatch({ type: 'SET_DELETE_FEED', payload: feed })}
            />

            <EditFeedModal
                isOpen={!!state.editingFeed}
                onClose={() => dispatch({ type: 'CLOSE_EDIT_FEED' })}
                feedFormData={state.feedFormData}
                categories={categories}
                isPending={updateFeedMutation.isPending}
                onChangeFeedForm={(patch) => dispatch({ type: 'UPDATE_FEED_FORM', payload: patch })}
                onSubmit={handleUpdateFeed}
            />

            {/* Confirm dialogs */}
            <ConfirmModal
                isOpen={!!state.deleteTarget}
                onClose={() => dispatch({ type: 'CLOSE_DELETE_SOURCE' })}
                onConfirm={() => state.deleteTarget && deleteMutation.mutate(state.deleteTarget.id)}
                title="حذف المصدر"
                message={`هل أنت متأكد من حذف مصدر "${state.deleteTarget?.name}"؟ سيتم حذف جميع الروابط والمقالات المرتبطة به.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />

            <ConfirmModal
                isOpen={!!state.deleteFeedTarget}
                onClose={() => dispatch({ type: 'CLOSE_DELETE_FEED' })}
                onConfirm={() => state.deleteFeedTarget && deleteFeedMutation.mutate(state.deleteFeedTarget.id)}
                title="حذف الرابط"
                message="هل أنت متأكد من حذف هذا الرابط؟ سيتم حذف جميع المقالات المرتبطة به."
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
