/**
 * SearchInput Component
 * 
 * Search input with icon, clear button, and submit.
 * 
 * @see components.forms.input in design-system.json
 * 
 * @example
 * <SearchInput 
 *   value={query}
 *   onChange={setQuery}
 *   onSubmit={handleSearch}
 *   placeholder="ابحث في الأخبار..."
 * />
 */

import React from 'react';
import { Icon, Button } from '@/components/atoms';

export interface SearchInputProps {
    /** Search query value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Submit handler */
    onSubmit?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show submit button */
    showButton?: boolean;
    /** Additional CSS classes */
    className?: string;
}

const sizeClasses = {
    sm: 'py-2 pr-10 pl-3 text-sm',
    md: 'py-3 pr-12 pl-4 text-sm',
    lg: 'py-4 pr-14 pl-5 text-base',
};

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    onSubmit,
    placeholder = 'ابحث...',
    size = 'md',
    showButton = false,
    className = '',
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSubmit?.();
        }
    };

    const handleClear = () => {
        onChange('');
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <div className="relative flex-1">
                {/* Search Icon */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Icon name="ri-search-line" className="text-gray-400" />
                </div>

                <input
                    type="search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`
            w-full border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-primary focus:border-transparent 
            outline-none transition-colors
            ${sizeClasses[size]}
          `}
                    aria-label="مربع البحث"
                />

                {/* Clear Button */}
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="مسح البحث"
                    >
                        <Icon name="ri-close-line" size="sm" />
                    </button>
                )}
            </div>

            {/* Submit Button */}
            {showButton && (
                <Button variant="primary" onClick={onSubmit}>
                    بحث
                </Button>
            )}
        </div>
    );
};

export default SearchInput;
