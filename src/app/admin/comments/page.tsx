"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, StatusBadge, Modal, Avatar } from '@/components/atoms';
import { DataTable } from '@/components/organisms';
import { TableSkeleton, ConfirmModal } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import { commentService } from '@/services'; // We might need to create this service if it doesn't exist
import type { Comment } from '@/types/api.types';
import Link from 'next/link';

// Temporary service mock if not exists, will check next
// import { commentService } from '@/services'; 

export default function CommentsPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [viewComment, setViewComment] = useState<Comment | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
    const [page, setPage] = useState(1);

    // Status filter
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');

    // Create a temporary service wrapper if real one doesn't exist yet, 
    // but better to assume I need to create the service too. 
    // For now, I'll assume I need to create src/services/comment.service.ts

    // Fetch comments
    const { data, isLoading, isError } = useQuery({
        queryKey: ['comments', { page, status: statusFilter }],
        queryFn: () => commentService.getComments({
            page,
            perPage: 20,
            status: statusFilter === 'all' ? undefined : statusFilter
        }),
    });

    // Update status mutation
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
            commentService.moderateComment(id, status),
        onSuccess: () => {
            success('تم تحديث حالة التعليق بنجاح');
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            setViewComment(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل تحديث حالة التعليق');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => commentService.deleteComment(id),
        onSuccess: () => {
            success('تم حذف التعليق بنجاح');
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            setDeleteTarget(null);
            setViewComment(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل حذف التعليق');
        },
    });

    const comments = data?.data || [];
    const meta = data?.meta;

    const handleStatusUpdate = (id: string, status: 'APPROVED' | 'REJECTED') => {
        statusMutation.mutate({ id, status });
    };

    const handleDelete = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">التعليقات</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        إدارة تعليقات القراء والمشاركات ({meta?.totalItems || 0} تعليق)
                    </p>
                </div>

                {/* Filters */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === status
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {status === 'all' ? 'الكل' :
                                status === 'PENDING' ? 'معلق' :
                                    status === 'APPROVED' ? 'مقبول' : 'مرفوض'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {isLoading ? (
                    <div className="p-6">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">
                        <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                        <p>حدث خطأ في تحميل التعليقات</p>
                    </div>
                ) : (
                    <DataTable
                        data={comments}
                        columns={[
                            {
                                key: 'author',
                                header: 'المستخدم',
                                render: (comment: Comment) => (
                                    <div className="flex items-center gap-3">
                                        <Avatar name={comment.author?.name || 'زائر'} size="sm" src={comment.author?.avatar} />
                                        <div>
                                            <div className="font-medium text-gray-900">{comment.author?.name || 'زائر'}</div>
                                            <div className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString('ar-YE')}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'content',
                                header: 'التعليق',
                                render: (comment: Comment) => (
                                    <div className="max-w-md">
                                        <p className="text-sm text-gray-600 truncate">{comment.content}</p>
                                        {comment.article && (
                                            <Link href={`/article/${comment.article.slug}`} target="_blank" className="text-xs text-primary hover:underline mt-1 block">
                                                على: {comment.article.title}
                                            </Link>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'status',
                                header: 'الحالة',
                                render: (comment: Comment) => (
                                    <StatusBadge status={comment.status as any} />
                                )
                            },
                            {
                                key: 'likes',
                                header: 'تفاعل',
                                render: (comment: Comment) => (
                                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                                        <Icon name="ri-thumb-up-line" size="sm" />
                                        <span>{comment.likes}</span>
                                    </div>
                                )
                            }
                        ]}
                        actions={(comment: Comment) => (
                            <div className="flex gap-2">
                                {comment.status === 'PENDING' && (
                                    <button
                                        onClick={() => handleStatusUpdate(comment.id, 'APPROVED')}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="قبول"
                                    >
                                        <Icon name="ri-check-line" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setViewComment(comment)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="عرض التفاصيل"
                                >
                                    <Icon name="ri-eye-line" />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(comment)}
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

            {/* View Modal */}
            <Modal
                isOpen={!!viewComment}
                onClose={() => setViewComment(null)}
                title="تفاصيل التعليق"
                width="max-w-xl"
            >
                {viewComment && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b pb-4">
                            <Avatar name={viewComment.author?.name || 'زائر'} size="md" src={viewComment.author?.avatar} />
                            <div>
                                <h3 className="font-bold text-gray-900">{viewComment.author?.name || 'زائر'}</h3>
                                <p className="text-sm text-gray-500">{new Date(viewComment.createdAt).toLocaleString('ar-YE')}</p>
                            </div>
                            <div className="mr-auto">
                                <StatusBadge status={viewComment.status as any} />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-800 leading-relaxed">{viewComment.content}</p>
                        </div>

                        {viewComment.article && (
                            <div className="text-sm">
                                <span className="text-gray-500">نشر على المقال: </span>
                                <Link href={`/article/${viewComment.article.slug}`} target="_blank" className="text-primary font-medium hover:underline">
                                    {viewComment.article.title}
                                </Link>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t">
                            {viewComment.status !== 'APPROVED' && (
                                <Button
                                    variant="primary"
                                    onClick={() => handleStatusUpdate(viewComment.id, 'APPROVED')}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    <Icon name="ri-check-line" className="ml-2" />
                                    قبول التعليق
                                </Button>
                            )}
                            {viewComment.status !== 'REJECTED' && (
                                <Button
                                    variant="secondary"
                                    onClick={() => handleStatusUpdate(viewComment.id, 'REJECTED')}
                                    className="flex-1 text-red-600 hover:bg-red-50"
                                >
                                    <Icon name="ri-close-line" className="ml-2" />
                                    رفض
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="حذف التعليق"
                message="هل أنت متأكد من حذف هذا التعليق نهائياً؟"
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
