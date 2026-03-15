/**
 * Automation Service - Full Content Automation Pipeline
 * Handles Scraping, AI rewriting, platform publishing, and social media posting
 */

import { AutomationStatus, SocialPostStatus, SocialPlatform } from '@prisma/client';
import { prisma } from '../index.js';
import { rewriteArticle as rewriteWithAI } from './ai.service.js';
import { notificationService } from './notification.service.js';
import { scrapeArticle } from './scraper.service.js';
import { indexingService } from './indexing.service.js';
// @ts-ignore
import slugify from 'slugify';
import crypto from 'crypto';

// Configuration
const SOCIAL_DELAY_MINUTES = 5; // Delay before posting to social media

// DEAD WORDS for anti-bot detection
const DEAD_WORDS = [
    'access denied', 'cloudflare', 'enable javascript', '403 forbidden',
    'captcha', 'security check', 'robot', 'automated request'
];

export class AutomationService {
    private static instance: AutomationService;
    private locks: Set<string> = new Set(); // Basic in-memory lock for concurrency

    private constructor() { }

    public static getInstance(): AutomationService {
        if (!AutomationService.instance) {
            AutomationService.instance = new AutomationService();
        }
        return AutomationService.instance;
    }

    /**
     * Start the full automation pipeline for an approved RSS article
     */
    public async startAutomation(rssArticleId: string): Promise<void> {
        console.log(`[Automation] Starting pipeline for RSS article: ${rssArticleId}`);

        try {
            // Check lock
            if (this.locks.has(rssArticleId)) {
                console.log(`[Automation] 🔒 Article ${rssArticleId} is already being processed.`);
                return;
            }

            // Upsert: create only if not already queued, skip if it exists
            const queueItem = await prisma.automationQueue.upsert({
                where: { rssArticleId },
                create: {
                    rssArticleId,
                    status: AutomationStatus.PENDING,
                    socialPlatform: SocialPlatform.FACEBOOK
                },
                update: {} // no-op on duplicate
            });

            // Only launch the pipeline if this is a genuinely new (PENDING) entry
            if (queueItem.status !== AutomationStatus.PENDING && queueItem.status !== AutomationStatus.FAILED) {
                console.log(`[Automation] Article already in queue with status: ${queueItem.status}`);
                return;
            }

            // Lock and Start processing immediately (async)
            this.locks.add(rssArticleId);
            this.processQueue(queueItem.id, rssArticleId).finally(() => {
                this.locks.delete(rssArticleId);
            });

        } catch (error: any) {
            console.error(`[Automation] Failed to start automation:`, error.message);
            await notificationService.createNotification(
                'automation_error',
                'فشل بدء الأتمتة',
                `فشل بدء الأتمتة للمقال: ${error.message}`,
                { rssArticleId }
            );
        }
    }

    /**
     * Process a queue item through all stages
     */
    private async processQueue(queueId: string, rssArticleId: string): Promise<void> {
        try {
            // Step 1: Scrape Full Content (On-Demand)
            const scrapedContent = await this.processScraping(queueId);

            // Step 2: AI Rewriting (Only if validation passes)
            await this.processAIRewrite(queueId, scrapedContent);

            // Step 3: Publish to Platform
            await this.publishToPlatform(queueId);

            // Step 4: Queue for Social Media
            await this.queueForSocial(queueId);

            console.log(`[Automation] Pipeline completed for queue: ${queueId}`);

        } catch (error: any) {
            console.error(`[Automation] Pipeline failed:`, error.message);

            const isScrapeError = error.message.includes('SCRAPE_VALIDATION');

            await prisma.automationQueue.update({
                where: { id: queueId },
                data: {
                    status: AutomationStatus.FAILED,
                    errorMessage: error.message.replace('SCRAPE_VALIDATION: ', '')
                }
            });
        }
    }

    /**
     * Step 1: Scrape and Validate
     */
    private async processScraping(queueId: string): Promise<string> {
        console.log(`[Automation] Step 1: Scraping for queue ${queueId}`);

        await prisma.automationQueue.update({
            where: { id: queueId },
            data: { status: AutomationStatus.AI_PROCESSING }
        });

        const queueItem = await prisma.automationQueue.findUnique({
            where: { id: queueId },
            include: { rssArticle: true }
        });

        const rssArticle = queueItem?.rssArticle;
        if (!rssArticle) throw new Error('RSS Article not found');

        // Execute Scraper
        const scrapeResult = await scrapeArticle(rssArticle.id);

        if (!scrapeResult.success || !scrapeResult.content) {
            throw new Error(`SCRAPE_VALIDATION: Scraper failed - ${scrapeResult.error || 'Empty content'}`);
        }

        const content = scrapeResult.content;
        const title = rssArticle.title;
        const excerpt = rssArticle.excerpt || '';

        // --- SMART VALIDATION LAYER ---

        // Check 1: Dead Words (Anti-bot detection)
        const lowerContent = content.toLowerCase();
        const foundDeadWord = DEAD_WORDS.find(word => lowerContent.includes(word));
        if (foundDeadWord) {
            throw new Error(`SCRAPE_VALIDATION: Anti-bot detected (${foundDeadWord})`);
        }

        // Check 2: Dynamic Length (3x Title Length)
        const minLength = title.length * 3;
        if (content.length < minLength) {
            throw new Error(`SCRAPE_VALIDATION: Content too short (${content.length} chars, expected >${minLength})`);
        }

        // Check 3: Semantic Consistency (Duplicate of Excerpt)
        // If content is too similar to the excerpt, the scraper likely failed to find the body
        if (content.trim() === excerpt.trim() || content.length < excerpt.length + 50) {
            throw new Error(`SCRAPE_VALIDATION: Failed to find main body (content identical to excerpt)`);
        }

        return content;
    }

    /**
     * Step 2: AI Rewriting
     */
    private async processAIRewrite(queueId: string, fullContent: string): Promise<void> {
        console.log(`[Automation] Step 2: AI Rewriting for ${queueId}`);

        await prisma.automationQueue.update({
            where: { id: queueId },
            data: { status: AutomationStatus.AI_PROCESSING }
        });

        const queueItem = await prisma.automationQueue.findUnique({
            where: { id: queueId },
            include: { rssArticle: true }
        });

        const article = queueItem!.rssArticle!;

        try {
            // Pass FULL content to AI for proper rewriting
            const aiResult = await rewriteWithAI(article.title, fullContent);

            if (aiResult) {
                await prisma.automationQueue.update({
                    where: { id: queueId },
                    data: {
                        status: AutomationStatus.AI_COMPLETED,
                        aiRewrittenTitle: aiResult.rewrittenTitle,
                        aiRewrittenExcerpt: aiResult.rewrittenExcerpt,
                        aiRewrittenContent: aiResult.rewrittenContent || fullContent,
                        aiProcessedAt: new Date()
                    }
                });
            } else {
                throw new Error('AI Service returned null result');
            }
        } catch (error: any) {
            console.error(`[Automation] AI rewriting failed:`, error.message);
            // Fallback to original content if AI fails but scraping succeeded
            await prisma.automationQueue.update({
                where: { id: queueId },
                data: {
                    status: AutomationStatus.AI_COMPLETED,
                    aiRewrittenTitle: article.title,
                    aiRewrittenExcerpt: article.excerpt || '',
                    aiRewrittenContent: fullContent,
                    aiProcessedAt: new Date()
                }
            });
        }
    }

    /**
     * Step 3: Create Platform Article
     */
    private async publishToPlatform(queueId: string): Promise<void> {
        console.log(`[Automation] Step 3: Publishing to platform for ${queueId}`);

        const queueItem = await prisma.automationQueue.update({
            where: { id: queueId },
            data: { status: AutomationStatus.PUBLISHING },
            include: { rssArticle: { include: { feed: { include: { source: true, category: true } } } } }
        });

        if (queueItem.createdArticleId) {
            await prisma.automationQueue.update({
                where: { id: queueId },
                data: { status: AutomationStatus.PUBLISHED }
            });
            return;
        }

        const article = queueItem.rssArticle!;
        const category = article.feed.category;

        // Generate unique slug with random hash to prevent Article_slug_key unique constraint error
        const baseSlug = (slugify as any)(queueItem.aiRewrittenTitle || article.title, {
            lower: true,
            strict: false,
            remove: /[*+~.()'"!:@]/g
        }) || 'article';
        
        const uniqueHash = crypto.randomBytes(3).toString('hex');
        const finalSlug = `${baseSlug}-${uniqueHash}`;

        const imageUrl = article.imageUrl || this.getDefaultImage(category?.slug || 'default');

        let systemUser = await prisma.user.findFirst({
            where: { email: 'system@voiceoftihama.com' }
        });

        if (!systemUser) {
            systemUser = await prisma.user.create({
                data: {
                    email: 'system@voiceoftihama.com',
                    name: 'النظام الآلي',
                    role: 'ADMIN',
                    password: crypto.randomBytes(32).toString('hex')
                }
            });
        }

        const newArticle = await prisma.article.create({
            data: {
                title: queueItem.aiRewrittenTitle || article.title,
                slug: finalSlug,
                excerpt: queueItem.aiRewrittenExcerpt || article.excerpt || '',
                content: queueItem.aiRewrittenContent || article.fullContent || '',
                imageUrl,
                categoryId: category?.id || (await this.getDefaultCategory()).id,
                authorId: systemUser.id,
                status: 'PUBLISHED',
                publishedAt: new Date()
            }
        });

        await prisma.automationQueue.update({
            where: { id: queueId },
            data: {
                status: AutomationStatus.PUBLISHED,
                createdArticleId: newArticle.id,
                publishedAt: new Date()
            }
        });

        console.log(`[Automation] Created platform article: ${newArticle.slug}`);

        // SEO: Notify Google Indexing API
        const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com'}/article/${newArticle.slug}`;
        indexingService.notifyGoogle(articleUrl).catch(err => {
            console.error('[Automation] Google Indexing notification failed:', err.message);
        });

        // Social publishing handled here
        try {
            const { publishToSocialChannels } = await import('./socialPublisher.service.js');
            await publishToSocialChannels(newArticle);
        } catch (err: any) {
            console.error('[Automation] Social publishing trigger failed:', err.message);
        }
    }

    /**
     * Step 4: Queue for Social Media Posting
     */
    private async queueForSocial(queueId: string): Promise<void> {
        await prisma.automationQueue.update({
            where: { id: queueId },
            data: {
                status: AutomationStatus.SOCIAL_PENDING,
                socialStatus: SocialPostStatus.PENDING,
                socialScheduledAt: new Date(Date.now() + SOCIAL_DELAY_MINUTES * 60 * 1000)
            }
        });
    }

    // ... (rest of helper methods)

    private getDefaultImage(categorySlug: string): string {
        const baseUrl = process.env.SITE_URL || 'https://voiceoftihama.com';
        const imageMap: Record<string, string> = {
            'politics': 'politics.jpg',
            'economy': 'economy.jpg',
            'sports': 'sports.jpg',
            'technology': 'technology.jpg',
            'misc': 'misc.jpg',
            'default': 'default.jpg'
        };
        const imageName = imageMap[categorySlug] || 'default.jpg';
        return `${baseUrl}/images/categories/${imageName}`;
    }

    private async getDefaultCategory() {
        let category = await prisma.category.findFirst({ where: { slug: 'misc' } });
        if (!category) category = await prisma.category.findFirst();
        if (!category) throw new Error('No categories found');
        return category;
    }

    public async getQueue(options: { page?: number; perPage?: number; status?: AutomationStatus } = {}) {
        const { page = 1, perPage = 20, status } = options;
        const where = status ? { status } : {};
        const [items, total] = await Promise.all([
            prisma.automationQueue.findMany({
                where,
                include: { rssArticle: { include: { feed: { include: { source: true, category: true } } } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage
            }),
            prisma.automationQueue.count({ where })
        ]);
        return { data: items, meta: { currentPage: page, totalPages: Math.ceil(total / perPage), totalItems: total, perPage } };
    }

    public async retryAutomation(queueId: string): Promise<void> {
        const queueItem = await prisma.automationQueue.findUnique({ where: { id: queueId } });
        if (!queueItem) throw new Error('Queue item not found');
        if (queueItem.status === AutomationStatus.FAILED) { // Fixed FAILED_SCRAPE ref
            await prisma.automationQueue.update({
                where: { id: queueId },
                data: { status: AutomationStatus.PENDING, errorMessage: null, retryCount: 0 }
            });
            this.startAutomation(queueItem.rssArticleId).catch(console.error);
        }
    }

    public async getPendingSocialPosts() {
        return prisma.automationQueue.findMany({ where: { status: AutomationStatus.SOCIAL_PENDING } });
    }

    public async markSocialPosted(id: string, postId: string) {
        return prisma.automationQueue.update({ where: { id }, data: { status: AutomationStatus.COMPLETED } });
    }

    public async markSocialFailed(id: string, error: string) {
        return prisma.automationQueue.update({ where: { id }, data: { status: AutomationStatus.FAILED } });
    }
}

export const automationService = AutomationService.getInstance();
