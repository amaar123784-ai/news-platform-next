/**
 * Web Scraper Service
 * Fetches full article content from original news URLs
 */
/**
 * Main scraping function for a single article
 */
export declare function scrapeArticle(articleId: string): Promise<{
    success: boolean;
    content: string | null;
    error: string | null;
}>;
/**
 * Process scrape queue - fetch unscraped articles
 * Uses concurrent processing with rate limiting for efficiency
 */
export declare function processScrapeQueue(batchSize?: number): Promise<{
    processed: number;
    successful: number;
}>;
/**
 * Retry failed scrapes
 */
export declare function retryFailedScrapes(limit?: number): Promise<number>;
//# sourceMappingURL=scraper.service.d.ts.map