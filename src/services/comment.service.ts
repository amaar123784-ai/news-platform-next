/**
 * Comment Service
 * 
 * Handles article comments and moderation.
 */

import api from './api';
import type { Comment, ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface CommentFilters {
    page?: number;
    perPage?: number;
    status?: string;
    articleId?: string;
}

export const commentService = {
    /**
     * Get comments (moderation view)
     */
    async getComments(filters: CommentFilters = {}): Promise<PaginatedResponse<Comment>> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });

        const response = await api.get<PaginatedResponse<Comment>>(`/comments?${params}`);
        return response.data;
    },

    /**
     * Add a comment to an article
     */
    async addComment(data: { articleId: string; content: string; parentId?: string }): Promise<Comment> {
        const response = await api.post<ApiResponse<Comment>>('/comments', data);
        return response.data.data;
    },

    /**
     * Moderate a comment (approve/reject)
     */
    async moderateComment(id: string, status: 'APPROVED' | 'REJECTED'): Promise<Comment> {
        const response = await api.patch<ApiResponse<Comment>>(`/comments/${id}/moderate`, { status });
        return response.data.data;
    },

    /**
     * Delete a comment
     */
    async deleteComment(id: string): Promise<void> {
        await api.delete(`/comments/${id}`);
    },

    /**
     * Like a comment
     */
    async likeComment(id: string): Promise<{ id: string; likes: number }> {
        const response = await api.post<ApiResponse<{ id: string; likes: number }>>(`/comments/${id}/like`);
        return response.data.data;
    },
};

export default commentService;
