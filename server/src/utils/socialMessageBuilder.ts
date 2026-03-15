import { SocialPlatform } from '@prisma/client';

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
 * Standard Footer with Voice of Tihama social links
 */
const getFooter = () => {
    const links = {
        facebook: process.env.FACEBOOK_URL || 'https://facebook.com/voiceoftihama',
        telegram: process.env.TELEGRAM_URL || 'https://t.me/voiceoftihama',
        whatsapp: process.env.WHATSAPP_CHANNEL_URL || 'https://whatsapp.com/channel/voiceoftihama',
        x: process.env.X_URL || 'https://x.com/voiceoftihama'
    };

    return `\n\n---\n📱 تابعوا "صوت تهامة" عبر منصاتنا:\n` +
           `🔵 فيسبوك: ${links.facebook}\n` +
           `✈️ تيليجرام: ${links.telegram}\n` +
           `🟢 واتساب: ${links.whatsapp}\n` +
           `𝕏 تويتر: ${links.x}`;
};

/**
 * Unified Message Builder for Social Platforms
 */
export function buildUnifiedMessage(article: any, platform: SocialPlatform, siteUrl: string): string {
    const rawTitle = article.aiRewrittenTitle || article.title || '';
    const rawExcerpt = article.aiRewrittenExcerpt || article.excerpt || '';
    const articleUrl = `${siteUrl}/article/${article.slug || article.id}`;

    // Clean data
    const title = stripHtml(rawTitle);
    const excerpt = stripHtml(rawExcerpt);

    if (platform === SocialPlatform.TELEGRAM) {
        // HTML Formatting for Telegram
        const head = `🔴 <b>${escapeHtml(title)}</b>`;
        const body = `📝 ${escapeHtml(excerpt)}`;
        const cta = `🔗 <b>التفاصيل كاملة:</b> <a href="${articleUrl}">اضغط هنا</a>`;
        
        return `${head}\n\n${body}\n\n${cta}${getFooter()}`;
    } else {
        // Plain Text Formatting for WhatsApp and Facebook
        const head = `🔴 *${title}*`;
        const body = `📝 ${excerpt}`;
        const cta = `🔗 التفاصيل كاملة:\n${articleUrl}`;

        return `${head}\n\n${body}\n\n${cta}${getFooter()}`;
    }
}
