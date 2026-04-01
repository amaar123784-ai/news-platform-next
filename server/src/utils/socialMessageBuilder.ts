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
const getFooter = (platform: 'TELEGRAM' | 'WHATSAPP' | 'FACEBOOK' | 'WEBHOOK') => {
    const links = {
        facebook: process.env.FACEBOOK_URL || 'https://www.facebook.com/profile.php?id=61586335597792',
        telegram: process.env.TELEGRAM_URL || 'https://t.me/voiceoftihama6',
        whatsapp: process.env.WHATSAPP_CHANNEL_URL || 'https://chat.whatsapp.com/Jtk05k0G8O81d861NJhSHU?mode=gi_t',
        x: process.env.X_URL || 'https://x.com/voiceoftihama'
    };

    const header = '\n\n---\n📱 تابعوا "صوت تهامة" عبر منصاتنا:\n';
    
    if (platform === 'TELEGRAM') {
        return `${header}` +
               `🔵 <a href="${links.facebook}">فيسبوك</a> | ` +
               `✈️ <a href="${links.telegram}">تيليجرام</a>\n` +
               `🟢 <a href="${links.whatsapp}">واتساب</a> | ` +
               `𝕏 <a href="${links.x}">تويتر</a>`;
    }

    // Default for plain text (WhatsApp & Facebook)
    return `${header}` +
           `🔵 فيسبوك: ${links.facebook}\n` +
           `✈️ تيليجرام: ${links.telegram}\n` +
           `🟢 واتساب: ${links.whatsapp}\n` +
           `𝕏 تويتر: ${links.x}`;
};

/**
 * Returns the standardized hashtags
 */
const getHashtags = (isBreaking: boolean, categorySlug?: string) => {
    const base = [
        '#صوت_تهامة', '#تهامة', '#اليمن', '#أخبار_اليمن', 
        '#الحديدة', '#حجة', '#تعز', '#ساحل_تهامة', 
        '#أخبار', '#News', '#YemenNews'
    ];
    
    if (isBreaking) base.push('#عاجل');
    
    // Add category as hashtag if available
    if (categorySlug) {
        const catTag = categorySlug === 'politics' ? '#السياسة' : 
                      categorySlug === 'economy' ? '#الاقتصاد' : 
                      categorySlug === 'sports' ? '#الرياضة' : 
                      categorySlug === 'culture' ? '#الثقافة' : null;
        if (catTag) base.push(catTag);
    }

    return '\n\n' + Array.from(new Set(base)).join(' ');
};

/**
 * Build a unified message for social platforms
 */
export function buildUnifiedMessage(
    article: any, 
    platform: 'TELEGRAM' | 'WHATSAPP' | 'FACEBOOK' | 'WEBHOOK', 
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
