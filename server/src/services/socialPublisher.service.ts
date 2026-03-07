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

const PLATFORMS = ['WhatsApp', 'Telegram', 'Facebook'] as const;

/**
 * Publish an article to all configured social media channels.
 * Each platform posts independently — a failure in one does not block others.
 */
export async function publishToSocialChannels(article: ArticlePayload): Promise<void> {
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

    const results = await Promise.allSettled(tasks.map(t => t.fn()));

    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            console.log(`[Social] ✅ ${tasks[i].name} posted article ${article.id}`);
        } else {
            console.error(`[Social] ❌ ${tasks[i].name} failed for article ${article.id}:`, result.reason?.message || result.reason);
        }
    });
}
