"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, StatusBadge, Modal, Avatar } from '@/components/atoms';
import { DataTable, AddUserForm, EditUserForm } from '@/components/organisms';
import { TableSkeleton, ConfirmModal } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import { userService } from '@/services';
import type { StatusType } from '@/types/api.types';

// Role definitions
const roleLabels: Record<string, { label: string; color: string }> = {
    ADMIN: { label: 'مدير', color: 'bg-red-100 text-red-700' },
    EDITOR: { label: 'محرر', color: 'bg-blue-100 text-blue-700' },
    JOURNALIST: { label: 'صحفي', color: 'bg-green-100 text-green-700' },
    READER: { label: 'قارئ', color: 'bg-gray-100 text-gray-700' },
};

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    // Fetch users from API
    const { data, isLoading, isError } = useQuery({
        queryKey: ['users', { page, search: searchQuery }],
        queryFn: () => userService.getUsers({
            page,
            perPage: 20,
            search: searchQuery || undefined,
        }),
    });

    // Create user mutation
    const createMutation = useMutation({
        mutationFn: (userData: any) => userService.createUser(userData),
        onSuccess: () => {
            success('تم إضافة المستخدم بنجاح');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setAddModalOpen(false);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل إضافة المستخدم');
        },
    });

    // Update user mutation
    const updateMutation = useMutation({
        mutationFn: (userData: any) => userService.updateUser({ id: userData.id, ...userData }),
        onSuccess: () => {
            success('تم تحديث المستخدم بنجاح');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditingUser(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل تحديث المستخدم');
        },
    });

    // Delete user mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => userService.deleteUser(id),
        onSuccess: () => {
            success('تم حذف المستخدم بنجاح');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteTarget(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل حذف المستخدم');
        },
    });

    const users = data?.data || [];
    const meta = data?.meta;

    const handleAddUser = (newUser: any) => {
        createMutation.mutate({
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role.toUpperCase(),
        });
    };

    const handleEditUser = (updatedUser: any) => {
        updateMutation.mutate({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role.toUpperCase(),
            // Password might be optional or handled separately in backend service logic if provided
        });
    };

    const handleDeleteUser = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">المستخدمين</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        إدارة فريق العمل والصلاحيات ({meta?.totalItems || 0} مستخدم)
                    </p>
                </div>
                <Button variant="primary" onClick={() => setAddModalOpen(true)}>
                    <Icon name="ri-user-add-line" className="ml-2" />
                    مستخدم جديد
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                    <Icon
                        name="ri-search-line"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        placeholder="بحث بالاسم أو البريد..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                    />
                </div>
            </div>

            <div className="hidden md:block">
                {isLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : isError ? (
                    <div className="bg-white p-8 rounded-lg text-center text-red-500">
                        <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                        <p>حدث خطأ في تحميل المستخدمين</p>
                    </div>
                ) : (
                    <DataTable
                        data={users}
                        columns={[
                            {
                                key: 'name',
                                header: 'المستخدم',
                                render: (user: any) => (
                                    <div className="flex items-center gap-3">
                                        <Avatar name={user.name} size="sm" />
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'role',
                                header: 'الدور',
                                render: (user: any) => {
                                    const role = roleLabels[user.role.toUpperCase()] || roleLabels.READER;
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                                            {role.label}
                                        </span>
                                    );
                                }
                            },
                            {
                                key: 'isActive', // Assuming API returns isActive boolean
                                header: 'الحالة',
                                render: (user: any) => (
                                    <StatusBadge status={user.isActive ? 'published' : 'draft'} /> // Mapping boolean to existing badge status
                                )
                            },
                            {
                                key: 'createdAt',
                                header: 'تاريخ التسجيل',
                                render: (user: any) => new Date(user.createdAt).toLocaleDateString('ar-YE')
                            },
                        ]}
                        actions={(user: any) => (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="تعديل"
                                >
                                    <Icon name="ri-edit-line" />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(user)}
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {users.map((user: any) => {
                    const role = roleLabels[user.role.toUpperCase()] || roleLabels.READER;
                    return (
                        <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar name={user.name} size="md" />
                                    <div>
                                        <h3 className="font-bold text-gray-900">{user.name}</h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <StatusBadge status={user.isActive ? 'published' : 'draft'} />
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                                    {role.label}
                                </span>
                                <span>{new Date(user.createdAt).toLocaleDateString('ar-YE')}</span>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setEditingUser(user)}
                                    className="flex-1"
                                >
                                    <Icon name="ri-edit-line" className="ml-1" />
                                    تعديل
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setDeleteTarget(user)}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Icon name="ri-delete-bin-line" />
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {users.length === 0 && !isLoading && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <Icon name="ri-user-line" size="2xl" className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">لا يوجد مستخدمين</h3>
                        <p className="text-gray-500 mt-1 mb-4">ابدأ بإضافة مستخدم جديد</p>
                        <Button variant="primary" onClick={() => setAddModalOpen(true)}>
                            <Icon name="ri-user-add-line" className="ml-2" />
                            إضافة مستخدم
                        </Button>
                    </div>
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

            {/* Add User Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                title="إضافة مستخدم جديد"
                width="max-w-2xl"
            >
                <AddUserForm
                    onSuccess={handleAddUser}
                    onCancel={() => setAddModalOpen(false)}
                />
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title="تعديل المستخدم"
                width="max-w-2xl"
            >
                {editingUser && (
                    <EditUserForm
                        user={editingUser}
                        onSuccess={handleEditUser}
                        onCancel={() => setEditingUser(null)}
                    />
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteUser}
                title="حذف المستخدم"
                message={`هل أنت متأكد من حذف المستخدم "${deleteTarget?.name}"؟ لن يتمكن من الوصول للنظام بعد ذلك.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
