/**
 * Automation Service - Frontend API Client
 * Handles automation queue and notifications
 */

import api from './api';

// Types
export interface AutomationQueueItem {
    id: string;
    rssArticleId: string;
    status: 'PENDING' | 'AI_PROCESSING' | 'AI_COMPLETED' | 'PUBLISHING' | 'PUBLISHED' | 'SOCIAL_PENDING' | 'SOCIAL_POSTING' | 'COMPLETED' | 'FAILED';
    aiRewrittenTitle?: string;
    aiRewrittenExcerpt?: string;
    createdArticleId?: string;
    publishedAt?: string;
    socialStatus?: 'PENDING' | 'PROCESSING' | 'POSTED' | 'FAILED';
    socialScheduledAt?: string;
    socialPostedAt?: string;
    errorMessage?: string;
    retryCount: number;
    createdAt: string;
    rssArticle: {
        id: string;
        title: string;
        excerpt?: string;
        imageUrl?: string;
        source: {
            name: string;
            category?: {
                name: string;
                slug: string;
            };
        };
    };
}

export interface SystemNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        perPage: number;
    };
}

// Automation Queue API
export const automationService = {
    /**
     * Get automation queue
     */
    async getQueue(params?: { page?: number; perPage?: number; status?: string }): Promise<PaginatedResponse<AutomationQueueItem>> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
        if (params?.status) searchParams.set('status', params.status);

        const response = await api.get(`/automation/queue?${searchParams.toString()}`);
        return response.data;
    },

    /**
     * Retry failed automation
     */
    async retryAutomation(queueId: string): Promise<{ success: boolean; message: string }> {
        const response = await api.post(`/automation/queue/${queueId}/retry`);
        return response.data;
    },
};

// Notifications API
export const notificationService = {
    /**
     * Get notifications
     */
    async getNotifications(params?: { page?: number; perPage?: number; unreadOnly?: boolean }): Promise<PaginatedResponse<SystemNotification>> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
        if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');

        const response = await api.get(`/notifications?${searchParams.toString()}`);
        return response.data;
    },

    /**
     * Get unread count
     */
    async getUnreadCount(): Promise<{ count: number }> {
        const response = await api.get('/notifications/count');
        return response.data.data;
    },

    /**
     * Mark as read
     */
    async markAsRead(id: string): Promise<void> {
        await api.patch(`/notifications/${id}/read`);
    },

    /**
     * Mark all as read
     */
    async markAllAsRead(): Promise<void> {
        await api.patch('/notifications/read-all');
    },

    /**
     * Delete notification
     */
    async deleteNotification(id: string): Promise<void> {
        await api.delete(`/notifications/${id}`);
    },
};
