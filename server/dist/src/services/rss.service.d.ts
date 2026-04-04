/**
 * RSS Feed Service
 * Handles fetching, parsing, and storing RSS feed content
 */
/**
 * Fetch and parse a single RSS feed
 */
export declare function fetchRSSFeed(feedId: string): Promise<{
    success: boolean;
    newArticles: number;
    errors: string[];
}>;
/**
 * Fetch all active RSS feeds that are due for update
 */
export declare function fetchAllActiveFeeds(): Promise<{
    feedsChecked: number;
    totalNewArticles: number;
    successful: number;
    failed: number;
}>;
/**
 * Clean up old RSS articles
 */
export declare function cleanupOldArticles(daysOld?: number): Promise<number>;
/**
 * Mark old approved articles as expired
 */
export declare function expireOldArticles(daysOld?: number): Promise<number>;
/**
 * Get feed statistics
 */
export declare function getRSSStats(): Promise<any>;
/**
 * Download and store image locally
 */
export declare function downloadRSSImage(imageUrl: string | null): Promise<string | null>;
//# sourceMappingURL=rss.service.d.ts.map