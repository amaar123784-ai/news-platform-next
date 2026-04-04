/**
 * Social Publisher Service
 *
 * Unified entry point for publishing articles to all social media platforms.
 */
/**
 * Publish an article to all configured social media channels.
 * Each platform posts independently — a failure in one does not block others.
 */
export async function publishToSocialChannels(article) {
    const results = [];
    // WhatsApp (Async Queue)
    try {
        const { whatsappService } = await import('./whatsapp.service.js');
        // WhatsApp is fire-and-forget to the internal queue which handles retries
        whatsappService.sendArticleToWhatsApp(article).catch(err => {
            console.error(`[Social] WhatsApp queue error for article ${article.id}:`, err.message);
        });
        results.push({ platform: 'WhatsApp', success: true }); // Means successfully queued
    }
    catch (err) {
        results.push({ platform: 'WhatsApp', success: false, error: 'Service unavailable' });
    }
    // Telegram
    try {
        const { telegramService } = await import('./telegram.service.js');
        const success = await telegramService.sendArticleWithPhoto(article);
        results.push({ platform: 'Telegram', success });
    }
    catch (err) {
        console.error(`[Social] Telegram failed for article ${article.id}:`, err.message);
        results.push({ platform: 'Telegram', success: false, error: err.message });
    }
    // Facebook
    try {
        const { facebookService } = await import('./facebook.service.js');
        const success = await facebookService.postArticleToFacebook(article);
        results.push({ platform: 'Facebook', success });
    }
    catch (err) {
        console.error(`[Social] Facebook failed for article ${article.id}:`, err.message);
        results.push({ platform: 'Facebook', success: false, error: err.message });
    }
    return results;
}
//# sourceMappingURL=socialPublisher.service.js.map