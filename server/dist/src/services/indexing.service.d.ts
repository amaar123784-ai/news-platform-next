/**
 * Google Indexing API Service
 *
 * Notifies Google of new or updated URLs to ensure instant crawling and indexing.
 * Used for breaking news and high-priority content.
 */
declare class IndexingService {
    private auth;
    private isEnabled;
    constructor();
    /**
     * Alias for notifyGoogle to match automation service expectations
     */
    submitUrl(url: string, type?: 'URL_UPDATED' | 'URL_DELETED'): Promise<boolean>;
    /**
     * Notify Google about a new or updated URL
     */
    notifyGoogle(url: string, type?: 'URL_UPDATED' | 'URL_DELETED'): Promise<boolean>;
}
export declare const indexingService: IndexingService;
export {};
//# sourceMappingURL=indexing.service.d.ts.map