"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Icon } from '@/components/atoms';
import { FormSkeleton } from '@/components/molecules';
import { settingsService, type SystemSettings } from '@/services/settings.service';
import { useToast } from '@/components/organisms/Toast';

type SettingsTab = 'general' | 'seo' | 'notifications' | 'social';

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    // Form state - using local state to manage changes before saving
    const [formData, setFormData] = useState<Partial<SystemSettings>>({});

    // Fetch settings
    const { data: settings, isLoading, isError } = useQuery({
        queryKey: ['settings'],
        queryFn: () => settingsService.getSettings(),
    });

    // Initialize form data when settings are loaded
    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data: Partial<SystemSettings>) => settingsService.updateSettings(data),
        onSuccess: () => {
            success('تم حفظ الإعدادات بنجاح');
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'فشل حفظ الإعدادات');
        },
    });

    const handleSave = () => {
        saveMutation.mutate(formData);
    };

    const updateNestedField = (group: keyof SystemSettings, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [group]: {
                ...(prev[group] || {}),
                [field]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
                <div className="h-12 bg-gray-200 rounded w-full mb-8" />
                <FormSkeleton fields={5} />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-red-50 p-6 rounded-lg text-red-600 border border-red-100 flex items-center gap-3">
                <Icon name="ri-error-warning-line" size="lg" />
                <p>فشل تحميل الإعدادات. يرجى المحاولة مرة أخرى.</p>
            </div>
        );
    }

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'general', label: 'عام', icon: 'ri-settings-3-line' },
        { id: 'seo', label: 'محركات البحث', icon: 'ri-search-eye-line' },
        { id: 'social', label: 'التواصل الاجتماعي', icon: 'ri-share-line' },
        { id: 'notifications', label: 'الإشعارات', icon: 'ri-notification-3-line' },
    ];

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
                <p className="text-gray-500 text-sm mt-1">إعدادات النظام والموقع العامة</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                            }
                        `}
                    >
                        <Icon name={tab.icon} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

                {/* General Settings */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الموقع</label>
                                <Input
                                    value={formData.general?.siteName || ''}
                                    onChange={(e: any) => updateNestedField('general', 'siteName', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني الرسمي</label>
                                <Input
                                    type="email"
                                    value={formData.general?.officialEmail || ''}
                                    onChange={(e: any) => updateNestedField('general', 'officialEmail', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                                <Input
                                    value={formData.general?.phoneNumber || ''}
                                    onChange={(e: any) => updateNestedField('general', 'phoneNumber', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اللغة الافتراضية</label>
                                <select
                                    value={formData.general?.defaultLanguage || 'ar'}
                                    onChange={(e) => updateNestedField('general', 'defaultLanguage', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                >
                                    <option value="ar">العربية</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">وصف مختصر (الفوتر)</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm resize-none"
                                value={formData.general?.footerDescription || ''}
                                onChange={(e) => updateNestedField('general', 'footerDescription', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* SEO Settings */}
                {activeTab === 'seo' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الصفحة الرئيسية (Meta Title)</label>
                            <Input
                                value={formData.seo?.metaTitle || ''}
                                onChange={(e: any) => updateNestedField('seo', 'metaTitle', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">الكلمات المفتاحية (Keywords)</label>
                            <Input
                                value={formData.seo?.keywords || ''}
                                onChange={(e: any) => updateNestedField('seo', 'keywords', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">وصف الميتا (Meta Description)</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm resize-none"
                                value={formData.seo?.metaDescription || ''}
                                onChange={(e) => updateNestedField('seo', 'metaDescription', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                id="indexing"
                                className="rounded text-primary focus:ring-primary"
                                checked={formData.seo?.allowIndexing || false}
                                onChange={(e) => updateNestedField('seo', 'allowIndexing', e.target.checked)}
                            />
                            <label htmlFor="indexing">السماح لمحركات البحث بفهرسة الموقع</label>
                        </div>
                    </div>
                )}

                {/* Social Media */}
                {activeTab === 'social' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                                <Input
                                    icon="ri-facebook-fill"
                                    placeholder="https://facebook.com/..."
                                    value={formData.social?.facebook || ''}
                                    onChange={(e: any) => updateNestedField('social', 'facebook', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Twitter (X)</label>
                                <Input
                                    icon="ri-twitter-x-line"
                                    placeholder="https://twitter.com/..."
                                    value={formData.social?.twitter || ''}
                                    onChange={(e: any) => updateNestedField('social', 'twitter', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                                <Input
                                    icon="ri-instagram-line"
                                    placeholder="https://instagram.com/..."
                                    value={formData.social?.instagram || ''}
                                    onChange={(e: any) => updateNestedField('social', 'instagram', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                                <Input
                                    icon="ri-youtube-line"
                                    placeholder="https://youtube.com/..."
                                    value={formData.social?.youtube || ''}
                                    onChange={(e: any) => updateNestedField('social', 'youtube', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                                <Input
                                    icon="ri-whatsapp-line"
                                    placeholder="+967..."
                                    value={formData.social?.whatsapp || ''}
                                    onChange={(e: any) => updateNestedField('social', 'whatsapp', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
                                <Input
                                    icon="ri-telegram-line"
                                    placeholder="https://t.me/..."
                                    value={formData.social?.telegram || ''}
                                    onChange={(e: any) => updateNestedField('social', 'telegram', e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">إشعارات البريد الإلكتروني</h4>
                            {[
                                { key: 'userRegistration', label: 'عند تسجيل مستخدم جديد' },
                                { key: 'newComment', label: 'عند إضافة تعليق جديد' },
                                { key: 'contactForm', label: 'عند إرسال نموذج "اتصل بنا"' },
                                { key: 'securityAlerts', label: 'تنبيهات الأمان ومحاولات الدخول' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between py-2">
                                    <span className="text-gray-700 text-sm">{item.label}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={(formData.notifications as any)?.[item.key] || false}
                                            onChange={(e) => updateNestedField('notifications', item.key, e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            if (window.confirm('هل أنت متأكد من العودة للإعدادات الأصلية؟')) {
                                setFormData(settings || {});
                            }
                        }}
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-2"
                    >
                        <Icon name="ri-refresh-line" />
                        إعادة تعيين
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <Icon name="ri-loader-4-line" className="animate-spin" />
                                جاري الحفظ...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Icon name="ri-save-line" />
                                حفظ التغييرات
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
