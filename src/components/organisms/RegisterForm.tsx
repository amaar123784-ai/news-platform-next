"use client";

/**
 * RegisterForm Organism
 * 
 * Dedicated form for public user registration.
 * Enforces 'READER' role and connects to real auth API.
 */

import React, { useState } from 'react';
import { Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useToast } from '@/components/organisms/Toast';
import { authService } from '@/services/auth.service';

export interface RegisterFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onCancel }) => {
    const { success, error: showError } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
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

        if (formData.password !== formData.passwordConfirmation) {
            newErrors.passwordConfirmation = 'كلمتا المرور غير متطابقتين';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                passwordConfirmation: formData.passwordConfirmation,
            });

            success('تم إنشاء الحساب بنجاح! مرحباً بك في أخبار اليمن');
            onSuccess();
        } catch (err: any) {
            showError(err.message || 'فشل إنشاء الحساب، يرجى المحاولة لاحقاً');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <FormField
                label="الاسم الكامل"
                placeholder="أدخل اسمك الكامل"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                hasError={!!errors.name}
                errorMessage={errors.name}
                icon="ri-user-line"
                required
            />

            {/* Email */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
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

                {/* Password Confirmation */}
                <FormField
                    label="تأكيد كلمة المرور"
                    type="password"
                    placeholder="••••••••"
                    value={formData.passwordConfirmation}
                    onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                    hasError={!!errors.passwordConfirmation}
                    errorMessage={errors.passwordConfirmation}
                    icon="ri-lock-check-line"
                    required
                />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-gray-500 hover:text-primary transition-colors order-2 sm:order-1"
                >
                    العودة للرئيسية
                </button>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto order-1 sm:order-2"
                >
                    {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
                </Button>
            </div>
        </form>
    );
};

export default RegisterForm;
