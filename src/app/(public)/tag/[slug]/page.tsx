import type { Metadata } from 'next';
import { getArticles } from "@/lib/api";
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

// Common Arabic names for slugs if applicable
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
            {/* CollectionPage JSON-LD Schema for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
            />

            <main className="min-h-screen bg-gray-50 py-6 sm:py-8">
                <Container>
                    {/* Tag Header */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-4 border-r-4 border-primary">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                <Icon name="ri-price-tag-3-line" size="xl" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">موضوع: {tagName}</h1>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                    تصفح جميع الأخبار والتقارير المتعلقة بـ {tagName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Articles Grid */}
                    {articles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {articles.map((article: any) => (
                                    <NewsCard
                                        key={article.id}
                                        id={article.id}
                                        title={article.title}
                                        excerpt={article.excerpt}
                                        category={article.category?.slug || 'news'}
                                        imageUrl={article.imageUrl?.startsWith('http') ? article.imageUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000'}${article.imageUrl || '/images/placeholder.jpg'}`}
                                        author={article.author?.name || "المحرر"}
                                        timeAgo={new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-YE')}
                                    />
                                ))}
                            </div>

                            {meta && meta.totalPages > 1 && (
                                <div className="mt-8 pb-4">
                                    <UrlPagination currentPage={page} totalPages={meta.totalPages} />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Icon name="ri-article-line" size="2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد مقالات</h3>
                            <p className="text-gray-500 mb-6">لم يتم العثور على أي مقالات بهذا الوسم.</p>
                            <Link href="/">
                                <Button variant="primary">العودة للرئيسية</Button>
                            </Link>
                        </div>
                    )}
                </Container>
            </main>
        </>
    );
}
