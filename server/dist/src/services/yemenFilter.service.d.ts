/**
 * Yemen-Specific RSS Filter Engine
 *
 * Multi-layered filtering and scoring logic for Yemen-focused news aggregation.
 * Implements: Ingestion gates, Source tiering, Semantic deduplication,
 * Heuristic scoring, and Burst control.
 */
export interface RSSItemInput {
    guid: string;
    title: string;
    description?: string;
    excerpt?: string;
    sourceUrl?: string;
    publishedAt: Date;
    sourceId: string;
    sourceName: string;
    imageUrl?: string | null;
}
export interface FilterResult {
    status: 'ACCEPTED' | 'REJECTED' | 'FLAGGED' | 'MERGED';
    relevanceScore: number;
    tierCategory: 1 | 2 | 3;
    reasoning: string;
    action: 'PUBLISH' | 'MERGE' | 'HOLD' | 'DROP';
    mergeWithId?: string;
    semanticFingerprint?: string;
    entityDensity?: number;
}
/**
 * Process an RSS item through the Yemen-specific filter engine
 */
export declare function processYemenFilter(item: RSSItemInput): FilterResult;
/**
 * Clear burst tracking (call periodically for memory management)
 */
export declare function clearBurstTracking(): void;
/**
 * Get filter statistics
 */
export declare function getFilterStats(): {
    cacheSize: number;
    trackedSources: number;
};
declare const _default: {
    processYemenFilter: typeof processYemenFilter;
    clearBurstTracking: typeof clearBurstTracking;
    getFilterStats: typeof getFilterStats;
};
export default _default;
//# sourceMappingURL=yemenFilter.service.d.ts.map