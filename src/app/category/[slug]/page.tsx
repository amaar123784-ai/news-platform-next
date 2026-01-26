import type { Metadata } from 'next';
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getArticles } from "@/lib/api";
import { NewsCard } from "@/components/organisms";
import { Header, Footer } from "@/components/organisms";
import { Container, Button, Icon } from "@/components/atoms";
import Link from "next/link";

export const revalidate = 60;

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
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

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const categoryName = CATEGORY_NAMES[slug] || slug;

    // Fetch articles for this category
    const { data: articles } = await getArticles({
        category: slug,
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
            {/* CollectionPage JSON-LD Schema for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
            />
            <Header />
            <main className="min-h-screen bg-gray-50 py-8">
                <Container>
                    {/* Category Header */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <Icon name="ri-price-tag-3-line" size="xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    تصفح جميع الأخبار والمقالات المتعلقة بـ {categoryName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Articles Grid */}
                    {articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article: any) => (
                                <NewsCard
                                    key={article.id}
                                    id={article.id}
                                    title={article.title}
                                    excerpt={article.excerpt}
                                    category={article.category?.slug || slug}
                                    imageUrl={article.imageUrl?.startsWith('http') ? article.imageUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:5000'}${article.imageUrl || '/images/placeholder.jpg'}`}
                                    author={article.author?.name || "المحرر"}
                                    timeAgo={new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-YE')}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Icon name="ri-article-line" size="2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد مقالات</h3>
                            <p className="text-gray-500 mb-6">لم يتم نشر أي مقالات في هذا القسم بعد.</p>
                            <Link href="/">
                                <Button variant="primary">العودة للرئيسية</Button>
                            </Link>
                        </div>
                    )}
                </Container>
            </main>
            <Footer />
        </>
    );
}
