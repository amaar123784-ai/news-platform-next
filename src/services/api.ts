/**
 * API Client
 * 
 * Base axios instance with interceptors for auth and error handling.
 * Updated for Next.js - uses process.env instead of import.meta.env
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types/api.types';

/**
 * API Configuration
 * Uses environment variable for production flexibility
 * Defaults to localhost for development
 */
const getApiBaseUrl = (): string => {
    // Next.js uses process.env.NEXT_PUBLIC_* for client-side env vars
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!envUrl) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[API] NEXT_PUBLIC_API_URL not set in production environment');
        }
        // Force IPv4 loopback to avoid "resolved to private ip" errors in Next.js image optimization
        return 'http://127.0.0.1:5000/api';
    }
    return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Safe localStorage access (for SSR compatibility)
const getLocalStorage = () => {
    if (typeof window !== 'undefined') {
        return window.localStorage;
    }
    return null;
};

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const storage = getLocalStorage();
        const token = storage?.getItem(TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config;
        const storage = getLocalStorage();

        // Handle 401 Unauthorized - Token expired
        // Skip for login requests to allow components to handle invalid credentials
        if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/auth/login')) {
            // Try to refresh token
            const refreshToken = storage?.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });
                    const { token } = response.data;
                    storage?.setItem(TOKEN_KEY, token);

                    // Retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - logout user
                    storage?.removeItem(TOKEN_KEY);
                    storage?.removeItem(REFRESH_TOKEN_KEY);
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
            } else {
                // No refresh token - redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }

        // Transform error to consistent format
        const apiError: ApiError = {
            message: error.response?.data?.message || error.message || 'حدث خطأ غير متوقع',
            code: error.response?.data?.code || 'UNKNOWN_ERROR',
            status: error.response?.status || 500,
            details: error.response?.data?.details,
        };

        return Promise.reject(apiError);
    }
);

// Token management utilities
export const setAuthToken = (token: string, refreshToken?: string) => {
    const storage = getLocalStorage();
    storage?.setItem(TOKEN_KEY, token);
    if (refreshToken) {
        storage?.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const clearAuthToken = () => {
    const storage = getLocalStorage();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(REFRESH_TOKEN_KEY);
};

export const getAuthToken = () => getLocalStorage()?.getItem(TOKEN_KEY);

export const isAuthenticated = () => !!getAuthToken();

export default api;
