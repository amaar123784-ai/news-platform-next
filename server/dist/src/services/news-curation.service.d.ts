/**
 * News Curation Service
 * Auto-manages featured articles based on engagement and relevance scoring.
 */
/**
 * Refresh featured articles.
 * - Fetches PUBLISHED articles from the last 24 hours
 * - Scores them and picks the top 5
 * - Preserves manually-pinned articles (featured for < 48h)
 */
export declare function refreshFeaturedArticles(): Promise<{
    featured: number;
}>;
/**
 * Expire breaking news older than the specified hours.
 */
export declare function expireBreakingNews(maxAgeHours?: number): Promise<number>;
//# sourceMappingURL=news-curation.service.d.ts.map