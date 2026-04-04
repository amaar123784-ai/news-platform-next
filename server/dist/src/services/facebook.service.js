/**
 * Facebook Page Service
 * Sends articles to a Facebook Page via the official Graph API.
 */
const GRAPH_API = 'https://graph.facebook.com/v19.0';
const MAX_RETRIES = 3;
class FacebookService {
    pageId = null;
    pageToken = null;
    isEnabled = false;
    isReady = false;
    platformUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://voiceoftihama.com';
    constructor() {
        this.pageId = process.env.FACEBOOK_PAGE_ID || null;
        const token = process.env.FACEBOOK_PAGE_TOKEN || null;
        this.isEnabled = process.env.FACEBOOK_ENABLE === 'true';
        if (this.isEnabled && this.pageId && token) {
            console.log('[Facebook] ✅ Service enabled. Page ID:', this.pageId);
            this.initialize(token);
        }
        else if (this.isEnabled) {
            console.warn('[Facebook] ⚠️ Enabled but missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_TOKEN.');
        }
        else {
            console.log('[Facebook] Service is disabled via .env (FACEBOOK_ENABLE).');
        }
    }
    async initialize(token) {
        try {
            console.log('[Facebook] Fetching Page Access Token via /me/accounts...');
            const res = await fetch(`${GRAPH_API}/me/accounts?access_token=${token}`);
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                const page = data.data.find((p) => p.id === this.pageId) || data.data[0];
                this.pageId = page.id;
                this.pageToken = page.access_token;
                this.isReady = true;
                console.log(`[Facebook] ✅ Page verified: ${page.name} (${page.id})`);
                return;
            }
            console.log('[Facebook] /me/accounts returned no pages, trying token directly...');
            const pageRes = await fetch(`${GRAPH_API}/${this.pageId}?fields=name,id&access_token=${token}`);
            const pageData = await pageRes.json();
            if (pageData.name) {
                this.pageToken = token;
                this.isReady = true;
                console.log(`[Facebook] ✅ Page verified (direct): ${pageData.name} (${pageData.id})`);
            }
            else {
                console.error('[Facebook] ❌ Could not verify page. Error:', pageData.error?.message || JSON.stringify(data.error || data));
            }
        }
        catch (error) {
            console.error('[Facebook] ❌ Failed to initialize:', error.message);
        }
    }
    stripHtml(html) {
        if (!html)
            return '';
        return html.replace(/<[^>]*>?/gm, '').trim();
    }
    buildMessage(article) {
        const title = article.title || '';
        const excerpt = this.stripHtml(article.excerpt || '');
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;
        return `📰 ${title}\n\n${excerpt}\n\n🔗 اقرأ المزيد على منصة صوت تهامة:\n${articleUrl}`;
    }
    async postArticleToFacebook(article) {
        if (!this.isEnabled || !this.isReady || !this.pageId || !this.pageToken)
            return false;
        const message = this.buildMessage(article);
        const articleUrl = `${this.platformUrl}/article/${article.slug || article.id}`;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[Facebook] Attempting to post (attempt ${attempt}): ${article.title}`);
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
                    console.log(`[Facebook] ✅ Posted article: ${article.title} (Post ID: ${data.id})`);
                    return true;
                }
                console.error(`[Facebook] ❌ Attempt ${attempt} failed:`, data.error?.message || 'Unknown error');
                if (attempt < MAX_RETRIES)
                    await new Promise(r => setTimeout(r, 5000 * attempt));
            }
            catch (error) {
                console.error(`[Facebook] ❌ Attempt ${attempt} error:`, error.message);
                if (attempt < MAX_RETRIES)
                    await new Promise(r => setTimeout(r, 5000 * attempt));
            }
        }
        return false;
    }
}
export const facebookService = new FacebookService();
//# sourceMappingURL=facebook.service.js.map