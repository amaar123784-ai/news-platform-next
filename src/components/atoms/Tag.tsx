/**
 * Tag Component
 * 
 * Clickable tag pill for article topics and categories.
 * 
 * @see components.badges in design-system.json
 * 
 * @example
 * <Tag>سياسة</Tag>
 * <Tag onClick={() => navigate('/tag/economy')}>اقتصاد</Tag>
 */

import React from 'react';

export interface TagProps {
    /** Tag content */
    children: React.ReactNode;
    /** Click handler */
    onClick?: () => void;
    /** Whether tag is selected/active */
    isActive?: boolean;
    /** Additional CSS classes */
    className?: string;
}

export const Tag: React.FC<TagProps> = ({
    children,
    onClick,
    isActive = false,
    className = '',
}) => {
    const baseClasses = 'inline-block text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer';
    const stateClasses = isActive
        ? 'bg-primary text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

    return (
        <span
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
            className={`${baseClasses} ${stateClasses} ${className}`}
        >
            {children}
        </span>
    );
};

export default Tag;
