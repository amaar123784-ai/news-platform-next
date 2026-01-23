/**
 * Category Service
 * 
 * Handles category management operations.
 */

import api from './api';
import type { ApiResponse, PaginatedResponse, Category } from '@/types/api.types';

export interface CreateCategoryRequest {
    name: string;
    slug: string;
    description: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
    id: string;
}

export const categoryService = {
    /**
     * Get all categories
     */
    async getCategories(all = false): Promise<Category[]> {
        const response = await api.get<ApiResponse<Category[]>>(`/categories${all ? '?all=true' : ''}`);
        return response.data.data;
    },

    /**
     * Get single category
     */
    async getCategory(id: string): Promise<Category> {
        const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
        return response.data.data;
    },

    /**
     * Create new category
     */
    async createCategory(data: CreateCategoryRequest): Promise<Category> {
        const response = await api.post<ApiResponse<Category>>('/categories', data);
        return response.data.data;
    },

    /**
     * Update category
     */
    async updateCategory({ id, ...data }: UpdateCategoryRequest): Promise<Category> {
        const response = await api.patch<ApiResponse<Category>>(`/categories/${id}`, data);
        return response.data.data;
    },

    /**
     * Delete category
     */
    async deleteCategory(id: string): Promise<void> {
        await api.delete(`/categories/${id}`);
    },
};

export default categoryService;
