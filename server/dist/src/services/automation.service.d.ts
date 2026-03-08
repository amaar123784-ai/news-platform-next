/**
 * Automation Service - Full Content Automation Pipeline
 * Handles AI rewriting, platform publishing, and social media posting
 */
import { AutomationStatus } from '@prisma/client';
export declare class AutomationService {
    private static instance;
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
     * Step 1: AI Rewriting
     */
    private processAIRewrite;
    /**
     * Step 2: Create Platform Article
     */
    private publishToPlatform;
    /**
     * Step 3: Queue for Social Media Posting
     */
    private queueForSocial;
    /**
     * Get posts ready for social media (called by n8n)
     */
    getPendingSocialPosts(): Promise<({
        rssArticle: {
            feed: {
                category: {
                    name: string;
                    description: string | null;
                    id: string;
                    slug: string;
                    color: string;
                    icon: string | null;
                    isActive: boolean;
                    sortOrder: number;
                };
                source: {
                    name: string;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
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
        };
    } & {
        status: import(".prisma/client").$Enums.AutomationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
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
        errorMessage: string | null;
        retryCount: number;
    })[]>;
    /**
     * Mark a post as successfully posted to social media
     */
    markSocialPosted(queueId: string, postId: string): Promise<void>;
    /**
     * Mark a post as failed
     */
    markSocialFailed(queueId: string, errorMessage: string): Promise<void>;
    /**
     * Get default category image URL
     */
    private getDefaultImage;
    /**
     * Get default category
     */
    private getDefaultCategory;
    /**
     * Format article content with source attribution
     */
    private formatArticleContent;
    /**
     * Get automation queue for admin dashboard
     */
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
                        description: string | null;
                        id: string;
                        slug: string;
                        color: string;
                        icon: string | null;
                        isActive: boolean;
                        sortOrder: number;
                    };
                    source: {
                        name: string;
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
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
            };
        } & {
            status: import(".prisma/client").$Enums.AutomationStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            publishedAt: Date | null;
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
            errorMessage: string | null;
            retryCount: number;
        })[];
        meta: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            perPage: number;
        };
    }>;
    /**
     * Retry a failed automation
     */
    retryAutomation(queueId: string): Promise<void>;
}
export declare const automationService: AutomationService;
//# sourceMappingURL=automation.service.d.ts.map