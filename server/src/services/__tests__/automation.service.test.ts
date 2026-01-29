/**
 * Automation Service Unit Tests
 * Tests for the content automation pipeline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock PrismaClient
const mockPrisma = {
    automationQueue: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
    rSSArticle: {
        findUnique: vi.fn(),
    },
    article: {
        create: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
    },
    category: {
        findFirst: vi.fn(),
    },
    systemNotification: {
        create: vi.fn(),
    },
};

vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma),
    AutomationStatus: {
        PENDING: 'PENDING',
        AI_PROCESSING: 'AI_PROCESSING',
        AI_COMPLETED: 'AI_COMPLETED',
        PUBLISHING: 'PUBLISHING',
        PUBLISHED: 'PUBLISHED',
        SOCIAL_PENDING: 'SOCIAL_PENDING',
        SOCIAL_POSTING: 'SOCIAL_POSTING',
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED',
    },
    SocialPostStatus: {
        PENDING: 'PENDING',
        PROCESSING: 'PROCESSING',
        POSTED: 'POSTED',
        FAILED: 'FAILED',
    },
    SocialPlatform: {
        FACEBOOK: 'FACEBOOK',
        TELEGRAM: 'TELEGRAM',
        TWITTER: 'TWITTER',
    },
}));

describe('AutomationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('startAutomation', () => {
        it('should create a new queue entry for approved RSS article', async () => {
            const mockRssArticle = {
                id: 'rss-1',
                title: 'Test Article',
                status: 'APPROVED',
                source: {
                    category: { id: 'cat-1', name: 'Politics', slug: 'politics' }
                }
            };

            mockPrisma.rSSArticle.findUnique.mockResolvedValue(mockRssArticle);
            mockPrisma.automationQueue.create.mockResolvedValue({
                id: 'queue-1',
                rssArticleId: 'rss-1',
                status: 'PENDING'
            });

            // Import service after mocks are set up
            const { automationService } = await import('../services/automation.service');

            await automationService.startAutomation('rss-1');

            expect(mockPrisma.rSSArticle.findUnique).toHaveBeenCalledWith({
                where: { id: 'rss-1' },
                include: expect.any(Object)
            });
            expect(mockPrisma.automationQueue.create).toHaveBeenCalled();
        });

        it('should throw error for non-approved articles', async () => {
            mockPrisma.rSSArticle.findUnique.mockResolvedValue({
                id: 'rss-1',
                status: 'PENDING'
            });

            const { automationService } = await import('../services/automation.service');

            await expect(automationService.startAutomation('rss-1'))
                .rejects.toThrow();
        });

        it('should throw error for non-existent articles', async () => {
            mockPrisma.rSSArticle.findUnique.mockResolvedValue(null);

            const { automationService } = await import('../services/automation.service');

            await expect(automationService.startAutomation('non-existent'))
                .rejects.toThrow();
        });
    });

    describe('getQueue', () => {
        it('should return paginated queue items', async () => {
            const mockQueueItems = [
                { id: 'q1', status: 'PENDING', rssArticle: { title: 'Test 1' } },
                { id: 'q2', status: 'PUBLISHED', rssArticle: { title: 'Test 2' } },
            ];

            mockPrisma.automationQueue.findMany.mockResolvedValue(mockQueueItems);
            mockPrisma.automationQueue.count.mockResolvedValue(2);

            const { automationService } = await import('../services/automation.service');

            const result = await automationService.getQueue({ page: 1, perPage: 10 });

            expect(result.data).toHaveLength(2);
            expect(result.meta.totalItems).toBe(2);
            expect(result.meta.currentPage).toBe(1);
        });

        it('should filter by status when provided', async () => {
            mockPrisma.automationQueue.findMany.mockResolvedValue([]);
            mockPrisma.automationQueue.count.mockResolvedValue(0);

            const { automationService } = await import('../services/automation.service');

            await automationService.getQueue({ status: 'FAILED' as any });

            expect(mockPrisma.automationQueue.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'FAILED' }
                })
            );
        });
    });

    describe('markSocialPosted', () => {
        it('should update queue item to COMPLETED status', async () => {
            mockPrisma.automationQueue.update.mockResolvedValue({
                id: 'q1',
                status: 'COMPLETED'
            });

            const { automationService } = await import('../services/automation.service');

            await automationService.markSocialPosted('q1', 'fb-post-123');

            expect(mockPrisma.automationQueue.update).toHaveBeenCalledWith({
                where: { id: 'q1' },
                data: expect.objectContaining({
                    status: 'COMPLETED',
                    socialPostId: 'fb-post-123',
                })
            });
        });
    });

    describe('markSocialFailed', () => {
        it('should update queue item to FAILED status with error message', async () => {
            mockPrisma.automationQueue.findUnique.mockResolvedValue({
                id: 'q1',
                retryCount: 0,
                rssArticle: { title: 'Test' }
            });
            mockPrisma.automationQueue.update.mockResolvedValue({
                id: 'q1',
                status: 'FAILED'
            });

            const { automationService } = await import('../services/automation.service');

            await automationService.markSocialFailed('q1', 'Facebook API error');

            expect(mockPrisma.automationQueue.update).toHaveBeenCalled();
        });

        it('should retry if under max retries', async () => {
            mockPrisma.automationQueue.findUnique.mockResolvedValue({
                id: 'q1',
                retryCount: 1, // Under 3 max retries
                rssArticle: { title: 'Test' }
            });
            mockPrisma.automationQueue.update.mockResolvedValue({
                id: 'q1',
                status: 'SOCIAL_PENDING', // Should be re-queued
                retryCount: 2
            });

            const { automationService } = await import('../services/automation.service');

            await automationService.markSocialFailed('q1', 'Temporary error');

            // Should increment retry count and re-queue
            expect(mockPrisma.automationQueue.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        retryCount: 2
                    })
                })
            );
        });
    });

    describe('getDefaultImage', () => {
        it('should return correct image for politics category', async () => {
            const { automationService } = await import('../services/automation.service');

            const result = automationService.getDefaultImage('politics');

            expect(result).toContain('/images/categories/politics.png');
        });

        it('should return default image for unknown category', async () => {
            const { automationService } = await import('../services/automation.service');

            const result = automationService.getDefaultImage('unknown-category');

            expect(result).toContain('/images/categories/default.png');
        });
    });
});

describe('NotificationService', () => {
    describe('createNotification', () => {
        it('should create a notification with correct data', async () => {
            mockPrisma.systemNotification.create.mockResolvedValue({
                id: 'notif-1',
                type: 'automation_error',
                title: 'Error',
                message: 'Something failed'
            });

            const { notificationService } = await import('../services/notification.service');

            await notificationService.createNotification(
                'automation_error',
                'Error',
                'Something failed',
                { queueId: 'q1' }
            );

            expect(mockPrisma.systemNotification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    type: 'automation_error',
                    title: 'Error',
                    message: 'Something failed',
                })
            });
        });
    });

    describe('getUnreadCount', () => {
        it('should return count of unread notifications', async () => {
            mockPrisma.systemNotification = {
                ...mockPrisma.systemNotification,
                count: vi.fn().mockResolvedValue(5)
            };

            const { notificationService } = await import('../services/notification.service');

            const count = await notificationService.getUnreadCount();

            expect(count).toBe(5);
        });
    });
});
