"use client";

import Link from "next/link";
import { Icon } from "@/components/atoms";
import { NewsCardSmall } from "@/components/molecules";
import type { Article } from "@/lib/api";
import { formatTimeAgo } from "@/utils/date";

interface PublicSidebarProps {
    urgentNews: Article[];
    mostReadNews: Article[];
}

export function PublicSidebar({ urgentNews, mostReadNews }: PublicSidebarProps) {
    return (
        <aside className="space-y-5 lg:sticky lg:top-28" aria-label="الشريط الجانبي">

            {/* Urgent News — Red accent */}
            <section
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100/60"
                aria-label="أخبار عاجلة"
            >
                {/* Red accent header */}
                <div className="bg-gradient-to-l from-red-500 to-red-600 px-5 py-3 flex items-center gap-2.5">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <Icon name="ri-notification-3-line" size="lg" className="text-white" />
                    <h3 className="text-white font-bold text-sm">أخبار عاجلة</h3>
                </div>

                <div className="p-4 space-y-0">
                    {urgentNews.slice(0, 5).map((news) => (
                        <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group">
                            <article className="py-3 border-b border-gray-100/60 last:border-b-0 px-1 hover:bg-red-50/40 rounded transition-colors">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                    <span className="text-[11px] text-red-500 font-medium">
                                        {formatTimeAgo(news.publishedAt || news.createdAt)}
                                    </span>
                                </div>
                                <h4 className="font-medium text-sm group-hover:text-red-600 transition-colors line-clamp-2 leading-relaxed text-gray-800">
                                    {news.title}
                                </h4>
                            </article>
                        </Link>
                    ))}
                    {urgentNews.length === 0 && (
                        <p className="text-gray-400 text-sm py-4 text-center">لا توجد أخبار عاجلة حالياً</p>
                    )}
                </div>
            </section>

            {/* Most Read — Amber/Primary accent */}
            <section
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100/60"
                aria-label="الأكثر قراءة"
            >
                {/* Amber accent header */}
                <div className="bg-gradient-to-l from-amber-500 to-orange-500 px-5 py-3 flex items-center gap-2.5">
                    <Icon name="ri-fire-line" size="lg" className="text-white" />
                    <h3 className="text-white font-bold text-sm">الأكثر قراءة</h3>
                </div>

                <div className="p-4 space-y-0" role="list">
                    {mostReadNews.map((news, index) => (
                        <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group" role="listitem">
                            <NewsCardSmall
                                title={news.title}
                                views={news.views}
                                rank={index + 1}
                                className="group-hover:bg-amber-50/40 transition-colors"
                            />
                        </Link>
                    ))}
                    {mostReadNews.length === 0 && (
                        <p className="text-gray-400 text-sm py-4 text-center">لا توجد مقالات مميزة حالياً</p>
                    )}
                </div>
            </section>
        </aside>
    );
}

export default PublicSidebar;
