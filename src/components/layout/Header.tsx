"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/api";

interface HeaderProps {
    categories: Category[];
}

export function Header({ categories }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const pathname = usePathname();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between py-3 border-b">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">📰</span>
                        <span className="text-xl font-bold text-blue-900">أخبار اليمن</span>
                    </Link>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في الأخبار..."
                            className="px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 transition"
                        >
                            بحث
                        </button>
                    </form>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="text-2xl">{isMobileMenuOpen ? "✕" : "☰"}</span>
                    </button>
                </div>

                {/* Categories Navigation */}
                <nav className="hidden md:flex items-center gap-1 py-2 overflow-x-auto">
                    <Link
                        href="/"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${pathname === "/"
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        الرئيسية
                    </Link>
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/category/${cat.slug}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${pathname === `/category/${cat.slug}`
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t">
                        <form onSubmit={handleSearch} className="flex mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث..."
                                className="flex-1 px-4 py-2 border rounded-r-lg"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-l-lg"
                            >
                                بحث
                            </button>
                        </form>
                        <div className="space-y-2">
                            <Link
                                href="/"
                                className="block px-4 py-2 rounded-lg hover:bg-gray-100"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                الرئيسية
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="block px-4 py-2 rounded-lg hover:bg-gray-100"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
