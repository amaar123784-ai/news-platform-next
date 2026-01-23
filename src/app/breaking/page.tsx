import { Header, Footer } from "@/components/organisms";
import { NewsCard } from "@/components/organisms/NewsCard";
import { Container } from "@/components/atoms";
import { getBreakingNews, getImageUrl, formatTimeAgo } from "@/lib/api";

export const metadata = {
    title: "أخبار عاجلة | صوت تهامة",
    description: "تابع آخر الأخبار العاجلة والأحداث المهمة في اليمن والعالم لحظة بلحظة.",
};

export default async function BreakingNewsPage() {
    const breakingNews = await getBreakingNews();

    return (
        <>
            <Header />
            <main className="min-h-screen bg-white">
                <div className="bg-red-50 border-b border-red-100 py-12">
                    <Container>
                        <h1 className="text-3xl font-black text-red-700 mb-4 flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full bg-red-600 animate-pulse"></span>
                            أخبار عاجلة
                        </h1>
                        <p className="text-lg text-red-900/70 max-w-2xl">
                            تغطية مباشرة ومستمرة للأحداث الأكثر أهمية وتأثيراً.
                        </p>
                    </Container>
                </div>

                <Container className="py-12">
                    {breakingNews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {breakingNews.map((article: any, idx: number) => (
                                <NewsCard
                                    key={article.id || idx}
                                    id={article.id}
                                    title={article.title}
                                    excerpt={article.excerpt || ''}
                                    imageUrl={getImageUrl(article.imageUrl)}
                                    category={article.category?.slug || 'politics'}
                                    timeAgo={formatTimeAgo(article.createdAt)}
                                    author={article.author?.name}
                                    isBreaking={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-gray-500 text-lg">لا توجد أخبار عاجلة في الوقت الحالي.</p>
                        </div>
                    )}
                </Container>
            </main>
            <Footer />
        </>
    );
}
