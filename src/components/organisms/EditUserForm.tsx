"use client";

/**
 * EditUserForm Component
 * 
 * Edit existing user details with validation.
 * Integrates with UserManagementPage for CRUD operations.
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Icon, Avatar } from '@/components/atoms';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'writer' | 'viewer';
    status: 'published' | 'draft';
    lastActive: string;
    avatar?: string;
    phone?: string;
    bio?: string;
}

export interface EditUserFormProps {
    user: User;
    onSuccess: (updatedUser: User) => void;
    onCancel: () => void;
}

const roleOptions = [
    { value: 'admin', label: 'مدير النظام', description: 'صلاحيات كاملة' },
    { value: 'editor', label: 'محرر', description: 'تعديل ونشر المقالات' },
    { value: 'writer', label: 'كاتب', description: 'كتابة المقالات فقط' },
    { value: 'viewer', label: 'مشاهد', description: 'قراءة فقط' },
];

export const EditUserForm: React.FC<EditUserFormProps> = ({
    user,
    onSuccess,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'writer' as User['role'],
        phone: '',
        bio: '',
        status: 'published' as User['status'],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                bio: user.bio || '',
                status: user.status,
            });
        }
    }, [user]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'الاسم الكامل مطلوب';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'البريد الإلكتروني غير صالح';
        }

        if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'رقم الهاتف غير صالح';
        }

        if (changePassword) {
            if (!passwords.current) {
                newErrors.currentPassword = 'كلمة المرور الحالية مطلوبة';
            }
            if (!passwords.new) {
                newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
            } else if (passwords.new.length < 8) {
                newErrors.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
            }
            if (passwords.new !== passwords.confirm) {
                newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedUser: User = {
            ...user,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone,
            bio: formData.bio,
            status: formData.status,
        };

        onSuccess(updatedUser);
        setIsSubmitting(false);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                <Avatar
                    name={formData.name || user.name}
                    src={user.avatar}
                    size="lg"
                />
                <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <button
                        type="button"
                        className="text-sm text-primary hover:text-primary/80 mt-1"
                    >
                        تغيير الصورة الشخصية
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="أدخل الاسم الكامل"
                        icon="ri-user-line"
                        error={errors.name}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="example@domain.com"
                        icon="ri-mail-line"
                        dir="ltr"
                        error={errors.email}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف
                    </label>
                    <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+967 123 456 789"
                        icon="ri-phone-line"
                        dir="ltr"
                        error={errors.phone}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        الدور الوظيفي <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-colors bg-white"
                    >
                        {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label} - {role.description}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bio */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    نبذة تعريفية
                </label>
                <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="نبذة مختصرة عن المستخدم..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-colors resize-none"
                />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                    <h4 className="font-medium text-gray-900">حالة الحساب</h4>
                    <p className="text-sm text-gray-500">
                        {formData.status === 'published' ? 'الحساب نشط ويمكنه الوصول للنظام' : 'الحساب معطل'}
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.status === 'published'}
                        onChange={(e) => handleInputChange('status', e.target.checked ? 'published' : 'draft')}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

            {/* Password Change Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={() => setChangePassword(!changePassword)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Icon name="ri-lock-line" className="text-gray-500" />
                        <span className="font-medium text-gray-900">تغيير كلمة المرور</span>
                    </div>
                    <Icon
                        name={changePassword ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
                        className="text-gray-500"
                    />
                </button>

                {changePassword && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                كلمة المرور الحالية
                            </label>
                            <Input
                                type="password"
                                value={passwords.current}
                                onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                                placeholder="••••••••"
                                icon="ri-lock-line"
                                error={errors.currentPassword}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    كلمة المرور الجديدة
                                </label>
                                <Input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                                    placeholder="••••••••"
                                    icon="ri-lock-password-line"
                                    error={errors.newPassword}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    تأكيد كلمة المرور
                                </label>
                                <Input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                                    placeholder="••••••••"
                                    icon="ri-lock-password-line"
                                    error={errors.confirmPassword}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                    إلغاء
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Icon name="ri-loader-4-line" className="animate-spin" />
                            جاري الحفظ...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Icon name="ri-check-line" />
                            حفظ التغييرات
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
};

export default EditUserForm;
