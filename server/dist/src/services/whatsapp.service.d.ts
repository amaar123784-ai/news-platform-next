declare class WhatsAppService {
    private sock;
    private isReady;
    private channelJid;
    private platformUrl;
    private messageQueue;
    private isProcessingQueue;
    constructor();
    private initializeClient;
    /**
     * List all subscribed newsletters/channels
     */
    private listChannels;
    /**
     * Helper to clean HTML excerpt
     */
    private stripHtml;
    /**
     * Truncate text safely (Arabic-aware)
     */
    private truncateText;
    /**
     * Build message exactly as ShareButtons
     */
    private buildMessage;
    /**
     * Fetch article image as tiny JPEG buffer
     */
    private fetchThumbnail;
    /**
     * Verify article page is accessible
     */
    private waitForArticlePage;
    /**
     * Main entry point to send article. Adds to queue.
     */
    sendArticleToWhatsApp(article: any): Promise<void>;
    /**
     * Sequential queue processor
     */
    private processQueue;
    /**
     * Single send attempt
     */
    private attemptSend;
}
export declare const whatsappService: WhatsAppService;
export {};
//# sourceMappingURL=whatsapp.service.d.ts.map