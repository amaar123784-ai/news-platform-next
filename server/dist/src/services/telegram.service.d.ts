/**
 * Telegram Bot Service
 * Sends articles to a Telegram channel via the official Bot API.
 */
export interface TelegramResult {
    success: boolean;
    error?: string;
}
declare class TelegramService {
    private botToken;
    private channelId;
    private isEnabled;
    private platformUrl;
    constructor();
    private verifyBot;
    sendArticleToTelegram(article: any): Promise<TelegramResult>;
    sendArticleWithPhoto(article: any): Promise<TelegramResult>;
}
export declare const telegramService: TelegramService;
export {};
//# sourceMappingURL=telegram.service.d.ts.map