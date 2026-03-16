"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";
import type { Category } from "@/lib/api";

interface HeaderProps {
    categories: Category[];
}

export function Header({ categories }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const pathname = usePathname();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${
            isScrolled ? "bg-white/95 backdrop-blur-md shadow-md py-2" : "bg-white shadow-sm py-4"
        }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02] active:scale-95">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 overflow-hidden rounded-xl shadow-inner bg-gray-50 border border-gray-100">
                            <Image 
                                src="/images/logo.webp" 
                                alt="صوت تهامة" 
                                fill 
                                className="object-cover p-1"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg md:text-xl font-black text-gray-900 leading-none">صوت تهامة</span>
                            <span className="text-[10px] md:text-xs text-primary font-bold uppercase tracking-[0.2em] mt-1">Voice of Tihama</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                        <Link
                            href="/"
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                                pathname === "/"
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            الرئيسية
                        </Link>
                        {categories.slice(0, 6).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                    pathname === `/category/${cat.slug}`
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <form onSubmit={handleSearch} className="relative group">
                            <Icon
                                name="ri-search-line"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث..."
                                className="w-48 lg:w-64 pr-10 pl-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium"
                            />
                        </form>
                        
                        <div className="h-8 w-px bg-gray-200" />
                        
                        <Link href="/login">
                            <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 hover:bg-primary hover:text-white transition-all">
                                <Icon name="ri-user-line" />
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2.5 rounded-xl bg-gray-50 text-gray-900 border border-gray-100 active:scale-90 transition-transform"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="القائمة"
                    >
                        <Icon name={isMobileMenuOpen ? "ri-close-line" : "ri-menu-4-line"} size="xl" />
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 top-[72px] z-40 bg-white animate-in slide-in-from-top duration-300">
                        <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                            {/* Mobile Search */}
                            <form onSubmit={handleSearch} className="relative">
                                <Icon
                                    name="ri-search-line"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن الأخبار..."
                                    className="w-full h-14 pr-12 pl-6 rounded-2xl bg-gray-50 border border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                />
                            </form>

                            {/* Mobile Nav Links */}
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href="/"
                                    className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                                        pathname === "/" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 text-gray-700"
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Icon name="ri-home-4-line" />
                                    <span>الرئيسية</span>
                                </Link>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.slug}`}
                                        className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                                            pathname === `/category/${cat.slug}` 
                                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                                : "bg-gray-50 text-gray-700"
                                        }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Icon name="ri-hashtag" />
                                        <span className="truncate">{cat.name}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Social Links & Footer */}
                            <div className="pt-8 border-t border-gray-100 flex flex-col items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <a href="#" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                                        <Icon name="ri-facebook-fill" size="xl" />
                                    </a>
                                    <a href="#" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-sky-400 transition-colors">
                                        <Icon name="ri-twitter-x-fill" size="xl" />
                                    </a>
                                    <a href="#" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors">
                                        <Icon name="ri-youtube-fill" size="xl" />
                                    </a>
                                </div>
                                <Link href="/login" className="w-full">
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2">
                                        <Icon name="ri-user-line" />
                                        تسجيل الدخول
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
