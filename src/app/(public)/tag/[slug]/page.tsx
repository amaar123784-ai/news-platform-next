import type { Metadata } from 'next';
import { getArticles, getImageUrl, formatTimeAgo } from "@/lib/api";
import { NewsCard } from "@/components/organisms";
import { Container, Button, Icon } from "@/components/atoms";
import { UrlPagination } from "@/components/molecules";
import Link from "next/link";

export const revalidate = 60;

interface TagPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

const TAG_DISPLAY_NAMES: Record<string, string> = {
    'tihama-issue': 'القضية التهامية',
    'tihama-movement': 'الحراك التهامي',
    'tihama-oppression': 'المظلومية التهامية',
    'yemen-news': 'أخبار اليمن',
};

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
    const { slug } = await params;
    const tagName = TAG_DISPLAY_NAMES[slug] || decodeURIComponent(slug).replace(/-/g, ' ');

    return {
        title: `موضوع: ${tagName} | صوت تهامة`,
        description: `أحدث المقالات والتقارير المتعلقة بـ ${tagName} على منصة صوت تهامة.`,
        alternates: {
            canonical: `${siteUrl}/tag/${slug}`,
        },
        openGraph: {
            title: `${tagName} | صوت تهامة`,
            description: `تغطية شاملة لموضوع ${tagName}`,
            url: `${siteUrl}/tag/${slug}`,
            type: 'website',
            locale: 'ar_YE',
            siteName: 'صوت تهامة',
        },
    };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;

    const tagName = TAG_DISPLAY_NAMES[slug] || decodeURIComponent(slug).replace(/-/g, ' ');

    // Fetch articles for this tag
    const { data: articles, meta } = await getArticles({
        tag: slug,
        page: page > 0 ? page : 1,
        perPage: 12,
        status: "PUBLISHED"
    });

    // CollectionPage JSON-LD Schema
    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: tagName,
        description: `تغطية شاملة ومقالات عن ${tagName} في اليمن`,
        url: `${siteUrl}/tag/${slug}`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'صوت تهامة',
            url: siteUrl,
        },
        about: {
            '@type': 'Thing',
            name: tagName
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
            />

            <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
                <Container>
                    {/* Enhanced Tag Header */}
                    <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8 sm:mb-12 border-r-8 border-primary">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                        
                        <div className="relative px-6 py-8 sm:px-10 sm:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5 sm:gap-6">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0 transform rotate-3">
                                    <Icon name="ri-price-tag-3-line" size="2xl" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">موضوع</span>
                                        <div className="h-px w-8 bg-gray-200" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-none">{tagName}</h1>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 self-start md:self-auto">
                                <div className="text-center">
                                    <span className="block text-xl font-bold text-gray-900 leading-none mb-1">{meta?.totalItems || 0}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">مقال مرتبط</span>
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
                                            category={article.category?.slug || 'news'}
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
                                <Icon name="ri-price-tag-3-line" size="3xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                    <Icon name="ri-close-line" className="text-red-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">لا توجد نتائج</h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">لم يتم العثور على أي مقالات مرتبطة بهذا الموضوع حالياً.</p>
                            <Link href="/">
                                <Button variant="primary" className="px-8 rounded-full h-12 shadow-lg shadow-primary/20">
                                    العودة للرئيسية
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
