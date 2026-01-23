/**
 * LoadingOverlay
 * 
 * Full-screen loading overlay for async operations.
 */

import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isVisible,
    message = 'جاري التحميل...',
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-primary border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">{message}</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
