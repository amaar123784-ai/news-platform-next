/**
 * API Client
 *
 * Security hardening (S1):
 *   - JWT tokens are now stored in HttpOnly, Secure, SameSite=Strict cookies set by the server.
 *   - The frontend never reads, writes, or stores tokens — they are NOT accessible to JavaScript.
 *   - `withCredentials: true` tells Axios to include cookies on every cross-origin request.
 *   - The old localStorage helpers (setAuthToken / clearAuthToken / getAuthToken) are removed.
 *     Session state is determined by calling GET /auth/me (see AuthContext).
 *
 * Refresh flow:
 *   - When a 401 is received, POST /auth/refresh is called.
 *   - The server reads the refresh_token HttpOnly cookie automatically and rotates tokens.
 *   - If refresh fails, the user is redirected to /login.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiError } from '@/types/api.types';

const getApiBaseUrl = (): string => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!envUrl) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[API] NEXT_PUBLIC_API_URL not set in production environment');
        }
        return 'http://127.0.0.1:5000/api';
    }
    return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
// withCredentials ensures cookies are sent on every cross-origin request
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
    withCredentials: true, // Required for HttpOnly cookie auth
});

// Track whether a token refresh is already in-flight to avoid parallel refresh attempts
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

function onRefreshSuccess() {
    pendingRequests.forEach((cb) => cb());
    pendingRequests = [];
}

function onRefreshFailure() {
    pendingRequests = [];
}

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as typeof error.config & { _retry?: boolean };

        // Handle 401 — token expired, attempt silent refresh
        // Skip for login and refresh endpoints to avoid infinite loops
        const isAuthEndpoint =
            originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // Queue request until refresh completes
                return new Promise((resolve) => {
                    pendingRequests.push(() => resolve(api(originalRequest)));
                });
            }

            isRefreshing = true;
            try {
                // POST /auth/refresh — server reads HttpOnly refresh_token cookie automatically
                await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });

                isRefreshing = false;
                onRefreshSuccess();

                // Retry the original request (new access_token cookie is now set)
                return api(originalRequest);
            } catch {
                isRefreshing = false;
                onRefreshFailure();

                // Refresh failed — redirect to login
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

/**
 * isAuthenticated — check session server-side by calling /auth/me.
 * Do NOT use localStorage checks; there is no token accessible to JS anymore.
 * This is handled inside AuthContext.
 */
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        await api.get('/auth/me');
        return true;
    } catch {
        return false;
    }
};

export default api;
