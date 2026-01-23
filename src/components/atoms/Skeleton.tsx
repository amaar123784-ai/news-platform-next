/**
 * Skeleton Component
 * 
 * Loading placeholder with animated pulse effect.
 * Used for content loading states throughout the platform.
 * 
 * @see animations.pulse in design-system.json
 * 
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="image" height="h-48" />
 * <Skeleton variant="card" />
 */

import React from 'react';

export interface SkeletonProps {
    /** Skeleton shape variant */
    variant?: 'text' | 'circle' | 'image' | 'card';
    /** Width class */
    width?: string;
    /** Height class */
    height?: string;
    /** Number of text lines (for text variant) */
    lines?: number;
    /** Additional CSS classes */
    className?: string;
}

const baseClasses = 'animate-pulse bg-gray-200 rounded';

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width = 'w-full',
    height,
    lines = 1,
    className = '',
}) => {
    switch (variant) {
        case 'circle':
            return (
                <div
                    className={`${baseClasses} rounded-full ${width} ${height || 'h-10'} ${className}`}
                    aria-hidden="true"
                />
            );

        case 'image':
            return (
                <div
                    className={`${baseClasses} rounded-lg ${width} ${height || 'h-48'} ${className}`}
                    aria-hidden="true"
                />
            );

        case 'card':
            return (
                <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`} aria-hidden="true">
                    <div className={`${baseClasses} ${height || 'h-48'}`} />
                    <div className="p-4 space-y-3">
                        <div className={`${baseClasses} h-4 w-20`} />
                        <div className={`${baseClasses} h-6 w-full`} />
                        <div className={`${baseClasses} h-4 w-3/4`} />
                    </div>
                </div>
            );

        case 'text':
        default:
            return (
                <div className={`space-y-2 ${className}`} aria-hidden="true">
                    {Array.from({ length: lines }).map((_, i) => (
                        <div
                            key={i}
                            className={`${baseClasses} h-4 ${width} ${i === lines - 1 && lines > 1 ? 'w-3/4' : ''}`}
                        />
                    ))}
                </div>
            );
    }
};

export default Skeleton;
