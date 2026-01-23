/**
 * Activity Service
 * 
 * Handles fetching activity logs.
 */

import api from './api';
import type { ApiResponse, PaginatedResponse, ActivityLog } from '@/types/api.types';

export interface ActivityFilter {
    page?: number;
    perPage?: number;
    userId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
}

export const activityService = {
    /**
     * Get activity logs
     */
    async getActivityLogs(filter: ActivityFilter = {}): Promise<PaginatedResponse<ActivityLog>> {
        const params = new URLSearchParams();
        if (filter.page) params.append('page', filter.page.toString());
        if (filter.perPage) params.append('perPage', filter.perPage.toString());
        if (filter.userId) params.append('userId', filter.userId);
        if (filter.action) params.append('action', filter.action);
        if (filter.targetType) params.append('targetType', filter.targetType);
        if (filter.startDate) params.append('startDate', filter.startDate);
        if (filter.endDate) params.append('endDate', filter.endDate);

        const response = await api.get<ApiResponse<PaginatedResponse<ActivityLog>>>(`/analytics/activity?${params.toString()}`);
        return response.data.data;
    },

    /**
     * Clear old logs (Admin only)
     */
    async clearLogs(olderThanDays: number): Promise<void> {
        await api.delete('/analytics/activity', { data: { olderThanDays } });
    },
};

export default activityService;
