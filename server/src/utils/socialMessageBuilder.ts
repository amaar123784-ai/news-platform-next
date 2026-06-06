// ============================================================================
// types.ts - أنواع البيانات
// ============================================================================

export type Platform = 'TELEGRAM' | 'WHATSAPP' | 'FACEBOOK' | 'X' | 'WEBHOOK';

export interface Article {
  id: string | number;
  slug?: string;
  title: string;
  aiRewrittenTitle?: string;
  excerpt?: string;
  aiRewrittenExcerpt?: string;
  isBreaking?: boolean;
  category?: {
    slug?: string;
    name?: string;
  };
}

export interface SocialLinks {
  whatsappChannel: string;
  whatsappGroup: string;
  telegram: string;
  facebook: string;
  x: string;
}

export interface MessageConfig {
  maxExcerptLength: number;
  enableFooter: boolean;
  enableHashtags: boolean;
  language: 'ar' | 'en';
}

// ============================================================================
// config.ts - الإعدادات والروابط
// ============================================================================

const DEFAULT_LINKS: SocialLinks = {
  whatsappChannel: 'https://whatsapp.com/channel/0029VbCPmHj1HspqfKinlk16',
  whatsappGroup: 'https://chat.whatsapp.com/Jtk05k0G8O81d861NJhSHU',
  telegram: 'https://t.me/voiceoftihama6',
  facebook: 'https://www.facebook.com/profile.php?id=61586335597792',
  x: 'https://x.com/voiceoftihama',
};

export function getSocialLinks(): SocialLinks {
  return {
    whatsappChannel: process.env.WHATSAPP_CHANNEL_URL || DEFAULT_LINKS.whatsappChannel,
    whatsappGroup: process.env.WHATSAPP_GROUP_URL || DEFAULT_LINKS.whatsappGroup,
    telegram: process.env.TELEGRAM_URL || DEFAULT_LINKS.telegram,
    facebook: process.env.FACEBOOK_URL || DEFAULT_LINKS.facebook,
    x: process.env.X_URL || DEFAULT_LINKS.x,
  };
}

export const DEFAULT_CONFIG: MessageConfig = {
  maxExcerptLength: 300,
  enableFooter: true,
  enableHashtags: true,
  language: 'ar',
};

// ============================================================================
// utils.ts - أدوات مساعدة
// ============================================================================

export class TextUtils {
  static stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
  }

  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  static bold(text: string, platform: Platform): string {
    switch (platform) {
      case 'TELEGRAM':
        return `<b>${text}</b>`;
      case 'WHATSAPP':
        return `*${text}*`;
      case 'X':
        return text; // X doesn't support formatting in the same way
      default:
        return text;
    }
  }

  static link(text: string, url: string, platform: Platform): string {
    switch (platform) {
      case 'TELEGRAM':
        return `<a href="${url}">${TextUtils.escapeHtml(text)}</a>`;
      case 'WHATSAPP':
      case 'FACEBOOK':
      case 'X':
      default:
        return `${text}: ${url}`;
    }
  }

  static emojiBullet(emoji: string, text: string): string {
    return `${emoji} ${text}`;
  }
}

// ============================================================================
// hashtags.ts - إدارة الهاشتاقات
// ============================================================================

export class HashtagManager {
  private static readonly BASE_HASHTAGS = [
    '#صوت_تهامة',
    '#تهامة',
    '#اليمن',
    '#أخبار_اليمن',
    '#الحديدة',
    '#حجة',
    '#تعز',
    '#ساحل_تهامة',
    '#أخبار',
    '#News',
    '#YemenNews',
  ] as const;

  private static readonly CATEGORY_MAP: Record<string, string> = {
    politics: '#السياسة',
    economy: '#الاقتصاد',
    sports: '#الرياضة',
    culture: '#الثقافة',
    health: '#الصحة',
    technology: '#التكنولوجيا',
    education: '#التعليم',
  };

  static generate(isBreaking: boolean, categorySlug?: string): string {
    const tags = new Set<string>([...this.BASE_HASHTAGS]);

    if (isBreaking) {
      tags.add('#عاجل');
      tags.add('#BreakingNews');
    }

    if (categorySlug && this.CATEGORY_MAP[categorySlug]) {
      tags.add(this.CATEGORY_MAP[categorySlug]);
    }

    return '\n\n' + Array.from(tags).join(' ');
  }
}

// ============================================================================
// footer.ts - تذييل الرسائل
// ============================================================================

export class FooterBuilder {
  private links: SocialLinks;

  constructor(links?: SocialLinks) {
    this.links = links || getSocialLinks();
  }

  build(platform: Platform): string {
    if (platform === 'TELEGRAM') {
      return this.buildTelegramFooter();
    }
    return this.buildPlainTextFooter();
  }

  private buildTelegramFooter(): string {
    const { links } = this;
    return [
      '',
      '━━━━━━━━━━━━━━━',
      '📱 <b>تابعوا "صوت تهامة" عبر منصاتنا:</b>',
      '',
      `🟢 ${TextUtils.link('قناة واتس آب', links.whatsappChannel, 'TELEGRAM')} | ` +
        `💬 ${TextUtils.link('مجموعة واتس آب', links.whatsappGroup, 'TELEGRAM')}`,
      `✈️ ${TextUtils.link('تيليجرام', links.telegram, 'TELEGRAM')} | ` +
        `🔵 ${TextUtils.link('فيسبوك', links.facebook, 'TELEGRAM')} | ` +
        `𝕏 ${TextUtils.link('منصة X', links.x, 'TELEGRAM')}`,
    ].join('\n');
  }

  private buildPlainTextFooter(): string {
    const { links } = this;
    return [
      '',
      '━━━━━━━━━━━━━━━',
      '📱 تابعوا "صوت تهامة" عبر منصاتنا:',
      '',
      `🟢 قناة واتس آب: ${links.whatsappChannel}`,
      `💬 مجموعة واتس آب: ${links.whatsappGroup}`,
      `✈️ تيليجرام: ${links.telegram}`,
      `🔵 فيسبوك: ${links.facebook}`,
      `𝕏 منصة X: ${links.x}`,
    ].join('\n');
  }
}

// ============================================================================
// strategies.ts - استراتيجيات المنصات (Strategy Pattern)
// ============================================================================

export interface PlatformStrategy {
  formatTitle(title: string): string;
  formatExcerpt(excerpt: string): string;
  formatLink(url: string): string;
  formatBreakingBadge(): string;
  getDivider(): string;
}

abstract class BaseStrategy implements PlatformStrategy {
  abstract formatTitle(title: string): string;
  abstract formatExcerpt(excerpt: string): string;
  abstract formatLink(url: string): string;
  
  formatBreakingBadge(): string {
    return '🔴 عاجل';
  }
  
  getDivider(): string {
    return '\n\n';
  }
}

class TelegramStrategy extends BaseStrategy {
  formatTitle(title: string): string {
    return `🔴 <b>${TextUtils.escapeHtml(title)}</b>`;
  }

  formatExcerpt(excerpt: string): string {
    return `📝 ${TextUtils.escapeHtml(excerpt)}`;
  }

  formatLink(url: string): string {
    return `🔗 <b>التفاصيل كاملة:</b> <a href="${url}">اضغط هنا للقراءة</a>`;
  }

  formatBreakingBadge(): string {
    return '🔴 <b>عاجل</b>';
  }
}

class WhatsAppStrategy extends BaseStrategy {
  formatTitle(title: string): string {
    return `🔴 *${title}*`;
  }

  formatExcerpt(excerpt: string): string {
    return `📝 ${excerpt}`;
  }

  formatLink(url: string): string {
    return `🔗 *التفاصيل كاملة:*\n${url}`;
  }
}

class FacebookStrategy extends BaseStrategy {
  formatTitle(title: string): string {
    return `🔴 ${title}`;
  }

  formatExcerpt(excerpt: string): string {
    return `📝 ${excerpt}`;
  }

  formatLink(url: string): string {
    return `🔗 التفاصيل كاملة:\n${url}`;
  }
}

class XStrategy extends BaseStrategy {
  formatTitle(title: string): string {
    return `🔴 ${title}`;
  }

  formatExcerpt(excerpt: string): string {
    // X has character limit, keep it concise
    return excerpt;
  }

  formatLink(url: string): string {
    return url; // Keep it minimal for X
  }
}

export class StrategyFactory {
  private static strategies: Map<Platform, PlatformStrategy> = new Map([
    ['TELEGRAM', new TelegramStrategy()],
    ['WHATSAPP', new WhatsAppStrategy()],
    ['FACEBOOK', new FacebookStrategy()],
    ['X', new XStrategy()],
    ['WEBHOOK', new FacebookStrategy()], // Default to Facebook style
  ]);

  static get(platform: Platform): PlatformStrategy {
    const strategy = this.strategies.get(platform);
    if (!strategy) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return strategy;
  }

  static register(platform: Platform, strategy: PlatformStrategy): void {
    this.strategies.set(platform, strategy);
  }
}

// ============================================================================
// builder.ts - البناء الرئيسي
// ============================================================================

export class UnifiedMessageBuilder {
  private config: MessageConfig;
  private footerBuilder: FooterBuilder;

  constructor(config: Partial<MessageConfig> = {}, links?: SocialLinks) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.footerBuilder = new FooterBuilder(links);
  }

  build(article: Article, platform: Platform, siteUrl: string): string {
    const strategy = StrategyFactory.get(platform);
    const articleUrl = this.buildArticleUrl(article, siteUrl);
    
    const title = article.aiRewrittenTitle || article.title || 'صوت تهامة';
    const excerpt = article.aiRewrittenExcerpt || article.excerpt || '';
    
    const cleanTitle = TextUtils.stripHtml(title);
    const cleanExcerpt = TextUtils.truncate(
      TextUtils.stripHtml(excerpt),
      this.config.maxExcerptLength
    );

    const parts: string[] = [];

    // Breaking news badge
    if (article.isBreaking) {
      parts.push(strategy.formatBreakingBadge());
    }

    // Title
    parts.push(strategy.formatTitle(cleanTitle));

    // Divider
    parts.push(strategy.getDivider());

    // Excerpt
    if (cleanExcerpt) {
      parts.push(strategy.formatExcerpt(cleanExcerpt));
      parts.push(strategy.getDivider());
    }

    // Link
    parts.push(strategy.formatLink(articleUrl));

    // Footer
    if (this.config.enableFooter) {
      parts.push(this.footerBuilder.build(platform));
    }

    // Hashtags
    if (this.config.enableHashtags) {
      parts.push(HashtagManager.generate(!!article.isBreaking, article.category?.slug));
    }

    return parts.join('');
  }

  private buildArticleUrl(article: Article, siteUrl: string): string {
    const slug = article.slug || article.id;
    return `${siteUrl.replace(/\/$/, '')}/article/${slug}`;
  }
}

// ============================================================================
// index.ts - الواجهة الرئيسية (API المتوافق مع الكود القديم)
// ============================================================================

export function buildUnifiedMessage(
  article: Article,
  platform: Platform,
  siteUrl: string,
  config?: Partial<MessageConfig>
): string {
  const builder = new UnifiedMessageBuilder(config);
  return builder.build(article, platform, siteUrl);
}
