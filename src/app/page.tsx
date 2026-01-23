import { getFeaturedArticles, getArticles, getCategories, getBreakingNews } from "@/lib/api";
import { HomeContent } from "@/components/HomeContent";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { BreakingNewsTicker } from "@/components/organisms/BreakingNewsTicker";

export const revalidate = 60; // ISR every 60 seconds

export default async function HomePage() {
  // Parallel data fetching on server
  const [featured, articlesResponse, breakingNews] = await Promise.all([
    getFeaturedArticles(5),
    getArticles({ perPage: 6, status: "PUBLISHED" }),
    getBreakingNews(),
  ]);

  return (
    <>
      {/* Breaking News Ticker */}
      {breakingNews && breakingNews.length > 0 && (
        <BreakingNewsTicker items={breakingNews} />
      )}

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 min-h-screen">
        <HomeContent
          featuredArticles={featured}
          articles={articlesResponse.data}
          topArticles={featured.slice(1, 5)}
        />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
