/**
 * Article Service
 * 
 * Handles article CRUD operations.
 */

import api from './api';
import type {
    Article,
    CreateArticleRequest,
    UpdateArticleRequest,
    ApiResponse,
    PaginatedResponse
} from '@/types/api.types';

export interface ArticleFilters {
    page?: number;
    perPage?: number;
    category?: string;
    status?: Article['status'];
    authorId?: string;
    search?: string;
    sortBy?: 'createdAt' | 'views' | 'title';
    sortOrder?: 'asc' | 'desc';
}

export const articleService = {
    /**
     * Get paginated articles list
     */
    async getArticles(filters: ArticleFilters = {}): Promise<PaginatedResponse<Article>> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });

        const response = await api.get<PaginatedResponse<Article>>(`/articles?${params}`);
        return response.data;
    },

    /**
     * Get single article by ID or slug
     */
    async getArticle(idOrSlug: string): Promise<Article> {
        const response = await api.get<ApiResponse<Article>>(`/articles/${idOrSlug}`);
        return response.data.data;
    },

    /**
     * Get featured/trending articles
     */
    async getFeatured(limit: number = 5): Promise<Article[]> {
        const response = await api.get<ApiResponse<Article[]>>(`/articles/featured?limit=${limit}`);
        return response.data.data;
    },

    /**
     * Get related articles
     */
    async getRelated(articleId: string, limit: number = 3): Promise<Article[]> {
        const response = await api.get<ApiResponse<Article[]>>(`/articles/${articleId}/related?limit=${limit}`);
        return response.data.data;
    },

    /**
     * Create new article
     */
    async createArticle(data: CreateArticleRequest): Promise<Article> {
        const response = await api.post<ApiResponse<Article>>('/articles', data);
        return response.data.data;
    },

    /**
     * Update article
     */
    async updateArticle({ id, ...data }: UpdateArticleRequest): Promise<Article> {
        const response = await api.patch<ApiResponse<Article>>(`/articles/${id}`, data);
        return response.data.data;
    },

    /**
     * Delete article
     */
    async deleteArticle(id: string): Promise<void> {
        await api.delete(`/articles/${id}`);
    },

    /**
     * Publish article
     */
    async publishArticle(id: string): Promise<Article> {
        const response = await api.post<ApiResponse<Article>>(`/articles/${id}/publish`);
        return response.data.data;
    },

    /**
     * Archive article
     */
    async archiveArticle(id: string): Promise<Article> {
        const response = await api.post<ApiResponse<Article>>(`/articles/${id}/archive`);
        return response.data.data;
    },

    /**
     * Search articles
     */
    async searchArticles(query: string, filters: ArticleFilters = {}): Promise<PaginatedResponse<Article>> {
        return this.getArticles({ ...filters, search: query });
    },

    /**
     * Get breaking news articles for ticker
     */
    async getBreakingNews(limit: number = 10): Promise<Article[]> {
        try {
            const response = await api.get<ApiResponse<Article[]>>(`/articles/breaking?limit=${limit}`);
            return response.data.data;
        } catch {
            return [];
        }
    },
};

export default articleService;
