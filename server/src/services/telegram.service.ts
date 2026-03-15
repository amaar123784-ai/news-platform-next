/**
 * Telegram Bot Service
 * Sends articles to a Telegram channel via the official Bot API.
 */

import axios from 'axios';

const TELEGRAM_API = 'https://api.telegram.org';

/** Message cap for Telegram (official limit is 4096) */
const MESSAGE_MAX_LENGTH = 4096;
const MAX_RETRIES = 3;

export interface TelegramResult {
    success: boolean;
    error?: string;
}

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
            console.warn('[Telegram] ⚠️ Enabled but missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID.');
        } else {
            console.log('[Telegram] Service is disabled via .env (TELEGRAM_ENABLE).');
        }
    }

    private async verifyBot(): Promise<void> {
        try {
            const res = await axios.get(`${TELEGRAM_API}/bot${this.botToken}/getMe`);
            if (res.data.ok) {
                console.log(`[Telegram] ✅ Bot verified: @${res.data.result.username}`);
            } else {
                console.error('[Telegram] ❌ Bot verification failed:', res.data.description);
                this.isEnabled = false;
            }
        } catch (error: any) {
            console.error('[Telegram] ❌ Failed to verify bot:', error.message);
        }
    }

    /**
     * Robust HTML stripper to prevent Telegram parsing errors
     */
    private stripAllHtml(html: string): string {
        if (!html) return '';
        return html
            .replace(/<[^>]*>?/gm, '') // Remove all tags
            .replace(/&nbsp;/g, ' ')   // Replace entities
            .trim();
    }

    private truncateText(text: string, maxLen: number): string {
        if (text.length <= maxLen) return text;
        return text.slice(0, maxLen).trim() + '…';
    }

    private escapeHtml(text: string): string {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private buildMessage(article: any): string {
        // STRIP ALL HTML before re-wrapping in Telegram safe tags
        const title = this.escapeHtml(this.stripAllHtml(article.title || ''));
        const excerpt = this.escapeHtml(this.stripAllHtml(article.excerpt || ''));
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

        const message = `<b>${title}</b>\n\n${excerpt}\n\n🔗 <a href="${articleUrl}">اقرأ المزيد على منصة صوت تهامة</a>`;

        if (message.length <= MESSAGE_MAX_LENGTH) return message;

        const excerptMax = MESSAGE_MAX_LENGTH - (title.length + articleUrl.length + 100);
        const excerptTrimmed = this.truncateText(excerpt, Math.max(50, excerptMax));
        return `<b>${title}</b>\n\n${excerptTrimmed}\n\n🔗 <a href="${articleUrl}">اقرأ المزيد على منصة صوت تهامة</a>`;
    }

    public async sendArticleToTelegram(article: any): Promise<TelegramResult> {
        if (!this.isEnabled || !this.botToken || !this.channelId) {
            return { success: false, error: 'Telegram service disabled or missing credentials' };
        }

        const text = this.buildMessage(article);
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await axios.post(`${TELEGRAM_API}/bot${this.botToken}/sendMessage`, {
                    chat_id: this.channelId,
                    text,
                    parse_mode: 'HTML',
                    disable_web_page_preview: false,
                });

                if (response.data.ok) {
                    console.log(`[Telegram] ✅ Sent article: ${article.title}`);
                    return { success: true };
                }
                
                throw new Error(response.data.description || 'Unknown error');
            } catch (error: any) {
                const status = error.response?.status;
                const description = error.response?.data?.description || error.message;
                
                // CRITICAL: Handle retry_after
                if (status === 429) {
                    const retryAfter = error.response?.data?.parameters?.retry_after || 5;
                    console.warn(`[Telegram] ⏳ Rate limited (429). Waiting ${retryAfter}s...`);
                    await new Promise(r => setTimeout(r, retryAfter * 1000));
                    continue; // Re-attempt same logic
                }

                console.error(`[Telegram] ❌ Attempt ${attempt} failed: ${description}`);
                
                if (attempt < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                } else {
                    return { success: false, error: description };
                }
            }
        }
        return { success: false, error: 'Exhausted retries' };
    }

    public async sendArticleWithPhoto(article: any): Promise<TelegramResult> {
        if (!this.isEnabled || !this.botToken || !this.channelId) {
            return { success: false, error: 'Telegram service disabled or missing credentials' };
        }

        const imageUrl = article.imageUrl;
        // Fallback to text if no image or relative path (local uploads need full URL or buffer)
        if (!imageUrl || imageUrl.startsWith('/uploads/')) {
            return this.sendArticleToTelegram(article);
        }

        const caption = this.buildMessage(article);
        // Telegram caption limit is shorter than message limit
        const safeCaption = caption.length > 1024 ? caption.substring(0, 1020) + '…' : caption;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await axios.post(`${TELEGRAM_API}/bot${this.botToken}/sendPhoto`, {
                    chat_id: this.channelId,
                    photo: imageUrl,
                    caption: safeCaption,
                    parse_mode: 'HTML',
                });

                if (response.data.ok) {
                    console.log(`[Telegram] ✅ Sent article with photo: ${article.title}`);
                    return { success: true };
                }

                throw new Error(response.data.description || 'Unknown error');
            } catch (error: any) {
                const status = error.response?.status;
                const description = error.response?.data?.description || error.message;

                // CRITICAL: Handle retry_after
                if (status === 429) {
                    const retryAfter = error.response?.data?.parameters?.retry_after || 5;
                    console.warn(`[Telegram] ⏳ Rate limited (429). Waiting ${retryAfter}s...`);
                    await new Promise(r => setTimeout(r, retryAfter * 1000));
                    continue;
                }

                console.warn(`[Telegram] ⚠️ Photo attempt ${attempt} failed: ${description}`);
                
                if (attempt < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                } else {
                    // Final fallback: try sending as text only
                    console.log(`[Telegram] 🔄 Photo failed after ${MAX_RETRIES} attempts, falling back to text...`);
                    return this.sendArticleToTelegram(article);
                }
            }
        }

        return this.sendArticleToTelegram(article);
    }
}

export const telegramService = new TelegramService();
