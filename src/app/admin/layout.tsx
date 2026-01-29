"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon, Button } from '@/components/atoms';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    // Mobile-first: sidebar hidden by default on small screens
    const [isSidebarOpen, setSidebarOpen] = useState(true); // Default open for desktop
    const { user, isLoading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Handle screen resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const menuItems = [
        { path: '/admin', icon: 'ri-dashboard-line', label: 'لوحة القيادة', exact: true, roles: ['admin', 'editor', 'journalist'] },
        { path: '/admin/articles', icon: 'ri-file-list-line', label: 'إدارة المحتوى', roles: ['admin', 'editor', 'journalist'] },
        { path: '/admin/categories', icon: 'ri-folder-line', label: 'الأقسام', roles: ['admin', 'editor'] },
        { path: '/admin/rss', icon: 'ri-rss-line', label: 'مصادر RSS', exact: true, roles: ['admin', 'editor'] },
        { path: '/admin/rss/moderation', icon: 'ri-checkbox-circle-line', label: 'مراجعة RSS', roles: ['admin', 'editor'] },
        { path: '/admin/automation', icon: 'ri-robot-line', label: 'الأتمتة', roles: ['admin', 'editor'] },
        { path: '/admin/media', icon: 'ri-image-line', label: 'المكتبة الإعلامية', roles: ['admin', 'editor', 'journalist'] },
        { path: '/admin/users', icon: 'ri-team-line', label: 'المستخدمين والصلاحيات', roles: ['admin'] },
        { path: '/admin/comments', icon: 'ri-chat-1-line', label: 'التعليقات', roles: ['admin', 'editor'] },
        { path: '/admin/activity', icon: 'ri-history-line', label: 'سجل النشاط', roles: ['admin'] },
        { path: '/admin/permissions', icon: 'ri-shield-user-line', label: 'الصلاحيات', roles: ['admin'] },
        { path: '/admin/settings', icon: 'ri-settings-4-line', label: 'الإعدادات العامة', roles: ['admin'] },
    ];

    const isActive = (path: string, exact = false) => {
        if (exact) return pathname === path;
        return pathname.startsWith(path);
    };

    React.useEffect(() => {
        if (!isLoading && !user && typeof window !== 'undefined') {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    if (!user) {
        return null;
    }

    // Filter menu items based on role
    const filteredMenuItems = menuItems.filter(item =>
        user && item.roles.includes(user.role?.toLowerCase() || '')
    );

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans relative overflow-hidden">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 right-0 z-50 bg-gray-900 text-white transition-transform duration-300 transform lg:relative lg:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full lg:w-20'}
                `}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-800">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="ri-admin-line" size="lg" />
                        </div>
                        <span className={`font-bold text-lg transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                            لوحة التحكم
                        </span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        {filteredMenuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                        ${isActive(item.path, item.exact)
                                            ? 'bg-primary text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }
                                        ${!isSidebarOpen && 'lg:justify-center'}
                                    `}
                                    title={!isSidebarOpen ? item.label : ''}
                                >
                                    <Icon name={item.icon} size="lg" />
                                    <span className={`text-sm font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Info / Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-900">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'lg:justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                            <span className="font-bold text-xs">{user?.name?.charAt(0) || 'A'}</span>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 lg:hidden'}`}>
                            <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                <Icon name="ri-logout-box-line" size="sm" />
                                تسجيل خروج
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Actions */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            <Icon name={isSidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'} size="xl" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800 truncate">
                            {menuItems.find(i => isActive(i.path, i.exact))?.label || 'لوحة التحكم'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4">
                        <span className="hidden sm:inline-block">
                            <Button variant="secondary" size="sm" onClick={() => window.open('/', '_blank')}>
                                <Icon name="ri-external-link-line" className="ml-2" />
                                عرض الموقع
                            </Button>
                        </span>
                        <span className="sm:hidden">
                            <button onClick={() => window.open('/', '_blank')} className="p-2 text-gray-600 hover:text-primary">
                                <Icon name="ri-external-link-line" size="lg" />
                            </button>
                        </span>
                        <div className="relative">
                            <Icon name="ri-notification-3-line" size="lg" className="text-gray-500 cursor-pointer hover:text-primary" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
