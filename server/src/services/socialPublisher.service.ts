/**
 * Social Publisher Service
 *
 * Unified entry point for publishing articles to all social media platforms.
 */

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
 * Publish an article to all configured social media channels.
 * Each platform posts independently — a failure in one does not block others.
 */
export async function publishToSocialChannels(article: ArticlePayload): Promise<PlatformResult[]> {
    const results: PlatformResult[] = [];

    // WhatsApp (Async Queue)
    try {
        const { whatsappService } = await import('./whatsapp.service.js');
        // WhatsApp is fire-and-forget to the internal queue which handles retries
        whatsappService.sendArticleToWhatsApp(article).catch(err => {
            console.error(`[Social] WhatsApp queue error for article ${article.id}:`, err.message);
        });
        results.push({ platform: 'WhatsApp', success: true }); // Means successfully queued
    } catch (err: any) {
        results.push({ platform: 'WhatsApp', success: false, error: 'Service unavailable' });
    }

    // Telegram
    try {
        const { telegramService } = await import('./telegram.service.js');
        const success = await telegramService.sendArticleWithPhoto(article);
        results.push({ platform: 'Telegram', success });
    } catch (err: any) {
        console.error(`[Social] Telegram failed for article ${article.id}:`, err.message);
        results.push({ platform: 'Telegram', success: false, error: err.message });
    }

    // Facebook
    try {
        const { facebookService } = await import('./facebook.service.js');
        const success = await facebookService.postArticleToFacebook(article);
        results.push({ platform: 'Facebook', success });
    } catch (err: any) {
        console.error(`[Social] Facebook failed for article ${article.id}:`, err.message);
        results.push({ platform: 'Facebook', success: false, error: err.message });
    }

    return results;
}
