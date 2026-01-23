/**
 * PublicLayout Template
 * 
 * Layout for public-facing news pages (home, category, article).
 * Includes header, optional breaking news, main content with sidebar, and footer.
 * 
 * @see pageTemplates.publicPage in design-system.json
 * 
 * @example
 * <PublicLayout showBreakingNews breakingNewsItems={['...']}>
 *   <MainContent />
 * </PublicLayout>
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { articleService } from '@/services';
import { Container } from '@/components/atoms';
import { Header, BreakingNewsTicker, Footer } from '@/components/organisms';

export interface PublicLayoutProps {
    /** Main content */
    children: React.ReactNode;
    /** Sidebar content */
    sidebar?: React.ReactNode;
    /** Whether to show breaking news ticker */
    showBreakingNews?: boolean;
    /** Breaking news items */
    breakingNewsItems?: string[];
    /** Current path for nav highlighting */
    currentPath?: string;
    /** Whether user is logged in */
    isLoggedIn?: boolean;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    children,
    sidebar,
    showBreakingNews = false,
    breakingNewsItems = [],
}) => {
    // Fetch breaking news if enabled and not provided
    const { data: fetchedBreakingNews } = useQuery({
        queryKey: ['breaking-news'],
        queryFn: () => articleService.getBreakingNews(),
        enabled: showBreakingNews && breakingNewsItems.length === 0,
        staleTime: 60 * 1000, // 1 minute refresh
    });

    const finalBreakingNews = breakingNewsItems.length > 0 ? breakingNewsItems : (fetchedBreakingNews || []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            {/* Header */}
            <Header />

            {/* Breaking News */}
            {showBreakingNews && (
                <BreakingNewsTicker items={finalBreakingNews} />
            )}

            {/* Main Content */}
            <main className="flex-1">
                <Container as="div" className="py-6">
                    {sidebar ? (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-3">{children}</div>
                            <aside className="lg:col-span-1">{sidebar}</aside>
                        </div>
                    ) : (
                        children
                    )}
                </Container>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default PublicLayout;
