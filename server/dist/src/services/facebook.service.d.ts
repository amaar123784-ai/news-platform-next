/**
 * Facebook Page Service
 * Sends articles to a Facebook Page via the official Graph API.
 */
declare class FacebookService {
    private pageId;
    private pageToken;
    private isEnabled;
    private isReady;
    private platformUrl;
    constructor();
    private initialize;
    private stripHtml;
    private buildMessage;
    postArticleToFacebook(article: any): Promise<boolean>;
}
export declare const facebookService: FacebookService;
export {};
//# sourceMappingURL=facebook.service.d.ts.map