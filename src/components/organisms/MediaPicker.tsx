"use client";

/**
 * MediaPicker Component
 * 
 * Reusable component for browsing, uploading, and selecting media files.
 * Used in MediaLibraryPage and MediaLibraryModal.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Modal } from '@/components/atoms';
import { ConfirmModal } from '@/components/molecules';
import { MediaUploader } from '@/components/organisms/MediaUploader';
import { mediaService } from '@/services';
import type { MediaFile } from '@/services/media.service';
import { useToast } from '@/components/organisms/Toast';

export interface MediaPickerProps {
    onSelect?: (file: MediaFile) => void;
    allowMultiple?: boolean; // For future implementation
    className?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
    onSelect,
    className = ''
}) => {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [isUploadOpen, setUploadOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set()); // For bulk actions
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
            for (const file of files) {
                await uploadMutation.mutateAsync(file);
            }
            success('تم رفع الملفات بنجاح');
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setUploadOpen(false);
        } catch (error) {
            console.error('Upload sequence failed', error);
        }
    };

    const handleDelete = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
        }
    };

    const handleFileClick = (file: MediaFile) => {
        if (onSelect) {
            onSelect(file);
        } else {
            setPreviewFile(file);
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
                        <Icon name="ri-upload-cloud-2-line" className="ml-2" />
                        رفع ملفات
                    </Button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon name="ri-grid-line" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon name="ri-list-check" />
                    </button>
                </div>
            </div>

            {/* Media Content */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-square bg-white rounded-lg border border-gray-200 animate-pulse"></div>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-white p-8 text-center text-red-500 rounded-lg border border-red-100">
                    <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                    <p>فشل تحميل الملفات</p>
                </div>
            ) : media.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {media.map((file) => (
                            <div
                                key={file.id}
                                className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer"
                                onClick={() => handleFileClick(file)}
                            >
                                <div className="aspect-square">
                                    <img
                                        src={getMediaUrl(file.url)}
                                        alt={file.alt || file.filename}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Overlay / Select Indicator */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {onSelect ? (
                                        <Button variant="primary" size="sm">
                                            اختر الصورة
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                                className="w-8 h-8 bg-white text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-100"
                                            >
                                                <Icon name="ri-eye-line" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(file); }}
                                                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                            >
                                                <Icon name="ri-delete-bin-line" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-2">
                                    <p className="text-xs font-medium text-gray-900 truncate">{file.filename}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View (Simplified for Picker) */
                    <div className="space-y-2">
                        {media.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center p-2 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer gap-3"
                                onClick={() => handleFileClick(file)}
                            >
                                <img src={getMediaUrl(file.url)} className="w-10 h-10 rounded object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.filename}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                {onSelect && <Icon name="ri-add-circle-line" className="text-primary" />}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <Icon name="ri-image-line" className="mb-2 text-2xl" />
                    <p>لا توجد ملفات</p>
                </div>
            )}

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
                        {page} / {meta.totalPages}
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

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadOpen}
                onClose={() => setUploadOpen(false)}
                title="رفع ملفات جديدة"
                width="max-w-2xl"
            >
                <MediaUploader
                    onFilesSubmit={handleUploadFiles}
                    onCancel={() => setUploadOpen(false)}
                    accept="image/*"
                    maxSize={50}
                    multiple
                />
            </Modal>

            {/* Preview Modal (Only if not in selection mode or explicitly requested) */}
            <Modal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                title={previewFile?.filename || 'معاينة'}
                width="max-w-4xl"
            >
                {previewFile && (
                    <div className="space-y-4">
                        <img
                            src={getMediaUrl(previewFile.url)}
                            alt={previewFile.filename}
                            className="w-full rounded-lg"
                        />
                        <div className="flex gap-3 pt-4 border-t">
                            {onSelect ? (
                                <Button variant="primary" onClick={() => { onSelect(previewFile); setPreviewFile(null); }}>
                                    استخدام هذه الصورة
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="text-red-600"
                                    onClick={() => {
                                        setDeleteTarget(previewFile);
                                        setPreviewFile(null);
                                    }}
                                >
                                    حذف
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
                title="حذف الملف"
                message={`هل أنت متأكد من حذف هذا الملف؟`}
                confirmText="حذف"
                confirmVariant="danger"
            />
        </div>
    );
};

export default MediaPicker;
