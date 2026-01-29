export declare class WebhookService {
    private static instance;
    private readonly n8nWebhookUrl;
    private constructor();
    static getInstance(): WebhookService;
    /**
     * Send article data to n8n webhook
     * This is a fire-and-forget operation to not block the main execution flow
     */
    notifyNewArticle(articleId: string): Promise<void>;
}
export declare const webhookService: WebhookService;
//# sourceMappingURL=webhook.service.d.ts.map