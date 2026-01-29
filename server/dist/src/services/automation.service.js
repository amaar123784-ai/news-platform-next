/**
 * Automation Service - Full Content Automation Pipeline
 * Handles AI rewriting, platform publishing, and social media posting
 */
import { PrismaClient, AutomationStatus, SocialPostStatus, SocialPlatform } from '@prisma/client';
import { rewriteArticle as rewriteWithAI } from './ai.service.js';
import { notificationService } from './notification.service.js';
import slugify from 'slugify';
import crypto from 'crypto';
const prisma = new PrismaClient();
// Configuration
const SOCIAL_DELAY_MINUTES = 5; // Delay before posting to social media
export class AutomationService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!AutomationService.instance) {
            AutomationService.instance = new AutomationService();
        }
        return AutomationService.instance;
    }
    /**
     * Start the full automation pipeline for an approved RSS article
     */
    async startAutomation(rssArticleId) {
        console.log(`[Automation] Starting pipeline for RSS article: ${rssArticleId}`);
        try {
            // Check if already in queue
            const existing = await prisma.automationQueue.findUnique({
                where: { rssArticleId }
            });
            if (existing) {
                console.log(`[Automation] Article already in queue with status: ${existing.status}`);
                return;
            }
            // Create queue entry
            const queueItem = await prisma.automationQueue.create({
                data: {
                    rssArticleId,
                    status: AutomationStatus.PENDING,
                    socialPlatform: SocialPlatform.FACEBOOK
                }
            });
            // Start processing immediately (async)
            this.processQueue(queueItem.id).catch(err => {
                console.error(`[Automation] Pipeline error:`, err);
            });
        }
        catch (error) {
            console.error(`[Automation] Failed to start automation:`, error.message);
            await notificationService.createNotification('automation_error', 'فشل بدء الأتمتة', `فشل بدء الأتمتة للمقال: ${error.message}`, { rssArticleId });
        }
    }
    /**
     * Process a queue item through all stages
     */
    async processQueue(queueId) {
        try {
            // Step 1: AI Rewriting
            await this.processAIRewrite(queueId);
            // Step 2: Publish to Platform
            await this.publishToPlatform(queueId);
            // Step 3: Queue for Social Media
            await this.queueForSocial(queueId);
            console.log(`[Automation] Pipeline completed for queue: ${queueId}`);
        }
        catch (error) {
            console.error(`[Automation] Pipeline failed:`, error.message);
            await prisma.automationQueue.update({
                where: { id: queueId },
                data: {
                    status: AutomationStatus.FAILED,
                    errorMessage: error.message
                }
            });
        }
    }
    /**
     * Step 1: AI Rewriting
     */
    async processAIRewrite(queueId) {
        console.log(`[Automation] Step 1: AI Rewriting for ${queueId}`);
        const queueItem = await prisma.automationQueue.update({
            where: { id: queueId },
            data: { status: AutomationStatus.AI_PROCESSING },
            include: { rssArticle: { include: { source: { include: { category: true } } } } }
        });
        const article = queueItem.rssArticle;
        // Use existing rewritten content or original
        let title = article.rewrittenTitle || article.title;
        let excerpt = article.rewrittenExcerpt || article.excerpt || '';
        let content = article.fullContent || excerpt;
        // Try AI rewriting
        try {
            const aiResult = await rewriteWithAI(title, content);
            if (aiResult) {
                title = aiResult.rewrittenTitle;
                excerpt = aiResult.rewrittenExcerpt;
                // For full content, we use the excerpt as a summary
                // The full content would require a more sophisticated prompt
                content = this.formatArticleContent(article.fullContent || excerpt, article.sourceUrl);
            }
        }
        catch (error) {
            console.warn(`[Automation] AI rewriting failed, using original content:`, error.message);
        }
        await prisma.automationQueue.update({
            where: { id: queueId },
            data: {
                status: AutomationStatus.AI_COMPLETED,
                aiRewrittenTitle: title,
                aiRewrittenExcerpt: excerpt.substring(0, 500),
                aiRewrittenContent: content,
                aiProcessedAt: new Date()
            }
        });
    }
    /**
     * Step 2: Create Platform Article
     */
    async publishToPlatform(queueId) {
        console.log(`[Automation] Step 2: Publishing to platform for ${queueId}`);
        const queueItem = await prisma.automationQueue.update({
            where: { id: queueId },
            data: { status: AutomationStatus.PUBLISHING },
            include: { rssArticle: { include: { source: { include: { category: true } } } } }
        });
        const article = queueItem.rssArticle;
        const category = article.source.category;
        // Generate unique slug
        const baseSlug = slugify(queueItem.aiRewrittenTitle || article.title, {
            lower: true,
            strict: true
        });
        const uniqueSlug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
        // Get default image if no image exists
        const imageUrl = article.imageUrl || this.getDefaultImage(category?.slug || 'default');
        // Get or create a system user for automated articles
        let systemUser = await prisma.user.findFirst({
            where: { email: 'system@voiceoftihama.com' }
        });
        if (!systemUser) {
            systemUser = await prisma.user.create({
                data: {
                    email: 'system@voiceoftihama.com',
                    name: 'النظام الآلي',
                    role: 'ADMIN',
                    password: crypto.randomBytes(32).toString('hex') // Random password, won't be used
                }
            });
        }
        // Create the article
        const newArticle = await prisma.article.create({
            data: {
                title: queueItem.aiRewrittenTitle || article.title,
                slug: uniqueSlug,
                excerpt: queueItem.aiRewrittenExcerpt || article.excerpt || '',
                content: queueItem.aiRewrittenContent || article.fullContent || article.excerpt || '',
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
    }
    /**
     * Step 3: Queue for Social Media Posting
     */
    async queueForSocial(queueId) {
        console.log(`[Automation] Step 3: Queuing for social media ${queueId}`);
        const scheduledTime = new Date(Date.now() + SOCIAL_DELAY_MINUTES * 60 * 1000);
        await prisma.automationQueue.update({
            where: { id: queueId },
            data: {
                status: AutomationStatus.SOCIAL_PENDING,
                socialStatus: SocialPostStatus.PENDING,
                socialScheduledAt: scheduledTime
            }
        });
        console.log(`[Automation] Scheduled for social at: ${scheduledTime.toISOString()}`);
    }
    /**
     * Get posts ready for social media (called by n8n)
     */
    async getPendingSocialPosts() {
        const now = new Date();
        return prisma.automationQueue.findMany({
            where: {
                status: AutomationStatus.SOCIAL_PENDING,
                socialStatus: SocialPostStatus.PENDING,
                socialScheduledAt: { lte: now }
            },
            include: {
                rssArticle: {
                    include: {
                        source: { include: { category: true } }
                    }
                }
            },
            take: 10
        });
    }
    /**
     * Mark a post as successfully posted to social media
     */
    async markSocialPosted(queueId, postId) {
        await prisma.automationQueue.update({
            where: { id: queueId },
            data: {
                status: AutomationStatus.COMPLETED,
                socialStatus: SocialPostStatus.POSTED,
                socialPostedAt: new Date(),
                socialPostId: postId
            }
        });
        console.log(`[Automation] Successfully posted to social: ${queueId}`);
    }
    /**
     * Mark a post as failed
     */
    async markSocialFailed(queueId, errorMessage) {
        const queueItem = await prisma.automationQueue.findUnique({
            where: { id: queueId }
        });
        if (!queueItem)
            return;
        const newRetryCount = queueItem.retryCount + 1;
        const shouldRetry = newRetryCount < 3;
        await prisma.automationQueue.update({
            where: { id: queueId },
            data: {
                status: shouldRetry ? AutomationStatus.SOCIAL_PENDING : AutomationStatus.FAILED,
                socialStatus: shouldRetry ? SocialPostStatus.PENDING : SocialPostStatus.FAILED,
                errorMessage,
                retryCount: newRetryCount,
                socialScheduledAt: shouldRetry ? new Date(Date.now() + 5 * 60 * 1000) : undefined
            }
        });
        if (!shouldRetry) {
            await notificationService.createNotification('social_error', 'فشل النشر على فيسبوك', `فشل نشر المقال بعد 3 محاولات: ${errorMessage}`, { queueId });
        }
    }
    /**
     * Get default category image URL
     */
    getDefaultImage(categorySlug) {
        const baseUrl = process.env.SITE_URL || 'https://voiceoftihama.com';
        const imageMap = {
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
    /**
     * Get default category
     */
    async getDefaultCategory() {
        let category = await prisma.category.findFirst({
            where: { slug: 'misc' }
        });
        if (!category) {
            category = await prisma.category.findFirst();
        }
        if (!category) {
            throw new Error('No categories found in database');
        }
        return category;
    }
    /**
     * Format article content with source attribution
     */
    formatArticleContent(content, sourceUrl) {
        return content;
    }
    /**
     * Get automation queue for admin dashboard
     */
    async getQueue(options = {}) {
        const { page = 1, perPage = 20, status } = options;
        const where = status ? { status } : {};
        const [items, total] = await Promise.all([
            prisma.automationQueue.findMany({
                where,
                include: {
                    rssArticle: {
                        include: {
                            source: { include: { category: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage
            }),
            prisma.automationQueue.count({ where })
        ]);
        return {
            data: items,
            meta: {
                currentPage: page,
                totalPages: Math.ceil(total / perPage),
                totalItems: total,
                perPage
            }
        };
    }
    /**
     * Retry a failed automation
     */
    async retryAutomation(queueId) {
        const queueItem = await prisma.automationQueue.findUnique({
            where: { id: queueId }
        });
        if (!queueItem) {
            throw new Error('Queue item not found');
        }
        // Reset status based on where it failed
        if (queueItem.status === AutomationStatus.FAILED) {
            if (queueItem.createdArticleId) {
                // Already published, just retry social
                await prisma.automationQueue.update({
                    where: { id: queueId },
                    data: {
                        status: AutomationStatus.SOCIAL_PENDING,
                        socialStatus: SocialPostStatus.PENDING,
                        socialScheduledAt: new Date(),
                        errorMessage: null,
                        retryCount: 0
                    }
                });
            }
            else {
                // Restart from beginning
                await prisma.automationQueue.update({
                    where: { id: queueId },
                    data: {
                        status: AutomationStatus.PENDING,
                        errorMessage: null,
                        retryCount: 0
                    }
                });
                this.processQueue(queueId).catch(console.error);
            }
        }
    }
}
export const automationService = AutomationService.getInstance();
//# sourceMappingURL=automation.service.js.map