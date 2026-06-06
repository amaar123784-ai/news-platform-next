/**
 * Social Publisher Service
 *
 * Unified entry point for publishing articles to all social media platforms.
 * Tracks every attempt in the SocialPost database table.
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
 */
export declare function publishToSocialChannels(article: ArticlePayload): Promise<PlatformResult[]>;
export {};
//# sourceMappingURL=socialPublisher.service.d.ts.map