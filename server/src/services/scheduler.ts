/**
 * Background Job Scheduler
 * Handles scheduled RSS fetching and cleanup tasks
 */

import cron from 'node-cron';
import { fetchAllActiveFeeds, cleanupOldArticles, expireOldArticles } from './rss.service.js';
import { processScrapeQueue } from './scraper.service.js';

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

    isSchedulerInitialized = true;
    console.log('[Scheduler] Background jobs initialized successfully');
    console.log('[Scheduler] - RSS fetch: every 15 minutes');
    console.log('[Scheduler] - Scrape queue: every 5 minutes');
    console.log('[Scheduler] - Article expiry: daily at 2 AM');
    console.log('[Scheduler] - Cleanup: daily at 3 AM');
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
    return isSchedulerInitialized;
}
