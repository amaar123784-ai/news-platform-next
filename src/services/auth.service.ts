/**
 * Auth Service
 *
 * Security hardening (S1):
 *   - Tokens are now stored in HttpOnly cookies by the server.
 *   - This service NO LONGER reads/writes tokens from localStorage.
 *   - setAuthToken / clearAuthToken helpers have been removed from api.ts.
 *   - After login, the server sets the cookie; the UI just receives the user object.
 */

import api from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, User, ApiResponse } from '@/types/api.types';

export const authService = {
    /**
     * Login — server sets access_token and refresh_token HttpOnly cookies
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
        return response.data.data; // { user }
    },

    /**
     * Google Login
     */
    async loginWithGoogle(token: string): Promise<LoginResponse> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/google', { token });
        return response.data.data;
    },

    /**
     * Facebook Login
     */
    async loginWithFacebook(token: string): Promise<LoginResponse> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/facebook', { token });
        return response.data.data;
    },

    /**
     * Register new user — server sets auth cookies
     */
    async register(data: RegisterRequest): Promise<LoginResponse> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
        return response.data.data;
    },

    /**
     * Logout — server clears cookies server-side
     */
    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    /**
     * Get current user profile (confirms session is valid via cookie)
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
