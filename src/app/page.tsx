import { getFeaturedArticles, getArticles, getCategories } from "@/lib/api";
import { HomeContent } from "@/components/HomeContent";

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
        <HomeContent
          featuredArticles={featured}
          articles={articlesResponse.data}
          topArticles={featured.slice(1, 5)}
        />
      </main>
    </>
  );
}

