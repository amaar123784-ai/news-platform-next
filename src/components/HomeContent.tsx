"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Icon } from "@/components/atoms";
import { NewsCardSmall } from "@/components/molecules";
import { FeaturedNews, FeaturedNewsGrid, NewsCard, Header, Footer, BreakingNewsTicker, PublicSidebar } from "@/components/organisms";
import type { Article } from "@/lib/api";
import { formatTimeAgo } from "@/utils/date";

interface HomeContentProps {
    featuredArticles: Article[];
    articles: Article[];
    topArticles: Article[];
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

    // Helper to get image URL using environment variable
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
        author: article.author?.name || "المحرر",
        timeAgo: formatTimeAgo(article.publishedAt || article.createdAt),
        views: article.views,
        isBreaking: (article as any).isBreaking || false,
    }));

    return (
        <>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
