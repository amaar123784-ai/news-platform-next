// @ts-ignore
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

class WhatsAppService {
    private client: any;
    private isReady: boolean = false;
    private channelId: string | null = null;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';

    constructor() {
        // Initialize client with LocalAuth to persist session
        this.client = new Client({
            authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.channelId = process.env.WHATSAPP_CHANNEL_ID || null;

        this.initializeClient();
    }

    private initializeClient(): void {
        if (process.env.WHATSAPP_ENABLE !== 'true') {
            console.log('[WhatsApp] Service is disabled via .env (WHATSAPP_ENABLE).');
            return;
        }

        console.log('[WhatsApp] Initializing client...');

        this.client.on('qr', (qr: string) => {
            console.log('[WhatsApp] Action Required: Scan QR Code to connect!');
            // Render visual QR code in terminal using dynamic import (ESM)
            // @ts-ignore
            import('qrcode-terminal').then((qrModule: any) => {
                const qrcode = qrModule.default || qrModule;
                qrcode.generate(qr, { small: true });
            }).catch(() => {
                console.log('[WhatsApp] QR Data:', qr);
            });
        });

        this.client.on('ready', async () => {
            console.log('[WhatsApp] Client is ready!');
            this.isReady = true;

            // Fetch and print all chats to help user find the Channel ID
            try {
                const chats: any[] = await this.client.getChats();
                const channels = chats.filter((c: any) => c.id._serialized.includes('newsletter'));
                const groups = chats.filter((c: any) => c.isGroup);

                console.log('\n--- WhatsApp Connected Targets ---');
                if (channels.length > 0) {
                    console.log('Channels found:');
                    channels.forEach((ch: any) => console.log(`  - ${ch.name}: ${ch.id._serialized}`));
                } else {
                    console.log('No Channels found.');
                }

                if (groups.length > 0) {
                    console.log('Groups found:');
                    groups.forEach((g: any) => console.log(`  - ${g.name}: ${g.id._serialized}`));
                }
                console.log('----------------------------------\n');
            } catch (error: any) {
                console.error('[WhatsApp] Could not fetch chats:', error);
            }
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsApp] Authenticated successfully!');
        });

        this.client.on('auth_failure', (msg: string) => {
            console.error('[WhatsApp] Authentication failure:', msg);
        });

        this.client.on('disconnected', (reason: string) => {
            console.log('[WhatsApp] Client was disconnected:', reason);
            this.isReady = false;
        });

        this.client.initialize().catch((err: any) => {
            console.error('[WhatsApp] Failed to initialize client:', err);
        });
    }

    /**
     * Helper to clean HTML excerpt
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>?/gm, '').trim();
    }

    /**
     * Main function to format and send the article
     */
    public async sendArticleToWhatsApp(article: any): Promise<void> {
        if (!this.isReady) {
            console.log('[WhatsApp] Cannot send article: Client is not ready.');
            return;
        }

        if (!this.channelId) {
            console.log('[WhatsApp] Cannot send article: WHATSAPP_CHANNEL_ID is not configured.');
            return;
        }

        try {
            console.log(`[WhatsApp] Preparing to send article: ${article.title}`);

            const excerpt = article.excerpt ? this.stripHtml(article.excerpt) : '';
            const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

            // Build the message template
            const message = `🚨 *خبر جديد - صوت تهامة* 🚨\n\n*${article.title}*\n\n${excerpt}\n\n🔗 *التفاصيل:* \n${articleUrl}`;

            await this.client.sendMessage(this.channelId, message);
            console.log(`[WhatsApp] Successfully sent article "${article.title}" to channel!`);

        } catch (error: any) {
            console.error('[WhatsApp] Failed to send article:', error);
        }
    }
}

// Export a singleton instance
export const whatsappService = new WhatsAppService();
