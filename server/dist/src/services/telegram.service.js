/**
 * Telegram Bot Service
 * Sends articles to a Telegram channel via the official Bot API.
 */
const TELEGRAM_API = 'https://api.telegram.org';
/** Message cap for Telegram (official limit is 4096) */
const MESSAGE_MAX_LENGTH = 4096;
const MAX_RETRIES = 3;
class TelegramService {
    botToken = null;
    channelId = null;
    isEnabled = false;
    platformUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
        this.channelId = process.env.TELEGRAM_CHANNEL_ID || null;
        this.isEnabled = process.env.TELEGRAM_ENABLE === 'true';
        if (this.isEnabled && this.botToken && this.channelId) {
            console.log('[Telegram] ✅ Service enabled. Channel:', this.channelId);
            this.verifyBot();
        }
        else if (this.isEnabled) {
            console.warn('[Telegram] ⚠️ Enabled but missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID.');
        }
        else {
            console.log('[Telegram] Service is disabled via .env (TELEGRAM_ENABLE).');
        }
    }
    async verifyBot() {
        try {
            const res = await fetch(`${TELEGRAM_API}/bot${this.botToken}/getMe`);
            const data = await res.json();
            if (data.ok) {
                console.log(`[Telegram] ✅ Bot verified: @${data.result.username}`);
            }
            else {
                console.error('[Telegram] ❌ Bot verification failed:', data.description);
                this.isEnabled = false;
            }
        }
        catch (error) {
            console.error('[Telegram] ❌ Failed to verify bot:', error.message);
        }
    }
    stripHtml(html) {
        if (!html)
            return '';
        return html.replace(/<[^>]*>?/gm, '').trim();
    }
    truncateText(text, maxLen) {
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned.length <= maxLen)
            return cleaned;
        return cleaned.slice(0, maxLen).trim() + '…';
    }
    escapeHtml(text) {
        if (!text)
            return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    buildMessage(article) {
        const title = article.title || '';
        const excerpt = article.excerpt || '';
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;
        const message = `<b>${this.escapeHtml(title)}</b>\n\n${this.escapeHtml(excerpt)}\n\n🔗 <a href="${articleUrl}">اقرأ المزيد على منصة صوت تهامة</a>`;
        if (message.length <= MESSAGE_MAX_LENGTH)
            return message;
        const excerptMax = MESSAGE_MAX_LENGTH - (title.length + articleUrl.length + 100);
        const excerptTrimmed = this.truncateText(this.stripHtml(excerpt), Math.max(50, excerptMax));
        return `<b>${this.escapeHtml(title)}</b>\n\n${this.escapeHtml(excerptTrimmed)}\n\n🔗 <a href="${articleUrl}">اقرأ المزيد على منصة صوت تهامة</a>`;
    }
    async sendArticleToTelegram(article) {
        if (!this.isEnabled || !this.botToken || !this.channelId)
            return false;
        const text = this.buildMessage(article);
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(`${TELEGRAM_API}/bot${this.botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: this.channelId,
                        text,
                        parse_mode: 'HTML',
                        disable_web_page_preview: false,
                    }),
                });
                const data = await response.json();
                if (data.ok) {
                    console.log(`[Telegram] ✅ Sent article: ${article.title}`);
                    return true;
                }
                console.error(`[Telegram] ❌ Attempt ${attempt} failed: ${data.description}`);
                if (attempt < MAX_RETRIES)
                    await new Promise(r => setTimeout(r, 2000 * attempt));
            }
            catch (error) {
                console.error(`[Telegram] ❌ Attempt ${attempt} error: ${error.message}`);
                if (attempt < MAX_RETRIES)
                    await new Promise(r => setTimeout(r, 2000 * attempt));
            }
        }
        return false;
    }
    async sendArticleWithPhoto(article) {
        if (!this.isEnabled || !this.botToken || !this.channelId)
            return false;
        const imageUrl = article.imageUrl;
        if (!imageUrl || imageUrl.startsWith('/uploads/')) {
            return this.sendArticleToTelegram(article);
        }
        const caption = this.buildMessage(article);
        const safeCaption = caption.length > 1024 ? caption.substring(0, 1020) + '…' : caption;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
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
                    console.log(`[Telegram] ✅ Sent article with photo: ${article.title}`);
                    return true;
                }
                console.warn(`[Telegram] ⚠️ Photo attempt ${attempt} failed: ${data.description}`);
                if (attempt < MAX_RETRIES)
                    await new Promise(r => setTimeout(r, 2000 * attempt));
            }
            catch (error) {
                console.error(`[Telegram] ❌ Photo attempt ${attempt} error: ${error.message}`);
                if (attempt < MAX_RETRIES)
                    await new Promise(r => setTimeout(r, 2000 * attempt));
            }
        }
        // Final fallback to text
        return this.sendArticleToTelegram(article);
    }
}
export const telegramService = new TelegramService();
//# sourceMappingURL=telegram.service.js.map