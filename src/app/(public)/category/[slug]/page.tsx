import type { Metadata } from 'next';
import { notFound } from "next/navigation";
import { getArticles, getImageUrl, formatTimeAgo } from "@/lib/api";
import { NewsCard } from "@/components/organisms";
import { Container, Button, Icon } from "@/components/atoms";
import { UrlPagination } from "@/components/molecules";
import Link from "next/link";

export const revalidate = 60;

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

const CATEGORY_NAMES: Record<string, string> = {
    politics: "السياسة",
    economy: "الاقتصاد",
    sports: "الرياضة",
    culture: "الثقافة",
    technology: "التكنولوجيا",
    society: "المجتمع",
    miscellaneous: "منوع",
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const categoryName = CATEGORY_NAMES[slug] || slug;

    return {
        title: `${categoryName} | صوت تهامة`,
        description: `آخر أخبار ${categoryName} من منصة صوت تهامة. أحدث المقالات والتقارير في قسم ${categoryName}.`,
        alternates: {
            canonical: `${siteUrl}/category/${slug}`,
        },
        openGraph: {
            title: `${categoryName} | صوت تهامة`,
            description: `آخر أخبار ${categoryName} من منصة صوت تهامة`,
            url: `${siteUrl}/category/${slug}`,
            type: 'website',
            locale: 'ar_YE',
            siteName: 'صوت تهامة',
        },
        twitter: {
            card: 'summary',
            title: `${categoryName} | صوت تهامة`,
            description: `آخر أخبار ${categoryName} من منصة صوت تهامة`,
        },
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;

    const categoryName = CATEGORY_NAMES[slug] || slug;

    // Fetch articles for this category
    const { data: articles, meta } = await getArticles({
        category: slug,
        page: page > 0 ? page : 1,
        perPage: 12,
        status: "PUBLISHED"
    });

    // CollectionPage JSON-LD Schema
    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryName,
        description: `آخر أخبار ${categoryName} من منصة صوت تهامة`,
        url: `${siteUrl}/category/${slug}`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'صوت تهامة',
            url: siteUrl,
        },
        numberOfItems: articles.length,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
            />

            <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
                <Container>
                    {/* Compact Category Header */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 sm:mb-8">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-secondary/5 rounded-full -ml-8 -mb-8" />
                        
                        <div className="relative px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0 transform -rotate-3">
                                    <Icon name="ri-price-tag-3-line" size="lg" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-primary text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">القسم</span>
                                        <div className="hidden sm:block h-px w-6 bg-gray-200" />
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{categoryName}</h1>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-gray-100">
                                <div className="text-center border-l border-gray-200 pl-3 md:pl-4 ml-3 md:ml-4 last:border-0 last:pl-0 last:ml-0">
                                    <span className="block text-base md:text-lg font-bold text-gray-900 leading-none mb-0.5">{meta?.totalItems || 0}</span>
                                    <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">مقال</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-base md:text-lg font-bold text-gray-900 leading-none mb-0.5">{meta?.totalPages || 0}</span>
                                    <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">صفحة</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Articles Grid */}
                    {articles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {articles.map((article: any, index: number) => (
                                    <div key={article.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                        <NewsCard
                                            id={article.id}
                                            title={article.title}
                                            excerpt={article.excerpt}
                                            category={article.category?.slug || slug}
                                            imageUrl={getImageUrl(article.imageUrl)}
                                            timeAgo={formatTimeAgo(article.publishedAt || article.createdAt)}
                                            readTime={article.readTime}
                                        />
                                    </div>
                                ))}
                            </div>

                            {meta && meta.totalPages > 1 && (
                                <div className="mt-12 pt-8 border-t border-gray-100">
                                    <UrlPagination currentPage={page} totalPages={meta.totalPages} />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 relative">
                                <Icon name="ri-article-line" size="3xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                    <Icon name="ri-close-line" className="text-red-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">لا توجد مقالات حالياً</h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">نحن نعمل بجد لتوفير أفضل المحتوى في هذا القسم. يرجى العودة لاحقاً أو استكشاف أقسام أخرى.</p>
                            <Link href="/">
                                <Button variant="primary" className="px-8 rounded-full h-12 shadow-lg shadow-primary/20">
                                    استكشف الرئيسية
                                    <Icon name="ri-arrow-left-line" className="mr-2" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </Container>
            </main>
        </>
    );
}
