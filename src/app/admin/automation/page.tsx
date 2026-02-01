'use client';

/**
 * Automation Queue Admin Page
 * Shows the automation pipeline status for all articles
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationService, AutomationQueueItem } from '@/services/automation.service';
import {
    FiRefreshCw,
    FiClock,
    FiCheck,
    FiX,
    FiLoader,
    FiArrowRight,
    FiFacebook,
    FiFileText,
    FiCpu
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'قيد الانتظار',
    AI_PROCESSING: 'جاري إعادة الصياغة',
    AI_COMPLETED: 'تمت إعادة الصياغة',
    PUBLISHING: 'جاري النشر',
    PUBLISHED: 'تم النشر في المنصة',
    SOCIAL_PENDING: 'في انتظار النشر الاجتماعي',
    SOCIAL_POSTING: 'جاري النشر على فيسبوك',
    COMPLETED: 'مكتمل',
    FAILED: 'فشل'
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    AI_PROCESSING: 'bg-blue-100 text-blue-700',
    AI_COMPLETED: 'bg-blue-200 text-blue-800',
    PUBLISHING: 'bg-yellow-100 text-yellow-700',
    PUBLISHED: 'bg-green-100 text-green-700',
    SOCIAL_PENDING: 'bg-purple-100 text-purple-700',
    SOCIAL_POSTING: 'bg-purple-200 text-purple-800',
    COMPLETED: 'bg-green-200 text-green-800',
    FAILED: 'bg-red-100 text-red-700'
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100'}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

function ProgressSteps({ item }: { item: AutomationQueueItem }) {
    const steps = [
        { key: 'ai', label: 'الذكاء الاصطناعي', icon: FiCpu, done: ['AI_COMPLETED', 'PUBLISHING', 'PUBLISHED', 'SOCIAL_PENDING', 'SOCIAL_POSTING', 'COMPLETED'].includes(item.status), active: item.status === 'AI_PROCESSING' },
        { key: 'platform', label: 'المنصة', icon: FiFileText, done: ['PUBLISHED', 'SOCIAL_PENDING', 'SOCIAL_POSTING', 'COMPLETED'].includes(item.status), active: item.status === 'PUBLISHING' },
        { key: 'social', label: 'فيسبوك', icon: FiFacebook, done: item.status === 'COMPLETED', active: ['SOCIAL_PENDING', 'SOCIAL_POSTING'].includes(item.status) },
    ];

    return (
        <div className="flex items-center gap-1">
            {steps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${step.done ? 'bg-green-500 text-white' :
                        step.active ? 'bg-blue-500 text-white animate-pulse' :
                            'bg-gray-200 text-gray-500'
                        }`}>
                        <step.icon className="w-3 h-3" />
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`w-4 h-0.5 mx-0.5 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function QueueItem({ item, onRetry }: { item: AutomationQueueItem; onRetry: (id: string) => void }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                        {item.aiRewrittenTitle || item.rssArticle.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {item.rssArticle.feed.source.name} • {item.rssArticle.feed.category?.name || 'غير مصنف'}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                        <StatusBadge status={item.status} />
                        <ProgressSteps item={item} />
                    </div>

                    {item.errorMessage && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                            {item.errorMessage}
                        </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>أُضيف: {new Date(item.createdAt).toLocaleString('ar-SA')}</span>
                        {item.publishedAt && (
                            <span>نُشر: {new Date(item.publishedAt).toLocaleString('ar-SA')}</span>
                        )}
                        {item.socialScheduledAt && item.status === 'SOCIAL_PENDING' && (
                            <span className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                مجدول: {new Date(item.socialScheduledAt).toLocaleString('ar-SA')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {item.rssArticle.imageUrl && (
                        <img
                            src={item.rssArticle.imageUrl}
                            alt=""
                            className="w-20 h-14 object-cover rounded"
                        />
                    )}
                </div>
            </div>

            {item.status === 'FAILED' && (
                <div className="mt-4 pt-4 border-t">
                    <button
                        onClick={() => onRetry(item.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AutomationQueuePage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['automationQueue', page, statusFilter],
        queryFn: () => automationService.getQueue({ page, perPage: 20, status: statusFilter || undefined }),
    });

    const retryMutation = useMutation({
        mutationFn: (id: string) => automationService.retryAutomation(id),
        onSuccess: () => {
            toast.success('تمت إعادة تشغيل الأتمتة');
            queryClient.invalidateQueries({ queryKey: ['automationQueue'] });
        },
        onError: () => {
            toast.error('فشل إعادة تشغيل الأتمتة');
        },
    });

    const statusOptions = [
        { value: '', label: 'الكل' },
        { value: 'PENDING', label: 'قيد الانتظار' },
        { value: 'AI_PROCESSING', label: 'جاري الذكاء الاصطناعي' },
        { value: 'PUBLISHED', label: 'تم النشر' },
        { value: 'SOCIAL_PENDING', label: 'في انتظار فيسبوك' },
        { value: 'COMPLETED', label: 'مكتمل' },
        { value: 'FAILED', label: 'فشل' },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">قائمة الأتمتة</h1>
                    <p className="text-gray-500 mt-1">متابعة عملية النشر التلقائي للمقالات</p>
                </div>

                <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    {isRefetching ? 'جاري التحديث...' : 'تحديث'}
                </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => { setStatusFilter(option.value); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${statusFilter === option.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center py-12 text-red-600">
                    حدث خطأ في تحميل البيانات
                </div>
            )}

            {/* Queue List */}
            {data && (
                <>
                    {data.data.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            لا توجد عناصر في القائمة
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.data.map((item: AutomationQueueItem) => (
                                <QueueItem
                                    key={item.id}
                                    item={item}
                                    onRetry={(id) => retryMutation.mutate(id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                                السابق
                            </button>
                            <span className="text-gray-600">
                                صفحة {page} من {data.meta.totalPages}
                            </span>
                            <button
                                disabled={page === data.meta.totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                                التالي
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
