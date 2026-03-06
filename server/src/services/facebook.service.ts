/**
 * Facebook Page Service
 * Sends articles to a Facebook Page via the official Graph API.
 * Uses Page Access Token for authentication.
 */

const GRAPH_API = 'https://graph.facebook.com/v19.0';

class FacebookService {
    private pageId: string | null = null;
    private pageToken: string | null = null;
    private isEnabled: boolean = false;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';

    constructor() {
        this.pageId = process.env.FACEBOOK_PAGE_ID || null;
        this.pageToken = process.env.FACEBOOK_PAGE_TOKEN || null;
        this.isEnabled = process.env.FACEBOOK_ENABLE === 'true';

        if (this.isEnabled && this.pageId && this.pageToken) {
            console.log('[Facebook] ✅ Service enabled. Page ID:', this.pageId);
            this.verifyToken();
        } else if (this.isEnabled) {
            console.log('[Facebook] ⚠️ Enabled but missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_TOKEN.');
        } else {
            console.log('[Facebook] Service is disabled via .env (FACEBOOK_ENABLE).');
        }
    }

    /**
     * Verify the page token by fetching page info
     */
    private async verifyToken(): Promise<void> {
        try {
            const res = await fetch(`${GRAPH_API}/${this.pageId}?fields=name,id&access_token=${this.pageToken}`);
            const data = await res.json();
            if (data.name) {
                console.log(`[Facebook] ✅ Page verified: ${data.name} (${data.id})`);
            } else {
                console.error('[Facebook] ❌ Token verification failed:', data.error?.message || 'Unknown error');
                this.isEnabled = false;
            }
        } catch (error: any) {
            console.error('[Facebook] ❌ Failed to verify token:', error.message);
        }
    }

    /**
     * Strip HTML tags
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>?/gm, '').trim();
    }

    /**
     * Build Facebook post message
     */
    private buildMessage(article: any): string {
        const title = article.title || '';
        const excerpt = this.stripHtml(article.excerpt || '');
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

        return `📰 ${title}\n\n${excerpt}\n\n🔗 اقرأ المزيد على منصة صوت تهامة:\n${articleUrl}`;
    }

    /**
     * Post article to Facebook Page
     */
    public async postArticleToFacebook(article: any): Promise<void> {
        if (!this.isEnabled || !this.pageId || !this.pageToken) {
            console.log('[Facebook] Cannot post article: Service is not ready.');
            return;
        }

        try {
            const message = this.buildMessage(article);
            const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;

            console.log(`[Facebook] Posting article: ${article.title?.substring(0, 40)}...`);

            const response = await fetch(`${GRAPH_API}/${this.pageId}/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    link: articleUrl,
                    access_token: this.pageToken,
                }),
            });

            const data = await response.json();

            if (data.id) {
                console.log(`[Facebook] ✅ Posted article "${article.title?.substring(0, 40)}..." (Post ID: ${data.id})`);
            } else {
                console.error('[Facebook] ❌ Failed to post:', data.error?.message || 'Unknown error');
            }
        } catch (error: any) {
            console.error('[Facebook] Failed to post article:', error.message);
        }
    }
}

// Export singleton
export const facebookService = new FacebookService();
