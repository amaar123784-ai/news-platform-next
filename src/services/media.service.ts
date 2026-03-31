/**
 * Media Service
 * 
 * Handles file uploads and media management.
 */

import api from './api';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { v4 as uuidv4 } from 'uuid';

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
     * Upload file in chunks (Resumable)
     */
    async uploadFileResumable(file: File, alt?: string, onProgress?: (p: number) => void): Promise<MediaFile> {
        const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const uploadId = uuidv4();

        let lastResponse;
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('file', chunk);
            formData.append('uploadId', uploadId);
            formData.append('chunkIndex', String(i));
            formData.append('totalChunks', String(totalChunks));
            formData.append('fileName', file.name);
            if (alt) formData.append('alt', alt);

            lastResponse = await api.post<UploadMediaResponse>('/media/upload/chunk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (onProgress) onProgress(((i + 1) / totalChunks) * 100);
        }

        return lastResponse!.data.data;
    },

    /**
     * Delete file
     */
    async deleteFile(id: string): Promise<void> {
        await api.delete(`/media/${id}`);
    },
};

export default mediaService;
