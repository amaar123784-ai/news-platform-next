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
import { CommentSection } from '@/components/organisms/CommentSection';
import { ArticleContent } from "@/components/organisms/ArticleContent";
import { ReadNextScroll } from '@/components/article/ReadNextScroll';
import { ViewTracker } from '@/components/article/ViewTracker';
import { SubscribeCTA } from '@/components/molecules/SubscribeCTA';
import { categoryBadges } from '@/design-system/tokens';
import ArticleJsonLd from '@/components/article/ArticleJsonLd';

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

    const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent(article.title)}&category=${encodeURIComponent(article.category?.name || 'أخبار')}${absoluteImageUrl ? `&imageUrl=${encodeURIComponent(absoluteImageUrl)}` : ''}`;

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
            images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.excerpt,
            images: [ogImageUrl],
        },
    };
}

export const revalidate = 60;

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;

    const [article, relatedArticles] = await Promise.all([
        getArticle(slug),
        getRelatedArticles(slug, 4),
    ]);

    if (!article) notFound();

    const categorySlug = article.category?.slug as any || 'politics';
    const displayImageUrl = getImageUrl(article.imageUrl);

    const formatArticleDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-YE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="bg-white min-h-screen">
            <ArticleJsonLd article={article} />
            {/* Main Layout Container */}
            <main className="container mx-auto px-4 py-8 lg:py-12">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16">
                    
                    {/* 70% Content Area: Distraction-Free Reading */}
                    <div className="lg:w-[70%] min-w-0">
                        <article>
                            {/* 1. Featured Image (Full width, responsive) */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-sm bg-gray-50 mb-10">
                                <Image
                                    src={displayImageUrl}
                                    alt={article.title}
                                    fill
                                    priority={true}
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 850px"
                                />
                            </div>

                            {/* 1. Category & Title (Stacking Order) */}
                            <header className="mb-8">
                                <ViewTracker slug={article.slug} />
                                <Link href={`/category/${categorySlug}`} className="inline-block mb-4">
                                    <Badge category={categorySlug} className="text-xs font-bold px-3 py-1 uppercase tracking-widest transition-transform hover:scale-105">
                                        {article.category?.name || 'أخبار'}
                                    </Badge>
                                </Link>
                                
                                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight font-arabic">
                                    {article.title}
                                </h1>

                                {/* 3. Metadata: Elegant Author & Date Row */}
                                <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-gray-500 text-sm md:text-base border-b border-gray-100 pb-8">
                                    <ArticleMeta
                                        date={formatArticleDate(article.publishedAt || article.createdAt)}
                                        views={article.views}
                                        readTime={article.readTime}
                                        size="md"
                                    />
                                    
                                    <div className="mr-auto">
                                        <ShareButtons title={article.title} excerpt={article.excerpt} />
                                    </div>
                                </div>
                            </header>

                            {/* 4. Article Body: Premium Typography */}
                            <div className="article-content max-w-none">
                                <ArticleContent content={article.content} className="md:prose-xl" />
                            </div>

                            {/* Engagement & Conversion */}
                            <div className="my-16 border-y border-gray-100 py-12">
                                <SubscribeCTA />
                            </div>

                            {/* Tags Section */}
                            {article.tags && article.tags.length > 0 && (
                                <footer className="mb-16">
                                    <div className="flex items-center gap-3 mb-4 text-gray-900 font-bold text-sm">
                                        <Icon name="ri-price-tag-3-line" className="text-primary" />
                                        <span>الكلمات المفتاحية:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {article.tags.map((tagItem: any) => {
                                            const tagSlug = tagItem.tag?.slug || tagItem.slug || tagItem;
                                            const tagName = tagItem.tag?.name || tagItem.name || tagItem;
                                            return (
                                                <Link key={tagItem.tag?.id || tagItem.id || tagSlug} href={`/tag/${tagSlug}`}>
                                                    <Tag className="hover:bg-primary hover:text-white transition-all cursor-pointer bg-gray-50 border-gray-100 text-gray-600 px-4 py-2">
                                                        {tagName}
                                                    </Tag>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </footer>
                            )}

                            {/* INFINITE SCROLL: Next Read */}
                            <ReadNextScroll currentArticleId={article.id} categoryId={article.category.id} />

                            {/* Comments */}
                            <div id="comments" className="mt-12 bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
                                <CommentSection articleId={article.id} />
                            </div>
                        </article>
                    </div>

                    {/* 30% Sidebar Area */}
                    <aside className="lg:w-[30%] space-y-10">
                        {/* Related Articles Sticky Sidebar */}
                        {relatedArticles && relatedArticles.length > 0 && (
                            <div className="sticky top-28 space-y-8">
                                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-primary rounded-full" />
                                            مقالات ذات صلة
                                        </h3>
                                        <Link href={`/category/${categorySlug}`} className="text-xs text-primary font-bold hover:underline">
                                            المزيد
                                        </Link>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {relatedArticles.map((a: any) => (
                                            <Link key={a.id} href={`/article/${a.slug || a.id}`} className="group flex gap-4 items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={getImageUrl(a.imageUrl)}
                                                        alt=""
                                                        fill
                                                        sizes="80px"
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                                        {a.title}
                                                    </h4>
                                                    <span className="text-[11px] text-gray-400 mt-1 block">
                                                        {formatTimeAgo(a.publishedAt || a.createdAt)}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>

                                {/* Sidebar Ad Space */}
                                <div className="bg-gray-50 rounded-2xl p-8 border border-dashed border-gray-200 text-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">إعلان</span>
                                    <div className="h-60 flex items-center justify-center text-gray-300 italic text-sm">
                                        مساحة إعلانية
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>

                </div>
            </main>
        </div>
    );
}
