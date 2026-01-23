"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Modal } from '@/components/atoms';
import { ConfirmModal } from '@/components/molecules';
import { MediaUploader } from '@/components/organisms';
import { mediaService } from '@/services';
import type { MediaFile } from '@/services/media.service';
import { useToast } from '@/components/organisms/Toast';

export default function MediaLibraryPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [isUploadOpen, setUploadOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
    const [page, setPage] = useState(1);

    // Fetch media
    const { data, isLoading, isError } = useQuery({
        queryKey: ['media', { page }],
        queryFn: () => mediaService.getMedia(page),
    });

    const media = data?.data || [];
    const meta = data?.meta;

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: (file: File) => mediaService.uploadFile(file),
        onError: (err: any) => {
            showError(`فشل رفع الملف: ${err.message || 'خطأ غير معروف'}`);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => mediaService.deleteFile(id),
        onSuccess: () => {
            success('تم حذف الملف بنجاح');
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setDeleteTarget(null);
            setPreviewFile(null);
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل حذف الملف');
        },
    });

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateString: string): string => {
        return new Intl.DateTimeFormat('ar-YE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(dateString));
    };

    // Get full URL for media files (handles relative paths)
    const getMediaUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // For relative paths like /uploads/..., prepend the API base URL
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${apiBaseUrl}${url}`;
    };

    const handleUploadFiles = async (files: File[]) => {
        try {
            // Upload files sequentially
            for (const file of files) {
                await uploadMutation.mutateAsync(file);
            }
            success('تم رفع الملفات بنجاح');
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setUploadOpen(false);
        } catch (error) {
            // Error managed by mutation callback
            console.error('Upload sequence failed', error);
        }
    };

    const handleDelete = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
        }
    };

    const handleBulkDelete = () => {
        showError('الحذف الجماعي غير مدعوم حالياً من السيرفر');
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedFiles(newSet);
    };

    const selectAll = () => {
        if (selectedFiles.size === media.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(media.map((m: any) => m.id)));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">المكتبة الإعلامية</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        إدارة الصور والملفات ({meta?.totalItems || 0} ملف)
                    </p>
                </div>
                <Button variant="primary" onClick={() => setUploadOpen(true)}>
                    <Icon name="ri-upload-cloud-2-line" className="ml-2" />
                    رفع ملفات
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedFiles.size === media.length && media.length > 0}
                            onChange={selectAll}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-600">تحديد الكل</span>
                    </label>

                    {selectedFiles.size > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="text-red-600 hover:bg-red-50"
                        >
                            <Icon name="ri-delete-bin-line" className="ml-1" />
                            حذف ({selectedFiles.size})
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Icon name="ri-grid-line" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Icon name="ri-list-check" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square bg-white rounded-lg border border-gray-200 animate-pulse"></div>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-white p-12 text-center text-red-500 rounded-lg border border-red-100">
                    <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                    <p>فشل تحميل الملفات</p>
                </div>
            ) : media.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {media.map((file: any) => (
                            <div
                                key={file.id}
                                className={`relative group bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${selectedFiles.has(file.id) ? 'ring-2 ring-primary border-primary' : 'border-gray-200 hover:shadow-md'}`}
                            >
                                <div className="absolute top-2 right-2 z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.has(file.id)}
                                        onChange={() => toggleSelect(file.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                </div>

                                <div
                                    className="aspect-square cursor-pointer"
                                    onClick={() => setPreviewFile(file)}
                                >
                                    <img
                                        src={getMediaUrl(file.url)}
                                        alt={file.alt || file.filename}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                                    <button
                                        onClick={() => setPreviewFile(file)}
                                        className="w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        <Icon name="ri-eye-line" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(file)}
                                        className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        <Icon name="ri-delete-bin-line" />
                                    </button>
                                </div>

                                <div className="p-2">
                                    <p className="text-xs font-medium text-gray-900 truncate">{file.filename}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="w-12 px-4 py-3"></th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الملف</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">الحجم</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">التاريخ</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {media.map((file: any) => (
                                    <tr key={file.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.has(file.id)}
                                                onChange={() => toggleSelect(file.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={getMediaUrl(file.url)}
                                                    alt={file.filename}
                                                    className="w-12 h-12 rounded object-cover"
                                                />
                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                    {file.filename}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                                            {formatFileSize(file.size)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                                            {formatDate(file.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setPreviewFile(file)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Icon name="ri-eye-line" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(file)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Icon name="ri-delete-bin-line" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Icon name="ri-image-line" size="2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">لا توجد ملفات حالياً</h3>
                    <p className="text-gray-500 mt-2 mb-6">قم برفع الصور لاستخدامها في المقالات</p>
                    <Button variant="primary" onClick={() => setUploadOpen(true)}>
                        <Icon name="ri-upload-cloud-2-line" className="ml-2" />
                        رفع ملفات
                    </Button>
                </div>
            )}

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

            <Modal isOpen={isUploadOpen} onClose={() => setUploadOpen(false)} title="رفع ملفات جديدة" width="max-w-2xl">
                <MediaUploader
                    onFilesSubmit={handleUploadFiles}
                    onCancel={() => setUploadOpen(false)}
                    accept="image/*"
                    maxSize={10}
                    multiple
                />
            </Modal>

            <Modal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} title={previewFile?.filename || 'معاينة'} width="max-w-4xl">
                {previewFile && (
                    <div className="space-y-4">
                        <img
                            src={getMediaUrl(previewFile.url)}
                            alt={previewFile.filename}
                            className="w-full rounded-lg"
                        />
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div><span className="font-medium">الحجم:</span> {formatFileSize(previewFile.size)}</div>
                            <div><span className="font-medium">النوع:</span> {previewFile.type}</div>
                            <div><span className="font-medium">التاريخ:</span> {formatDate(previewFile.createdAt)}</div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(getMediaUrl(previewFile.url))}>
                                <Icon name="ri-file-copy-line" className="ml-2" />
                                نسخ الرابط
                            </Button>
                            <Button
                                variant="secondary"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => { setDeleteTarget(previewFile); setPreviewFile(null); }}
                            >
                                <Icon name="ri-delete-bin-line" className="ml-2" />
                                حذف
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="حذف الملف"
                message={`هل أنت متأكد من حذف "${deleteTarget?.filename}"؟ لا يمكن التراجع عن هذا الإجراء.`}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isDestructive
            />
        </div>
    );
}
