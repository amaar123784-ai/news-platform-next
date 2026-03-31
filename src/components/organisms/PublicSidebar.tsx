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
                            <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg mb-2 last:mb-0 min-h-[44px]">
                                <article className="flex gap-3 py-3 px-3 border-b border-gray-100 last:border-b-0 hover:bg-primary/5 rounded-lg transition-colors">
                                    {/* Thumbnail */}
                                    {imgUrl && (
                                        <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                            <Image
                                                src={imgUrl}
                                                alt=""
                                                fill
                                                sizes="80px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold text-[14px] leading-tight text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                                            {news.title}
                                        </h4>
                                        <span className="text-[12px] text-gray-600 font-medium flex items-center gap-1.5">
                                            <Icon name="ri-time-line" size="sm" className="text-primary" />
                                            {formatTimeAgo(news.publishedAt || news.createdAt)}
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        );
                    })}
                    {urgentNews.length === 0 && (
                        <p className="text-gray-600 font-bold text-sm py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد أخبار عاجلة حالياً</p>
                    )}
                </div>
            </section>

            {/* ===== الأكثر قراءة ===== */}
            <section
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200"
                aria-label="الأكثر قراءة"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-l from-emerald-600 to-emerald-800 px-5 py-4 flex items-center gap-3 overflow-hidden">
                    <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
                    <div className="absolute left-8 -bottom-6 w-12 h-12 bg-white/5 rounded-full" />
                    <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon name="ri-fire-line" size="lg" className="text-white" />
                    </div>
                    <h3 className="text-white font-black text-base relative z-10 tracking-tight">الأكثر قراءة</h3>
                </div>

                <div className="p-3" role="list">
                    {mostReadNews.map((news, index) => {
                        const imgUrl = getImageUrl(news.imageUrl);
                        return (
                            <Link key={news.id} href={`/article/${news.slug || news.id}`} className="block group outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg mb-2 last:mb-0 min-h-[44px]" role="listitem">
                                <article className="flex gap-3 py-3 px-3 border-b border-gray-100 last:border-b-0 hover:bg-secondary/5 rounded-lg transition-colors">
                                    {/* Rank Number */}
                                    <span className={`
                                        flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black shrink-0 mt-0.5
                                        ${index === 0
                                            ? 'bg-secondary text-white shadow-md shadow-secondary/30'
                                            : index === 1
                                                ? 'bg-secondary/20 text-secondary'
                                                : index === 2
                                                    ? 'bg-secondary/10 text-secondary'
                                                    : 'bg-gray-100 text-gray-700'
                                        }
                                    `}>
                                        {index + 1}
                                    </span>

                                    {/* Thumbnail */}
                                    {imgUrl && (
                                        <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                            <Image
                                                src={imgUrl}
                                                alt={news.title}
                                                fill
                                                sizes="80px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold text-[14px] leading-tight text-gray-900 group-hover:text-secondary transition-colors line-clamp-2 mb-1.5">
                                            {news.title}
                                        </h4>
                                        <div className="flex items-center gap-4 text-[12px] text-gray-600 font-medium">
                                            {news.views !== undefined && (
                                                <span className="flex items-center gap-1.5">
                                                    <Icon name="ri-eye-line" size="sm" className="text-secondary" />
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
