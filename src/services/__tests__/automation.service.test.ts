/**
 * Frontend Automation Service Unit Tests
 * Tests for the automation API client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { automationService, notificationService } from '../automation.service';

// Mock the api module
vi.mock('../api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    }
}));

import api from '../api';

describe('automationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getQueue', () => {
        it('should fetch automation queue with default params', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [
                        { id: 'q1', status: 'PENDING', rssArticle: { title: 'Test' } }
                    ],
                    meta: { currentPage: 1, totalPages: 1, totalItems: 1, perPage: 20 }
                }
            };
            (api.get as any).mockResolvedValue(mockResponse);

            const result = await automationService.getQueue();

            expect(api.get).toHaveBeenCalledWith('/automation/queue?');
            expect(result.data).toHaveLength(1);
        });

        it('should include page and status in query params', async () => {
            const mockResponse = { data: { success: true, data: [], meta: {} } };
            (api.get as any).mockResolvedValue(mockResponse);

            await automationService.getQueue({ page: 2, status: 'FAILED', perPage: 10 });

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('page=2')
            );
            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('status=FAILED')
            );
        });
    });

    describe('retryAutomation', () => {
        it('should call retry endpoint with queue ID', async () => {
            const mockResponse = { data: { success: true, message: 'Retried' } };
            (api.post as any).mockResolvedValue(mockResponse);

            const result = await automationService.retryAutomation('queue-123');

            expect(api.post).toHaveBeenCalledWith('/automation/queue/queue-123/retry');
            expect(result.success).toBe(true);
        });
    });
});

describe('notificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getNotifications', () => {
        it('should fetch notifications with default params', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [{ id: 'n1', title: 'Test', isRead: false }],
                    meta: { currentPage: 1, totalPages: 1, totalItems: 1, perPage: 20 }
                }
            };
            (api.get as any).mockResolvedValue(mockResponse);

            const result = await notificationService.getNotifications();

            expect(api.get).toHaveBeenCalledWith('/notifications?');
            expect(result.data).toHaveLength(1);
        });

        it('should add unreadOnly param when true', async () => {
            const mockResponse = { data: { success: true, data: [], meta: {} } };
            (api.get as any).mockResolvedValue(mockResponse);

            await notificationService.getNotifications({ unreadOnly: true });

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('unreadOnly=true')
            );
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count from API', async () => {
            const mockResponse = { data: { data: { count: 5 } } };
            (api.get as any).mockResolvedValue(mockResponse);

            const result = await notificationService.getUnreadCount();

            expect(api.get).toHaveBeenCalledWith('/notifications/count');
            expect(result.count).toBe(5);
        });
    });

    describe('markAsRead', () => {
        it('should call patch endpoint with notification ID', async () => {
            (api.patch as any).mockResolvedValue({ data: { success: true } });

            await notificationService.markAsRead('notif-123');

            expect(api.patch).toHaveBeenCalledWith('/notifications/notif-123/read');
        });
    });

    describe('markAllAsRead', () => {
        it('should call read-all endpoint', async () => {
            (api.patch as any).mockResolvedValue({ data: { success: true } });

            await notificationService.markAllAsRead();

            expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
        });
    });

    describe('deleteNotification', () => {
        it('should call delete endpoint with ID', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });

            await notificationService.deleteNotification('notif-123');

            expect(api.delete).toHaveBeenCalledWith('/notifications/notif-123');
        });
    });
});
