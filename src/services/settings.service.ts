/**
 * Settings Service
 * 
 * Handles global system settings.
 */

import api from './api';
import type { ApiResponse } from '@/types/api.types';

export interface SystemSettings {
    general: {
        siteName: string;
        officialEmail: string;
        phoneNumber: string;
        defaultLanguage: string;
        footerDescription: string;
    };
    seo: {
        metaTitle: string;
        keywords: string;
        metaDescription: string;
        allowIndexing: boolean;
    };
    social: {
        facebook: string;
        twitter: string;
        instagram: string;
        youtube: string;
        whatsapp: string;
        telegram: string;
    };
    notifications: {
        userRegistration: boolean;
        newComment: boolean;
        contactForm: boolean;
        securityAlerts: boolean;
    };
}

export const settingsService = {
    /**
     * Get all settings
     */
    async getSettings(): Promise<SystemSettings> {
        const response = await api.get<ApiResponse<SystemSettings>>('/settings');
        return response.data.data;
    },

    /**
     * Get public settings (no auth required)
     */
    async getPublicSettings(): Promise<SystemSettings> {
        const response = await api.get<ApiResponse<SystemSettings>>('/settings/public');
        return response.data.data;
    },

    /**
     * Update settings
     */
    async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
        const response = await api.patch<ApiResponse<SystemSettings>>('/settings', data);
        return response.data.data;
    },
};

export default settingsService;
