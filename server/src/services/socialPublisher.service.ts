/**
 * Social Publisher Service
 *
 * Unified entry point for publishing articles to all social media platforms.
 * Tracks every attempt in the SocialPost database table.
 */

import { PrismaClient, SocialPlatform, SocialPostStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface ArticlePayload {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string | null;
    status: string;
    [key: string]: any;
}

export interface PlatformResult {
    platform: string;
    success: boolean;
    error?: string;
}

/**
 * Update or create a SocialPost record
 */
async function updateStatus(articleId: string, platform: SocialPlatform, status: SocialPostStatus, error?: string) {
    try {
        await prisma.socialPost.upsert({
            where: {
                articleId_platform: { articleId, platform }
            },
            update: {
                status,
                errorMessage: error || null,
                postedAt: status === SocialPostStatus.POSTED ? new Date() : undefined,
                retryCount: { increment: (status === SocialPostStatus.FAILED) ? 1 : 0 }
            },
            create: {
                articleId,
                platform,
                status,
                errorMessage: error || null
            }
        });
    } catch (err: any) {
        console.error(`[Social] DB Update failed for ${platform}:`, err.message);
    }
}

/**
 * Publish an article to all configured social media channels.
 */
export async function publishToSocialChannels(article: ArticlePayload): Promise<PlatformResult[]> {
    const results: PlatformResult[] = [];

    // 1. WhatsApp (Async Queue)
    // We create the PENDING record here, the WhatsApp queue will update it to PROCESSING/POSTED/FAILED
    try {
        await updateStatus(article.id, SocialPlatform.WHATSAPP, SocialPostStatus.PENDING);
        const { whatsappService } = await import('./whatsapp.service.js');
        
        // Fire and forget to queue
        whatsappService.sendArticleToWhatsApp(article).catch(err => {
            console.error(`[Social] WhatsApp queuing error:`, err.message);
            updateStatus(article.id, SocialPlatform.WHATSAPP, SocialPostStatus.FAILED, err.message);
        });
        
        results.push({ platform: 'WhatsApp', success: true }); // Queued successfully
    } catch (err: any) {
        await updateStatus(article.id, SocialPlatform.WHATSAPP, SocialPostStatus.FAILED, 'Service unavailable');
        results.push({ platform: 'WhatsApp', success: false, error: 'Service unavailable' });
    }

    // 2. Telegram (Sync)
    try {
        await updateStatus(article.id, SocialPlatform.TELEGRAM, SocialPostStatus.PROCESSING);
        const { telegramService } = await import('./telegram.service.js');
        const result = await telegramService.sendArticleWithPhoto(article);
        
        const status = result.success ? SocialPostStatus.POSTED : SocialPostStatus.FAILED;
        const error = result.success ? undefined : result.error;
        
        await updateStatus(article.id, SocialPlatform.TELEGRAM, status, error);
        results.push({ platform: 'Telegram', success: result.success, error });
    } catch (err: any) {
        console.error(`[Social] Telegram failed:`, err.message);
        await updateStatus(article.id, SocialPlatform.TELEGRAM, SocialPostStatus.FAILED, err.message);
        results.push({ platform: 'Telegram', success: false, error: err.message });
    }

    // 3. Facebook (Sync)
    try {
        await updateStatus(article.id, SocialPlatform.FACEBOOK, SocialPostStatus.PROCESSING);
        const { facebookService } = await import('./facebook.service.js');
        const success = await facebookService.postArticleToFacebook(article);
        
        const status = success ? SocialPostStatus.POSTED : SocialPostStatus.FAILED;
        const error = success ? undefined : 'Service returned false (check logs)';

        await updateStatus(article.id, SocialPlatform.FACEBOOK, status, error);
        results.push({ platform: 'Facebook', success, error });
    } catch (err: any) {
        console.error(`[Social] Facebook failed:`, err.message);
        await updateStatus(article.id, SocialPlatform.FACEBOOK, SocialPostStatus.FAILED, err.message);
        results.push({ platform: 'Facebook', success: false, error: err.message });
    }

    return results;
}
