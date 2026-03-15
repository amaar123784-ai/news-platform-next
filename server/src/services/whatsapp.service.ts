// @ts-ignore
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { PrismaClient, SocialPlatform, SocialPostStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
/** Interval between processing messages in the queue (ms) to avoid rate limiting. Default base: 5s */
const QUEUE_PROCESS_BASE_INTERVAL = 5000;
/** Max delay for jitter (ms). Will add random value up to this to base interval */
const QUEUE_PROCESS_JITTER_MAX = 7000;
/** Max reconnection delay (ms) - 2 minutes */
const MAX_RECONNECT_DELAY = 120000;

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
    private reconnectAttempts: number = 0;

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
                printQRInTerminal: false,
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
                        this.reconnectAttempts++;
                        // Exponential backoff: 5s, 10s, 20s, 40s... up to 2m
                        const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), MAX_RECONNECT_DELAY);
                        console.log(`[WhatsApp] Reconnecting in ${delay / 1000}s (Attempt ${this.reconnectAttempts})...`);
                        setTimeout(() => this.initializeClient(), delay);
                    } else {
                        console.error('[WhatsApp] Logged out or critical error. Please check whatsapp-auth folder.');
                        this.reconnectAttempts = 0;
                    }
                }

                if (connection === 'open') {
                    console.log('[WhatsApp] ✅ Connected successfully!');
                    this.isReady = true;
                    this.reconnectAttempts = 0; // Reset counter on success
                    await this.listChannels();
                    await this.listGroups();

                    // Start processing queue if items exist
                    if (this.messageQueue.length > 0) {
                        this.processQueue();
                    }
                }
            });

        } catch (error: any) {
            console.error('[WhatsApp] Failed to initialize:', error.message);
            this.reconnectAttempts++;
            const delay = Math.min(10000 * this.reconnectAttempts, MAX_RECONNECT_DELAY);
            setTimeout(() => this.initializeClient(), delay);
        }
    }

    /**
     * Get a random human-like delay to avoid bot detection
     */
    private getJitterDelay(): number {
        return QUEUE_PROCESS_BASE_INTERVAL + Math.floor(Math.random() * QUEUE_PROCESS_JITTER_MAX);
    }

    /**
     * List all participating groups
     */
    private async listGroups(): Promise<void> {
        try {
            console.log('[WhatsApp] Attempting to fetch groups...');
            if (typeof this.sock?.groupFetchAllParticipating === 'function') {
                const groups = await this.sock.groupFetchAllParticipating();
                console.log('\n========= WHATSAPP GROUPS =========');
                let count = 0;
                for (const id in groups) {
                    console.log(`- ${groups[id].subject}`);
                    console.log(`  ID: ${id}`);
                    count++;
                }
                if (count === 0) console.log('  No groups found.');
                console.log('===================================\n');
            }
        } catch (error: any) {
             console.log('[WhatsApp] Could not list groups:', error.message);
        }
    }

    /**
     * List all subscribed newsletters/channels
     */
    private async listChannels(): Promise<void> {
        try {
            console.log('[WhatsApp] Attempting to fetch channels...');
            
            // Log available methods to see what Baileys version supports
            const newsletterMethods = Object.keys(this.sock || {}).filter(k => k.toLowerCase().includes('newsletter'));
            console.log('[WhatsApp] Available newsletter methods:', newsletterMethods);

            let newsletters = [];
            
            if (typeof this.sock?.newsletterSubscribed === 'function') {
                newsletters = await this.sock.newsletterSubscribed();
            } else if (typeof this.sock?.newsletterSubscriptions === 'function') {
                newsletters = await this.sock.newsletterSubscriptions();
            }

            console.log('\n--- WhatsApp Channels (Newsletters) ---');
            if (newsletters && newsletters.length > 0) {
                newsletters.forEach((nl: any) => {
                    console.log(`  - ${nl.name || 'Unnamed'}: ${nl.id}`);
                });
            } else {
                console.log('  No subscribed channels found (or could not fetch).');
            }
            console.log('---------------------------------------\n');
            
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
                    return; 
                }

                const item = this.messageQueue[0];
                
                // Track start of processing
                await this.updatePostStatus(item.article.id, SocialPostStatus.PROCESSING);

                const success = await this.attemptSend(item.article);

                if (success) {
                    this.messageQueue.shift(); // Remove from queue
                    
                    // Real success update
                    await this.updatePostStatus(item.article.id, SocialPostStatus.POSTED);

                    // ANTI-BAN: Dynamic human-like delay
                    const delay = this.getJitterDelay();
                    console.log(`[WhatsApp] ⏳ Waiting ${delay / 1000}s before next message...`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    item.retries++;
                    if (item.retries >= MAX_SEND_RETRIES) {
                        console.error(`[WhatsApp] ❌ Giving up on article after ${MAX_SEND_RETRIES} retries: ${item.article.title}`);
                        this.messageQueue.shift();
                        
                        // Real failure update
                        await this.updatePostStatus(item.article.id, SocialPostStatus.FAILED, `Failed after ${MAX_SEND_RETRIES} retries`);
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
        // ... (rest of attemptSend)
    }

    /**
     * Update SocialPost record in Database
     */
    private async updatePostStatus(articleId: string, status: SocialPostStatus, error?: string): Promise<void> {
        try {
            await prisma.socialPost.upsert({
                where: {
                    articleId_platform: {
                        articleId,
                        platform: SocialPlatform.WHATSAPP
                    }
                },
                update: {
                    status,
                    errorMessage: error || null,
                    postedAt: status === SocialPostStatus.POSTED ? new Date() : undefined,
                    retryCount: { increment: status === SocialPostStatus.FAILED ? 1 : 0 }
                },
                create: {
                    articleId,
                    platform: SocialPlatform.WHATSAPP,
                    status,
                    errorMessage: error || null
                }
            });
        } catch (err: any) {
            console.error(`[WhatsApp] ❌ Failed to update SocialPost DB: ${err.message}`);
        }
    }
}

export const whatsappService = new WhatsAppService();
