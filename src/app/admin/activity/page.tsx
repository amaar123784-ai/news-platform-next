"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Avatar } from '@/components/atoms';
import { DataTable } from '@/components/organisms';
import { TableSkeleton, ConfirmModal } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import { activityService } from '@/services';
import type { ActivityLog } from '@/types/api.types';

export default function ActivityPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [page, setPage] = useState(1);
    const [isClearModalOpen, setClearModalOpen] = useState(false);

    // Fetch activity logs
    const { data, isLoading, isError } = useQuery({
        queryKey: ['activity', { page }],
        queryFn: () => activityService.getActivityLogs({
            page,
            perPage: 20,
        }),
    });

    // Clear logs mutation
    const clearMutation = useMutation({
        mutationFn: () => activityService.clearLogs(30), // Clear older than 30 days
        onSuccess: () => {
            success('تم تنظيف السجلات القديمة بنجاح');
            queryClient.invalidateQueries({ queryKey: ['activity'] });
            setClearModalOpen(false);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل تنظيف السجلات');
        },
    });

    const logs = data?.data || [];
    const meta = data?.meta;

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'text-green-600 bg-green-50';
            case 'UPDATE': return 'text-blue-600 bg-blue-50';
            case 'DELETE': return 'text-red-600 bg-red-50';
            case 'LOGIN': return 'text-purple-600 bg-purple-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return 'إنشاء';
            case 'UPDATE': return 'تحديث';
            case 'DELETE': return 'حذف';
            case 'LOGIN': return 'تسجيل دخول';
            case 'PUBLISH': return 'نشر';
            default: return action;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">سجل النشاط</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        متابعة حركات المستخدمين والتغييرات في النظام
                    </p>
                </div>
                <Button variant="secondary" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => setClearModalOpen(true)}>
                    <Icon name="ri-delete-bin-line" className="ml-2" />
                    تنظيف السجلات القديمة
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {isLoading ? (
                    <div className="p-6">
                        <TableSkeleton rows={10} columns={4} />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">
                        <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                        <p>حدث خطأ في تحميل السجل</p>
                    </div>
                ) : (
                    <DataTable
                        data={logs}
                        columns={[
                            {
                                key: 'user',
                                header: 'المستخدم',
                                render: (log: ActivityLog) => (
                                    <div className="flex items-center gap-3">
                                        <Avatar name={log.user?.name || 'Java'} size="sm" />
                                        <span className="font-medium text-gray-900">{log.user?.name || 'System'}</span>
                                    </div>
                                )
                            },
                            {
                                key: 'action',
                                header: 'الحدث',
                                render: (log: ActivityLog) => (
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                                        {getActionLabel(log.action)}
                                    </span>
                                )
                            },
                            {
                                key: 'details',
                                header: 'التفاصيل',
                                render: (log: ActivityLog) => (
                                    <div className="text-sm text-gray-600">
                                        قام {getActionLabel(log.action)} <span className="font-medium text-gray-900">{log.targetTitle}</span>
                                        {log.details && <span className="text-gray-400 text-xs block mt-1">{log.details}</span>}
                                    </div>
                                )
                            },
                            {
                                key: 'createdAt',
                                header: 'التوقيت',
                                render: (log: ActivityLog) => (
                                    <div className="text-sm text-gray-500" dir="ltr">
                                        {new Date(log.createdAt).toLocaleString('ar-YE')}
                                    </div>
                                )
                            }
                        ]}
                    />
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

            {/* Clear Confirmation */}
            <ConfirmModal
                isOpen={isClearModalOpen}
                onClose={() => setClearModalOpen(false)}
                onConfirm={() => clearMutation.mutate()}
                title="تنظيف السجلات"
                message="سيتم حذف جميع السجلات التي مضى عليها أكثر من 30 يوماً. هل أنت متأكد؟"
                confirmLabel="تنظيف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
