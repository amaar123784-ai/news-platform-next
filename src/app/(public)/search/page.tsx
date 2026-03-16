import type { Metadata } from 'next';
import { getArticles, getImageUrl, formatTimeAgo } from "@/lib/api";
import { NewsCard } from "@/components/organisms";
import { Container, Icon, Button } from "@/components/atoms";
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

    let articles: any[] = [];
    let totalResults = 0;

    if (query) {
        const response = await getArticles({
            search: query,
            perPage: 12,
            status: "PUBLISHED"
        });
        articles = response.data;
        totalResults = response.meta?.totalItems || articles.length;
    }

    return (
        <>
            <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
                <Container>
                    {/* Hero Search Section */}
                    <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mt-32" />
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/5 rounded-full -mr-24 -mb-24" />
                        
                        <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 uppercase tracking-widest">
                                <Icon name="ri-search-eye-line" size="xs" />
                                محرك البحث
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-tight">عن ماذا تبحث اليوم؟</h1>
                            
                            <form action="/search" className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1 group">
                                    <Icon
                                        name="ri-search-line"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-xl"
                                    />
                                    <input
                                        type="text"
                                        name="q"
                                        defaultValue={query}
                                        placeholder="ابحث عن خبر، مقال، أو كاتب..."
                                        className="w-full h-14 pr-12 pl-6 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium text-gray-900 placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="primary" className="h-14 px-10 rounded-2xl text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                                    ابدأ البحث
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Results Area */}
                    {query ? (
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-primary">
                                        <Icon name="ri-list-check-2" size="lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">نتائج البحث عن: <span className="text-primary">&quot;{query}&quot;</span></h2>
                                        <p className="text-sm text-gray-500 mt-0.5">تم العثور على {totalResults} نتيجة مطابقة</p>
                                    </div>
                                </div>
                            </div>

                            {articles.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                    {articles.map((article: any, index: number) => (
                                        <div key={article.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                            <NewsCard
                                                id={article.id}
                                                title={article.title}
                                                excerpt={article.excerpt}
                                                category={article.category?.slug || "general"}
                                                imageUrl={getImageUrl(article.imageUrl)}
                                                timeAgo={formatTimeAgo(article.publishedAt || article.createdAt)}
                                                readTime={article.readTime}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 relative">
                                        <Icon name="ri-search-2-line" size="3xl" />
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                            <Icon name="ri-question-mark" className="text-primary" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">عذراً، لم نجد أي نتائج</h3>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">تأكد من كتابة الكلمات بشكل صحيح، أو جرب استخدام كلمات مفتاحية أخرى أكثر عمومية.</p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <Button variant="secondary" className="rounded-xl px-6" onClick={() => {}}>تغيير كلمات البحث</Button>
                                        <Link href="/">
                                            <Button variant="primary" className="rounded-xl px-6 shadow-md shadow-primary/10">العودة للرئيسية</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto py-12">
                            {/* Tips for searching */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                                    <Icon name="ri-lightbulb-line" size="xl" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">استخدم كلمات واضحة</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">كلما كانت الكلمات أكثر تحديداً كلما حصلت على نتائج أفضل وأكثر دقة لما تبحث عنه.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
                                    <Icon name="ri-user-search-line" size="xl" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">ابحث عن الكتاب</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">يمكنك البحث عن مقالات كاتب معين بكتابة اسمه الكامل في محرك البحث.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                                    <Icon name="ri-history-line" size="xl" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">تصفح الأرشيف</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">نظام البحث يغطي جميع المقالات المنشورة منذ تأسيس المنصة وحتى اليوم.</p>
                            </div>
                        </div>
                    )}
                </Container>
            </main>
        </>
    );
}
