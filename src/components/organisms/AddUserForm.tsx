"use client";

/**
 * AddUserForm Organism
 * 
 * Form for creating a new user with validation and role selection.
 */

import React, { useState } from 'react';
import { Button, Input } from '@/components/atoms'; // Using Input directly for custom select, or FormField for standard
import { FormField } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';

export interface AddUserFormProps {
    onSuccess: (user: any) => void;
    onCancel: () => void;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({ onSuccess, onCancel }) => {
    const { success } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'editor',
    });

    // Validation State
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name.trim()) newErrors.name = 'الاسم الكامل مطلوب';
        if (!formData.email.trim()) {
            newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
        }

        if (!formData.password) {
            newErrors.password = 'كلمة المرور مطلوبة';
        } else if (formData.password.length < 8) {
            newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        // Simulate API delay
        setTimeout(() => {
            setIsLoading(false);

            const newUser = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData,
                status: 'published', // Active by default
                lastActive: 'الآن'
            };

            success(`تم إضافة المستخدم ${formData.name} بنجاح`);
            onSuccess(newUser);
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                    <FormField
                        label="الاسم الكامل"
                        placeholder="أدخل الاسم الرباعي"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        hasError={!!errors.name}
                        errorMessage={errors.name}
                        icon="ri-user-line"
                        required
                    />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                    <FormField
                        label="البريد الإلكتروني"
                        type="email"
                        placeholder="example@domain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        hasError={!!errors.email}
                        errorMessage={errors.email}
                        icon="ri-mail-line"
                        required
                    />
                </div>

                {/* Password */}
                <div className="md:col-span-1">
                    <FormField
                        label="كلمة المرور"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        hasError={!!errors.password}
                        errorMessage={errors.password}
                        icon="ri-lock-line"
                        required
                    />
                </div>

                {/* Role Selection */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        الدور والصلاحيات
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <div className="relative">
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm appearance-none bg-white"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="admin">مسؤول (Admin)</option>
                            <option value="editor">محرر (Editor)</option>
                            <option value="writer">صحفي (Writer)</option>
                        </select>
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                            <i className="ri-arrow-down-s-line text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={onCancel} type="button">
                    العودة
                </Button>
                <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'جاري الحفظ...' : 'إضافة المستخدم'}
                </Button>
            </div>
        </form>
    );
};
