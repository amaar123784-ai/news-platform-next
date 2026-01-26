"use client";

import React from 'react';
import { Icon } from '@/components/atoms';

export default function PermissionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">الصلاحيات والأدوار</h1>
                <p className="text-gray-500 text-sm mt-1">
                    عرض مصفوفة الصلاحيات للأدوار المختلفة في النظام
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 bg-yellow-50 border-b border-yellow-100 flex gap-3 text-yellow-800">
                    <Icon name="ri-information-line" size="xl" />
                    <div>
                        <h4 className="font-bold">ملاحظة</h4>
                        <p className="text-sm mt-1">
                            إدارة الصلاحيات الدقيقة غير مفعلة في هذه النسخة. الصلاحيات حالياً مرتبطة بشكل ثابت بالأدوار (Hardcoded Roles).
                            يمكنك تغيير دور المستخدم من صفحة "المستخدمين" لمنحه صلاحيات مختلفة.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-900 font-bold border-b">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">الصلاحية / الدور</th>
                                <th className="px-6 py-4 text-center text-red-600 whitespace-nowrap">المدير (Admin)</th>
                                <th className="px-6 py-4 text-center text-blue-600 whitespace-nowrap">المحرر (Editor)</th>
                                <th className="px-6 py-4 text-center text-green-600 whitespace-nowrap">الصحفي (Journalist)</th>
                                <th className="px-6 py-4 text-center text-gray-600 whitespace-nowrap">القاريء (Reader)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                                { name: 'دخول لوحة التحكم', roles: [true, true, true, false] },
                                { name: 'إدارة المستخدمين', roles: [true, false, false, false] },
                                { name: 'إدارة الإعدادات', roles: [true, false, false, false] },
                                { name: 'نشر المقالات مباشرة', roles: [true, true, false, false] },
                                { name: 'تعديل مقالات الآخرين', roles: [true, true, false, false] },
                                { name: 'حذف المقالات', roles: [true, true, false, false] },
                                { name: 'إنشاء مقالات (مسودة)', roles: [true, true, true, false] },
                                { name: 'إدارة التعليقات', roles: [true, true, false, false] },
                                { name: 'رفع ملفات وسائط', roles: [true, true, true, false] },
                                { name: 'الوصول لسجل النشاط', roles: [true, false, false, false] },
                            ].map((perm, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{perm.name}</td>
                                    {perm.roles.map((hasAccess, rIdx) => (
                                        <td key={rIdx} className="px-6 py-4 text-center">
                                            {hasAccess ? (
                                                <Icon name="ri-check-line" className="text-green-500 mx-auto" size="lg" />
                                            ) : (
                                                <Icon name="ri-close-line" className="text-red-200 mx-auto" size="lg" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
