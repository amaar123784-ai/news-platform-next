/**
 * Facebook Page Service
 * Sends articles to a Facebook Page via the official Graph API.
 * Automatically exchanges User Access Token for Page Access Token.
 */

const GRAPH_API = 'https://graph.facebook.com/v19.0';

class FacebookService {
    private pageId: string | null = null;
    private pageToken: string | null = null;
    private isEnabled: boolean = false;
    private isReady: boolean = false;
    private platformUrl: string = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';

    constructor() {
        this.pageId = process.env.FACEBOOK_PAGE_ID || null;
        const token = process.env.FACEBOOK_PAGE_TOKEN || null;
        this.isEnabled = process.env.FACEBOOK_ENABLE === 'true';

        if (this.isEnabled && this.pageId && token) {
            console.log('[Facebook] ✅ Service enabled. Page ID:', this.pageId);
            this.initialize(token);
        } else if (this.isEnabled) {
            console.log('[Facebook] ⚠️ Enabled but missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_TOKEN.');
        } else {
            console.log('[Facebook] Service is disabled via .env (FACEBOOK_ENABLE).');
        }
    }

    /**
     * Initialize: try to get the correct Page Access Token.
     * If the provided token is a User Token, exchange it for a Page Token via /me/accounts.
     * If it's already a Page Token, use it directly.
     */
    private async initialize(token: string): Promise<void> {
        try {
            // Step 1: Try /me/accounts to get the page-specific token
            console.log('[Facebook] Fetching Page Access Token via /me/accounts...');
            const res = await fetch(`${GRAPH_API}/me/accounts?access_token=${token}`);
            const data = await res.json();

            if (data.data && data.data.length > 0) {
                // Find the matching page
                const page = data.data.find((p: any) => p.id === this.pageId) || data.data[0];
                this.pageId = page.id;
                this.pageToken = page.access_token;
                this.isReady = true;
                console.log(`[Facebook] ✅ Page verified: ${page.name} (${page.id})`);
                return;
            }

            // Step 2: If /me/accounts failed, try using the token directly as a Page Token
            console.log('[Facebook] /me/accounts returned no pages, trying token directly...');
            const pageRes = await fetch(`${GRAPH_API}/${this.pageId}?fields=name,id&access_token=${token}`);
            const pageData = await pageRes.json();

            if (pageData.name) {
                this.pageToken = token;
                this.isReady = true;
                console.log(`[Facebook] ✅ Page verified (direct): ${pageData.name} (${pageData.id})`);
            } else {
                console.error('[Facebook] ❌ Could not verify page. Error:', pageData.error?.message || JSON.stringify(data.error || data));
                console.error('[Facebook] 💡 Make sure the token has pages_manage_posts and pages_read_engagement permissions.');
            }
        } catch (error: any) {
            console.error('[Facebook] ❌ Failed to initialize:', error.message);
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
        if (!this.isEnabled || !this.isReady || !this.pageId || !this.pageToken) {
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
                console.log(`[Facebook] ✅ Posted "${article.title?.substring(0, 40)}..." (Post ID: ${data.id})`);
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
