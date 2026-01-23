/**
 * TableSkeleton Component
 * 
 * Loading skeleton for admin data tables.
 */

import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 4,
    showHeader = true,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            {/* Header */}
            {showHeader && (
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <div
                            key={`header-${i}`}
                            className="h-4 bg-gray-200 rounded"
                            style={{ width: `${60 + ((i * 17) % 40)}px` }}
                        />
                    ))}
                </div>
            )}

            {/* Rows */}
            <div className="divide-y divide-gray-200">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="px-6 py-4 flex items-center gap-4">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className={`h-4 bg-gray-200 rounded ${colIndex === 0 ? 'w-1/4' : 'flex-1'
                                    }`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * CardGridSkeleton Component
 * 
 * Loading skeleton for card grids (media library, etc.)
 */

interface CardGridSkeletonProps {
    cards?: number;
    columns?: 2 | 3 | 4 | 5;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
    cards = 8,
    columns = 4,
}) => {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
        5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-4 animate-pulse`}>
            {Array.from({ length: cards }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Image Placeholder */}
                    <div className="aspect-square bg-gray-200" />
                    {/* Content */}
                    <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * ArticleSkeleton Component
 * 
 * Loading skeleton for article page content.
 */

export const ArticleSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            {/* Category & Meta */}
            <div className="flex items-center gap-4 mb-4">
                <div className="h-6 bg-gray-200 rounded-full w-20" />
                <div className="h-4 bg-gray-200 rounded w-32" />
            </div>

            {/* Title */}
            <div className="space-y-3 mb-6">
                <div className="h-8 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded w-4/5" />
            </div>

            {/* Excerpt */}
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />

            {/* Author & Date */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
            </div>

            {/* Featured Image */}
            <div className="aspect-video bg-gray-200 rounded-lg mb-8" />

            {/* Content */}
            <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
        </div>
    );
};

/**
 * FormSkeleton Component
 * 
 * Loading skeleton for form sections.
 */

interface FormSkeletonProps {
    fields?: number;
    hasButton?: boolean;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
    fields = 4,
    hasButton = true,
}) => {
    return (
        <div className="animate-pulse space-y-6">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
            ))}

            {hasButton && (
                <div className="flex justify-end gap-3 pt-4">
                    <div className="h-10 bg-gray-200 rounded w-24" />
                    <div className="h-10 bg-gray-200 rounded w-32" />
                </div>
            )}
        </div>
    );
};

/**
 * StatCardSkeleton Component
 * 
 * Loading skeleton for dashboard stat cards.
 */

export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-20" />
                            <div className="h-4 bg-gray-200 rounded w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default {
    TableSkeleton,
    CardGridSkeleton,
    ArticleSkeleton,
    FormSkeleton,
    StatCardSkeleton,
};
