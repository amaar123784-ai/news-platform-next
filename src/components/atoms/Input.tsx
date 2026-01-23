'use client';

/**
 * Input Component
 * 
 * Form input field following design system form tokens.
 * Supports text, email, password, and search types with icons.
 * 
 * @see components.forms.input in design-system.json
 * 
 * @example
 * <Input type="email" placeholder="البريد الإلكتروني" icon="ri-mail-line" />
 * <Input type="password" placeholder="كلمة المرور" />
 */

import React, { useState } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'search' | 'tel';
    /** Remix Icon class for right side (RTL) */
    icon?: string;
    /** Error state */
    hasError?: boolean;
    /** Error message */
    errorMessage?: string;
    /** Error message (alias for errorMessage) */
    error?: string;
    /** Input size */
    inputSize?: 'sm' | 'md' | 'lg';
}

// Classes from design-system.json components.forms.input
const baseInputClass = 'w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-colors';
const errorClass = 'border-red-500 focus:ring-red-500';
const iconContainerClass = 'absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center';
const iconClass = 'text-gray-400';

const sizeClasses = {
    sm: 'py-2 pr-10 pl-3',
    md: 'py-3 pr-12 pl-4',
    lg: 'py-4 pr-14 pl-5',
};

export const Input: React.FC<InputProps> = ({
    type = 'text',
    icon,
    hasError = false,
    errorMessage,
    error,
    inputSize = 'md',
    className = '',
    id,
    ...props
}) => {
    const actualErrorMessage = error || errorMessage;
    const isError = hasError || !!error;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="relative">
            {/* Right icon (RTL) */}
            {icon && (
                <div className={iconContainerClass}>
                    <i className={`${icon} ${iconClass}`} aria-hidden="true" />
                </div>
            )}

            <input
                id={inputId}
                type={inputType}
                className={`
          ${baseInputClass}
          ${sizeClasses[inputSize]}
          ${isError ? errorClass : ''}
          ${icon ? 'pr-12' : 'pr-4'}
          ${isPassword ? 'pl-12' : 'pl-4'}
          ${className}
        `}
                aria-invalid={isError}
                aria-describedby={isError && actualErrorMessage ? `${inputId}-error` : undefined}
                {...props}
            />

            {/* Password toggle button */}
            {isPassword && (
                <button
                    type="button"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                    <i
                        className={showPassword ? 'ri-eye-line' : 'ri-eye-off-line'}
                        aria-hidden="true"
                    />
                </button>
            )}

            {/* Error message */}
            {isError && actualErrorMessage && (
                <p
                    id={`${inputId}-error`}
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                >
                    {actualErrorMessage}
                </p>
            )}
        </div>
    );
};

export default Input;
