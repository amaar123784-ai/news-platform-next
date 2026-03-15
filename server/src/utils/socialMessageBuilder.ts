/**
 * Unified Social Media Message Builder
 * 
 * Standardizes the "Voice of Tihama" brand voice across all distribution channels.
 */

/**
 * Strips all HTML tags from a string
 */
function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Escapes characters for HTML parse_mode
 */
function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Returns the standardized footer with social links
 */
const getFooter = (isHtml: boolean) => {
    const links = {
        facebook: process.env.FACEBOOK_URL || 'https://facebook.com/voiceoftihama',
        telegram: process.env.TELEGRAM_URL || 'https://t.me/voiceoftihama',
        whatsapp: process.env.WHATSAPP_CHANNEL_URL || 'https://whatsapp.com/channel/voiceoftihama',
        x: process.env.X_URL || 'https://x.com/voiceoftihama'
    };

    const header = '\n\n---\n📱 تابعوا "صوت تهامة" عبر منصاتنا:\n';
    
    if (isHtml) {
        return `${header}` +
               `🔵 <a href="${links.facebook}">فيسبوك</a> | ` +
               `✈️ <a href="${links.telegram}">تيليجرام</a>\n` +
               `🟢 <a href="${links.whatsapp}">واتساب</a> | ` +
               `𝕏 <a href="${links.x}">تويتر</a>`;
    }

    return `${header}` +
           `🔵 فيسبوك: ${links.facebook}\n` +
           `✈️ تيليجرام: ${links.telegram}\n` +
           `🟢 واتساب: ${links.whatsapp}\n` +
           `𝕏 تويتر: ${links.x}`;
};

/**
 * Build a unified message for social platforms
 */
export function buildUnifiedMessage(
    article: any, 
    platform: 'TELEGRAM' | 'WHATSAPP' | 'WEBHOOK', 
    siteUrl: string
): string {
    const rawTitle = article.aiRewrittenTitle || article.title || 'صوت تهامة';
    const rawExcerpt = article.aiRewrittenExcerpt || article.excerpt || '';
    const articleUrl = `${siteUrl}/article/${article.slug || article.id}`;

    // 1. Clean and Prepare Data
    const cleanTitle = stripHtml(rawTitle);
    const cleanExcerpt = stripHtml(rawExcerpt);

    // 2. Platform Specific Formatting
    if (platform === 'TELEGRAM') {
        const head = `🔴 <b>${escapeHtml(cleanTitle)}</b>`;
        const body = `📝 ${escapeHtml(cleanExcerpt)}`;
        const cta = `🔗 <b>التفاصيل كاملة:</b> <a href="${articleUrl}">اضغط هنا</a>`;
        
        return `${head}\n\n${body}\n\n${cta}${getFooter(true)}`;
    } 
    
    // Default for WhatsApp and Webhook
    const head = `🔴 *${cleanTitle}*`;
    const body = `📝 ${cleanExcerpt}`;
    const cta = `🔗 التفاصيل كاملة:\n${articleUrl}`;

    return `${head}\n\n${body}\n\n${cta}${getFooter(false)}`;
}
