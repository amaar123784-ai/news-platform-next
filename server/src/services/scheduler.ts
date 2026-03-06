/**
 * Background Job Scheduler
 * Handles scheduled RSS fetching and cleanup tasks
 */

import cron from 'node-cron';
import { fetchAllActiveFeeds, cleanupOldArticles, expireOldArticles } from './rss.service.js';
import { processScrapeQueue } from './scraper.service.js';
import { automationService } from './automation.service.js';

let isSchedulerInitialized = false;

/**
 * Initialize all scheduled background jobs
 */
export function initializeScheduler(): void {
    if (isSchedulerInitialized) {
        console.log('[Scheduler] Already initialized, skipping...');
        return;
    }

    console.log('[Scheduler] Initializing background jobs...');

    // Fetch RSS feeds every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('[Scheduler] Starting RSS feed fetch...');
        try {
            const result = await fetchAllActiveFeeds();
            console.log(`[Scheduler] RSS fetch complete: ${result.feedsChecked} feeds, ${result.totalNewArticles} new articles`);
        } catch (error) {
            console.error('[Scheduler] RSS fetch error:', error);
        }
    });

    // Expire old approved articles daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('[Scheduler] Expiring old articles...');
        try {
            const count = await expireOldArticles(60); // 60 days
            console.log(`[Scheduler] Expired ${count} old articles`);
        } catch (error) {
            console.error('[Scheduler] Expire articles error:', error);
        }
    });

    // Cleanup deleted/rejected articles daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('[Scheduler] Cleaning up old articles...');
        try {
            const count = await cleanupOldArticles(30); // 30 days
            console.log(`[Scheduler] Removed ${count} old articles`);
        } catch (error) {
            console.error('[Scheduler] Cleanup error:', error);
        }
    });

    // Process scrape queue every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('[Scheduler] Processing scrape queue...');
        try {
            const result = await processScrapeQueue(5);
            console.log(`[Scheduler] Scrape complete: ${result.successful}/${result.processed} articles`);
        } catch (error) {
            console.error('[Scheduler] Scrape queue error:', error);
        }
    });

    // Process social media queue every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
        try {
            const pendingPosts = await automationService.getPendingSocialPosts();
            if (pendingPosts.length > 0) {
                console.log(`[Scheduler] Processing ${pendingPosts.length} social media posts...`);
                for (const post of pendingPosts) {
                    try {
                        // WhatsApp & Telegram are sent inline during publishToPlatform,
                        // so we just mark these as completed
                        await automationService.markSocialPosted(post.id, 'auto-completed');
                    } catch (err: any) {
                        await automationService.markSocialFailed(post.id, err.message);
                    }
                }
            }
        } catch (error) {
            console.error('[Scheduler] Social media worker error:', error);
        }
    });

    // Expire stale breaking news every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            const { expireBreakingNews } = await import('./news-curation.service.js');
            await expireBreakingNews(6); // 6 hours
        } catch (error) {
            console.error('[Scheduler] Breaking news expiry error:', error);
        }
    });

    // Refresh featured articles every hour (at minute 5)
    cron.schedule('5 * * * *', async () => {
        try {
            const { refreshFeaturedArticles } = await import('./news-curation.service.js');
            const result = await refreshFeaturedArticles();
            console.log(`[Scheduler] Featured refresh: ${result.featured} articles featured`);
        } catch (error) {
            console.error('[Scheduler] Featured refresh error:', error);
        }
    });

    isSchedulerInitialized = true;
    console.log('[Scheduler] Background jobs initialized successfully');
    console.log('[Scheduler] - RSS fetch: every 15 minutes');
    console.log('[Scheduler] - Scrape queue: every 5 minutes');
    console.log('[Scheduler] - Social media: every 2 minutes');
    console.log('[Scheduler] - Breaking news expiry: every 30 minutes');
    console.log('[Scheduler] - Featured refresh: every hour');
    console.log('[Scheduler] - Article expiry: daily at 2 AM');
    console.log('[Scheduler] - Cleanup: daily at 3 AM');
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
    return isSchedulerInitialized;
}
