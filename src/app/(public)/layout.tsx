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
            {/* Fixed Top Section: Ticker + Header */}
            <div className="sticky top-0 z-[100] w-full bg-white shadow-sm">
                {/* Breaking News Ticker */}
                {breakingNews.length > 0 && (
                    <BreakingNewsTicker items={breakingNews} />
                )}

                {/* Header */}
                <Header />
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 min-h-screen">
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </>
    );
}
