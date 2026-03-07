"use client";

/**
 * AuthContext
 *
 * Session state is derived from the server — on mount we call GET /auth/me.
 * The access_token lives in an HttpOnly cookie and is never accessible to JS.
 * User profile (non-secret data) is kept in React state only — not localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from server on first render.
    // The HttpOnly cookie is sent automatically by the browser.
    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get<{ success: boolean; data: User }>('/auth/me');
            setUser(response.data.data);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        refreshUser().finally(() => setIsLoading(false));
    }, [refreshUser]);

    /** Called after a successful login — the server already set the cookie */
    const login = (userData: User) => {
        setUser(userData);
    };

    /** Calls the server to invalidate the session cookie, then clears local state */
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Even if the server call fails, clear UI state
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isLoggedIn: !!user,
            login,
            logout,
            refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
