import Link from "next/link";
import { getBreakingNews } from "@/lib/api";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { BreakingNewsTicker } from "@/components/organisms/BreakingNewsTicker";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch data on server for layout
    const breakingNews = await getBreakingNews();

    return (
        <>
            {/* Breaking News Ticker */}
            {breakingNews.length > 0 && (
                <BreakingNewsTicker items={breakingNews} />
            )}

            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 min-h-screen">
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </>
    );
}
