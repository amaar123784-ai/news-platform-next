/**
 * RSS Feed Service
 * Handles fetching, parsing, and storing RSS feed content
 */
/**
 * Fetch and parse a single RSS feed
 * Now works with RSSFeed model instead of RSSSource
 */
export declare function fetchRSSFeed(feedId: string): Promise<{
    success: boolean;
    newArticles: number;
    errors: string[];
}>;
/**
 * Fetch all active RSS feeds that are due for update
 * Uses Promise.allSettled for graceful error handling per feed
 */
export declare function fetchAllActiveFeeds(): Promise<{
    feedsChecked: number;
    totalNewArticles: number;
    successful: number;
    failed: number;
}>;
/**
 * Clean up old RSS articles
 * Removes articles older than specified days that are not approved
 */
export declare function cleanupOldArticles(daysOld?: number): Promise<number>;
/**
 * Mark old approved articles as expired
 */
export declare function expireOldArticles(daysOld?: number): Promise<number>;
/**
 * Get feed statistics for monitoring
 */
export declare function getRSSStats(): Promise<{
    totalSources: number;
    totalFeeds: number;
    activeFeeds: number;
    errorFeeds: number;
    totalArticles: number;
    pendingArticles: number;
    approvedArticles: number;
}>;
/**
 * Download and store image locally for an RSS article
 * Called when article is approved to save storage space
 */
export declare function downloadRSSImage(imageUrl: string | null): Promise<string | null>;
//# sourceMappingURL=rss.service.d.ts.map