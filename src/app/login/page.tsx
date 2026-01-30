import type { Metadata } from 'next';
import { LoginContent } from "./LoginContent";

import { Container } from "@/components/atoms";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export const metadata: Metadata = {
    title: "تسجيل الدخول | صوت تهامة",
    description: "تسجيل الدخول إلى حسابك في منصة صوت تهامة",
    alternates: { canonical: `${siteUrl}/login` },
    openGraph: {
        title: "تسجيل الدخول | صوت تهامة",
        description: "تسجيل الدخول إلى حسابك",
        url: `${siteUrl}/login`,
        type: 'website',
        locale: 'ar_YE',
        siteName: 'صوت تهامة',
    },
};

export default function LoginPage() {
    return (
        <>

            <main className="min-h-screen bg-gray-50 py-12 flex items-center">
                <Container>
                    <LoginContent />
                </Container>
            </main>

        </>
    );
}
