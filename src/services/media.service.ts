/**
 * Media Service
 * 
 * Handles file uploads and media management.
 */

import api from './api';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface MediaFile {
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
    alt?: string;
    uploaderId: string;
    createdAt: string;
}

export interface UploadMediaResponse {
    success: boolean;
    data: MediaFile;
}

export const mediaService = {
    /**
     * Get paginated media files
     */
    async getMedia(page: number = 1, type?: string): Promise<PaginatedResponse<MediaFile>> {
        const params = new URLSearchParams({ page: String(page), perPage: '20' });
        if (type) params.append('type', type);

        const response = await api.get<PaginatedResponse<MediaFile>>(`/media?${params}`);
        return response.data;
    },

    /**
     * Upload file
     */
    async uploadFile(file: File, alt?: string): Promise<MediaFile> {
        const formData = new FormData();
        formData.append('file', file);
        if (alt) formData.append('alt', alt);

        const response = await api.post<UploadMediaResponse>('/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    /**
     * Delete file
     */
    async deleteFile(id: string): Promise<void> {
        await api.delete(`/media/${id}`);
    },
};

export default mediaService;
