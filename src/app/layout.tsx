import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { Providers } from "./providers";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";
import { settingsService } from "@/services/settings.service";

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceoftihama.com";

  try {
    const settings = await settingsService.getPublicSettings();
    const siteName = settings.general.siteName || "صوت تهامة";
    const metaTitle = settings.seo.metaTitle || siteName;
    const metaDesc = settings.seo.metaDescription || "صوت تهامة - صوت الحقيقة";

    return {
      title: {
        template: `%s | ${siteName}`,
        default: metaTitle,
      },
      description: metaDesc,
      verification: {
        google: "googlea4c038509d2813c1",
      },
      metadataBase: new URL(siteUrl),
      openGraph: {
        type: "website",
        locale: "ar_YE",
        siteName: siteName,
      },
      twitter: {
        card: "summary_large_image",
      },
      icons: {
        icon: [
          { url: '/images/logo.webp', type: 'image/webp' },
          { url: '/images/logo.webp', type: 'image/webp', sizes: '32x32' },
        ],
        shortcut: '/images/logo.webp',
        apple: [
          { url: '/images/logo.webp', sizes: '180x180', type: 'image/webp' },
        ],
      }
    };
  } catch (error) {
    return {
      title: "صوت تهامة - Tihama Voice",
      description: "صوت تهامة - صوت الحقيقة",
      metadataBase: new URL(siteUrl),
      icons: {
        icon: '/images/logo.webp',
        shortcut: '/images/logo.webp',
        apple: '/images/logo.webp',
      }
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={arabicFont.variable}>
      <head>
        {/* Remixicon is now self-hosted via globals.css import */}
        <link rel="icon" href="/images/logo.webp" />
        <link rel="shortcut icon" href="/images/logo.webp" />
        <link rel="apple-touch-icon" href="/images/logo.webp" />
        <link rel="alternate" type="application/rss+xml" title="صوت تهامة - RSS" href="/rss.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "صوت تهامة",
              "alternateName": "Voice of Tihama",
              "url": "https://voiceoftihama.com",
              "logo": "https://voiceoftihama.com/images/logo.png",
              "sameAs": [
                "https://www.facebook.com/profile.php?id=61586335597792",
                "https://t.me/voiceoftihama6",
                "https://x.com/voiceoftihama"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "areaServed": "YE",
                "availableLanguage": "Arabic"
              }
            })
          }}
        />
      </head>
      <body className="font-arabic antialiased bg-gray-50 min-h-screen flex flex-col">
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

