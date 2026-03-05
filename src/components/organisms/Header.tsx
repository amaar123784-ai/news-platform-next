"use client";

/**
 * Header Component
 * 
 * Main site header with logo, navigation, search, and auth actions.
 * Uses Next.js navigation.
 * 
 * @see components.header and components.navigation in design-system.json
 */

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Icon, Button } from '@/components/atoms';
import { settingsService } from '@/services/settings.service';

export interface HeaderProps {
    /** Whether user is logged in */
    isLoggedIn?: boolean;
    /** Current page path for active nav highlighting */
    currentPath?: string;
    /** User name when logged in */
    userName?: string;
}

export const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { data: settings } = useQuery({
        queryKey: ['public-settings'],
        queryFn: () => settingsService.getPublicSettings(),
        staleTime: 1000 * 60 * 10,
    });

    const siteName = settings?.general?.siteName || 'صوت تهامة';

    const navLinks = [
        { path: '/', label: 'الرئيسية' },
        { path: '/category/politics', label: 'سياسة' },
        { path: '/category/economy', label: 'اقتصاد' },
        { path: '/category/sports', label: 'رياضة' },
        { path: '/category/culture', label: 'ثقافة' },
        { path: '/category/technology', label: 'تكنولوجيا' },
    ];

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <header className="bg-white border-b-2 border-primary shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 lg:h-20 flex items-center justify-between">

                {/* Mobile Menu Button (Right side in RTL) */}
                <div className="flex-1 lg:hidden flex justify-start">
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="فتح القائمة"
                    >
                        <Icon name="ri-menu-line" size="xl" />
                    </button>
                </div>

                {/* Logo */}
                <div className="flex justify-center lg:justify-start lg:flex-none">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Image
                            src="/images/logo.webp"
                            alt={siteName}
                            width={64}
                            height={64}
                            priority
                            className="h-10 lg:h-14 w-auto group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="flex flex-col justify-center pt-1">
                            <span className="text-[22px] lg:text-3xl font-black text-primary tracking-tight leading-none whitespace-nowrap">{siteName}</span>
                            <span className="text-[10px] lg:text-xs font-bold text-gray-400 tracking-[0.15em] uppercase mt-0.5 whitespace-nowrap text-center lg:text-right">VOICE OF TIHAMA</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center justify-center gap-1 flex-1 px-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${isActive(link.path)
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex-1 lg:flex-none flex items-center justify-end gap-2 lg:gap-3">
                    {/* Mobile Search */}
                    <button
                        onClick={() => router.push('/search')}
                        className="w-10 h-10 flex lg:hidden items-center justify-center rounded-full text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                        aria-label="بحث"
                    >
                        <Icon name="ri-search-line" size="xl" />
                    </button>

                    {/* Desktop Search */}
                    <Button variant="icon" onClick={() => router.push('/search')} className="hidden lg:flex hover:bg-primary/10 hover:text-primary" aria-label="بحث">
                        <Icon name="ri-search-line" size="lg" />
                    </Button>

                    <div className="hidden lg:block">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{user.name}</span>
                                {['admin', 'editor', 'journalist'].includes(user.role.toLowerCase()) && (
                                    <Link href="/admin">
                                        <Button variant="outline" size="sm" className="whitespace-nowrap">
                                            <Icon name="ri-dashboard-line" className="ml-1" />
                                            لوحة التحكم
                                        </Button>
                                    </Link>
                                )}
                                <Button variant="primary" size="sm" onClick={logout} className="bg-red-500 hover:bg-red-600 whitespace-nowrap">خروج</Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="whitespace-nowrap">دخول</Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="primary" size="sm" className="whitespace-nowrap">اشتراك</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform duration-300">
                        <div className="p-4 border-b flex items-center justify-between">
                            <span className="font-bold text-lg">القائمة</span>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                aria-label="إغلاق القائمة"
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <Icon name="ri-close-line" size="xl" />
                            </button>
                        </div>

                        <nav className="p-4 flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`p-3 rounded-lg flex items-center gap-3 min-h-[44px] ${isActive(link.path) ? 'bg-primary/10 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Icon name={
                                        link.path === '/' ? 'ri-home-line' :
                                            link.path.includes('politics') ? 'ri-government-line' :
                                                link.path.includes('economy') ? 'ri-bar-chart-line' :
                                                    link.path.includes('sports') ? 'ri-football-line' :
                                                        'ri-article-line'
                                    } />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="p-4 border-t mt-auto">
                            {user ? (
                                <div className="flex flex-col gap-2">
                                    {['admin', 'editor', 'journalist'].includes(user.role.toLowerCase()) && (
                                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="secondary" className="w-full justify-center">
                                                <Icon name="ri-dashboard-line" className="ml-2" />
                                                لوحة التحكم
                                            </Button>
                                        </Link>
                                    )}
                                    <Button variant="secondary" className="w-full justify-center text-red-600 hover:bg-red-50" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                                        تسجيل خروج
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full justify-center">دخول</Button>
                                    </Link>
                                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="primary" className="w-full justify-center">اشتراك جديد</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
