"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/atoms";
import { NewsCard } from "@/components/organisms";
import { NewsCardSkeleton } from "@/components/molecules/NewsCardSkeleton";
import type { Article } from "@/lib/api";
import { formatTimeAgo } from "@/utils/date";
import { getImageUrl } from "@/lib/api";

interface CategoryNewsFilterProps {
    initialArticles: Article[];
}

const categoryTabs = [
    { key: "all", label: "جميع الأخبار", icon: "ri-newspaper-line" },
    { key: "politics", label: "السياسة", icon: "ri-government-line" },
    { key: "economy", label: "الاقتصاد", icon: "ri-money-dollar-circle-line" },
    { key: "sports", label: "الرياضة", icon: "ri-football-line" },
    { key: "culture", label: "الثقافة", icon: "ri-book-2-line" },
];

export function CategoryNewsFilter({ initialArticles }: CategoryNewsFilterProps) {
    const [activeCategory, setActiveCategory] = useState("all");

    const { data: filteredData, isFetching } = useQuery({
        queryKey: ["articles", "list", activeCategory],
        queryFn: async () => {
            if (activeCategory === "all") return initialArticles;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"}/articles?category=${activeCategory}&perPage=6&status=PUBLISHED`
            );
            const data = await res.json();
            return data.data;
        },
        initialData: initialArticles,
        staleTime: 2 * 60 * 1000,
    });

    const displayArticles = filteredData || initialArticles;
    const showSkeleton = isFetching && activeCategory !== "all";

    return (
        <section className="mb-6 sm:mb-8">
            {/* Section Header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-5">
                <Icon name="ri-newspaper-line" size="xl" className="text-primary" />
                <h2 className="text-lg sm:text-xl font-bold">أحدث الأخبار</h2>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="تصنيفات الأخبار">
                {categoryTabs.map((tab) => (
                    <button
                        key={tab.key}
                        role="tab"
                        aria-selected={activeCategory === tab.key}
                        aria-controls={`panel-${tab.key}`}
                        id={`tab-${tab.key}`}
                        onClick={() => setActiveCategory(tab.key)}
                        className={`
                            flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                            whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
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

            {/* Cards Grid */}
            <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                id={`panel-${activeCategory}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeCategory}`}
            >
                {showSkeleton ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <NewsCardSkeleton key={i} />
                    ))
                ) : (
                    displayArticles.map((article: Article, index: number) => (
                        <div
                            key={article.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 40}ms` }}
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
    );
}
