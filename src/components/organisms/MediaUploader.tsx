"use client";

/**
 * MediaUploader Component
 * 
 * Drag-and-drop file upload with preview functionality.
 * Delegates actual upload to parent component.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button, Icon } from '@/components/atoms';

export interface MediaUploaderProps {
    onFilesSubmit: (files: File[]) => Promise<void>;
    onCancel?: () => void;
    accept?: string;
    maxSize?: number; // in MB
    multiple?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    onFilesSubmit,
    onCancel,
    accept = 'image/*',
    maxSize = 10,
    multiple = true,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            return `${file.name} يتجاوز الحد الأقصى للحجم (${maxSize}MB)`;
        }
        if (accept !== '*' && !file.type.match(accept.replace('*', '.*'))) {
            return `${file.name} نوع غير مدعوم`;
        }
        return null;
    };

    const processFiles = useCallback((fileList: FileList | File[]) => {
        const validFiles: File[] = [];
        const newErrors: string[] = [];
        const newPreviews: { file: File; url: string }[] = [];

        Array.from(fileList).forEach((file) => {
            const error = validateFile(file);
            if (error) {
                newErrors.push(error);
            } else {
                validFiles.push(file);
                if (file.type.startsWith('image/')) {
                    newPreviews.push({
                        file,
                        url: URL.createObjectURL(file),
                    });
                }
            }
        });

        if (multiple) {
            setFiles(prev => [...prev, ...validFiles]);
            setPreviews(prev => [...prev, ...newPreviews]);
        } else {
            // Clean up previous previews
            previews.forEach(p => URL.revokeObjectURL(p.url));
            setFiles(validFiles.slice(0, 1));
            setPreviews(newPreviews.slice(0, 1));
        }

        setErrors(prev => [...prev, ...newErrors]);
    }, [accept, maxSize, multiple, previews]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
        }
    };

    const removeFile = (index: number) => {
        const preview = previews[index];
        if (preview) {
            URL.revokeObjectURL(preview.url);
        }
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            await onFilesSubmit(files);
            // Cleanup
            setFiles([]);
            setPreviews([]);
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                    }
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                    <Icon name="ri-upload-cloud-2-line" size="2xl" />
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {isDragging ? 'أفلت الملفات هنا' : 'اسحب وأفلت الملفات'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    أو انقر للتصفح من جهازك
                </p>
                <p className="text-xs text-gray-400">
                    الحد الأقصى للملف: {maxSize}MB • {accept === 'image/*' ? 'الصور فقط' : accept}
                </p>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    {errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                            <Icon name="ri-error-warning-line" size="sm" />
                            {error}
                        </div>
                    ))}
                    <button
                        onClick={() => setErrors([])}
                        className="text-xs text-red-500 hover:underline mt-2"
                    >
                        إخفاء الأخطاء
                    </button>
                </div>
            )}

            {/* Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previews.map((preview, index) => (
                        <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
                        >
                            <img
                                src={preview.url}
                                alt={preview.file.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    <Icon name="ri-delete-bin-line" />
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs truncate">
                                {preview.file.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* File List (for non-image files) */}
            {files.filter(f => !f.type.startsWith('image/')).length > 0 && (
                <div className="space-y-2">
                    {files
                        .filter(f => !f.type.startsWith('image/'))
                        .map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon name="ri-file-line" className="text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(files.indexOf(file))}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Icon name="ri-close-line" />
                                </button>
                            </div>
                        ))}
                </div>
            )}

            {/* Actions */}
            {files.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-gray-500">
                        {files.length} ملف{files.length > 1 ? 'ات' : ''} • {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
                    </p>
                    <div className="flex gap-3">
                        {onCancel && (
                            <Button variant="secondary" onClick={onCancel} disabled={isUploading}>
                                إلغاء
                            </Button>
                        )}
                        <Button variant="primary" onClick={handleSubmit} disabled={isUploading}>
                            {isUploading ? (
                                <span className="flex items-center gap-2">
                                    <Icon name="ri-loader-4-line" className="animate-spin" />
                                    جاري الرفع...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Icon name="ri-upload-2-line" />
                                    رفع الملفات
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaUploader;
