"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, StatusBadge, Modal } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { RichTextEditor, ArticleContent, MediaPicker } from '@/components/organisms';
import { useToast } from '@/components/organisms/Toast';
import { articleService } from '@/services';
import { createArticleAction } from '@/actions/article.actions';
import type { CreateArticleRequest, UpdateArticleRequest, StatusType, Category } from '@/types/api.types';
import type { MediaFile } from '@/services/media.service';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

interface ArticleFormProps {
    initialData?: Partial<CreateArticleRequest> & { id?: string };
    categories: Category[];
    isEditMode?: boolean;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({ initialData, categories, isEditMode = false }) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [editorImageCallback, setEditorImageCallback] = useState<((url: string) => void) | null>(null);
    const [idempotencyKey] = useState(() => uuidv4());

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        excerpt: initialData?.excerpt || '',
        content: initialData?.content || '',
        categoryId: initialData?.categoryId || '',
        status: (initialData?.status || 'draft') as CreateArticleRequest['status'],
        imageUrl: initialData?.imageUrl || '',
        tagsString: initialData?.tags?.join(', ') || '',
        seoTitle: initialData?.seoTitle || '',
        seoDescription: initialData?.seoDescription || '',
        isBreaking: initialData?.isBreaking || false,
        isFeatured: initialData?.isFeatured || false,
    });

    useEffect(() => {
        if (!isEditMode) {
            localforage.getItem('draft_article_form').then((saved: any) => {
                if (saved) setFormData(saved as any);
            });
        }
    }, [isEditMode]);

    useEffect(() => {
        if (!isEditMode) {
            localforage.setItem('draft_article_form', formData);
        }
    }, [formData, isEditMode]);

    const createMutation = useMutation({
        mutationFn: (data: CreateArticleRequest) => articleService.createArticle(data, idempotencyKey),
        onMutate: async (newArticle) => {
            await queryClient.cancelQueries({ queryKey: ['articles'] });
            const previousArticles = queryClient.getQueryData(['articles']);
            queryClient.setQueryData(['articles'], (old: any) => ({ ...old, data: [newArticle, ...(old?.data || [])] }));
            return { previousArticles };
        },
        onSuccess: () => {
            success('تم إنشاء المقال بنجاح');
            localforage.removeItem('draft_article_form');
            router.push('/admin/articles');
        },
        onError: (err: any, newArticle, context) => {
            queryClient.setQueryData(['articles'], context?.previousArticles);
            showError(`فشل إنشاء المقال: ${err.message || 'خطأ غير معروف'}`);
            if (!navigator.onLine && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(sw => {
                    localforage.setItem(`sync_queue_${idempotencyKey}`, newArticle);
                    (sw as any).sync.register('sync-articles');
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateArticleRequest) => articleService.updateArticle(data),
        onSuccess: () => {
            success('تم تحديث المقال بنجاح');
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            queryClient.invalidateQueries({ queryKey: ['article', initialData?.id] });
            router.push('/admin/articles');
        },
        onError: (err: any) => {
            showError(`فشل تحديث المقال: ${err.message || 'خطأ غير معروف'}`);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.categoryId || !formData.content) {
            showError('يرجى ملء الحقول المطلوبة (العنوان، القسم، المحتوى)');
            return;
        }

        const payload: CreateArticleRequest = {
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
            categoryId: formData.categoryId,
            status: formData.status,
            imageUrl: formData.imageUrl,
            tags: formData.tagsString.split(',').map(tag => tag.trim()).filter(Boolean),
            seoTitle: formData.seoTitle,
            seoDescription: formData.seoDescription,
            isBreaking: formData.isBreaking,
            isFeatured: formData.isFeatured,
        };

        if (isEditMode && initialData?.id) {
            updateMutation.mutate({ ...payload, id: initialData.id });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleImageSelect = (file: MediaFile) => {
        if (editorImageCallback) {
            const fullUrl = file.url.startsWith('http') ? file.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${file.url}`;
            editorImageCallback(fullUrl);
            setEditorImageCallback(null);
        } else {
            setFormData({ ...formData, imageUrl: file.url });
        }
        setIsMediaOpen(false);
    };

    const currentCategory = categories.find(c => c.id === formData.categoryId);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => router.push('/admin/articles')} type="button">
                        <Icon name="ri-arrow-right-line" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                            {isEditMode ? 'تعديل مقال' : 'مقال جديد'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 truncate">
                            {isEditMode ? 'تحديث المحتوى والبيانات' : 'إنشاء محتوى جديد ونشره'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Button variant="secondary" type="button" onClick={() => setIsPreviewOpen(true)} className="text-sm sm:text-base">
                        <Icon name="ri-eye-line" className="ml-1 sm:ml-2" />
                        <span className="hidden xs:inline">معاينة</span>
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="article-form"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="text-sm sm:text-base whitespace-nowrap"
                    >
                        {createMutation.isPending || updateMutation.isPending ? (
                            <Icon name="ri-loader-4-line" className="animate-spin" />
                        ) : (
                            isEditMode ? 'تحديث ونشر' : 'نشر المقال'
                        )}
                    </Button>
                </div>
            </div>

            <form id="article-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">المحتوى الأساسي</h3>
                            <div className="space-y-6">
                                <FormField
                                    label="عنوان المقال"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="أدخل عنواناً جذاباً..."
                                    className="text-lg"
                                />
                                <FormField
                                    label="المقتطف (الملخص)"
                                    helpText="يظهر في بطاقات الأخبار وفي نتائج البحث"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    placeholder="ملخص قصير لمحتوى المقال..."
                                    multiline
                                    rows={3}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">محتوى المقال</label>
                                    <RichTextEditor
                                        value={formData.content}
                                        onChange={(html) => setFormData({ ...formData, content: html })}
                                        onImageRequest={(cb) => {
                                            setEditorImageCallback(() => cb);
                                            setIsMediaOpen(true);
                                        }}
                                        placeholder="اكتب تفاصيل المقال هنا..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <Icon name="ri-search-eye-line" className="text-gray-400" />
                                <h3 className="font-bold text-gray-900">تحسين محركات البحث (SEO)</h3>
                            </div>
                            <div className="space-y-4">
                                <FormField
                                    label="عنوان الميتا (Meta Title)"
                                    value={formData.seoTitle}
                                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                                    placeholder={formData.title}
                                />
                                <FormField
                                    label="وصف الميتا (Meta Description)"
                                    value={formData.seoDescription}
                                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                                    placeholder={formData.excerpt}
                                    multiline
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">النشر</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as CreateArticleRequest['status'] })}
                                    >
                                        <option value="draft">مسودة</option>
                                        <option value="review">قيد المراجعة</option>
                                        <option value="published">منشور</option>
                                        <option value="archived">مؤرشف</option>
                                    </select>
                                </div>

                                {formData.status !== 'draft' && (
                                    <div className="pt-2">
                                        <StatusBadge status={formData.status} className="w-full justify-center py-2" />
                                    </div>
                                )}

                                <div className="border-t pt-4 mt-4 space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                                        <div>
                                            <span className="font-medium text-red-900 block">خبر عاجل</span>
                                            <span className="text-xs text-red-700">سيظهر في شريط الأخبار العاجلة</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isBreaking: !formData.isBreaking })}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${formData.isBreaking ? 'bg-red-600' : 'bg-gray-200'}`}
                                            role="switch"
                                            aria-checked={formData.isBreaking}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isBreaking ? '-translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-yellow-50/50 rounded-lg border border-yellow-100 hover:bg-yellow-50 transition-colors">
                                        <div>
                                            <span className="font-medium text-yellow-900 block">خبر مميز</span>
                                            <span className="text-xs text-yellow-700">سيظهر في الرئيسية بحجم أكبر</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-200'}`}
                                            role="switch"
                                            aria-checked={formData.isFeatured}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isFeatured ? '-translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">التصنيف</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        required
                                    >
                                        <option value="">اختر القسم</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الوسوم (Tags)</label>
                                    <div className="w-full min-h-[42px] px-3 py-1.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary bg-white flex flex-wrap gap-2 items-center">
                                        {formData.tagsString.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, index) => (
                                            <span key={index} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const tags = formData.tagsString.split(',').map(t => t.trim()).filter(Boolean);
                                                        tags.splice(index, 1);
                                                        setFormData({ ...formData, tagsString: tags.join(', ') });
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder={formData.tagsString ? "" : "اضغط Enter لإضافة وسم..."}
                                            className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault();
                                                    const value = e.currentTarget.value.trim();
                                                    if (value) {
                                                        const currentTags = formData.tagsString.split(',').map(t => t.trim()).filter(Boolean);
                                                        // Prevent duplicates
                                                        if (!currentTags.includes(value)) {
                                                            setFormData({ ...formData, tagsString: [...currentTags, value].join(', ') });
                                                        }
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const value = e.currentTarget.value.trim();
                                                if (value) {
                                                    const currentTags = formData.tagsString.split(',').map(t => t.trim()).filter(Boolean);
                                                    if (!currentTags.includes(value)) {
                                                        setFormData({ ...formData, tagsString: [...currentTags, value].join(', ') });
                                                    }
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">اضغط Enter أو فاصلة (,) لإضافة وسم جديد</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">الصورة البارزة</h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group relative"
                                onClick={() => !formData.imageUrl && setIsMediaOpen(true)}
                            >
                                {formData.imageUrl ? (
                                    <>
                                        <div className="relative w-full h-40">
                                            <Image
                                                src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${formData.imageUrl}`}
                                                alt="Featured"
                                                fill
                                                className="object-cover rounded-md"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsMediaOpen(true); }} className="bg-primary text-white p-2 rounded-full relative z-10">
                                                    <Icon name="ri-pencil-line" />
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, imageUrl: '' }); }} className="bg-red-600 text-white p-2 rounded-full relative z-10">
                                                    <Icon name="ri-delete-bin-line" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500">
                                        <Icon name="ri-image-add-line" size="2xl" className="mb-2" />
                                        <span className="text-sm">اضغط لاختيار صورة</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <Modal isOpen={isMediaOpen} onClose={() => setIsMediaOpen(false)} title="مكتبة الصور" width="max-w-4xl">
                <div className="max-h-[80vh] overflow-y-auto p-1">
                    <MediaPicker onSelect={handleImageSelect} />
                </div>
            </Modal>

            <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="معاينة المقال" width="max-w-4xl">
                <div className="prose-wrapper" dir="rtl">
                    <div className="mb-6">
                        {currentCategory && <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full">{currentCategory.name}</span>}
                        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">{formData.title}</h1>
                        <p className="text-xl text-gray-600">{formData.excerpt}</p>
                    </div>
                    {formData.imageUrl && (
                        <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 bg-gray-100 relative">
                            <Image
                                src={formData.imageUrl}
                                alt={formData.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <ArticleContent content={formData.content} />
                </div>
            </Modal>
        </div>
    );
};
