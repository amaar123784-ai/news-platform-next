"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Icon } from "@/components/atoms";
import { NewsCardSmall } from "@/components/molecules";
import { FeaturedNews, FeaturedNewsCarousel, NewsCard, Header, Footer, BreakingNewsTicker, PublicSidebar } from "@/components/organisms";
import type { Article } from "@/lib/api";

interface HomeContentProps {
    featuredArticles: Article[];
    articles: Article[];
    topArticles: Article[];
}

// Format time ago in Arabic
function formatTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "منذ دقائق";
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}

// Category tabs
const categoryTabs = [
    { key: "all", label: "جميع الأخبار" },
    { key: "politics", label: "السياسة" },
    { key: "economy", label: "الاقتصاد" },
    { key: "sports", label: "الرياضة" },
    { key: "culture", label: "الثقافة" },
];

// Fallback image
const fallbackImg = "/images/placeholder.jpg";

export function HomeContent({ featuredArticles, articles, topArticles }: HomeContentProps) {
    const [activeCategory, setActiveCategory] = useState("all");

    // Client-side category filtering
    const { data: filteredData } = useQuery({
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
    const featuredArticle = featuredArticles?.[0];

    // Helper to get image URL using environment variable
    const getImageUrl = (imageUrl?: string) => {
        if (!imageUrl) return fallbackImg;
        if (imageUrl.startsWith("http")) return imageUrl;
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000';
        return `${apiBaseUrl}${imageUrl}`;
    };

    return (
        <>


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Featured Article Carousel */}
                    <section className="mb-6 sm:mb-8">
                        {featuredArticles && featuredArticles.length > 0 ? (
                            <FeaturedNewsCarousel
                                interval={6000}
                                pauseOnHover={true}
                                articles={featuredArticles.map(article => ({
                                    id: article.id,
                                    title: article.title,
                                    excerpt: article.excerpt,
                                    category: (article.category?.slug || "politics") as any,
                                    imageUrl: getImageUrl(article.imageUrl),
                                    author: article.author?.name || "المحرر",
                                    timeAgo: formatTimeAgo(article.publishedAt || article.createdAt),
                                    views: article.views,
                                    isBreaking: article.views > 1000,
                                }))}
                            />
                        ) : (
                            <div className="h-64 sm:h-80 lg:h-96 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                                لا توجد مقالات مميزة
                            </div>
                        )}
                    </section>

                    {/* News Grid */}
                    <section className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <Icon name="ri-newspaper-line" size="xl" className="text-primary" />
                            <h2 className="text-lg sm:text-xl font-bold">أحدث الأخبار</h2>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {displayArticles.map((article: Article) => (
                                <NewsCard
                                    key={article.id}
                                    id={article.id}
                                    title={article.title}
                                    excerpt={article.excerpt}
                                    category={(article.category?.slug || "politics") as any}
                                    imageUrl={getImageUrl(article.imageUrl)}
                                    author={article.author?.name || "المحرر"}
                                    authorId={article.author?.id}
                                    timeAgo={formatTimeAgo(article.publishedAt || article.createdAt)}
                                />
                            ))}
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
