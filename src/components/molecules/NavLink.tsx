/**
 * NavLink Component
 * 
 * Navigation link with icon for desktop/mobile nav.
 * Combines Icon and text with active state styling.
 * 
 * @see components.navigation in design-system.json
 * 
 * @example
 * <NavLink href="/politics" icon="ri-government-line" isActive>السياسة</NavLink>
 */

import React from 'react';
import { Icon } from '@/components/atoms';

export interface NavLinkProps {
    /** Link destination */
    href: string;
    /** Remix Icon class */
    icon?: string;
    /** Whether link is currently active */
    isActive?: boolean;
    /** Link text */
    children: React.ReactNode;
    /** onClick handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
}

// Classes from design-system.json components.navigation
const linkClasses = {
    default: 'text-gray-700 hover:text-primary font-medium transition-colors',
    active: 'text-primary font-bold border-b-2 border-primary',
};

export const NavLink: React.FC<NavLinkProps> = ({
    href,
    icon,
    isActive = false,
    children,
    onClick,
    className = '',
}) => {
    return (
        <a
            href={href}
            onClick={onClick}
            className={`
        flex items-center gap-2
        ${isActive ? linkClasses.active : linkClasses.default}
        ${className}
      `}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon && <Icon name={icon} size="lg" aria-hidden />}
            <span>{children}</span>
        </a>
    );
};

export default NavLink;
