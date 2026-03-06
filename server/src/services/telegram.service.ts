/**
 * Telegram Bot Service
 * Sends articles to a Telegram channel via the official Bot API.
 * 100% free, no limits, no unofficial libraries.
 */

const TELEGRAM_API = 'https://api.telegram.org';

/** WhatsApp-like message cap for safety; Telegram actually allows 4096 chars */
const MESSAGE_MAX_LENGTH = 4096;

class TelegramService {
    private botToken: string | null = null;
    private channelId: string | null = null;
    private isEnabled: boolean = false;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';

    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
        this.channelId = process.env.TELEGRAM_CHANNEL_ID || null;
        this.isEnabled = process.env.TELEGRAM_ENABLE === 'true';

        if (this.isEnabled && this.botToken && this.channelId) {
            console.log('[Telegram] ✅ Service enabled. Channel:', this.channelId);
            this.verifyBot();
        } else if (this.isEnabled) {
            console.log('[Telegram] ⚠️ Enabled but missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID.');
        } else {
            console.log('[Telegram] Service is disabled via .env (TELEGRAM_ENABLE).');
        }
    }

    /**
     * Verify the bot token by calling getMe
     */
    private async verifyBot(): Promise<void> {
        try {
            const res = await fetch(`${TELEGRAM_API}/bot${this.botToken}/getMe`);
            const data = await res.json();
            if (data.ok) {
                console.log(`[Telegram] ✅ Bot verified: @${data.result.username}`);
            } else {
                console.error('[Telegram] ❌ Bot verification failed:', data.description);
                this.isEnabled = false;
            }
        } catch (error: any) {
            console.error('[Telegram] ❌ Failed to verify bot:', error.message);
        }
    }

    /**
     * Strip HTML tags for plain-text fallback
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>?/gm, '').trim();
    }

    /**
     * Truncate text safely (Arabic-aware)
     */
    private truncateText(text: string, maxLen: number): string {
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned.length <= maxLen) return cleaned;
        return cleaned.slice(0, maxLen).trim() + '…';
    }

    /**
     * Build Telegram message using HTML formatting.
     * Format:  <b>Title</b>\n\nExcerpt\n\n🔗 Read more link
     */
    private buildMessage(article: any): string {
        const title = article.title || '';
        const excerpt = article.excerpt || '';
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

        // Telegram supports HTML: <b>, <i>, <a>, <code>, <pre>
        const message = `<b>${this.escapeHtml(title)}</b>\n\n${this.escapeHtml(excerpt)}\n\n🔗 <a href="${articleUrl}">اقرأ المزيد على منصة صوت تهامة</a>`;

        if (message.length <= MESSAGE_MAX_LENGTH) return message;

        // Truncate excerpt if too long
        const excerptMax = MESSAGE_MAX_LENGTH - (title.length + articleUrl.length + 100);
        const excerptTrimmed = this.truncateText(this.stripHtml(excerpt), Math.max(50, excerptMax));
        return `<b>${this.escapeHtml(title)}</b>\n\n${this.escapeHtml(excerptTrimmed)}\n\n🔗 <a href="${articleUrl}">اقرأ المزيد على منصة صوت تهامة</a>`;
    }

    /**
     * Escape special HTML characters for Telegram
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Send article to Telegram channel
     */
    public async sendArticleToTelegram(article: any): Promise<void> {
        if (!this.isEnabled || !this.botToken || !this.channelId) {
            console.log('[Telegram] Cannot send article: Service is not ready.');
            return;
        }

        try {
            const text = this.buildMessage(article);

            console.log(`[Telegram] Sending article: ${article.title?.substring(0, 40)}...`);

            const response = await fetch(`${TELEGRAM_API}/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.channelId,
                    text,
                    parse_mode: 'HTML',
                    disable_web_page_preview: false, // Allow link preview with image
                }),
            });

            const data = await response.json();

            if (data.ok) {
                console.log(`[Telegram] ✅ Sent article "${article.title?.substring(0, 40)}..."`);
            } else {
                console.error(`[Telegram] ❌ Failed to send:`, data.description);
            }
        } catch (error: any) {
            console.error('[Telegram] Failed to send article:', error.message);
        }
    }

    /**
     * Send article with photo (if image URL available)
     */
    public async sendArticleWithPhoto(article: any): Promise<void> {
        if (!this.isEnabled || !this.botToken || !this.channelId) {
            console.log('[Telegram] Cannot send article: Service is not ready.');
            return;
        }

        const imageUrl = article.imageUrl;

        // If no image or local path, fallback to text-only with link preview
        if (!imageUrl || imageUrl.startsWith('/uploads/')) {
            return this.sendArticleToTelegram(article);
        }

        try {
            const caption = this.buildMessage(article);

            // Telegram caption limit is 1024 chars
            const safeCaption = caption.length > 1024
                ? caption.substring(0, 1020) + '…'
                : caption;

            console.log(`[Telegram] Sending article with photo: ${article.title?.substring(0, 40)}...`);

            const response = await fetch(`${TELEGRAM_API}/bot${this.botToken}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.channelId,
                    photo: imageUrl,
                    caption: safeCaption,
                    parse_mode: 'HTML',
                }),
            });

            const data = await response.json();

            if (data.ok) {
                console.log(`[Telegram] ✅ Sent article with photo.`);
            } else {
                // Fallback to text-only if photo fails
                console.warn(`[Telegram] ⚠️ Photo send failed (${data.description}), falling back to text.`);
                await this.sendArticleToTelegram(article);
            }
        } catch (error: any) {
            console.error('[Telegram] Failed to send with photo:', error.message);
            // Fallback to text-only
            await this.sendArticleToTelegram(article);
        }
    }
}

// Export singleton
export const telegramService = new TelegramService();
