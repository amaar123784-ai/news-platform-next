import { getFeaturedArticles, getArticles, getCategories, getBreakingNews } from "@/lib/api";
import { HomeContent } from "@/components/HomeContent";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { BreakingNewsTicker } from "@/components/organisms/BreakingNewsTicker";

export const revalidate = 60; // ISR every 60 seconds

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

// Organization JSON-LD Schema for Google Knowledge Panel
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'صوت تهامة',
  alternateName: 'Voice of Tihama',
  url: siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${siteUrl}/images/logo.webp`,
  },
  sameAs: [
    'https://facebook.com/voiceoftihama',
    'https://twitter.com/voiceoftihama',
    'https://telegram.me/voiceoftihama',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@voiceoftihama.com',
    contactType: 'customer service',
    availableLanguage: ['Arabic'],
  },
};

// WebSite JSON-LD Schema for Sitelinks Search Box
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'صوت تهامة',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default async function HomePage() {
  // Parallel data fetching on server
  const [featured, articlesResponse, breakingNews] = await Promise.all([
    getFeaturedArticles(5),
    getArticles({ perPage: 6, status: "PUBLISHED" }),
    getBreakingNews(),
  ]);

  return (
    <>
      {/* Organization JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {/* WebSite JSON-LD Schema with SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Fixed Top Section: Ticker + Header */}
      <div className="sticky top-0 z-[100] w-full bg-white shadow-sm">
        {/* Breaking News Ticker */}
        {breakingNews && breakingNews.length > 0 && (
          <BreakingNewsTicker items={breakingNews} />
        )}

        {/* Header */}
        <Header />
      </div>

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

