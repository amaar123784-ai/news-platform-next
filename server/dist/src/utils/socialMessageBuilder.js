/**
 * Unified Social Media Message Builder
 *
 * Standardizes the "Voice of Tihama" brand voice across all distribution channels.
 */
/**
 * Strips all HTML tags from a string
 */
function stripHtml(html) {
    if (!html)
        return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
}
/**
 * Escapes characters for HTML parse_mode
 */
function escapeHtml(text) {
    if (!text)
        return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
/**
 * Returns the standardized footer with social links
 */
const getFooter = (platform) => {
    const links = {
        whatsappChannel: process.env.WHATSAPP_CHANNEL_URL || 'https://whatsapp.com/channel/0029VbCPmHj1HspqfKinlk16',
        whatsappGroup: process.env.WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/Jtk05k0G8O81d861NJhSHU',
        telegram: process.env.TELEGRAM_URL || 'https://t.me/voiceoftihama6',
        facebook: process.env.FACEBOOK_URL || 'https://www.facebook.com/profile.php?id=61586335597792',
        x: process.env.X_URL || 'https://x.com/voiceoftihama'
    };
    if (platform === 'TELEGRAM') {
        const header = '\n\n---\n📱 <b>تابعوا "صوت تهامة" عبر منصاتنا:</b>\n';
        return `${header}` +
            `🟢 <a href="${links.whatsappChannel}">قناة واتس آب</a> | ` +
            `💬 <a href="${links.whatsappGroup}">مجموعة واتس آب</a>\n` +
            `✈️ <a href="${links.telegram}">تيليجرام</a> | ` +
            `🔵 <a href="${links.facebook}">فيسبوك</a> | ` +
            `𝕏 <a href="${links.x}">منصة X</a>`;
    }
    // Default for plain text (WhatsApp & Facebook)
    const header = '\n\n---\n📱 تابعوا "صوت تهامة" عبر منصاتنا:\n\n';
    return `${header}` +
        `🟢 قناة واتس آب: ${links.whatsappChannel}\n` +
        `💬 ومجموعة واتس آب: ${links.whatsappGroup}\n` +
        `✈️ تيليجرام: ${links.telegram}\n` +
        `🔵 فيسبوك: ${links.facebook}\n` +
        `𝕏 منصة X: ${links.x}`;
};
/**
 * Returns the standardized hashtags
 */
const getHashtags = (isBreaking, categorySlug) => {
    const base = [
        '#صوت_تهامة', '#تهامة', '#اليمن', '#أخبار_اليمن',
        '#الحديدة', '#حجة', '#تعز', '#ساحل_تهامة',
        '#أخبار', '#News', '#YemenNews'
    ];
    if (isBreaking)
        base.push('#عاجل');
    // Add category as hashtag if available
    if (categorySlug) {
        const catTag = categorySlug === 'politics' ? '#السياسة' :
            categorySlug === 'economy' ? '#الاقتصاد' :
                categorySlug === 'sports' ? '#الرياضة' :
                    categorySlug === 'culture' ? '#الثقافة' : null;
        if (catTag)
            base.push(catTag);
    }
    return '\n\n' + Array.from(new Set(base)).join(' ');
};
/**
 * Build a unified message for social platforms
 */
export function buildUnifiedMessage(article, platform, siteUrl) {
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
        const tags = getHashtags(!!article.isBreaking, article.category?.slug);
        return `${head}\n\n${body}\n\n${cta}${getFooter('TELEGRAM')}${tags}`;
    }
    if (platform === 'WHATSAPP') {
        const head = `🔴 *${cleanTitle}*`;
        const body = `📝 ${cleanExcerpt}`;
        const cta = `🔗 التفاصيل كاملة:\n${articleUrl}`;
        const tags = getHashtags(!!article.isBreaking, article.category?.slug);
        return `${head}\n\n${body}\n\n${cta}${getFooter('WHATSAPP')}${tags}`;
    }
    // Default for Facebook and Webhook (No special bolding characters)
    const head = `🔴 ${cleanTitle}`;
    const body = `📝 ${cleanExcerpt}`;
    const cta = `🔗 التفاصيل كاملة:\n${articleUrl}`;
    const tags = getHashtags(!!article.isBreaking, article.category?.slug);
    return `${head}\n\n${body}\n\n${cta}${getFooter('FACEBOOK')}${tags}`;
}
//# sourceMappingURL=socialMessageBuilder.js.map