/**
 * Social Publisher Service
 *
 * Unified entry point for publishing articles to all social media platforms.
 */
interface ArticlePayload {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string | null;
    status: string;
    [key: string]: any;
}
export interface PlatformResult {
    platform: string;
    success: boolean;
    error?: string;
}
/**
 * Publish an article to all configured social media channels.
 * Each platform posts independently — a failure in one does not block others.
 */
export declare function publishToSocialChannels(article: ArticlePayload): Promise<PlatformResult[]>;
export {};
//# sourceMappingURL=socialPublisher.service.d.ts.map