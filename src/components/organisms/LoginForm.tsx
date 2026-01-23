"use client";

/**
 * LoginForm Component
 * 
 * Complete login form with email, password, social login options.
 * 
 * @see components.forms in design-system.json
 * 
 * @example
 * <LoginForm onSubmit={handleLogin} onSocialLogin={handleSocial} />
 */

import React, { useState } from 'react';
import { Icon, Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';

export interface LoginFormProps {
    /** Form submit handler */
    onSubmit?: (email: string, password: string, remember: boolean) => void;
    /** Social login handler */
    onSocialLogin?: (provider: 'google' | 'facebook') => void;
    /** Forgot password handler */
    onForgotPassword?: () => void;
    /** Create account handler */
    onCreateAccount?: () => void;
    /** Whether form is submitting */
    isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
    onSubmit,
    onSocialLogin,
    onForgotPassword,
    onCreateAccount,
    isLoading = false,
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: typeof errors = {};
        if (!email || !email.includes('@')) {
            newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح';
        }
        if (!password || password.length < 6) {
            newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        onSubmit?.(email, password, remember);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="ri-user-line" size="2xl" className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
                    <p className="text-gray-600">مرحباً بك في Voice of Tihama</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                        label="البريد الإلكتروني"
                        type="email"
                        icon="ri-mail-line"
                        placeholder="أدخل بريدك الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        hasError={!!errors.email}
                        errorMessage={errors.email}
                        required
                    />

                    <FormField
                        label="كلمة المرور"
                        type="password"
                        icon="ri-lock-line"
                        placeholder="أدخل كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        hasError={!!errors.password}
                        errorMessage={errors.password}
                        required
                    />

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="custom-checkbox"
                            />
                            <span className="text-sm text-gray-700">تذكرني</span>
                        </label>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm text-primary hover:text-primary/80 font-medium"
                        >
                            نسيت كلمة المرور؟
                        </button>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-3"
                        isLoading={isLoading}
                    >
                        تسجيل الدخول
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">أو</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => onSocialLogin?.('google')}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                        >
                            <Icon name="ri-google-fill" className="text-red-500" />
                            <span>تسجيل الدخول بـ Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onSocialLogin?.('facebook')}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                        >
                            <Icon name="ri-facebook-fill" className="text-blue-600" />
                            <span>تسجيل الدخول بـ Facebook</span>
                        </button>
                    </div>

                    {/* Create Account */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            ليس لديك حساب؟{' '}
                            <button
                                type="button"
                                onClick={onCreateAccount}
                                className="text-primary hover:text-primary/80 font-medium"
                            >
                                إنشاء حساب جديد
                            </button>
                        </p>
                    </div>
                </form>
            </div>

            {/* Terms */}
            <div className="text-center mt-8">
                <p className="text-xs text-gray-500">
                    بتسجيل الدخول، أنت توافق على{' '}
                    <a href="#" className="text-primary hover:text-primary/80">شروط الخدمة</a>
                    {' '}و{' '}
                    <a href="#" className="text-primary hover:text-primary/80">سياسة الخصوصية</a>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
