/**
 * RSS Feed Service
 * Handles fetching, parsing, and storing RSS feed content
 */
/**
 * Fetch and parse a single RSS feed source
 */
export declare function fetchRSSFeed(sourceId: string): Promise<{
    success: boolean;
    newArticles: number;
    errors: string[];
}>;
/**
 * Fetch all active RSS feeds that are due for update
 * Uses Promise.allSettled for graceful error handling per source
 */
export declare function fetchAllActiveFeeds(): Promise<{
    sourcesChecked: number;
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
    activeSources: number;
    errorSources: number;
    totalArticles: number;
    pendingArticles: number;
    approvedArticles: number;
}>;
//# sourceMappingURL=rss.service.d.ts.map