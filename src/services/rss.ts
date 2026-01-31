/**
 * RSS API Service
 * Frontend service for interacting with RSS endpoints
 */

import api from './api';

// ============= TYPES =============

// Individual RSS Feed (belongs to a source)
export interface RSSFeed {
    id: string;
    feedUrl: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    fetchInterval: number;
    lastFetchedAt?: string | null;
    lastError?: string | null;
    errorCount: number;
    applyFilter: boolean;
    categoryId: string;
    category: {
        id: string;
        name: string;
        slug: string;
        color?: string;
    };
    _count?: {
        articles: number;
    };
    createdAt: string;
    updatedAt: string;
}

// RSS Source (parent of feeds)
export interface RSSSource {
    id: string;
    name: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    isActive: boolean;
    feeds: RSSFeed[];
    _count?: {
        feeds: number;
        articles: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface RSSArticle {
    id: string;
    guid: string;
    title: string;
    excerpt?: string | null;
    sourceUrl: string;
    imageUrl?: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    publishedAt: string;
    fetchedAt: string;
    approvedAt?: string | null;
    // AI Rewriting fields
    rewrittenTitle?: string | null;
    rewrittenExcerpt?: string | null;
    isRewritten?: boolean;
    rewrittenAt?: string | null;
    // Web Scraper fields
    fullContent?: string | null;
    contentScraped?: boolean;
    scrapeError?: string | null;
    scrapedAt?: string | null;
    // Feed reference with source info
    feed: {
        id: string;
        categoryId: string;
        source: {
            name: string;
            logoUrl?: string | null;
            websiteUrl?: string | null;
        };
        category: {
            id?: string;
            name: string;
            slug?: string;
            color?: string;
        };
    };
}

export interface RSSStats {
    totalSources: number;
    activeSources: number;
    errorSources: number;
    totalArticles: number;
    pendingArticles: number;
    approvedArticles: number;
}

// Feed data within create source request
export interface CreateFeedData {
    feedUrl: string;
    categoryId: string;
    fetchInterval?: number;
    applyFilter?: boolean;
}

// Create source with multiple feeds
export interface CreateRSSSourceData {
    name: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    feeds: CreateFeedData[];
}

// Update source metadata only
export interface UpdateRSSSourceData {
    name?: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    isActive?: boolean;
}

// Update individual feed
export interface UpdateRSSFeedData {
    feedUrl?: string;
    categoryId?: string;
    fetchInterval?: number;
    applyFilter?: boolean;
    status?: 'ACTIVE' | 'PAUSED';
}

interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        perPage: number;
    };
}

interface SingleResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// ============= RSS SERVICE =============

export const rssService = {
    // ============= PUBLIC =============

    /**
     * Get approved RSS articles (public)
     */
    async getArticles(params?: {
        page?: number;
        perPage?: number;
        categoryId?: string;
        category?: string; // category slug
    }): Promise<PaginatedResponse<RSSArticle>> {
        const response = await api.get('/rss/articles', { params });
        return response.data;
    },

    // ============= ADMIN: SOURCES =============

    /**
     * Get all RSS sources (admin)
     */
    async getSources(): Promise<SingleResponse<RSSSource[]>> {
        const response = await api.get('/rss/sources');
        return response.data;
    },

    /**
     * Get single RSS source details (admin)
     */
    async getSource(id: string): Promise<SingleResponse<RSSSource>> {
        const response = await api.get(`/rss/sources/${id}`);
        return response.data;
    },

    /**
     * Create new RSS source (admin)
     */
    async createSource(data: CreateRSSSourceData): Promise<SingleResponse<RSSSource>> {
        const response = await api.post('/rss/sources', data);
        return response.data;
    },

    /**
     * Update RSS source (admin)
     */
    async updateSource(id: string, data: UpdateRSSSourceData): Promise<SingleResponse<RSSSource>> {
        const response = await api.patch(`/rss/sources/${id}`, data);
        return response.data;
    },

    /**
     * Delete RSS source (admin)
     */
    async deleteSource(id: string): Promise<SingleResponse<null>> {
        const response = await api.delete(`/rss/sources/${id}`);
        return response.data;
    },

    /**
     * Manually trigger all feeds fetch for a source (admin)
     */
    async fetchSource(id: string): Promise<SingleResponse<{ feedsCount: number; successful: number; totalNewArticles: number }>> {
        const response = await api.post(`/rss/sources/${id}/fetch`);
        return response.data;
    },

    // ============= ADMIN: FEEDS =============

    /**
     * Add a new feed to a source (admin)
     */
    async addFeed(sourceId: string, data: CreateFeedData): Promise<SingleResponse<RSSFeed>> {
        const response = await api.post(`/rss/sources/${sourceId}/feeds`, data);
        return response.data;
    },

    /**
     * Update feed (admin)
     */
    async updateFeed(feedId: string, data: UpdateRSSFeedData): Promise<SingleResponse<RSSFeed>> {
        const response = await api.patch(`/rss/feeds/${feedId}`, data);
        return response.data;
    },

    /**
     * Delete feed (admin)
     */
    async deleteFeed(feedId: string): Promise<SingleResponse<null>> {
        const response = await api.delete(`/rss/feeds/${feedId}`);
        return response.data;
    },

    /**
     * Fetch a single feed (admin)
     */
    async fetchFeed(feedId: string): Promise<SingleResponse<{ newArticles: number; errors: string[] }>> {
        const response = await api.post(`/rss/feeds/${feedId}/fetch`);
        return response.data;
    },

    // ============= ADMIN: MODERATION =============

    /**
     * Get sources with pending articles for moderation (admin)
     */
    async getModerationSources(): Promise<SingleResponse<Array<RSSSource & { _count: { articles: number } }>>> {
        const response = await api.get('/rss/moderation/sources');
        return response.data;
    },

    /**
     * Get pending articles for moderation (admin)
     */
    async getModerationQueue(params?: {
        page?: number;
        perPage?: number;
        sourceId?: string;
        categoryId?: string;
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    }): Promise<PaginatedResponse<RSSArticle>> {
        const response = await api.get('/rss/moderation', { params });
        return response.data;
    },

    /**
     * Get single RSS article by ID (admin)
     */
    async getArticle(id: string): Promise<SingleResponse<RSSArticle>> {
        const response = await api.get(`/rss/articles/${id}`);
        return response.data;
    },

    /**
     * Approve or reject single article (admin)
     */
    async updateArticleStatus(
        id: string,
        status: 'APPROVED' | 'REJECTED'
    ): Promise<SingleResponse<RSSArticle>> {
        const response = await api.patch(`/rss/articles/${id}`, { status });
        return response.data;
    },

    /**
     * Bulk approve or reject articles (admin)
     */
    async bulkUpdateArticles(
        ids: string[],
        status: 'APPROVED' | 'REJECTED'
    ): Promise<SingleResponse<{ updatedCount: number }>> {
        const response = await api.post('/rss/articles/bulk', { ids, status });
        return response.data;
    },

    // ============= ADMIN: OPERATIONS =============

    /**
     * Fetch all active feeds (admin)
     */
    async fetchAllFeeds(): Promise<SingleResponse<{ sourcesChecked: number; totalNewArticles: number }>> {
        const response = await api.post('/rss/fetch-all');
        return response.data;
    },

    /**
     * Cleanup old articles (admin)
     */
    async cleanupOldArticles(days = 30): Promise<SingleResponse<{ deletedCount: number }>> {
        const response = await api.post(`/rss/cleanup?days=${days}`);
        return response.data;
    },

    /**
     * Get RSS statistics (admin)
     */
    async getStats(): Promise<SingleResponse<RSSStats>> {
        const response = await api.get('/rss/stats');
        return response.data;
    },

    // ============= ADMIN: AI REWRITING =============

    /**
     * Rewrite single article with AI
     */
    async rewriteArticle(id: string): Promise<SingleResponse<RSSArticle>> {
        const response = await api.post(`/rss/articles/${id}/rewrite`);
        return response.data;
    },

    /**
     * Bulk rewrite articles with AI
     */
    async bulkRewriteArticles(ids: string[]): Promise<SingleResponse<{ successCount: number; totalCount: number }>> {
        const response = await api.post('/rss/articles/bulk-rewrite', { ids });
        return response.data;
    },

    /**
     * Check if AI service is enabled
     */
    async getAIStatus(): Promise<SingleResponse<{ enabled: boolean }>> {
        const response = await api.get('/rss/ai-status');
        return response.data;
    },
};

export default rssService;
