/**
 * Button Component
 * 
 * Primary interactive element following design system button tokens.
 * Supports primary, secondary, outline, icon, social, and category tab variants.
 * 
 * Button Hierarchy:
 * - primary:   Strong CTA — solid brand color (sky blue), high emphasis
 * - secondary: Supporting action — outlined/neutral style, less visual weight
 * - outline:   Gentle action — bordered, transparent background
 * - icon:      Icon-only circular button
 * - social:    Social media icon button
 * - categoryTab: Toggle-style tab
 * 
 * @see components.buttons in design-system.json
 * 
 * @example
 * <Button variant="primary">تسجيل الدخول</Button>
 * <Button variant="secondary">إلغاء</Button>
 * <Button variant="icon" ariaLabel="Search"><Icon name="ri-search-line" /></Button>
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button variant from design system */
    variant?: 'primary' | 'secondary' | 'outline' | 'icon' | 'social' | 'categoryTab';
    /** Whether this is the active category tab */
    isActive?: boolean;
    /** Button size */
    size?: 'sm' | 'md' | 'lg';
    /** Loading state */
    isLoading?: boolean;
    /** Children elements */
    children: React.ReactNode;
}

// Clear CTA hierarchy with consistent styling
const variantClasses = {
    // Strong CTA: solid brand color, high contrast
    primary: 'bg-primary text-white hover:bg-sky-400 active:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0 rounded-full font-bold tracking-wide transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md',
    // Supporting: outlined, neutral weight
    secondary: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 active:bg-gray-300 hover:-translate-y-0.5 active:translate-y-0 rounded-full font-bold tracking-wide transition-all duration-300 whitespace-nowrap',
    // Outline variant: transparent with border
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10 active:bg-primary/20 rounded-full font-bold tracking-wide transition-all duration-300 whitespace-nowrap',
    // Icon button
    icon: 'w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full text-gray-600 transition-colors',
    // Social media button
    social: 'w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-primary hover:-translate-y-1 transition-all duration-300 text-white shadow-sm',
    // Category tab
    categoryTab: 'px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border',
};

const categoryTabStates = {
    active: 'bg-primary text-white border-primary',
    inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200',
};

const sizeClasses = {
    sm: 'text-sm px-4 py-1.5',
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
