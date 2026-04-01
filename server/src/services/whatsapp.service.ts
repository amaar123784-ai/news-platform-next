// @ts-ignore
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { PrismaClient, SocialPlatform, SocialPostStatus } from '@prisma/client';
import { buildUnifiedMessage } from '../utils/socialMessageBuilder.js';

const prisma = new PrismaClient();

/** WhatsApp message limit */
const MESSAGE_MAX_LENGTH = 1024;
/** Delay (ms) before sending so article page/image are ready for link preview. */
const SEND_DELAY_MS = parseInt(process.env.WHATSAPP_SEND_DELAY_MS || '15000', 10) || 15000;
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
    private inviteCode: string | null = null;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';
    private messageQueue: any[] = [];
    private isProcessingQueue: boolean = false;
    private reconnectAttempts: number = 0;

    constructor() {
        const rawChannelId = process.env.WHATSAPP_CHANNEL_ID || '';

        // Support multiple formats:
        // 1. Full URL: https://whatsapp.com/channel/0029VbCPmHj1HspqfKinlk16
        // 2. Invite code only: 0029VbCPmHj1HspqfKinlk16
        // 3. Full JID: 120363XXXX@newsletter
        if (rawChannelId.includes('@newsletter')) {
            this.channelJid = rawChannelId;
            console.log('[WhatsApp] Channel JID set directly:', this.channelJid);
        } else if (rawChannelId) {
            // Extract invite code from URL or use raw value
            const urlMatch = rawChannelId.match(/channel\/([a-zA-Z0-9]+)/);
            this.inviteCode = urlMatch ? urlMatch[1] : rawChannelId;
            console.log('[WhatsApp] Will resolve channel from invite code:', this.inviteCode);
        }

        if (process.env.WHATSAPP_ENABLE === 'true') {
            this.initializeClient();
        } else {
            console.log('[WhatsApp] Service is disabled via .env (WHATSAPP_ENABLE).');
        }
    }

    /**
     * Resolve channel invite code to actual JID using Baileys newsletter API
     */
    private async resolveChannelJid(): Promise<void> {
        if (this.channelJid || !this.inviteCode || !this.sock) return;

        try {
            console.log(`[WhatsApp] 🔍 Resolving channel from invite code: ${this.inviteCode}...`);
            const metadata = await this.sock.newsletterMetadata('invite', this.inviteCode);

            if (metadata?.id) {
                this.channelJid = metadata.id;
                console.log(`[WhatsApp] ✅ Channel resolved: "${metadata.name || 'Unknown'}" → ${this.channelJid}`);
            } else {
                console.error('[WhatsApp] ❌ Could not resolve channel. No metadata returned.');
            }
        } catch (error: any) {
            console.error(`[WhatsApp] ❌ Failed to resolve channel invite code: ${error.message}`);

            // Try listing subscribed newsletters as fallback
            try {
                console.log('[WhatsApp] 🔄 Attempting to list all subscribed channels...');
                const newsletters = await this.sock.newsletterList();
                if (newsletters && newsletters.length > 0) {
                    console.log(`[WhatsApp] 📋 Found ${newsletters.length} channel(s):`);
                    newsletters.forEach((ch: any, i: number) => {
                        console.log(`  ${i + 1}. "${ch.name}" → JID: ${ch.id}`);
                    });
                    // Auto-select first channel if only one exists
                    if (newsletters.length === 1) {
                        this.channelJid = newsletters[0].id;
                        console.log(`[WhatsApp] ✅ Auto-selected channel: "${newsletters[0].name}"`);
                    }
                } else {
                    console.warn('[WhatsApp] ⚠️ No subscribed channels found.');
                }
            } catch (listError: any) {
                console.error(`[WhatsApp] ❌ Newsletter list also failed: ${listError.message}`);
            }
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

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

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
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    console.log(`[WhatsApp] Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);
                    this.isReady = false;

                    if (shouldReconnect) {
                        this.reconnectAttempts++;
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
                    this.reconnectAttempts = 0;

                    // Resolve channel JID if we only have invite code
                    await this.resolveChannelJid();

                    this.isReady = true;
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

    private getJitterDelay(): number {
        return QUEUE_PROCESS_BASE_INTERVAL + Math.floor(Math.random() * QUEUE_PROCESS_JITTER_MAX);
    }

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
                if (buffer.length > 5 * 1024 * 1024) return undefined; // Skip images over 5MB
                return buffer;
            } catch (err: any) {
                console.log(`[WhatsApp] ⚠️ Thumbnail fetch attempt ${attempt}/${retries} failed: ${err.message}`);
                if (attempt < retries) await new Promise(r => setTimeout(r, 2000));
            }
        }
        return undefined;
    }

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
                await this.updatePostStatus(item.article.id, SocialPostStatus.PROCESSING);
                const success = await this.attemptSend(item.article);

                if (success) {
                    this.messageQueue.shift();
                    await this.updatePostStatus(item.article.id, SocialPostStatus.POSTED);
                    const delay = this.getJitterDelay();
                    console.log(`[WhatsApp] ⏳ Waiting ${delay / 1000}s before next message...`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    item.retries++;
                    if (item.retries >= MAX_SEND_RETRIES) {
                        console.error(`[WhatsApp] ❌ Giving up on article after ${MAX_SEND_RETRIES} retries: ${item.article.title}`);
                        this.messageQueue.shift();
                        await this.updatePostStatus(item.article.id, SocialPostStatus.FAILED, `Failed after ${MAX_SEND_RETRIES} retries`);
                    } else {
                        console.log(`[WhatsApp] ⏳ Retrying article (${item.retries}/${MAX_SEND_RETRIES}) in 30s: ${item.article.title}`);
                        await new Promise(r => setTimeout(r, 30000));
                    }
                }
            }
        } catch (error: any) {
            console.error(`[WhatsApp] ⚠️ Unexpected error in queue processing: ${error.message}`);
        } finally {
            this.isProcessingQueue = false;
        }
    }

    private async attemptSend(article: any): Promise<boolean> {
        try {
            // UNIFIED MESSAGE BUILDER
            const text = buildUnifiedMessage(article, 'WHATSAPP', this.platformUrl);
            const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

            console.log(`[WhatsApp] 📤 Attempting to send: ${article.title}`);

            let jpegThumbnail: Buffer | undefined;
            if (article.imageUrl) {
                const fullImageUrl = article.imageUrl.startsWith('http')
                    ? article.imageUrl
                    : `${this.platformUrl}${article.imageUrl}`;
                jpegThumbnail = await this.fetchThumbnail(fullImageUrl);
            }

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
                                description: article.excerpt || '',
                                jpegThumbnail,
                                previewType: 1,
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
                    console.log(`[WhatsApp] ✅ Sent article with large preview: ${article.title}`);
                    return true;
                } catch (err: any) {
                    console.warn(`[WhatsApp] ⚠️ Rich preview failed, falling back to text: ${err.message}`);
                }
            }

            await withTimeout(
                this.sock.sendMessage(this.channelJid!, { text }),
                20000,
                "WhatsApp API timeout (sendMessage)"
            );
            return true;

        } catch (error: any) {
            console.error(`[WhatsApp] ❌ Send attempt failed: ${error.message}`);
            return false;
        }
    }

    private async updatePostStatus(articleId: string, status: SocialPostStatus, error?: string): Promise<void> {
        try {
            await prisma.socialPost.upsert({
                where: { articleId_platform: { articleId, platform: SocialPlatform.WHATSAPP } },
                update: {
                    status,
                    errorMessage: error || null,
                    postedAt: status === SocialPostStatus.POSTED ? new Date() : undefined,
                    retryCount: { increment: status === SocialPostStatus.FAILED ? 1 : 0 }
                },
                create: { articleId, platform: SocialPlatform.WHATSAPP, status, errorMessage: error || null }
            });
        } catch (err: any) {
            console.error(`[WhatsApp] ❌ Failed to update SocialPost DB: ${err.message}`);
        }
    }
}

export const whatsappService = new WhatsAppService();
