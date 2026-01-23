"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Modal } from '@/components/atoms';
import { DataTable } from '@/components/organisms';
import { TableSkeleton, ConfirmModal, FormField } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import { categoryService } from '@/services';
import type { Category } from '@/types/api.types';

export default function CategoriesPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        color: '#3B82F6', // Default blue
        icon: 'ri-hashtag',
        isActive: true,
    });

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            color: '#3B82F6',
            icon: 'ri-hashtag',
            isActive: true,
        });
        setEditingCategory(null);
        setAddModalOpen(false);
    };

    // Load data into form for editing
    const loadCategory = (category: Category) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            color: category.color || '#3B82F6',
            icon: category.icon || 'ri-hashtag',
            isActive: category.isActive,
        });
        setEditingCategory(category);
    };

    // Fetch categories
    const { data: categories, isLoading, isError } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => categoryService.createCategory(data),
        onSuccess: () => {
            success('تم إضافة القسم بنجاح');
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            resetForm();
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل إضافة القسم');
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: any) => categoryService.updateCategory({ id: editingCategory!.id, ...data }),
        onSuccess: () => {
            success('تم تحديث القسم بنجاح');
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            resetForm();
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل تحديث القسم');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryService.deleteCategory(id),
        onSuccess: () => {
            success('تم حذف القسم بنجاح');
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setDeleteTarget(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل حذف القسم');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic slug generation if empty
        const submissionData = {
            ...formData,
            slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        };

        if (editingCategory) {
            updateMutation.mutate(submissionData);
        } else {
            createMutation.mutate(submissionData);
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">الأقسام</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        إدارة تصنيفات الأخبار والمحتوى
                    </p>
                </div>
                <Button variant="primary" onClick={() => setAddModalOpen(true)}>
                    <Icon name="ri-add-line" className="ml-2" />
                    قسم جديد
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {isLoading ? (
                    <div className="p-6">
                        <TableSkeleton rows={5} columns={4} />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">
                        <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                        <p>حدث خطأ في تحميل الأقسام</p>
                    </div>
                ) : (
                    <DataTable
                        data={categories || []}
                        columns={[
                            {
                                key: 'name',
                                header: 'الاسم',
                                render: (cat: Category) => (
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                            style={{ backgroundColor: cat.color }}
                                        >
                                            <Icon name={cat.icon || 'ri-hashtag'} size="sm" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{cat.name}</div>
                                            <div className="text-xs text-gray-500">{cat.slug}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'articleCount',
                                header: 'المقالات',
                                render: (cat: Category) => (
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                        {cat.articleCount || 0} مقال
                                    </span>
                                )
                            },
                            {
                                key: 'isActive',
                                header: 'الحالة',
                                render: (cat: Category) => (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {cat.isActive ? 'نشط' : 'معطل'}
                                    </span>
                                )
                            }
                        ]}
                        actions={(cat: Category) => (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => loadCategory(cat)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="تعديل"
                                >
                                    <Icon name="ri-edit-line" />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(cat)}
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
                isOpen={isAddModalOpen || !!editingCategory}
                onClose={resetForm}
                title={editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}
                width="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="اسم القسم"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: سياسة، رياضة..."
                    />

                    <FormField
                        label="الرابط (Slug)"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="politics-news"
                        helpText="يترك فارغاً للتوليد التلقائي من الاسم"
                        dir="ltr"
                    />

                    <FormField
                        label="الوصف"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="وصف مختصر لمحتوى القسم..."
                        multiline
                        rows={3}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اللون</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الأيقونة (Remix Icon)</label>
                            <div className="flex items-center gap-2 relative">
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                                    <Icon name={formData.icon} />
                                </div>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg pr-10 pl-3 py-2 text-sm"
                                    placeholder="ri-hashtag"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none">
                            تفعيل القسم
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={resetForm}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <Icon name="ri-loader-4-line" className="animate-spin" />
                            ) : (
                                editingCategory ? 'حفظ التغييرات' : 'إضافة القسم'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="حذف القسم"
                message={`هل أنت متأكد من حذف القسم "${deleteTarget?.name}"؟ قد يؤثر هذا على المقالات المرتبطة به.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
