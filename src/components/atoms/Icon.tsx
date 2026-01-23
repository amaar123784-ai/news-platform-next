/**
 * Icon Component
 * 
 * Renders Remix Icon icons from the design system.
 * Uses the icon token mapping from design-system/tokens.
 * 
 * @example
 * <Icon name="ri-user-line" size="md" />
 * <Icon name="ri-search-line" className="text-primary" />
 */

import React from 'react';

export interface IconProps {
    /** Remix Icon class name (e.g., "ri-user-line") */
    name: string;
    /** Icon size - maps to design system sizing */
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    /** Additional CSS classes */
    className?: string;
    /** Accessible label for screen readers */
    'aria-label'?: string;
    /** Whether icon is decorative (hidden from screen readers) */
    'aria-hidden'?: boolean;
}

const sizeClasses: Record<NonNullable<IconProps['size']>, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
};

export const Icon: React.FC<IconProps> = ({
    name,
    size = 'md',
    className = '',
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden = !ariaLabel,
}) => {
    return (
        <i
            className={`${name} ${sizeClasses[size]} ${className}`}
            aria-label={ariaLabel}
            aria-hidden={ariaHidden}
            role={ariaLabel ? 'img' : undefined}
        />
    );
};

export default Icon;
