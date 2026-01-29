"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, StatusBadge, Input, Modal } from '@/components/atoms';
import { DataTable, useToast } from '@/components/organisms';
import { ConfirmModal } from '@/components/molecules';
import { articleService } from '@/services';
import type { StatusType, Article } from '@/types/api.types';

export default function ArticleListPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Fetch articles from API
    const { data, isLoading, isError } = useQuery({
        queryKey: ['articles', 'admin-list', { page, search: searchTerm, status: statusFilter }],
        queryFn: () => articleService.getArticles({
            page,
            perPage: 20,
            search: searchTerm || undefined,
            status: (statusFilter as any) || undefined,
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

    return (
        <div className="space-y-6">
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

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="w-full md:w-96">
                    <Input
                        type="search"
                        placeholder="بحث في العنوان..."
                        icon="ri-search-line"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex-1"></div>
                <select
                    className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">جميع الحالات</option>
                    <option value="PUBLISHED">منشور</option>
                    <option value="DRAFT">مسودة</option>
                    <option value="REVIEW">مراجعة</option>
                    <option value="ARCHIVED">مؤرشف</option>
                </select>
            </div>

            <DataTable
                data={articles}
                isLoading={isLoading}
                pagination={{
                    currentPage: page,
                    totalPages: meta?.totalPages || 1,
                    onPageChange: setPage,
                    totalItems: meta?.totalItems
                }}
                columns={[
                    {
                        key: 'title',
                        header: 'العنوان',
                        width: '40%',
                        render: (row: any) => (
                            <div>
                                <p className="font-medium text-gray-900 line-clamp-1">{row.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{row.slug}</p>
                            </div>
                        )
                    },
                    {
                        key: 'category',
                        header: 'القسم',
                        render: (row: any) => row.category?.name || '-'
                    },
                    {
                        key: 'author',
                        header: 'الكاتب',
                        render: (row: any) => row.author?.name || '-'
                    },
                    {
                        key: 'status',
                        header: 'الحالة',
                        render: (row: any) => <StatusBadge status={mapStatus(row.status)} />
                    },
                    {
                        key: 'createdAt',
                        header: 'التاريخ',
                        render: (row: any) => new Date(row.createdAt).toLocaleDateString('ar-YE')
                    },
                    {
                        key: 'views',
                        header: 'المشاهدات',
                        render: (row: any) => (row.views || 0).toLocaleString()
                    },
                ]}
                actions={(row: any) => (
                    <>
                        <Link href={`/admin/articles/${row.id}/edit`}>
                            <button
                                className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                                title="تعديل"
                            >
                                <Icon name="ri-edit-line" size="lg" />
                            </button>
                        </Link>
                        <button
                            className="text-gray-500 hover:text-red-600 transition-colors p-1"
                            title="حذف"
                            onClick={() => handleDeleteClick(row.id)}
                        >
                            <Icon name="ri-delete-bin-line" size="lg" />
                        </button>
                    </>
                )}
            />

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
        </div>
    );
}
