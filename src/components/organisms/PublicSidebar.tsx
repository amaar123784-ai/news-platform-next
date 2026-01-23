"use client";

import Link from "next/link";
import { Icon } from "@/components/atoms";
import { NewsCardSmall } from "@/components/molecules";
import type { Article } from "@/lib/api";

interface PublicSidebarProps {
    urgentNews: Article[];
    mostReadNews: Article[];
}

// Format time ago in Arabic (Duplicate logic to avoid dependency issues if not imported)
function formatTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "منذ دقائق";
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}

export function PublicSidebar({ urgentNews, mostReadNews }: PublicSidebarProps) {
    return (
        <aside className="space-y-6">
            {/* Urgent News */}
            <section className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-secondary">
                <div className="flex items-center gap-3 mb-4">
                    <Icon name="ri-notification-3-line" size="xl" className="text-primary" />
                    <h3 className="text-lg font-bold">أخبار عاجلة</h3>
                </div>
                <div className="space-y-4">
                    {urgentNews.slice(0, 5).map((news) => (
                        <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group">
                            <article className="pb-4 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-red-600 font-medium">
                                        {formatTimeAgo(news.publishedAt || news.createdAt)}
                                    </span>
                                </div>
                                <h4 className="font-medium text-sm group-hover:text-primary transition">{news.title}</h4>
                            </article>
                        </Link>
                    ))}
                    {urgentNews.length === 0 && (
                        <p className="text-gray-500 text-sm">لا توجد أخبار عاجلة حالياً</p>
                    )}
                </div>
            </section>

            {/* Most Read */}
            <section className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-primary">
                <div className="flex items-center gap-3 mb-4">
                    <Icon name="ri-fire-line" size="xl" className="text-primary" />
                    <h3 className="text-lg font-bold">الأكثر قراءة</h3>
                </div>
                <div className="space-y-4">
                    {mostReadNews.map((news, index) => (
                        <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group">
                            <NewsCardSmall
                                title={news.title}
                                views={news.views}
                                rank={index + 1}
                                className="group-hover:bg-gray-50 transition-colors"
                            />
                        </Link>
                    ))}
                    {mostReadNews.length === 0 && (
                        <p className="text-gray-500 text-sm">لا توجد مقالات مميزة حالياً</p>
                    )}
                </div>
            </section>
        </aside>
    );
}

export default PublicSidebar;
