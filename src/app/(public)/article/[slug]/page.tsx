import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getArticle, getRelatedArticles, formatDate, formatTimeAgo, getImageUrl } from '@/lib/api';
import { Badge } from '@/components/atoms/Badge';
import { Tag } from '@/components/atoms/Tag';
import { Icon } from '@/components/atoms/Icon';
import { ArticleMeta } from '@/components/molecules/ArticleMeta';
import { ShareButtons } from '@/components/molecules/ShareButtons';
import { AuthorCard } from '@/components/organisms/AuthorCard';
import { CommentSection } from '@/components/organisms/CommentSection';
import { ArticleContent } from "@/components/organisms/ArticleContent";
import { categoryBadges } from '@/design-system/tokens';

// Fallback image
import fallbackImg from '@/image/79c82bf90ef6d83cfcc8af5f94b6f09a.jpg';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) return { title: 'المقال غير موجود' };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';
    const imageUrl = getImageUrl(article.imageUrl);
    const absoluteImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`;

    return {
        title: article.seoTitle || article.title,
        description: article.seoDesc || article.excerpt,
        alternates: {
            canonical: `${siteUrl}/article/${slug}`,
        },
        openGraph: {
            title: article.title,
            description: article.excerpt,
            url: `${siteUrl}/article/${slug}`,
            siteName: 'صوت تهامة',
            type: 'article',
            publishedTime: article.publishedAt || article.createdAt,
            modifiedTime: article.updatedAt,
            authors: [article.author?.name || 'صوت تهامة'],
            images: absoluteImageUrl ? [
                {
                    url: absoluteImageUrl,
                    width: 1200,
                    height: 630,
                    alt: article.title,
                }
            ] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.excerpt,
            images: absoluteImageUrl ? [absoluteImageUrl] : [],
            creator: '@voiceoftihama',
            site: '@voiceoftihama',
        },
    };
}

export const revalidate = 60;

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;

    // Fetch data
    const [article, relatedArticles] = await Promise.all([
        getArticle(slug),
        getRelatedArticles(slug, 3),
    ]);

    if (!article) notFound();

    const categorySlug = article.category?.slug as any || 'politics';
    const categoryInfo = categoryBadges[categorySlug as keyof typeof categoryBadges] || categoryBadges.politics;
    const displayImageUrl = getImageUrl(article.imageUrl);

    // Format helpers
    const formatArticleDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-YE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // JSON-LD structured data for SEO
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.excerpt,
        image: displayImageUrl ? [displayImageUrl] : undefined,
        datePublished: article.publishedAt || article.createdAt,
        dateModified: article.updatedAt,
        author: {
            '@type': 'Person',
            name: article.author?.name || 'المحرر',
        },
        publisher: {
            '@type': 'NewsMediaOrganization',
            name: 'صوت تهامة',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/images/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteUrl}/article/${slug}`,
        },
        articleSection: article.category?.name,
        wordCount: article.content?.split(/\s+/).length || 0,
    };

    return (
        <>
            {/* JSON-LD Schema for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <div className="bg-gray-50 min-h-screen py-8">
                <main className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">

                        {/* Main Content Column */}
                        <div className="flex-1 min-w-0">
                            <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                                <div className="p-6 md:p-10">
                                    {/* Main Article Image (Top) */}
                                    <div className="mb-8">
                                        <img
                                            src={displayImageUrl}
                                            alt={article.title}
                                            className="w-full h-auto rounded-xl shadow-sm"
                                        />
                                    </div>

                                    {/* Header: Category & Title (Below Image) */}
                                    <div className="mb-8">
                                        <Link href={`/category/${categorySlug}`}>
                                            <Badge category={categorySlug} className="mb-4 text-sm px-3 py-1">
                                                {article.category?.name || categoryInfo.label}
                                            </Badge>
                                        </Link>

                                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight font-arabic">
                                            {article.title}
                                        </h1>

                                        {/* Author & Meta */}
                                        <div className="flex flex-wrap items-center gap-6 text-gray-500 text-sm pb-6 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                {article.author?.avatar ? (
                                                    <Image
                                                        src={getImageUrl(article.author.avatar)}
                                                        alt={article.author.name}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <Icon name="ri-user-line" size="sm" />
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-900">{article.author?.name || 'المحرر'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Icon name="ri-calendar-line" />
                                                <time>{formatArticleDate(article.publishedAt || article.createdAt)}</time>
                                            </div>
                                            <ArticleMeta
                                                views={article.views}
                                                readTime={article.readTime}
                                                size="sm"
                                                className="!gap-6"
                                            />
                                        </div>
                                    </div>

                                    {/* Share & Content */}
                                    <div className="mb-8 flex justify-end border-b border-gray-100 pb-4">
                                        <ShareButtons title={article.title} excerpt={article.excerpt} />
                                    </div>

                                    <ArticleContent content={article.content} />

                                    {/* Tags */}
                                    {article.tags && article.tags.length > 0 && (
                                        <div className="mt-10 pt-8 border-t border-gray-100">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="flex items-center gap-2 text-primary font-bold">
                                                    <Icon name="ri-price-tag-3-line" />
                                                    الوسوم:
                                                </span>
                                                {article.tags.map((tagItem: any) => (
                                                    <Tag key={tagItem.tag?.id || tagItem.name}
                                                        className="hover:bg-primary hover:text-white transition-colors cursor-pointer px-4 py-1.5 text-sm bg-gray-50 border-transparent">
                                                        {tagItem.tag?.name || tagItem}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </article>

                            {/* Author Card */}
                            {article.author && (
                                <div className="mt-8">
                                    <AuthorCard
                                        name={article.author.name}
                                        role="كاتب"
                                        bio={article.author.bio || ''}
                                        imageUrl={article.author.avatar ? getImageUrl(article.author.avatar) : undefined}
                                        articleCount={0}
                                        profileUrl={`/author/${article.author.id}`}
                                        className="border-none shadow-sm ring-1 ring-gray-100"
                                    />
                                </div>
                            )}

                            {/* Comments Section */}
                            <div className="mt-8">
                                <CommentSection articleId={article.id} />
                            </div>
                        </div>

                        {/* Sidebar / Related Articles */}
                        <aside className="lg:w-[350px] space-y-8">
                            {/* Related Articles Widget */}
                            {relatedArticles && relatedArticles.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm p-6 ring-1 ring-gray-100 sticky top-24">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
                                            مقالات ذات صلة
                                        </h3>
                                        <Link href={`/category/${categorySlug}`} className="text-primary text-sm hover:underline">
                                            المزيد
                                        </Link>
                                    </div>

                                    <div className="grid gap-6">
                                        {relatedArticles.map((a: any) => (
                                            <Link key={a.id} href={`/article/${a.slug || a.id}`} className="group flex gap-4 items-start">
                                                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={getImageUrl(a.imageUrl)}
                                                        alt={a.title}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Badge category={a.category?.slug as any || 'politics'} className="mb-2 text-[10px] px-2 py-0.5">
                                                        {a.category?.name || 'أخبار'}
                                                    </Badge>
                                                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-relaxed mb-1">
                                                        {a.title}
                                                    </h4>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Icon name="ri-time-line" size="sm" />
                                                        {formatTimeAgo(a.publishedAt || a.createdAt)}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ad Space Placeholder */}
                            <div className="bg-primary/5 rounded-xl p-6 text-center border border-dashed border-primary/20">
                                <span className="text-primary font-medium block mb-2">إعلان تجاري</span>
                                <div className="h-48 bg-white/50 rounded-lg flex items-center justify-center text-gray-400">
                                    مساحة إعلانية
                                </div>
                            </div>
                        </aside>

                    </div>
                </main>
            </div>
        </>
    );
}
