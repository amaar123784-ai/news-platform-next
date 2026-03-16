/**
 * Google Indexing API Service
 * 
 * Notifies Google of new or updated URLs to ensure instant crawling and indexing.
 * Used for breaking news and high-priority content.
 */

import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

class IndexingService {
    private auth: GoogleAuth;
    private isEnabled: boolean;

    constructor() {
        this.isEnabled = process.env.GOOGLE_INDEXING_ENABLE === 'true';
        
        // GoogleAuth automatically looks for GOOGLE_APPLICATION_CREDENTIALS in env
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        if (this.isEnabled) {
            console.log('[Indexing] ✅ Google Indexing API service initialized.');
        }
    }

    /**
     * Alias for notifyGoogle to match automation service expectations
     */
    public async submitUrl(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<boolean> {
        return this.notifyGoogle(url, type);
    }

    /**
     * Notify Google about a new or updated URL
     */
    public async notifyGoogle(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<boolean> {
        if (!this.isEnabled) return false;

        try {
            console.log(`[Indexing] 📡 Pinging Google for: ${url} (${type})`);

            const client = await this.auth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse.token;

            if (!accessToken) {
                throw new Error('Failed to retrieve Google Access Token');
            }

            const response = await axios.post(
                INDEXING_API_ENDPOINT,
                {
                    url: url,
                    type: type,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.status === 200) {
                console.log(`[Indexing] ✅ Google notified successfully for: ${url}`);
                return true;
            }

            console.error(`[Indexing] ❌ Google responded with status ${response.status}:`, response.data);
            return false;

        } catch (error: any) {
            // Handle specific API errors
            const errorData = error.response?.data?.error;
            if (errorData) {
                console.error(`[Indexing] ❌ API Error (${errorData.code}): ${errorData.message}`);
            } else {
                console.error(`[Indexing] ❌ Connection Error: ${error.message}`);
            }
            return false;
        }
    }
}

export const indexingService = new IndexingService();
