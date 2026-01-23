/**
 * Auth Service
 * 
 * Handles authentication operations.
 */

import api, { setAuthToken, clearAuthToken } from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, User, ApiResponse } from '@/types/api.types';

export const authService = {
    /**
     * Login user
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
        const { user, token, refreshToken } = response.data.data;
        setAuthToken(token, refreshToken);
        return { user, token, refreshToken };
    },

    /**
     * Register new user
     */
    async register(data: RegisterRequest): Promise<LoginResponse> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
        const { user, token, refreshToken } = response.data.data;
        setAuthToken(token, refreshToken);
        return { user, token, refreshToken };
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } finally {
            clearAuthToken();
        }
    },

    /**
     * Get current user profile
     */
    async getCurrentUser(): Promise<User> {
        const response = await api.get<ApiResponse<User>>('/auth/me');
        return response.data.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await api.patch<ApiResponse<User>>('/auth/me', data);
        return response.data.data;
    },

    /**
     * Change password
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.post('/auth/change-password', { currentPassword, newPassword });
    },

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<void> {
        await api.post('/auth/forgot-password', { email });
    },

    /**
     * Reset password with token
     */
    async resetPassword(token: string, password: string): Promise<void> {
        await api.post('/auth/reset-password', { token, password });
    },
};

export default authService;
