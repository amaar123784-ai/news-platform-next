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
export declare function getSocialLinks(): SocialLinks;
export declare const DEFAULT_CONFIG: MessageConfig;
export declare class TextUtils {
    static stripHtml(html: string | null | undefined): string;
    static escapeHtml(text: string | null | undefined): string;
    static truncate(text: string, maxLength: number): string;
    static bold(text: string, platform: Platform): string;
    static link(text: string, url: string, platform: Platform): string;
    static emojiBullet(emoji: string, text: string): string;
}
export declare class HashtagManager {
    private static readonly BASE_HASHTAGS;
    private static readonly CATEGORY_MAP;
    static generate(isBreaking: boolean, categorySlug?: string): string;
}
export declare class FooterBuilder {
    private links;
    constructor(links?: SocialLinks);
    build(platform: Platform): string;
    private buildTelegramFooter;
    private buildPlainTextFooter;
}
export interface PlatformStrategy {
    formatTitle(title: string): string;
    formatExcerpt(excerpt: string): string;
    formatLink(url: string): string;
    formatBreakingBadge(): string;
    getDivider(): string;
}
export declare class StrategyFactory {
    private static strategies;
    static get(platform: Platform): PlatformStrategy;
    static register(platform: Platform, strategy: PlatformStrategy): void;
}
export declare class UnifiedMessageBuilder {
    private config;
    private footerBuilder;
    constructor(config?: Partial<MessageConfig>, links?: SocialLinks);
    build(article: Article, platform: Platform, siteUrl: string): string;
    private buildArticleUrl;
}
export declare function buildUnifiedMessage(article: Article, platform: Platform, siteUrl: string, config?: Partial<MessageConfig>): string;
//# sourceMappingURL=socialMessageBuilder.d.ts.map