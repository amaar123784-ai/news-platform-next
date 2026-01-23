"use client";

/**
 * Toast Notification System
 * 
 * Global toast notifications for success, error, warning, and info messages.
 * Uses React Context for global state management.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Icon } from '@/components/atoms';

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
}

// Context
const ToastContext = createContext<ToastContextValue | null>(null);

// Hook
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

// Toast styling based on type
const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'ri-check-line',
        iconColor: 'text-green-600 bg-green-100',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'ri-error-warning-line',
        iconColor: 'text-red-600 bg-red-100',
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'ri-alert-line',
        iconColor: 'text-yellow-600 bg-yellow-100',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'ri-information-line',
        iconColor: 'text-blue-600 bg-blue-100',
    },
};

// Single Toast Component
const ToastItem: React.FC<{
    toast: Toast;
    onClose: () => void;
}> = ({ toast, onClose }) => {
    const styles = toastStyles[toast.type];

    useEffect(() => {
        if (toast.duration !== 0) {
            const timer = setTimeout(() => {
                onClose();
            }, toast.duration || 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onClose]);

    return (
        <div
            className={`
                ${styles.bg} ${styles.border}
                border rounded-lg shadow-lg p-4 min-w-[320px] max-w-md
                animate-slide-in-right
                flex items-start gap-3
            `}
            role="alert"
        >
            {/* Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconColor}`}>
                <Icon name={styles.icon} size="sm" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <h4 className="font-medium text-gray-900 text-sm mb-0.5">{toast.title}</h4>
                )}
                <p className="text-sm text-gray-600">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="إغلاق"
            >
                <Icon name="ri-close-line" size="sm" />
            </button>
        </div>
    );
};

// Toast Container Component
export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-4 z-50 flex flex-col gap-3">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

// Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string, title?: string) => {
        addToast({ type: 'success', message, title, duration: 4000 });
    }, [addToast]);

    const error = useCallback((message: string, title?: string) => {
        addToast({ type: 'error', message, title, duration: 6000 });
    }, [addToast]);

    const warning = useCallback((message: string, title?: string) => {
        addToast({ type: 'warning', message, title, duration: 5000 });
    }, [addToast]);

    const info = useCallback((message: string, title?: string) => {
        addToast({ type: 'info', message, title, duration: 4000 });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

export default ToastProvider;
