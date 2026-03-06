// @ts-ignore
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';

/** WhatsApp message limit */
const MESSAGE_MAX_LENGTH = 1024;

class WhatsAppService {
    private sock: any = null;
    private isReady: boolean = false;
    private channelJid: string | null = null;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';

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
     * Truncate text when message would exceed WhatsApp limit
     */
    private truncateText(text: string, maxLen: number): string {
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned.length <= maxLen) return cleaned;
        return cleaned.slice(0, maxLen).trim() + '…';
    }

    /**
     * Build message identical to ShareButtons whatsapp share format:
     * *Title*
     *
     * excerpt
     *
     * اقرأ المزيد على منصة صوت تهامة:
     * articleUrl
     */
    private buildMessage(article: any): string {
        const title = (article.title || '').trim();
        const rawExcerpt = article.excerpt ? this.stripHtml(article.excerpt) : '';
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

        let message = `*${title}*\n\n${rawExcerpt}\n\nاقرأ المزيد على منصة صوت تهامة:\n${articleUrl}`;
        if (message.length > MESSAGE_MAX_LENGTH) {
            const excerptMax = MESSAGE_MAX_LENGTH - (title.length + articleUrl.length + 60);
            const excerpt = this.truncateText(rawExcerpt, Math.max(100, excerptMax));
            message = `*${title}*\n\n${excerpt}\n\nاقرأ المزيد على منصة صوت تهامة:\n${articleUrl}`;
        }
        return message;
    }

    /**
     * Send article to WhatsApp channel — text only, 100% same as share (no media).
     * Link preview (with image) is shown by WhatsApp when the URL is in the message.
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
            const text = this.buildMessage(article);
            await this.sock.sendMessage(this.channelJid, { text });
            console.log(`[WhatsApp] ✅ Sent article "${article.title}".`);
        } catch (error: any) {
            console.error('[WhatsApp] Failed to send article:', error.message);
        }
    }
}

// Export singleton
export const whatsappService = new WhatsAppService();
