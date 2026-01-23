"use client";

/**
 * Sidebar Component
 * 
 * Admin dashboard sidebar with navigation items.
 * 
 * @see components.sidebar in design-system.json
 * 
 * @example
 * <Sidebar currentPath="/dashboard/articles" />
 */

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/atoms';

export interface SidebarProps {
    /** Current active path */
    currentPath?: string;
    /** Optional user info */
    userName?: string;
}

const navItems = [
    { icon: 'ri-dashboard-line', label: 'الرئيسية', href: '/admin' },
    { icon: 'ri-article-line', label: 'إدارة الأخبار', href: '/admin/articles' },
    { icon: 'ri-user-line', label: 'إدارة المستخدمين', href: '/admin/users' },
    { icon: 'ri-folder-line', label: 'الأقسام', href: '/admin/categories' },
    { icon: 'ri-image-line', label: 'المكتبة الإعلامية', href: '/admin/media' },
    { icon: 'ri-chat-line', label: 'التعليقات', href: '/admin/comments' },
    { icon: 'ri-history-line', label: 'سجل النشاط', href: '/admin/activity' },
    { icon: 'ri-shield-user-line', label: 'الصلاحيات', href: '/admin/permissions' },
    { icon: 'ri-settings-line', label: 'الإعدادات', href: '/admin/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({
    currentPath = '/admin',
}) => {
    return (
        <aside className="sidebar w-64 bg-white shadow-lg border-l border-gray-200">
            <div className="p-6">
                {/* Dashboard Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Icon name="ri-dashboard-line" className="text-white text-xl" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">لوحة التحكم</h3>
                        <p className="text-xs text-gray-500">إدارة شاملة</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2" aria-label="التنقل في لوحة التحكم">
                    {navItems.map((item) => {
                        const isActive = currentPath === item.href ||
                            (item.href !== '/dashboard' && currentPath.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                `}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <Icon name={item.icon} />
                                </div>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
