import type { Metadata } from 'next';
import { Suspense } from "react";

import { Container, Icon, Input, Button } from "@/components/atoms";
import { getArticles, type Article } from "@/lib/api";
import { NewsCard } from "@/components/organisms";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export const metadata: Metadata = {
    title: "البحث | صوت تهامة",
    description: "البحث في الأخبار والمقالات على منصة صوت تهامة",
    alternates: { canonical: `${siteUrl}/search` },
    openGraph: {
        title: "البحث | صوت تهامة",
        description: "البحث في الأخبار والمقالات",
        url: `${siteUrl}/search`,
        type: 'website',
        locale: 'ar_YE',
        siteName: 'صوت تهامة',
    },
};

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q: query } = await searchParams;

    let articles: Article[] = [];
    if (query) {
        const response = await getArticles({
            search: query,
            perPage: 12,
            status: "PUBLISHED"
        });
        articles = response.data;
    }

    return (
        <>

            <main className="min-h-screen bg-gray-50 py-8">
                <Container>
                    {/* Search Header */}
                    <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
                        <h1 className="text-2xl font-bold mb-6">البحث في الموقع</h1>
                        <form action="/search" className="max-w-2xl mx-auto flex gap-2">
                            <div className="relative flex-1">
                                <Icon
                                    name="ri-search-line"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    name="q"
                                    defaultValue={query}
                                    placeholder="ابحث عن خبر، مقال، أو كاتب..."
                                    className="w-full h-12 pr-10 pl-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                                />
                            </div>
                            <Button type="submit" variant="primary" className="h-12 px-8">
                                بحث
                            </Button>
                        </form>
                    </div>

                    {/* Results */}
                    {query ? (
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <h2 className="text-xl font-bold">نتائج البحث عن: <span className="text-primary">{query}</span></h2>
                                <span className="text-sm text-gray-500">({articles.length} نتيجة)</span>
                            </div>

                            {articles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {articles.map((article: any) => (
                                        <NewsCard
                                            key={article.id}
                                            id={article.id}
                                            title={article.title}
                                            excerpt={article.excerpt}
                                            category={article.category?.slug || "general"}
                                            imageUrl={article.imageUrl?.startsWith('http') ? article.imageUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000'}${article.imageUrl || '/images/placeholder.jpg'}`}
                                            author={article.author?.name || "المحرر"}
                                            timeAgo={new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-YE')}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Icon name="ri-search-2-line" size="2xl" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
                                    <p className="text-gray-500">جرب البحث بكلمات مختلفة أو أكثر عامة.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-gray-500">أدخل كلمة البحث للبدء...</p>
                        </div>
                    )}
                </Container>
            </main>

        </>
    );
}
