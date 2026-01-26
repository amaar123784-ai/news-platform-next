/**
 * Button Component
 * 
 * Primary interactive element following design system button tokens.
 * Supports primary, secondary, icon, social, and category tab variants.
 * 
 * @see components.buttons in design-system.json
 * 
 * @example
 * <Button variant="primary">تسجيل الدخول</Button>
 * <Button variant="icon" ariaLabel="Search"><Icon name="ri-search-line" /></Button>
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button variant from design system */
    variant?: 'primary' | 'secondary' | 'icon' | 'social' | 'categoryTab';
    /** Whether this is the active category tab */
    isActive?: boolean;
    /** Button size */
    size?: 'sm' | 'md' | 'lg';
    /** Loading state */
    isLoading?: boolean;
    /** Children elements */
    children: React.ReactNode;
}

// Classes derived from design-system.json components.buttons
const variantClasses = {
    primary: 'bg-primary text-white border-2 border-secondary hover:-translate-y-0.5 active:translate-y-0 rounded-full font-bold tracking-wide transition-all duration-300 whitespace-nowrap',
    secondary: 'bg-secondary text-white hover:-translate-y-0.5 active:translate-y-0 rounded-full font-bold tracking-wide transition-all duration-300 whitespace-nowrap',
    icon: 'w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full text-gray-600 transition-colors',
    social: 'w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-primary hover:-translate-y-1 transition-all duration-300 text-white shadow-sm',
    categoryTab: 'px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border',
};

const categoryTabStates = {
    active: 'bg-primary text-white',
    inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
};

const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-6 py-2.5',
    lg: 'text-lg px-8 py-3',
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    isActive = false,
    size = 'md',
    isLoading = false,
    children,
    className = '',
    disabled,
    type = 'button',
    ...props
}) => {
    const baseClasses = variantClasses[variant];
    const stateClasses = variant === 'categoryTab'
        ? (isActive ? categoryTabStates.active : categoryTabStates.inactive)
        : '';
    const sizeClass = variant !== 'icon' && variant !== 'social' ? sizeClasses[size] : '';

    return (
        <button
            type={type}
            className={`${baseClasses} ${stateClasses} ${sizeClass} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            disabled={disabled || isLoading}
            aria-busy={isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <i className="ri-loader-4-line animate-spin" aria-hidden="true" />
                    <span>{children}</span>
                </span>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
