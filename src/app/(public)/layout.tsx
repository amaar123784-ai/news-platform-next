import { getBreakingNews } from "@/lib/api";
import { Header, Footer, BreakingNewsTicker } from "@/components/organisms";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const breakingNews = await getBreakingNews();

    return (
        <>
            {/* Fixed Top Section: Ticker + Header */}
            <div className="sticky top-0 z-[100] w-full bg-white shadow-sm">
                {/* Breaking News Ticker */}
                {breakingNews && breakingNews.length > 0 && (
                    <BreakingNewsTicker items={breakingNews} />
                )}
                {/* Header */}
                <Header />
            </div>

            {/* Main Page Content */}
            <div className="relative z-10 flex-grow">
                {children}
            </div>

            {/* Footer */}
            <Footer />
        </>
    );
}

