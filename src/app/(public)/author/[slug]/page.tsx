import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from "next/navigation";
import { getArticles } from "@/lib/api";
import { NewsCard } from "@/components/organisms";
import { Container, Button, Icon } from "@/components/atoms";
import { UrlPagination } from "@/components/molecules";
import Link from "next/link";

export const revalidate = 60;

interface AuthorPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
    const { slug } = await params;
    
    // Fetch one article to get author metadata (assuming slug works or id is slug)
    const { data: articles } = await getArticles({ authorId: slug, perPage: 1, status: "PUBLISHED" });
    const authorName = articles[0]?.author?.name || 'محرر';
    
    return {
        title: `مقالات ${authorName} | صوت تهامة`,
        description: `جميع المقالات والتقارير المنشورة بواسطة ${authorName} على منصة صوت تهامة.`,
        alternates: {
            canonical: `${siteUrl}/author/${slug}`,
        },
        openGraph: {
            title: `مقالات ${authorName} | صوت تهامة`,
            description: `جميع المقالات والتقارير المنشورة بواسطة ${authorName}`,
            url: `${siteUrl}/author/${slug}`,
            type: 'profile',
            locale: 'ar_YE',
            siteName: 'صوت تهامة',
        },
    };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;

    // Fetch articles for this author
    const { data: articles, meta } = await getArticles({
        authorId: slug,
        page: page > 0 ? page : 1,
        perPage: 12,
        status: "PUBLISHED"
    });

    if (articles.length === 0 && page === 1) {
        notFound();
    }

    const author = articles[0]?.author;
    const authorName = author?.name || 'محرر';

    // JSON-LD for E-E-A-T
    const profileSchema = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        'mainEntity': {
            '@type': 'Person',
            'name': authorName,
            'description': author?.bio || `الكاتب والمحرر في منصة صوت تهامة`,
            'jobTitle': 'صحفي',
            'url': `${siteUrl}/author/${slug}`,
            'image': author?.avatar ? author.avatar : undefined,
            'knowsAbout': ['القضية التهامية', 'أخبار اليمن', 'الحراك التهامي']
        }
    };

    return (
        <>
            {/* ProfilePage JSON-LD for E-E-A-T */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
            />
            <main className="min-h-screen bg-gray-50 py-6 sm:py-8">
            <Container>
                {/* Author Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0 overflow-hidden relative">
                            {author?.avatar ? (
                                <Image
                                    src={author.avatar}
                                    alt={authorName}
                                    fill
                                    sizes="(max-width: 640px) 64px, 80px"
                                    className="object-cover"
                                />
                            ) : (
                                <Icon name="ri-user-line" size="2xl" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{authorName}</h1>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                {author?.bio || `الكاتب والمحرر في منصة صوت تهامة`}
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
                                    author={authorName}
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
                        <p className="text-gray-500 mb-6">لم يتم العثور على أي مقالات.</p>
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
