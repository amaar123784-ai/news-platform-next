"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/atoms";
import { NewsCardSmall } from "@/components/molecules";
import { NewsCardSkeleton } from "@/components/molecules/NewsCardSkeleton";
import { FeaturedNewsGrid, NewsCard, PublicSidebar } from "@/components/organisms";
import type { Article } from "@/lib/api";
import { formatTimeAgo } from "@/utils/date";

interface HomeContentProps {
    featuredArticles: Article[];
    articles: Article[];
    topArticles: Article[];
}

// Category tabs
const categoryTabs = [
    { key: "all", label: "جميع الأخبار", icon: "ri-newspaper-line" },
    { key: "politics", label: "السياسة", icon: "ri-government-line" },
    { key: "economy", label: "الاقتصاد", icon: "ri-money-dollar-circle-line" },
    { key: "sports", label: "الرياضة", icon: "ri-football-line" },
    { key: "culture", label: "الثقافة", icon: "ri-book-2-line" },
];

// Fallback image
const fallbackImg = "/images/placeholder.jpg";

export function HomeContent({ featuredArticles, articles, topArticles }: HomeContentProps) {
    const [activeCategory, setActiveCategory] = useState("all");

    // Client-side category filtering
    const { data: filteredData, isLoading, isFetching } = useQuery({
        queryKey: ["articles", "list", activeCategory],
        queryFn: async () => {
            if (activeCategory === "all") return articles;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"}/articles?category=${activeCategory}&perPage=6&status=PUBLISHED`
            );
            const data = await res.json();
            return data.data;
        },
        initialData: articles,
        staleTime: 2 * 60 * 1000,
    });

    const displayArticles = filteredData || articles;
    const showSkeleton = isFetching && activeCategory !== "all";

    // Helper to get image URL
    const getImageUrl = (imageUrl?: string) => {
        if (!imageUrl) return fallbackImg;
        if (imageUrl.startsWith("http")) return imageUrl;
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
        const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}${imageUrl}`;
    };

    // Fallback: if no featured articles, use top 3 articles with images
    const effectiveFeatured = featuredArticles && featuredArticles.length > 0
        ? featuredArticles
        : articles.filter(a => a.imageUrl).slice(0, 3);

    // Map to FeaturedNewsGrid format
    const featuredGridArticles = effectiveFeatured.map(article => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        category: (article.category?.slug || "politics") as any,
        imageUrl: getImageUrl(article.imageUrl),
        timeAgo: formatTimeAgo(article.publishedAt || article.createdAt),
        views: article.views,
        isBreaking: (article as any).isBreaking || false,
    }));

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Featured Articles Grid */}
                    {featuredGridArticles.length > 0 ? (
                        <FeaturedNewsGrid articles={featuredGridArticles} />
                    ) : (
                        <div className="h-64 sm:h-80 lg:h-96 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 mb-6">
                            لا توجد مقالات مميزة
                        </div>
                    )}

                    {/* News Grid with Category Tabs */}
                    <section className="mb-6 sm:mb-8">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 sm:gap-3 mb-5">
                            <Icon name="ri-newspaper-line" size="xl" className="text-primary" />
                            <h2 className="text-lg sm:text-xl font-bold">أحدث الأخبار</h2>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Category Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                            {categoryTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveCategory(tab.key)}
                                    className={`
                                        flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                                        whitespace-nowrap transition-all duration-200
                                        ${activeCategory === tab.key
                                            ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                        }
                                    `}
                                >
                                    <Icon name={tab.icon} size="sm" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Cards Grid — with skeleton or real data */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {showSkeleton ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <NewsCardSkeleton key={i} />
                                ))
                            ) : (
                                displayArticles.map((article: Article, index: number) => (
                                    <div
                                        key={article.id}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${index * 60}ms` }}
                                    >
                                        <NewsCard
                                            id={article.id}
                                            title={article.title}
                                            excerpt={article.excerpt}
                                            category={(article.category?.slug || "politics") as any}
                                            imageUrl={getImageUrl(article.imageUrl)}
                                            timeAgo={formatTimeAgo(article.publishedAt || article.createdAt)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <PublicSidebar
                        urgentNews={displayArticles.slice(0, 5)}
                        mostReadNews={topArticles}
                    />
                </div>
            </div>
        </>
    );
}
