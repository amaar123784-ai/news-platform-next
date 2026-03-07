/**
 * Social Publisher Service
 *
 * Unified entry point for publishing articles to all social media platforms.
 * Replaces the duplicated social posting blocks in article.routes.ts.
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
    postId?: string;
    error?: string;
}

const PLATFORMS = ['WhatsApp', 'Telegram', 'Facebook'] as const;

/**
 * Publish an article to all configured social media channels.
 * Each platform posts independently — a failure in one does not block others.
 * Returns per-platform outcomes so callers can persist delivery status.
 */
export async function publishToSocialChannels(article: ArticlePayload): Promise<PlatformResult[]> {
    const tasks: Array<{ name: string; fn: () => Promise<void> }> = [];

    try {
        const { whatsappService } = await import('./whatsapp.service.js');
        tasks.push({
            name: 'WhatsApp',
            fn: () => whatsappService.sendArticleToWhatsApp(article),
        });
    } catch { /* service unavailable */ }

    try {
        const { telegramService } = await import('./telegram.service.js');
        tasks.push({
            name: 'Telegram',
            fn: () => telegramService.sendArticleWithPhoto(article),
        });
    } catch { /* service unavailable */ }

    try {
        const { facebookService } = await import('./facebook.service.js');
        tasks.push({
            name: 'Facebook',
            fn: () => facebookService.postArticleToFacebook(article),
        });
    } catch { /* service unavailable */ }

    const settled = await Promise.allSettled(tasks.map(t => t.fn()));

    const platformResults: PlatformResult[] = settled.map((result, i) => {
        const name = tasks[i].name;
        if (result.status === 'fulfilled') {
            console.log(`[Social] ✅ ${name} posted article ${article.id}`);
            return { platform: name, success: true };
        } else {
            const errMsg = result.reason?.message || String(result.reason);
            console.error(`[Social] ❌ ${name} failed for article ${article.id}:`, errMsg);
            return { platform: name, success: false, error: errMsg };
        }
    });

    return platformResults;
}
