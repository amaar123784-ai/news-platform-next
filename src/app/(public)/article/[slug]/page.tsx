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
import { SubscribeCTA } from '@/components/molecules/SubscribeCTA';
import { categoryBadges } from '@/design-system/tokens';

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

    const keywords = article.tags?.map((t: any) => t.tag?.name || t).filter(Boolean) || [];

    return {
        title: article.seoTitle || article.title,
        description: article.seoDesc || article.excerpt,
        keywords: keywords.length > 0 ? keywords : undefined,
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
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: article.title,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.excerpt,
            images: [ogImageUrl],
            creator: '@voiceoftihama',
            site: '@voiceoftihama',
        },
    };
}

export const revalidate = 60;

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;

    const [article, relatedArticles] = await Promise.all([
        getArticle(slug),
        getRelatedArticles(slug, 5), // Increased to 5 for better sidebar
    ]);

    if (!article) notFound();

    const categorySlug = article.category?.slug as any || 'politics';
    const categoryInfo = categoryBadges[categorySlug as keyof typeof categoryBadges] || categoryBadges.politics;
    const displayImageUrl = getImageUrl(article.imageUrl);

    const formatArticleDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-YE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';
    const absoluteImageUrl = displayImageUrl?.startsWith('http') ? displayImageUrl : `${siteUrl}${displayImageUrl}`;

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.excerpt,
        image: absoluteImageUrl ? [
            {
                '@type': 'ImageObject',
                url: absoluteImageUrl,
                width: 1200,
                height: 630
            }
        ] : undefined,
        datePublished: new Date(article.publishedAt || article.createdAt).toISOString(),
        dateModified: new Date(article.updatedAt).toISOString(),
        publisher: {
            '@type': 'NewsMediaOrganization',
            name: 'صوت تهامة',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/images/logo.webp`,
                width: 600,
                height: 60
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteUrl}/article/${slug}`,
        },
        articleSection: article.category?.name,
        wordCount: article.content?.split(/\s+/).length || 0,
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'الرئيسية',
                item: siteUrl,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: article.category?.name || 'أخبار',
                item: `${siteUrl}/category/${categorySlug}`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: article.title,
                item: `${siteUrl}/article/${slug}`,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            
            <div className="bg-white min-h-screen">
                {/* Unified Hero Section (Image Overlay) */}
                <div className="relative w-full min-h-[450px] md:min-h-[550px] lg:min-h-[650px] overflow-hidden group">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src={displayImageUrl}
                            alt={article.title}
                            fill
                            priority={true}
                            fetchPriority="high"
                            className="object-cover object-center transition-transform duration-[2000ms] group-hover:scale-105"
                            sizes="100vw"
                        />
                    </div>
                    
                    {/* Artistic Gradients & Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                    {/* Content Container */}
                    <div className="absolute inset-0 flex flex-col justify-end">
                        <div className="container mx-auto px-4 pb-12 md:pb-24 max-w-6xl">
                            <div className="animate-fade-in-up">
                                <Link href={`/category/${categorySlug}`} className="inline-block mb-6">
                                    <Badge category={categorySlug} className="text-xs uppercase tracking-[0.2em] px-5 py-2 shadow-lg border-white/20 hover:scale-105 transition-transform bg-white/10 backdrop-blur-md text-white border">
                                        {article.category?.name || categoryInfo.label}
                                    </Badge>
                                </Link>
                                
                                <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white mb-8 leading-[1.15] font-arabic max-w-5xl drop-shadow-2xl">
                                    {article.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6">
                                    <ArticleMeta
                                        date={formatArticleDate(article.publishedAt || article.createdAt)}
                                        views={article.views}
                                        readTime={article.readTime}
                                        size="md"
                                        className="bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/20 shadow-xl text-white font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="container mx-auto px-4 pb-20 pt-16">
                    <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">

                        {/* Main Content Column */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-12">
                                {/* Share Bar */}
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Icon name="ri-share-line" />
                                        <span>مشاركة المقال:</span>
                                    </div>
                                    <ShareButtons title={article.title} excerpt={article.excerpt} />
                                </div>

                                {/* Article Body */}
                                <div className="article-body">
                                    <ArticleContent content={article.content} />
                                </div>

                                {/* CONVERSION: Subscribe CTA */}
                                <div className="my-12">
                                    <SubscribeCTA />
                                </div>

                                {/* Tags Section */}
                                {article.tags && article.tags.length > 0 && (
                                    <div className="mt-12 pt-10 border-t border-gray-100">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="flex items-center gap-2 text-gray-900 font-bold bg-gray-100 px-3 py-1.5 rounded-lg text-sm">
                                                <Icon name="ri-price-tag-3-line" className="text-primary" />
                                                الكلمات المفتاحية:
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {article.tags.map((tagItem: any) => {
                                                    const tagSlug = tagItem.tag?.slug || tagItem.slug || tagItem;
                                                    const tagName = tagItem.tag?.name || tagItem.name || tagItem;
                                                    return (
                                                        <Link key={tagItem.tag?.id || tagItem.id || tagSlug} href={`/tag/${tagSlug}`}>
                                                            <Tag
                                                                className="hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer px-4 py-2 text-sm bg-white border-gray-200">
                                                                {tagName}
                                                            </Tag>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* INFINITE SCROLL: Read Next Articles */}
                            <div className="mt-12">
                                <ReadNextScroll currentArticleId={article.id} categoryId={article.category.id} />
                            </div>

                            {/* Comments Section */}
                            <div className="mt-12" id="comments">
                                <CommentSection articleId={article.id} />
                            </div>
                        </div>

                        {/* Sidebar / Related Articles */}
                        <aside className="lg:w-[380px] space-y-8">
                            {/* Related Articles Widget */}
                            {relatedArticles && relatedArticles.length > 0 && (
                                <section 
                                    className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 sticky top-28"
                                    aria-label="مقالات ذات صلة"
                                >
                                    <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-900 font-arabic">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <Icon name="ri-links-line" size="lg" />
                                            </div>
                                            <h3 className="font-black text-lg">قد يهمك أيضاً</h3>
                                        </div>
                                        <Link href={`/category/${categorySlug}`} className="text-primary hover:text-primary-dark text-xs font-bold transition-colors">
                                            عرض الكل
                                        </Link>
                                    </div>

                                    <div className="p-4 space-y-1">
                                        {relatedArticles.map((a: any) => (
                                            <Link key={a.id} href={`/article/${a.slug || a.id}`} className="block group p-3 rounded-xl hover:bg-primary/5 transition-colors">
                                                <article className="flex gap-4 items-start">
                                                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                                                        <Image
                                                            src={getImageUrl(a.imageUrl)}
                                                            alt=""
                                                            fill
                                                            sizes="80px"
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                            aria-hidden="true"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-relaxed mb-2">
                                                            {a.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-[11px] font-medium text-gray-400">
                                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md">
                                                                <Icon name="ri-time-line" size="sm" />
                                                                {formatTimeAgo(a.publishedAt || a.createdAt)}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md">
                                                                <Icon name="ri-eye-line" size="sm" />
                                                                {a.views?.toLocaleString('ar-YE')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </article>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Ad Space Placeholder */}
                            <div className="bg-primary/5 rounded-3xl p-8 text-center border border-dashed border-primary/20">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 uppercase tracking-widest">
                                    <Icon name="ri-advertisement-line" size="sm" />
                                    إعلان
                                </div>
                                <div className="h-64 bg-white/50 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 italic text-sm">
                                    مساحة إعلانية شاغرة
                                </div>
                            </div>
                        </aside>

                    </div>
                </main>
            </div>
        </>
    );
}
