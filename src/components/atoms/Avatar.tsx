/**
 * Avatar Component
 * 
 * User profile image or placeholder following design system avatar tokens.
 * 
 * @see components.avatar in design-system.json
 * 
 * @example
 * <Avatar size="md" src="/user.jpg" alt="أحمد محمد" />
 * <Avatar size="sm" placeholder />
 * <Avatar name="أحمد محمد" size="lg" />
 */

import React from 'react';

export interface AvatarProps {
    /** Avatar size from design system */
    size?: 'sm' | 'md' | 'lg';
    /** Image source URL */
    src?: string;
    /** Alt text for accessibility */
    alt?: string;
    /** User name for generating initials */
    name?: string;
    /** Show placeholder instead of image */
    placeholder?: boolean;
    /** Additional CSS classes */
    className?: string;
}

// Sizes from design-system.json components.avatar
const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
};

const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
        return words[0].charAt(0) + words[words.length - 1].charAt(0);
    }
    return words[0].charAt(0);
};

export const Avatar: React.FC<AvatarProps> = ({
    size = 'md',
    src,
    alt = '',
    name,
    placeholder = false,
    className = '',
}) => {
    const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden`;

    if (src && !placeholder) {
        return (
            <img
                src={src}
                alt={alt || name || 'User avatar'}
                className={`${baseClasses} object-cover ${className}`}
                loading="lazy"
            />
        );
    }

    // Show initials if name is provided, otherwise show icon
    const displayContent = name ? (
        <span className="font-medium">{getInitials(name)}</span>
    ) : (
        <i className="ri-user-line" aria-hidden="true" />
    );

    return (
        <div
            className={`${baseClasses} bg-primary text-white ${className}`}
            role="img"
            aria-label={alt || name || 'User avatar'}
        >
            {displayContent}
        </div>
    );
};

export default Avatar;

