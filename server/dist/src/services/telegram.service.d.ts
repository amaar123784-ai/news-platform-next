/**
 * Telegram Bot Service
 * Sends articles to a Telegram channel via the official Bot API.
 */
declare class TelegramService {
    private botToken;
    private channelId;
    private isEnabled;
    private platformUrl;
    constructor();
    private verifyBot;
    private stripHtml;
    private truncateText;
    private escapeHtml;
    private buildMessage;
    sendArticleToTelegram(article: any): Promise<boolean>;
    sendArticleWithPhoto(article: any): Promise<boolean>;
}
export declare const telegramService: TelegramService;
export {};
//# sourceMappingURL=telegram.service.d.ts.map