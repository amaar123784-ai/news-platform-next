/**
 * Analytics Service
 * 
 * Handles analytics and statistics operations.
 */

import api from './api';
import type {
    AnalyticsStats,
    ViewsData,
    TrafficData,
    GrowthData,
    ActivityLog,
    ApiResponse,
    PaginatedResponse
} from '@/types/api.types';

export interface DateRange {
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month' | 'year';
}

export const analyticsService = {
    /**
     * Get dashboard overview stats
     */
    async getStats(): Promise<AnalyticsStats> {
        const response = await api.get<ApiResponse<AnalyticsStats>>('/analytics/stats');
        return response.data.data;
    },

    /**
     * Get views data for chart
     */
    async getViewsData(range?: DateRange): Promise<ViewsData[]> {
        const params = new URLSearchParams();
        if (range) {
            Object.entries(range).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const response = await api.get<ApiResponse<ViewsData[]>>(`/analytics/views?${params}`);
        return response.data.data;
    },

    /**
     * Get traffic sources data
     */
    async getTrafficData(): Promise<TrafficData[]> {
        const response = await api.get<ApiResponse<TrafficData[]>>('/analytics/traffic');
        return response.data.data;
    },

    /**
     * Get user growth data
     */
    async getGrowthData(range?: DateRange): Promise<GrowthData[]> {
        const params = new URLSearchParams();
        if (range) {
            Object.entries(range).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const response = await api.get<ApiResponse<GrowthData[]>>(`/analytics/growth?${params}`);
        return response.data.data;
    },

    /**
     * Get activity logs
     */
    async getActivityLogs(filters: {
        page?: number;
        perPage?: number;
        userId?: string;
        targetType?: string;
        action?: string;
    } = {}): Promise<PaginatedResponse<ActivityLog>> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });
        const response = await api.get<PaginatedResponse<ActivityLog>>(`/analytics/activity?${params}`);
        return response.data;
    },

    /**
     * Get top articles by views
     */
    async getTopArticles(limit: number = 10): Promise<any[]> {
        const response = await api.get<ApiResponse<any[]>>(`/analytics/top-articles?limit=${limit}`);
        return response.data.data;
    },
};

export default analyticsService;
