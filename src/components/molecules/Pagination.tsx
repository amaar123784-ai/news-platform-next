/**
 * Pagination Component
 * 
 * Page navigation with previous/next and page numbers.
 * 
 * @see components.buttons in design-system.json
 * 
 * @example
 * <Pagination 
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 */

import React from 'react';
import { Icon, Button } from '@/components/atoms';

export interface PaginationProps {
    /** Current active page (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Page change handler */
    onPageChange: (page: number) => void;
    /** Number of page buttons to show */
    maxVisible?: number;
    /** Additional CSS classes */
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    maxVisible = 5,
    className = '',
}) => {
    if (totalPages <= 1) return null;

    // Calculate visible page range
    const getVisiblePages = (): number[] => {
        const pages: number[] = [];
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);

        // Adjust start if we're near the end
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();
    const showFirstEllipsis = visiblePages[0] > 2;
    const showLastEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

    return (
        <nav
            className={`flex items-center justify-center gap-1 ${className}`}
            aria-label="التنقل بين الصفحات"
        >
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="الصفحة السابقة"
            >
                <Icon name="ri-arrow-right-s-line" />
            </button>

            {/* First Page */}
            {visiblePages[0] > 1 && (
                <button
                    onClick={() => onPageChange(1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                    1
                </button>
            )}

            {/* First Ellipsis */}
            {showFirstEllipsis && (
                <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
            )}

            {/* Page Numbers */}
            {visiblePages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`
            w-10 h-10 flex items-center justify-center rounded-lg transition-colors
            ${page === currentPage
                            ? 'bg-primary text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }
          `}
                    aria-current={page === currentPage ? 'page' : undefined}
                >
                    {page.toLocaleString('ar-YE')}
                </button>
            ))}

            {/* Last Ellipsis */}
            {showLastEllipsis && (
                <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
            )}

            {/* Last Page */}
            {visiblePages[visiblePages.length - 1] < totalPages && (
                <button
                    onClick={() => onPageChange(totalPages)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                    {totalPages.toLocaleString('ar-YE')}
                </button>
            )}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="الصفحة التالية"
            >
                <Icon name="ri-arrow-left-s-line" />
            </button>
        </nav>
    );
};

export default Pagination;
