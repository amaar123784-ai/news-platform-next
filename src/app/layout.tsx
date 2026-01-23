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
        icon: '/images/logo.png',
        apple: '/images/logo.png',
      }
    };
  } catch (error) {
    return {
      title: "صوت تهامة - Tihama Voice",
      description: "صوت تهامة - صوت الحقيقة",
      metadataBase: new URL(siteUrl),
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
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="font-arabic antialiased bg-gray-50 min-h-screen">
        {/* Logo Watermark Background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/images/logo.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.08,
            zIndex: 9999,
          }}
          aria-hidden="true"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

