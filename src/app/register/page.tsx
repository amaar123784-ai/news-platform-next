import type { Metadata } from 'next';
import { RegisterContent } from "./RegisterContent";
import { Header, Footer } from "@/components/organisms";
import { Container } from "@/components/atoms";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export const metadata: Metadata = {
    title: "إنشاء حساب | صوت تهامة",
    description: "انضم إلينا وأنشئ حسابك الجديد في منصة صوت تهامة",
    alternates: { canonical: `${siteUrl}/register` },
    openGraph: {
        title: "إنشاء حساب | صوت تهامة",
        description: "انضم إلينا وأنشئ حسابك الجديد",
        url: `${siteUrl}/register`,
        type: 'website',
        locale: 'ar_YE',
        siteName: 'صوت تهامة',
    },
};

export default function RegisterPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 py-12">
                <Container>
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
                            <p className="text-gray-600">انضم إلى مجتمعنا وشارك في النقاش</p>
                        </div>
                        <RegisterContent />
                    </div>
                </Container>
            </main>
            <Footer />
        </>
    );
}
