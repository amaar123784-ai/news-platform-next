/**
 * Badge Component
 * 
 * Inline label for categorization and status indication.
 * Maps directly to design system badge tokens.
 * 
 * @see components.badges and colors.categoryBadges in design-system.json
 * 
 * @example
 * <Badge category="parliament">البرلمان</Badge>
 * <Badge variant="breaking">عاجل</Badge>
 * <Badge variant="status" status="positive">+12%</Badge>
 */

import React from 'react';
import { categoryBadges, type CategoryType } from '@/design-system/tokens';

export interface BadgeProps {
    /** Badge variant type */
    variant?: 'category' | 'breaking' | 'primary' | 'status';
    /** Category type - only used when variant is 'category' */
    category?: CategoryType;
    /** Status type - only used when variant is 'status' */
    status?: 'positive' | 'negative';
    /** Whether badge should pulse (for breaking news) */
    pulse?: boolean;
    /** Badge content */
    children: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}

// Classes from design-system.json components.badges
const baseClass = 'text-xs px-2 py-1 rounded-full font-medium inline-block';

const variantClasses = {
    breaking: 'bg-red-600 text-white px-3 animate-pulse',
    primary: 'bg-primary text-white px-3',
    status: {
        positive: 'bg-green-100 text-green-800',
        negative: 'bg-red-100 text-red-800',
    },
};

export const Badge: React.FC<BadgeProps> = ({
    variant = 'category',
    category = 'parliament',
    status = 'positive',
    pulse = false,
    children,
    className = '',
}) => {
    let classes = baseClass;

    if (variant === 'category' && category) {
        const categoryStyle = categoryBadges[category] || categoryBadges.politics || { bg: 'bg-gray-100', text: 'text-gray-600' };
        classes = `${classes} ${categoryStyle.bg} ${categoryStyle.text}`;
    } else if (variant === 'breaking') {
        classes = `${classes} ${variantClasses.breaking}`;
    } else if (variant === 'primary') {
        classes = `${classes} ${variantClasses.primary}`;
    } else if (variant === 'status') {
        classes = `${classes} ${variantClasses.status[status]}`;
    }

    if (pulse && variant !== 'breaking') {
        classes = `${classes} animate-pulse`;
    }

    return (
        <span className={`${classes} ${className}`} role="status">
            {children}
        </span>
    );
};

export default Badge;
