/**
 * Automation Service - Full Content Automation Pipeline
 * Handles Scraping, AI rewriting, platform publishing, and social media posting
 */
import { AutomationStatus } from '@prisma/client';
export declare class AutomationService {
    private static instance;
    private locks;
    private constructor();
    static getInstance(): AutomationService;
    /**
     * Start the full automation pipeline for an approved RSS article
     */
    startAutomation(rssArticleId: string): Promise<void>;
    /**
     * Process a queue item through all stages
     */
    private processQueue;
    /**
     * Step 1: Scrape and Validate
     */
    private processScraping;
    /**
     * Step 2: AI Rewriting
     */
    private processAIRewrite;
    /**
     * Step 3: Create Platform Article
     */
    private publishToPlatform;
    /**
     * Step 4: Queue for Social Media Posting
     */
    private queueForSocial;
    private getDefaultImage;
    private getDefaultCategory;
    getQueue(options?: {
        page?: number;
        perPage?: number;
        status?: AutomationStatus;
    }): Promise<{
        data: ({
            rssArticle: {
                feed: {
                    category: {
                        name: string;
                        id: string;
                        slug: string;
                        color: string;
                        icon: string | null;
                        description: string | null;
                        isActive: boolean;
                        sortOrder: number;
                    };
                    source: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        description: string | null;
                        isActive: boolean;
                        websiteUrl: string | null;
                        logoUrl: string | null;
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
                };
            } & {
                status: import(".prisma/client").$Enums.RSSArticleStatus;
                title: string;
                id: string;
                categoryId: string | null;
                guid: string;
                excerpt: string | null;
                sourceUrl: string;
                imageUrl: string | null;
                publishedAt: Date;
                fetchedAt: Date;
                approvedAt: Date | null;
                approvedById: string | null;
                feedId: string;
                titleHash: string | null;
                rawCategories: string | null;
                rewrittenTitle: string | null;
                rewrittenExcerpt: string | null;
                isRewritten: boolean;
                rewrittenAt: Date | null;
                fullContent: string | null;
                contentScraped: boolean;
                scrapeError: string | null;
                scrapedAt: Date | null;
            };
        } & {
            status: import(".prisma/client").$Enums.AutomationStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            publishedAt: Date | null;
            errorMessage: string | null;
            retryCount: number;
            rssArticleId: string;
            aiRewrittenTitle: string | null;
            aiRewrittenContent: string | null;
            aiRewrittenExcerpt: string | null;
            aiProcessedAt: Date | null;
            createdArticleId: string | null;
            socialPlatform: import(".prisma/client").$Enums.SocialPlatform | null;
            socialStatus: import(".prisma/client").$Enums.SocialPostStatus | null;
            socialScheduledAt: Date | null;
            socialPostedAt: Date | null;
            socialPostId: string | null;
        })[];
        meta: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            perPage: number;
        };
    }>;
    retryAutomation(queueId: string): Promise<void>;
    getPendingSocialPosts(): Promise<{
        status: import(".prisma/client").$Enums.AutomationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        errorMessage: string | null;
        retryCount: number;
        rssArticleId: string;
        aiRewrittenTitle: string | null;
        aiRewrittenContent: string | null;
        aiRewrittenExcerpt: string | null;
        aiProcessedAt: Date | null;
        createdArticleId: string | null;
        socialPlatform: import(".prisma/client").$Enums.SocialPlatform | null;
        socialStatus: import(".prisma/client").$Enums.SocialPostStatus | null;
        socialScheduledAt: Date | null;
        socialPostedAt: Date | null;
        socialPostId: string | null;
    }[]>;
    markSocialPosted(id: string, postId: string): Promise<{
        status: import(".prisma/client").$Enums.AutomationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        errorMessage: string | null;
        retryCount: number;
        rssArticleId: string;
        aiRewrittenTitle: string | null;
        aiRewrittenContent: string | null;
        aiRewrittenExcerpt: string | null;
        aiProcessedAt: Date | null;
        createdArticleId: string | null;
        socialPlatform: import(".prisma/client").$Enums.SocialPlatform | null;
        socialStatus: import(".prisma/client").$Enums.SocialPostStatus | null;
        socialScheduledAt: Date | null;
        socialPostedAt: Date | null;
        socialPostId: string | null;
    }>;
    markSocialFailed(id: string, error: string): Promise<{
        status: import(".prisma/client").$Enums.AutomationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        errorMessage: string | null;
        retryCount: number;
        rssArticleId: string;
        aiRewrittenTitle: string | null;
        aiRewrittenContent: string | null;
        aiRewrittenExcerpt: string | null;
        aiProcessedAt: Date | null;
        createdArticleId: string | null;
        socialPlatform: import(".prisma/client").$Enums.SocialPlatform | null;
        socialStatus: import(".prisma/client").$Enums.SocialPostStatus | null;
        socialScheduledAt: Date | null;
        socialPostedAt: Date | null;
        socialPostId: string | null;
    }>;
}
export declare const automationService: AutomationService;
//# sourceMappingURL=automation.service.d.ts.map