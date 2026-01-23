/**
 * StatusBadge Atom
 * 
 * Specialized badge for CMS content states.
 */

import React from 'react';
import type { StatusType } from '@/types/api.types';

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; bg: string; text: string; dot: string }> = {
    published: {
        label: 'منشور',
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-500'
    },
    draft: {
        label: 'مسودة',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        dot: 'bg-gray-500'
    },
    archived: {
        label: 'مؤرشف',
        bg: 'bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500'
    },
    review: {
        label: 'قيد المراجعة',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500'
    },
    PENDING: {
        label: 'معلق',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500'
    },
    APPROVED: {
        label: 'مقبول',
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-500'
    },
    REJECTED: {
        label: 'مرفوض',
        bg: 'bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500'
    }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    // Default to draft if status is unknown or undefined
    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${config.bg} ${config.text} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
};

export type { StatusType };
