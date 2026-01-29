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
    getPendingSocialPosts(): Promise<any>;
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
        data: any;
        meta: {
            currentPage: number;
            totalPages: number;
            totalItems: any;
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