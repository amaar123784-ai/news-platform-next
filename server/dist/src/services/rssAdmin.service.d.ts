/**
 * RSS Admin Service
 *
 * Business logic for RSS source/feed management, moderation queue,
 * and AI rewrite operations. The existing rss.service.ts handles
 * low-level feed fetching/parsing and remains unchanged.
 */
interface CreateSourceData {
    name: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    feeds: Array<{
        feedUrl: string;
        categoryId: string;
        fetchInterval: number;
        applyFilter: boolean;
    }>;
}
interface UpdateSourceData {
    name?: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    isActive?: boolean;
}
interface AddFeedData {
    feedUrl: string;
    categoryId: string;
    fetchInterval: number;
    applyFilter: boolean;
}
interface UpdateFeedData {
    feedUrl?: string;
    categoryId?: string;
    fetchInterval?: number;
    applyFilter?: boolean;
    status?: 'ACTIVE' | 'PAUSED';
}
/**
 * List approved RSS articles (public endpoint)
 */
export declare function listPublicArticles(page: number, perPage: number, categoryId?: string, categorySlug?: string): Promise<{
    data: ({
        feed: {
            category: {
                name: string;
                id: string;
                slug: string;
                color: string;
            };
            categoryId: string;
            source: {
                name: string;
                websiteUrl: string | null;
                logoUrl: string | null;
            };
        };
    } & {
        status: import(".prisma/client").$Enums.RSSArticleStatus;
        title: string;
        guid: string;
        imageUrl: string | null;
        id: string;
        categoryId: string | null;
        excerpt: string | null;
        sourceUrl: string;
        publishedAt: Date;
        fetchedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        feedId: string;
        titleHash: string | null;
        rewrittenTitle: string | null;
        rewrittenExcerpt: string | null;
        isRewritten: boolean;
        rewrittenAt: Date | null;
        fullContent: string | null;
        contentScraped: boolean;
        scrapeError: string | null;
        scrapedAt: Date | null;
    })[];
    meta: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        perPage: number;
    };
}>;
/**
 * List all RSS sources with computed stats
 */
export declare function listSources(): Promise<any[]>;
/**
 * Get a single source with its feeds
 */
export declare function getSource(id: string): Promise<{
    feeds: ({
        category: {
            name: string;
            id: string;
            slug: string;
        };
        _count: {
            articles: number;
        };
    } & {
        status: import(".prisma/client").$Enums.RSSSourceStatus;
        id: string;
        feedUrl: string;
        fetchInterval: number;
        lastFetchedAt: Date | null;
        lastError: string | null;
        errorCount: number;
        applyFilter: boolean;
        categoryId: string;
        sourceId: string;
        createdAt: Date;
        updatedAt: Date;
    })[];
} & {
    name: string;
    description: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    websiteUrl: string | null;
    logoUrl: string | null;
}>;
/**
 * Create a new RSS source with feeds
 */
export declare function createSource(data: CreateSourceData, userId: string): Promise<{
    feeds: ({
        category: {
            name: string;
            id: string;
            slug: string;
        };
    } & {
        status: import(".prisma/client").$Enums.RSSSourceStatus;
        id: string;
        feedUrl: string;
        fetchInterval: number;
        lastFetchedAt: Date | null;
        lastError: string | null;
        errorCount: number;
        applyFilter: boolean;
        categoryId: string;
        sourceId: string;
        createdAt: Date;
        updatedAt: Date;
    })[];
} & {
    name: string;
    description: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    websiteUrl: string | null;
    logoUrl: string | null;
}>;
/**
 * Update source metadata
 */
export declare function updateSource(id: string, data: UpdateSourceData): Promise<{
    feeds: ({
        category: {
            name: string;
            id: string;
            slug: string;
        };
    } & {
        status: import(".prisma/client").$Enums.RSSSourceStatus;
        id: string;
        feedUrl: string;
        fetchInterval: number;
        lastFetchedAt: Date | null;
        lastError: string | null;
        errorCount: number;
        applyFilter: boolean;
        categoryId: string;
        sourceId: string;
        createdAt: Date;
        updatedAt: Date;
    })[];
} & {
    name: string;
    description: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    websiteUrl: string | null;
    logoUrl: string | null;
}>;
/**
 * Delete a source and all its feeds/articles
 */
export declare function deleteSource(id: string, userId: string): Promise<void>;
/**
 * Fetch all active feeds for a source
 */
export declare function fetchSourceFeeds(sourceId: string): Promise<{
    feedsChecked: number;
    successCount: number;
    newArticles: number;
    errors: any[];
}>;
/**
 * Add a new feed to an existing source
 */
export declare function addFeed(sourceId: string, data: AddFeedData): Promise<{
    category: {
        name: string;
        id: string;
        slug: string;
    };
} & {
    status: import(".prisma/client").$Enums.RSSSourceStatus;
    id: string;
    feedUrl: string;
    fetchInterval: number;
    lastFetchedAt: Date | null;
    lastError: string | null;
    errorCount: number;
    applyFilter: boolean;
    categoryId: string;
    sourceId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Update feed settings
 */
export declare function updateFeed(feedId: string, data: UpdateFeedData): Promise<{
    category: {
        name: string;
        id: string;
        slug: string;
    };
} & {
    status: import(".prisma/client").$Enums.RSSSourceStatus;
    id: string;
    feedUrl: string;
    fetchInterval: number;
    lastFetchedAt: Date | null;
    lastError: string | null;
    errorCount: number;
    applyFilter: boolean;
    categoryId: string;
    sourceId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Delete a feed
 */
export declare function deleteFeed(feedId: string): Promise<void>;
/**
 * Get sources with pending article counts for moderation sidebar
 */
export declare function getModerationSources(): Promise<{
    id: any;
    name: any;
    logoUrl: any;
    _count: {
        articles: any;
    };
}[]>;
/**
 * List articles for moderation review
 */
export declare function getModerationArticles(page: number, perPage: number, status: string, sourceId?: string, categoryId?: string): Promise<{
    data: ({
        feed: {
            category: {
                name: string;
                id: string;
                color: string;
            };
            id: string;
            source: {
                name: string;
                id: string;
                logoUrl: string | null;
            };
        };
    } & {
        status: import(".prisma/client").$Enums.RSSArticleStatus;
        title: string;
        guid: string;
        imageUrl: string | null;
        id: string;
        categoryId: string | null;
        excerpt: string | null;
        sourceUrl: string;
        publishedAt: Date;
        fetchedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        feedId: string;
        titleHash: string | null;
        rewrittenTitle: string | null;
        rewrittenExcerpt: string | null;
        isRewritten: boolean;
        rewrittenAt: Date | null;
        fullContent: string | null;
        contentScraped: boolean;
        scrapeError: string | null;
        scrapedAt: Date | null;
    })[];
    meta: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        perPage: number;
    };
}>;
/**
 * Get a single RSS article by ID
 */
export declare function getArticle(id: string): Promise<{
    feed: {
        category: {
            name: string;
            id: string;
            slug: string;
        };
        id: string;
        source: {
            name: string;
            logoUrl: string | null;
        };
    };
} & {
    status: import(".prisma/client").$Enums.RSSArticleStatus;
    title: string;
    guid: string;
    imageUrl: string | null;
    id: string;
    categoryId: string | null;
    excerpt: string | null;
    sourceUrl: string;
    publishedAt: Date;
    fetchedAt: Date;
    approvedAt: Date | null;
    approvedById: string | null;
    feedId: string;
    titleHash: string | null;
    rewrittenTitle: string | null;
    rewrittenExcerpt: string | null;
    isRewritten: boolean;
    rewrittenAt: Date | null;
    fullContent: string | null;
    contentScraped: boolean;
    scrapeError: string | null;
    scrapedAt: Date | null;
}>;
/**
 * Approve or reject a single article
 */
export declare function updateArticleStatus(id: string, status: 'APPROVED' | 'REJECTED', userId: string): Promise<{
    feed: {
        source: {
            name: string;
        };
    };
} & {
    status: import(".prisma/client").$Enums.RSSArticleStatus;
    title: string;
    guid: string;
    imageUrl: string | null;
    id: string;
    categoryId: string | null;
    excerpt: string | null;
    sourceUrl: string;
    publishedAt: Date;
    fetchedAt: Date;
    approvedAt: Date | null;
    approvedById: string | null;
    feedId: string;
    titleHash: string | null;
    rewrittenTitle: string | null;
    rewrittenExcerpt: string | null;
    isRewritten: boolean;
    rewrittenAt: Date | null;
    fullContent: string | null;
    contentScraped: boolean;
    scrapeError: string | null;
    scrapedAt: Date | null;
}>;
/**
 * Bulk approve/reject articles
 */
export declare function bulkUpdateStatus(ids: string[], status: 'APPROVED' | 'REJECTED', userId: string): Promise<number>;
/**
 * AI rewrite a single article
 */
export declare function rewriteSingleArticle(id: string): Promise<import("./ai.service.js").RewriteResult>;
/**
 * Bulk AI rewrite multiple articles
 */
export declare function bulkRewrite(ids: string[]): Promise<{
    successCount: number;
    totalCount: number;
    results: {
        id: string;
        success: boolean;
        error?: string;
    }[];
}>;
/**
 * Validate an RSS feed URL by attempting to parse it
 */
export declare function validateFeedUrl(url: string): Promise<{
    title: string | undefined;
    description: string | undefined;
    itemCount: number;
    lastItem: {
        title: string | undefined;
        pubDate: string | undefined;
    } | null;
}>;
export {};
//# sourceMappingURL=rssAdmin.service.d.ts.map