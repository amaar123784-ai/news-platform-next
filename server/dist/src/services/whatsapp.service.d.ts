declare class WhatsAppService {
    private sock;
    private isReady;
    private channelJid;
    private groupJid;
    private inviteCode;
    private platformUrl;
    private messageQueue;
    private isProcessingQueue;
    private reconnectAttempts;
    constructor();
    /**
     * Resolve channel invite code to actual JID using Baileys newsletter API
     */
    private resolveChannelJid;
    private initializeClient;
    private getJitterDelay;
    private fetchThumbnail;
    sendArticleToWhatsApp(article: any): Promise<void>;
    private processQueue;
    private attemptSend;
    private updatePostStatus;
}
export declare const whatsappService: WhatsAppService;
export {};
//# sourceMappingURL=whatsapp.service.d.ts.map