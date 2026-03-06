// @ts-ignore
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import axios from 'axios';

/** WhatsApp caption limit */
const CAPTION_MAX_LENGTH = 1024;
/** First block: short summary under the image */
const SUMMARY_MAX_LENGTH = 130;
/** Second block: headline + body (content or excerpt) */
const BODY_MAX_LENGTH = 420;

class WhatsAppService {
    private sock: any = null;
    private isReady: boolean = false;
    private channelJid: string | null = null;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';
    /** Brand/header shown at top of each post (e.g. صوت تهامة) */
    private headerLabel: string = process.env.WHATSAPP_HEADER || 'صوت تهامة';

    constructor() {
        this.channelJid = process.env.WHATSAPP_CHANNEL_ID || null;

        if (process.env.WHATSAPP_ENABLE === 'true') {
            this.initializeClient();
        } else {
            console.log('[WhatsApp] Service is disabled via .env (WHATSAPP_ENABLE).');
        }
    }

    private async initializeClient(): Promise<void> {
        console.log('[WhatsApp] Initializing Baileys client...');

        try {
            const { state, saveCreds } = await useMultiFileAuthState('./whatsapp-auth');
            const { version } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
                version,
                auth: state,
                browser: ['VoiceOfTihama', 'Chrome', '120.0'],
            });

            // Save credentials whenever they update
            this.sock.ev.on('creds.update', saveCreds);

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                // Show QR code when available
                if (qr) {
                    console.log('[WhatsApp] Scan this QR Code with your phone:');
                    // @ts-ignore
                    import('qrcode-terminal').then((qrModule: any) => {
                        const qrcode = qrModule.default || qrModule;
                        qrcode.generate(qr, { small: true });
                    }).catch(() => {
                        console.log('[WhatsApp] QR:', qr);
                    });
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    console.log(`[WhatsApp] Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);
                    this.isReady = false;

                    if (shouldReconnect) {
                        // Wait a bit before reconnecting
                        setTimeout(() => this.initializeClient(), 5000);
                    } else {
                        console.log('[WhatsApp] Logged out. Please delete whatsapp-auth folder and restart to re-scan QR.');
                    }
                }

                if (connection === 'open') {
                    console.log('[WhatsApp] ✅ Connected successfully!');
                    this.isReady = true;

                    // List available newsletters/channels
                    await this.listChannels();
                }
            });

        } catch (error: any) {
            console.error('[WhatsApp] Failed to initialize:', error.message);
        }
    }

    /**
     * List all subscribed newsletters/channels
     */
    private async listChannels(): Promise<void> {
        try {
            if (this.sock?.newsletterSubscriptions) {
                const newsletters = await this.sock.newsletterSubscriptions();
                console.log('\n--- WhatsApp Channels (Newsletters) ---');
                if (newsletters && newsletters.length > 0) {
                    newsletters.forEach((nl: any) => {
                        console.log(`  - ${nl.name || 'Unnamed'}: ${nl.id}`);
                    });
                } else {
                    console.log('  No subscribed channels found.');
                }
                console.log('---------------------------------------\n');
            }

            // Also try listing groups
            const groups = await this.sock?.groupFetchAllParticipating?.();
            if (groups) {
                const groupList = Object.values(groups) as any[];
                if (groupList.length > 0) {
                    console.log('--- WhatsApp Groups ---');
                    groupList.slice(0, 10).forEach((g: any) => {
                        console.log(`  - ${g.subject}: ${g.id}`);
                    });
                    console.log('-----------------------\n');
                }
            }
        } catch (error: any) {
            console.log('[WhatsApp] Could not list channels:', error.message);
        }
    }

    /**
     * Helper to clean HTML excerpt
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>?/gm, '').trim();
    }

    /**
     * Truncate text for caption (single line or short block)
     */
    private truncateText(text: string, maxLen: number): string {
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned.length <= maxLen) return cleaned;
        return cleaned.slice(0, maxLen).trim() + '…';
    }

    /**
     * Resolve full image URL (relative -> absolute)
     */
    private resolveImageUrl(imageUrl: string): string {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
        const base = this.platformUrl.replace(/\/$/, '');
        return imageUrl.startsWith('/') ? `${base}${imageUrl}` : `${base}/${imageUrl}`;
    }

    /**
     * Fetch image buffer from URL (for sending as media)
     */
    private async fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
        try {
            const res = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 15000,
                maxContentLength: 5 * 1024 * 1024, // 5MB
                validateStatus: (s) => s === 200,
            });
            return Buffer.from(res.data);
        } catch {
            return null;
        }
    }

    /**
     * Build caption in two-block style (like reference):
     * Block 1: headline + short summary → domain
     * Block 2: headline + body → "اقرأ المزيد على منصة صوت تهامة:" → URL
     */
    private buildCaption(article: any): string {
        const title = (article.title || '').trim();
        const rawExcerpt = article.excerpt ? this.stripHtml(article.excerpt) : '';
        const rawContent = article.content ? this.stripHtml(article.content) : rawExcerpt;
        const summary = this.truncateText(rawExcerpt, SUMMARY_MAX_LENGTH);
        const body = this.truncateText(rawContent, BODY_MAX_LENGTH);
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;
        const domain = this.platformUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '');

        const lines: string[] = [
            // Block 1: headline + summary
            `*${title}*`,
            '',
            summary,
            '',
            domain,
            '',
            // Block 2: headline + full body
            `*${title}*`,
            '',
            body,
            '',
            'اقرأ المزيد على منصة صوت تهامة:',
            articleUrl,
        ];
        const caption = lines.join('\n').trim();
        return caption.length > CAPTION_MAX_LENGTH ? caption.slice(0, CAPTION_MAX_LENGTH - 1) + '…' : caption;
    }

    /**
     * Build text-only message (same structure, when no image or image send fails)
     */
    private buildTextMessage(article: any): string {
        return this.buildCaption(article);
    }

    /**
     * Send article to WhatsApp channel or group (one image + caption, or text-only)
     */
    public async sendArticleToWhatsApp(article: any): Promise<void> {
        if (!this.isReady || !this.sock) {
            console.log('[WhatsApp] Cannot send article: Client is not ready.');
            return;
        }

        if (!this.channelJid) {
            console.log('[WhatsApp] Cannot send article: WHATSAPP_CHANNEL_ID is not configured.');
            return;
        }

        try {
            console.log(`[WhatsApp] Preparing to send article: ${article.title}`);

            const caption = this.buildCaption(article);
            const hasImage = !!article.imageUrl;

            if (hasImage) {
                const imageUrl = this.resolveImageUrl(article.imageUrl);
                const imageBuffer = await this.fetchImageBuffer(imageUrl);

                if (imageBuffer && imageBuffer.length > 0) {
                    await this.sock.sendMessage(this.channelJid, {
                        image: imageBuffer,
                        caption,
                    });
                    console.log(`[WhatsApp] ✅ Sent article with image "${article.title}" successfully!`);
                    return;
                }
                console.warn('[WhatsApp] Could not fetch image, sending text-only.');
            }

            await this.sock.sendMessage(this.channelJid, { text: this.buildTextMessage(article) });
            console.log(`[WhatsApp] ✅ Sent article "${article.title}" successfully!`);
        } catch (error: any) {
            console.error('[WhatsApp] Failed to send article:', error.message);
        }
    }
}

// Export singleton
export const whatsappService = new WhatsAppService();
