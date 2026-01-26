import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { settingsService } from "@/services/settings.service";

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
        {/* Remixicon CSS - Google Font handled by next/font */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.min.css"
          rel="stylesheet"
        />
        <link rel="icon" href="/images/logo.webp" />
        <link rel="shortcut icon" href="/images/logo.webp" />
        <link rel="apple-touch-icon" href="/images/logo.webp" />
      </head>
      <body className="font-arabic antialiased bg-gray-50 min-h-screen">
        {/* Logo Watermark Background - Optimized */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/images/logo.webp)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.05,
            zIndex: 9999,
          }}
          aria-hidden="true"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

