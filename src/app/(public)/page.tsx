import { getFeaturedArticles, getArticles, formatTimeAgo, getImageUrl } from "@/lib/api";
import { FeaturedNewsGrid, PublicSidebar } from "@/components/organisms";
import { CategoryNewsFilter } from "@/components/CategoryNewsFilter";

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
  const [featured, articlesResponse] = await Promise.all([
    getFeaturedArticles(5),
    getArticles({ perPage: 6, status: "PUBLISHED" }),
  ]);

  const articles = articlesResponse.data;

  // Map to FeaturedNewsGrid format
  const featuredGridArticles = featured.map(article => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    category: (article.category?.slug || "politics") as any,
    imageUrl: getImageUrl(article.imageUrl),
    timeAgo: formatTimeAgo(article.publishedAt || article.createdAt),
    views: article.views,
    isBreaking: (article as any).isBreaking || false,
  }));

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-3">
            {/* Featured Articles Grid — Server Rendered for LCP speed */}
            <FeaturedNewsGrid articles={featuredGridArticles} />

            {/* News Grid with Category Filtering — Client Component for interactivity */}
            <CategoryNewsFilter initialArticles={articles} />
          </div>

          {/* Sidebar — Server Rendered */}
          <div className="lg:col-span-1">
            <PublicSidebar
              urgentNews={articles.slice(0, 5)}
              mostReadNews={featured.slice(1, 5)}
            />
          </div>
        </div>
      </main>
    </>
  );
}

