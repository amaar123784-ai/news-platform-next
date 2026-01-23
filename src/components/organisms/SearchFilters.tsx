/**
 * SearchFilters Component
 * 
 * Sidebar with category, date range, and sort filters for search results.
 * 
 * @see components.sidebar in design-system.json
 * 
 * @example
 * <SearchFilters 
 *   filters={currentFilters}
 *   onFilterChange={setFilters}
 * />
 */

import React from 'react';
import { Icon, Button } from '@/components/atoms';
import { categoryBadges, type CategoryType } from '@/design-system/tokens';

export interface SearchFiltersState {
    category?: CategoryType | 'all';
    dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
    sortBy?: 'relevance' | 'date' | 'views';
}

export interface SearchFiltersProps {
    /** Current filter state */
    filters: SearchFiltersState;
    /** Filter change handler */
    onFilterChange: (filters: SearchFiltersState) => void;
    /** Result count */
    resultCount?: number;
    /** Additional CSS classes */
    className?: string;
}

const dateRanges = [
    { value: 'all', label: 'جميع الأوقات' },
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'year', label: 'هذا العام' },
];

const sortOptions = [
    { value: 'relevance', label: 'الأكثر صلة' },
    { value: 'date', label: 'الأحدث' },
    { value: 'views', label: 'الأكثر مشاهدة' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
    filters,
    onFilterChange,
    resultCount,
    className = '',
}) => {
    const updateFilter = <K extends keyof SearchFiltersState>(
        key: K,
        value: SearchFiltersState[K]
    ) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange({
            category: 'all',
            dateRange: 'all',
            sortBy: 'relevance',
        });
    };

    const hasActiveFilters =
        (filters.category && filters.category !== 'all') ||
        (filters.dateRange && filters.dateRange !== 'all') ||
        (filters.sortBy && filters.sortBy !== 'relevance');

    return (
        <aside className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Icon name="ri-filter-3-line" className="text-primary" />
                    <h3 className="font-bold">تصفية النتائج</h3>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-primary hover:underline"
                    >
                        مسح الكل
                    </button>
                )}
            </div>

            {/* Result Count */}
            {resultCount !== undefined && (
                <p className="text-sm text-gray-500 mb-6">
                    {resultCount.toLocaleString('ar-YE')} نتيجة
                </p>
            )}

            {/* Category Filter */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">القسم</h4>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="category"
                            checked={!filters.category || filters.category === 'all'}
                            onChange={() => updateFilter('category', 'all')}
                            className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">جميع الأقسام</span>
                    </label>
                    {Object.entries(categoryBadges).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="category"
                                checked={filters.category === key}
                                onChange={() => updateFilter('category', key as CategoryType)}
                                className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm">{value.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">الفترة الزمنية</h4>
                <div className="space-y-2">
                    {dateRanges.map((range) => (
                        <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="dateRange"
                                checked={filters.dateRange === range.value || (!filters.dateRange && range.value === 'all')}
                                onChange={() => updateFilter('dateRange', range.value as SearchFiltersState['dateRange'])}
                                className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Sort By */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">ترتيب حسب</h4>
                <select
                    value={filters.sortBy || 'relevance'}
                    onChange={(e) => updateFilter('sortBy', e.target.value as SearchFiltersState['sortBy'])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                    {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </aside>
    );
};

export default SearchFilters;
