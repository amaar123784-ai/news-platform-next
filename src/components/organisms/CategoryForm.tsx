"use client";

/**
 * CategoryForm Component
 * 
 * Add/Edit category form with validation.
 * Maps to design-system.json form patterns.
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Icon } from '@/components/atoms';
import { type Category } from '@/types/api.types';

export interface CategoryFormProps {
    category?: Category | null;
    categories?: Category[];
    onSubmit: (data: Omit<Category, 'id' | 'articleCount'>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const colorOptions = [
    { value: 'red', bg: 'bg-red-500', label: 'أحمر' },
    { value: 'blue', bg: 'bg-blue-500', label: 'أزرق' },
    { value: 'green', bg: 'bg-green-500', label: 'أخضر' },
    { value: 'purple', bg: 'bg-purple-500', label: 'بنفسجي' },
    { value: 'orange', bg: 'bg-orange-500', label: 'برتقالي' },
    { value: 'yellow', bg: 'bg-yellow-500', label: 'أصفر' },
    { value: 'pink', bg: 'bg-pink-500', label: 'وردي' },
    { value: 'gray', bg: 'bg-gray-500', label: 'رمادي' },
];

const iconOptions = [
    { value: 'ri-government-line', label: 'سياسة' },
    { value: 'ri-money-dollar-circle-line', label: 'اقتصاد' },
    { value: 'ri-football-line', label: 'رياضة' },
    { value: 'ri-palette-line', label: 'ثقافة' },
    { value: 'ri-global-line', label: 'عالمي' },
    { value: 'ri-community-line', label: 'مجتمع' },
    { value: 'ri-mic-line', label: 'مقابلات' },
    { value: 'ri-file-text-line', label: 'تحليلات' },
];

export const CategoryForm: React.FC<CategoryFormProps> = ({
    category,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        color: 'blue',
        icon: 'ri-folder-line',
        isActive: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                color: category.color || 'blue',
                icon: category.icon || 'ri-folder-line',
                isActive: category.isActive ?? true,
            });
        }
    }, [category]);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    };

    const handleNameChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            name: value,
            slug: category ? prev.slug : generateSlug(value),
        }));
        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'اسم القسم مطلوب';
        }
        if (!formData.slug.trim()) {
            newErrors.slug = 'الرابط المختصر مطلوب';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم القسم <span className="text-red-500">*</span>
                </label>
                <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="مثال: السياسة"
                    icon="ri-folder-line"
                    error={errors.name}
                />
            </div>

            {/* Slug Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرابط المختصر (Slug) <span className="text-red-500">*</span>
                </label>
                <Input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                        setFormData(prev => ({ ...prev, slug: e.target.value }));
                        if (errors.slug) setErrors(prev => ({ ...prev, slug: '' }));
                    }}
                    placeholder="politics"
                    dir="ltr"
                    className="text-left"
                    error={errors.slug}
                />
                <p className="text-xs text-gray-500 mt-1">يظهر في الرابط: /category/{formData.slug || 'slug'}</p>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف مختصر للقسم..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-colors resize-none"
                />
            </div>

            {/* Color Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون
                </label>
                <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                            className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center transition-all ${formData.color === color.value
                                ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                                : 'hover:scale-105'
                                }`}
                            title={color.label}
                        >
                            {formData.color === color.value && (
                                <Icon name="ri-check-line" className="text-white" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Icon Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    الأيقونة
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {iconOptions.map((icon) => (
                        <button
                            key={icon.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                            className={`p-3 rounded-lg border-2 flex items-center justify-center transition-all ${formData.icon === icon.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                            title={icon.label}
                        >
                            <Icon name={icon.value} size="xl" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">القسم نشط</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
                    إلغاء
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Icon name="ri-loader-4-line" className="animate-spin" />
                            جاري الحفظ...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Icon name="ri-check-line" />
                            {category ? 'حفظ التغييرات' : 'إضافة القسم'}
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
};

export default CategoryForm;
