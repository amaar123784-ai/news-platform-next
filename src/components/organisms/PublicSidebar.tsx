"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/atoms";
import { NewsCardSmall } from "@/components/molecules";
import type { Article } from "@/lib/api";
import { formatTimeAgo } from "@/utils/date";

interface PublicSidebarProps {
    urgentNews: Article[];
    mostReadNews: Article[];
}

// Helper to resolve image URLs
function getImageUrl(imageUrl?: string) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${imageUrl}`;
}

export function PublicSidebar({ urgentNews, mostReadNews }: PublicSidebarProps) {
    return (
        <aside className="space-y-5 lg:sticky lg:top-28" aria-label="الشريط الجانبي">

            {/* ===== أخبار عاجلة ===== */}
            <section
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100/60"
                aria-label="أخبار عاجلة"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-l from-primary to-sky-600 px-5 py-3.5 flex items-center gap-3 overflow-hidden">
                    <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
                    <div className="absolute left-8 -bottom-6 w-12 h-12 bg-white/5 rounded-full" />
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon name="ri-notification-3-line" size="lg" className="text-white" />
                    </div>
                    <h3 className="text-white font-bold text-sm relative z-10">أخبار عاجلة</h3>
                    <span className="mr-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>

                <div className="p-3">
                    {urgentNews.slice(0, 5).map((news, index) => {
                        const imgUrl = getImageUrl(news.imageUrl);
                        return (
                            <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group">
                                <article className="flex gap-3 py-3 px-2 border-b border-gray-50 last:border-b-0 hover:bg-primary/[0.03] rounded-lg transition-colors">
                                    {/* Thumbnail */}
                                    {imgUrl && (
                                        <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            <Image
                                                src={imgUrl}
                                                alt={news.title}
                                                fill
                                                sizes="64px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-[13px] leading-relaxed text-gray-800 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                                            {news.title}
                                        </h4>
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <Icon name="ri-time-line" size="sm" />
                                            {formatTimeAgo(news.publishedAt || news.createdAt)}
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        );
                    })}
                    {urgentNews.length === 0 && (
                        <p className="text-gray-400 text-sm py-6 text-center">لا توجد أخبار عاجلة حالياً</p>
                    )}
                </div>
            </section>

            {/* ===== الأكثر قراءة ===== */}
            <section
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100/60"
                aria-label="الأكثر قراءة"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-l from-secondary to-emerald-600 px-5 py-3.5 flex items-center gap-3 overflow-hidden">
                    <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
                    <div className="absolute left-8 -bottom-6 w-12 h-12 bg-white/5 rounded-full" />
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon name="ri-fire-line" size="lg" className="text-white" />
                    </div>
                    <h3 className="text-white font-bold text-sm relative z-10">الأكثر قراءة</h3>
                </div>

                <div className="p-3" role="list">
                    {mostReadNews.map((news, index) => {
                        const imgUrl = getImageUrl(news.imageUrl);
                        return (
                            <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group" role="listitem">
                                <article className="flex gap-3 py-3 px-2 border-b border-gray-50 last:border-b-0 hover:bg-secondary/[0.03] rounded-lg transition-colors">
                                    {/* Rank Number */}
                                    <span className={`
                                        flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 mt-0.5
                                        ${index === 0
                                            ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                                            : index === 1
                                                ? 'bg-secondary/20 text-secondary'
                                                : index === 2
                                                    ? 'bg-secondary/10 text-secondary'
                                                    : 'bg-gray-100 text-gray-500'
                                        }
                                    `}>
                                        {index + 1}
                                    </span>

                                    {/* Thumbnail */}
                                    {imgUrl && (
                                        <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            <Image
                                                src={imgUrl}
                                                alt={news.title}
                                                fill
                                                sizes="64px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-[13px] leading-relaxed text-gray-800 group-hover:text-secondary transition-colors line-clamp-2 mb-1">
                                            {news.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                            {news.views !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <Icon name="ri-eye-line" size="sm" />
                                                    {news.views.toLocaleString('ar-YE')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        );
                    })}
                    {mostReadNews.length === 0 && (
                        <p className="text-gray-400 text-sm py-6 text-center">لا توجد مقالات مميزة حالياً</p>
                    )}
                </div>
            </section>
        </aside>
    );
}

export default PublicSidebar;
