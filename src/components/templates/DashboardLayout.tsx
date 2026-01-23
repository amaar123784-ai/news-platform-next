/**
 * DashboardLayout Template
 * 
 * Layout for admin dashboard pages with sidebar navigation.
 * 
 * @see pageTemplates.dashboardPage in design-system.json
 * 
 * @example
 * <DashboardLayout currentPath="/dashboard/articles" userName="أحمد">
 *   <DashboardContent />
 * </DashboardLayout>
 */

import React from 'react';
import { Container, Icon, Button } from '@/components/atoms';
import { Sidebar, Footer } from '@/components/organisms';

export interface DashboardLayoutProps {
    /** Dashboard content */
    children: React.ReactNode;
    /** Current path for sidebar highlighting */
    currentPath?: string;
    /** User name */
    userName?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    currentPath = '/dashboard',
    userName = 'المستخدم',
}) => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            {/* Dashboard Header */}
            <header className="bg-white shadow-sm border-b-2 border-primary">
                <div className="max-w-full mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Label */}
                        <div className="flex items-center gap-8">
                            <a href="/" className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <Icon name="ri-global-line" size="2xl" className="text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold text-primary font-brand">Voice of Tihama</h1>
                            </a>
                            <div className="text-sm text-gray-600 bg-primary/10 px-3 py-1 rounded-full">
                                لوحة تحكم المسؤول
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <div className="relative">
                                <Button variant="icon" aria-label="الإشعارات">
                                    <Icon name="ri-notification-line" size="xl" className="text-gray-600 hover:text-primary" />
                                </Button>
                                <div className="notification-dot absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full" />
                            </div>

                            {/* User */}
                            <div className="flex items-center gap-3 cursor-pointer">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                    <Icon name="ri-user-line" className="text-white" />
                                </div>
                                <span className="text-sm font-medium hidden md:block">{userName}</span>
                            </div>

                            {/* Logout */}
                            <a href="/" className="text-gray-600 hover:text-primary" aria-label="تسجيل الخروج">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <Icon name="ri-logout-box-line" size="xl" />
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Area with Sidebar */}
            <div className="flex flex-1">
                <Sidebar currentPath={currentPath} />
                <main className="flex-1 p-6">{children}</main>
            </div>

            {/* Footer */}
            <Footer variant="dashboard" />
        </div>
    );
};

export default DashboardLayout;
