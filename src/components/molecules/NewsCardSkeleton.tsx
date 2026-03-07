/**
 * NewsCardSkeleton Component
 * 
 * Loading placeholder matching NewsCard dimensions.
 * Uses CSS shimmer animation.
 */

import React from 'react';

export const NewsCardSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden h-full animate-pulse">
            {/* Accent line */}
            <div className="h-[3px] bg-gray-200" />

            {/* Image placeholder */}
            <div className="aspect-[16/9] w-full bg-gray-200 shimmer" />

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                {/* Title lines */}
                <div className="h-5 bg-gray-200 rounded-md w-full mb-2 shimmer" />
                <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-4 shimmer" />

                {/* Excerpt lines */}
                <div className="h-3.5 bg-gray-100 rounded w-full mb-1.5 shimmer" />
                <div className="h-3.5 bg-gray-100 rounded w-5/6 mb-4 shimmer" />

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-3 bg-gray-200 rounded w-16 shimmer" />
                        <div className="h-3 bg-gray-200 rounded w-12 shimmer" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsCardSkeleton;
