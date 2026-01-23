"use client";

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child component tree.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon, Button } from '@/components/atoms';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // In production, send to error reporting service
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                    <div className="max-w-lg w-full text-center">
                        <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <Icon name="ri-error-warning-line" className="text-red-600 text-5xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 font-brand">
                            حدث خطأ غير متوقع
                        </h1>
                        <p className="text-gray-600 mb-6">
                            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
                        </p>

                        {this.state.error && (
                            <details className="mb-6 text-left bg-gray-100 p-4 rounded-lg">
                                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                                    تفاصيل الخطأ (للمطورين)
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 overflow-auto" dir="ltr">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-4 justify-center">
                            <Button variant="primary" onClick={this.handleReset}>
                                <Icon name="ri-home-line" className="ml-2" />
                                العودة للرئيسية
                            </Button>
                            <Button variant="secondary" onClick={() => window.location.reload()}>
                                <Icon name="ri-refresh-line" className="ml-2" />
                                تحديث الصفحة
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
