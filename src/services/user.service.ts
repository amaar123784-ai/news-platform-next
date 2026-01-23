/**
 * User Service
 * 
 * Handles user management operations.
 */

import api from './api';
import type { User, ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface UserFilters {
    page?: number;
    perPage?: number;
    role?: User['role'];
    search?: string;
    sortBy?: 'createdAt' | 'name' | 'email';
    sortOrder?: 'asc' | 'desc';
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: User['role'];
    avatar?: string;
    bio?: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
    id: string;
}

export const userService = {
    /**
     * Get paginated users list
     */
    async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });

        const response = await api.get<PaginatedResponse<User>>(`/users?${params}`);
        return response.data;
    },

    /**
     * Get single user by ID
     */
    async getUser(id: string): Promise<User> {
        const response = await api.get<ApiResponse<User>>(`/users/${id}`);
        return response.data.data;
    },

    /**
     * Create new user
     */
    async createUser(data: CreateUserRequest): Promise<User> {
        const response = await api.post<ApiResponse<User>>('/users', data);
        return response.data.data;
    },

    /**
     * Update user
     */
    async updateUser({ id, ...data }: UpdateUserRequest): Promise<User> {
        const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
        return response.data.data;
    },

    /**
     * Delete user
     */
    async deleteUser(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    },

    /**
     * Get user's articles
     */
    async getUserArticles(userId: string, page: number = 1): Promise<PaginatedResponse<any>> {
        const response = await api.get<PaginatedResponse<any>>(`/users/${userId}/articles?page=${page}`);
        return response.data;
    },
};

export default userService;
