import type { Metadata } from 'next';
import { Header, Footer } from '@/components/organisms';
import AggregatedNewsContent from './AggregatedNewsContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export const metadata: Metadata = {
    title: 'أخبار من مصادر موثوقة | صوت تهامة',
    description: 'تغطية شاملة للأحداث من المصادر العالمية والمحلية الموثوقة. أخبار محدثة من وكالات الأنباء والصحف العربية الكبرى.',
    alternates: {
        canonical: `${siteUrl}/aggregated-news`,
    },
    openGraph: {
        title: 'أخبار من مصادر موثوقة | صوت تهامة',
        description: 'تغطية شاملة للأحداث من المصادر العالمية والمحلية الموثوقة',
        url: `${siteUrl}/aggregated-news`,
        type: 'website',
        locale: 'ar_YE',
        siteName: 'صوت تهامة',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'أخبار من مصادر موثوقة | صوت تهامة',
        description: 'تغطية شاملة للأحداث من المصادر العالمية والمحلية الموثوقة',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function AggregatedNewsPage() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <AggregatedNewsContent />
            <Footer />
        </main>
    );
}
