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
    role: 'ADMIN' | 'EDITOR' | 'JOURNALIST' | 'READER';
    isActive: boolean;
    avatar?: string;
    phone?: string;
    bio?: string;
    createdAt: string;
}

export interface EditUserFormProps {
    user: User;
    onSuccess: (updatedUser: any) => void;
    onCancel: () => void;
}

const roleOptions = [
    { value: 'ADMIN', label: 'مدير النظام', description: 'صلاحيات كاملة' },
    { value: 'EDITOR', label: 'محرر', description: 'تعديل ونشر المقالات' },
    { value: 'JOURNALIST', label: 'صحفي', description: 'كتابة المقالات' },
    { value: 'READER', label: 'قارئ', description: 'قراءة فقط' },
];

export const EditUserForm: React.FC<EditUserFormProps> = ({
    user,
    onSuccess,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'JOURNALIST' as User['role'],
        bio: '',
        isActive: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [changePassword, setChangePassword] = useState(false);
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                bio: user.bio || '',
                isActive: user.isActive,
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

        if (changePassword) {
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

        const updateData: any = {
            id: user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            bio: formData.bio,
            isActive: formData.isActive,
        };

        if (changePassword && passwords.new) {
            updateData.password = passwords.new;
        }

        onSuccess(updateData);
    };

    const handleInputChange = (field: string, value: any) => {
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
                        الدور الوظيفي <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-colors bg-white text-gray-900"
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-colors resize-none text-gray-900"
                />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                    <h4 className="font-medium text-gray-900">حالة الحساب</h4>
                    <p className="text-sm text-gray-500">
                        {formData.isActive ? 'الحساب نشط ويمكنه الوصول للنظام' : 'الحساب معطل'}
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
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
                <Button type="button" variant="secondary" onClick={onCancel}>
                    إلغاء
                </Button>
                <Button type="submit" variant="primary">
                    <span className="flex items-center gap-2">
                        <Icon name="ri-check-line" />
                        حفظ التغييرات
                    </span>
                </Button>
            </div>
        </form>
    );
};

export default EditUserForm;
