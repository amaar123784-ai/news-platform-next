// @ts-ignore
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';

/** WhatsApp message limit */
const MESSAGE_MAX_LENGTH = 1024;
/** Delay (ms) before sending so article page/image are ready for link preview. Env: WHATSAPP_SEND_DELAY_MS */
const SEND_DELAY_MS = parseInt(process.env.WHATSAPP_SEND_DELAY_MS || '15000', 10) || 15000;
/** Max retries to wait for WhatsApp connection before giving up */
const READY_WAIT_RETRIES = 6;
/** Delay between each ready-check retry (ms) */
const READY_WAIT_INTERVAL = 8000;
/** Max pending queue size */
const MAX_PENDING_QUEUE = 50;
/** Max retries for sending a single message */
const MAX_SEND_RETRIES = 3;
/** Interval between processing messages in the queue (ms) to avoid rate limiting */
const QUEUE_PROCESS_INTERVAL = 5000;

/**
 * Utility to enforce timeouts on promises
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
};

class WhatsAppService {
    private sock: any = null;
    private isReady: boolean = false;
    private channelJid: string | null = null;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';
    private messageQueue: any[] = [];
    private isProcessingQueue: boolean = false;

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
                printQRInTerminal: false, // We handle it manually
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
            });

            // Save credentials whenever they update
            this.sock.ev.on('creds.update', saveCreds);

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                // Show QR code when available
                if (qr) {
                    console.log('[WhatsApp] Scan this QR Code with your phone:');
                    try {
                        // @ts-ignore
                        const qrcode = await import('qrcode-terminal');
                        (qrcode.default || qrcode).generate(qr, { small: true });
                    } catch (err) {
                        console.log('[WhatsApp] QR:', qr);
                    }
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    console.log(`[WhatsApp] Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);
                    this.isReady = false;

                    if (shouldReconnect) {
                        // Wait a bit before reconnecting with exponential backoff feel
                        setTimeout(() => this.initializeClient(), 5000);
                    } else {
                        console.error('[WhatsApp] Logged out or critical error. Please check whatsapp-auth folder.');
                    }
                }

                if (connection === 'open') {
                    console.log('[WhatsApp] ✅ Connected successfully!');
                    this.isReady = true;
                    await this.listChannels();

                    // Start processing queue if items exist
                    if (this.messageQueue.length > 0) {
                        this.processQueue();
                    }
                }
            });

        } catch (error: any) {
            console.error('[WhatsApp] Failed to initialize:', error.message);
            // Retry initialization after a delay
            setTimeout(() => this.initializeClient(), 10000);
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
        } catch (error: any) {
            console.log('[WhatsApp] Could not list channels:', error.message);
        }
    }

    /**
     * Helper to clean HTML excerpt
     */
    private stripHtml(html: string): string {
        if (!html) return '';
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
     * Build message exactly as ShareButtons
     */
    private buildMessage(article: any): string {
        const title = article.title || '';
        const excerpt = article.excerpt || '';
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

        const message = `*${title}*\n\n${excerpt}\n\nاقرأ المزيد على منصة صوت تهامة:\n${articleUrl}`;

        if (message.length <= MESSAGE_MAX_LENGTH) return message;

        const excerptMax = MESSAGE_MAX_LENGTH - (title.length + articleUrl.length + 60);
        const excerptTrimmed = this.truncateText(this.stripHtml(excerpt), Math.max(50, excerptMax));

        return `*${title}*\n\n${excerptTrimmed}\n\nاقرأ المزيد على منصة صوت تهامة:\n${articleUrl}`;
    }

    /**
     * Fetch article image as tiny JPEG buffer
     */
    private async fetchThumbnail(imageUrl: string, retries: number = 3): Promise<Buffer | undefined> {
        if (!imageUrl) return undefined;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(imageUrl, {
                    headers: { 'User-Agent': 'WhatsApp/2.23.20.76' },
                    signal: AbortSignal.timeout(15000),
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Ensure it's not too large for a thumbnail
                if (buffer.length > 1024 * 1024) return undefined;

                return buffer;
            } catch (err: any) {
                console.log(`[WhatsApp] ⚠️ Thumbnail fetch attempt ${attempt}/${retries} failed: ${err.message}`);
                if (attempt < retries) await new Promise(r => setTimeout(r, 2000));
            }
        }
        return undefined;
    }

    /**
     * Verify article page is accessible
     */
    private async waitForArticlePage(url: string, maxAttempts: number = 5): Promise<boolean> {
        // Wait for SSR/ISR to potentially finish
        await new Promise(r => setTimeout(r, 10000));

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'HEAD',
                    headers: { 'User-Agent': 'WhatsApp/2.23.20.76' },
                    signal: AbortSignal.timeout(10000),
                });

                if (response.ok) return true;
                console.log(`[WhatsApp] ⏳ Article page not ready (HTTP ${response.status}), attempt ${attempt}/${maxAttempts}`);
            } catch (err: any) {
                console.log(`[WhatsApp] ⏳ Article page check failed: ${err.message}, attempt ${attempt}/${maxAttempts}`);
            }
            if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 5000));
        }
        return false;
    }

    /**
     * Main entry point to send article. Adds to queue.
     */
    public async sendArticleToWhatsApp(article: any): Promise<void> {
        if (!this.channelJid) {
            console.warn('[WhatsApp] Skip sending: WHATSAPP_CHANNEL_ID not configured.');
            return;
        }

        if (this.messageQueue.length >= MAX_PENDING_QUEUE) {
            console.error(`[WhatsApp] ❌ Queue full. Dropping article: ${article.title}`);
            return;
        }

        console.log(`[WhatsApp] 📝 Article queued: ${article.title}`);
        this.messageQueue.push({ article, retries: 0 });

        if (!this.isProcessingQueue) {

            this.processQueue();
        }
    }

    /**
     * Sequential queue processor
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue || this.messageQueue.length === 0) return;
        this.isProcessingQueue = true;

        try {
            while (this.messageQueue.length > 0) {
                if (!this.isReady || !this.sock) {
                    console.log('[WhatsApp] ⏳ Pausing queue: Client not ready.');
                    return; // Will exit and trigger finally block
                }

                const item = this.messageQueue[0];
                const success = await this.attemptSend(item.article);

                if (success) {
                    this.messageQueue.shift(); // Remove from queue
                    // Cooldown between messages
                    await new Promise(r => setTimeout(r, QUEUE_PROCESS_INTERVAL));
                } else {
                    item.retries++;
                    if (item.retries >= MAX_SEND_RETRIES) {
                        console.error(`[WhatsApp] ❌ Giving up on article after ${MAX_SEND_RETRIES} retries: ${item.article.title}`);
                        this.messageQueue.shift();
                    } else {
                        console.log(`[WhatsApp] ⏳ Retrying article (${item.retries}/${MAX_SEND_RETRIES}) in 30s: ${item.article.title}`);
                        await new Promise(r => setTimeout(r, 30000)); // Wait longer before retry
                    }
                }
            }
        } catch (error: any) {
             console.error(`[WhatsApp] ⚠️ Unexpected error in queue processing: ${error.message}`);
        } finally {
            // Guarantee the queue is unlocked regardless of errors
            this.isProcessingQueue = false;
        }
    }

    /**
     * Single send attempt
     */
    private async attemptSend(article: any): Promise<boolean> {
        try {
            const text = this.buildMessage(article);
            const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

            console.log(`[WhatsApp] 📤 Attempting to send: ${article.title}`);

            // 1. Wait for page visibility
            await this.waitForArticlePage(articleUrl, 3);

            // 2. Prepare preview
            let jpegThumbnail: Buffer | undefined;
            if (article.imageUrl) {
                const fullImageUrl = article.imageUrl.startsWith('http')
                    ? article.imageUrl
                    : `${this.platformUrl}${article.imageUrl}`;
                jpegThumbnail = await this.fetchThumbnail(fullImageUrl);
            }

            // 3. Send with rich preview if possible
            if (jpegThumbnail && this.sock?.user?.id) {
                try {
                    const { generateWAMessageFromContent, proto } = await import('@whiskeysockets/baileys');
                    const msg = generateWAMessageFromContent(
                        this.channelJid!,
                        proto.Message.fromObject({
                            extendedTextMessage: {
                                text,
                                matchedText: articleUrl,
                                canonicalUrl: articleUrl,
                                title: article.title || '',
                                description: this.stripHtml(article.excerpt || '').substring(0, 200),
                                jpegThumbnail,
                                thumbnailWidth: 960,
                                thumbnailHeight: 540,
                                previewType: 0,
                            }
                        }),
                        { userJid: this.sock.user.id }
                    );

                    await withTimeout(
                        this.sock.relayMessage(this.channelJid!, msg.message!, {
                            messageId: msg.key.id!
                        }),
                        20000,
                        "WhatsApp API timeout (relayMessage)"
                    );
                    
                    console.log(`[WhatsApp] ✅ Sent successfully with rich preview: ${article.title}`);
                    return true;
                } catch (err: any) {
                    console.warn(`[WhatsApp] ⚠️ Rich preview failed, falling back to text: ${err.message}`);
                }
            }

            // 4. Fallback: plain text
            await withTimeout(
                this.sock.sendMessage(this.channelJid!, { text }),
                20000,
                "WhatsApp API timeout (sendMessage)"
            );
            console.log(`[WhatsApp] ✅ Sent successfully (text only): ${article.title}`);
            return true;

        } catch (error: any) {
            console.error(`[WhatsApp] ❌ Send attempt failed: ${error.message}`);
            return false;
        }
    }
}

export const whatsappService = new WhatsAppService();
