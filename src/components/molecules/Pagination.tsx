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
import Link from 'next/link';
import { Icon, Button } from '@/components/atoms';

export interface PaginationProps {
    /** Current active page (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Page change handler (optional if getPageUrl is used) */
    onPageChange?: (page: number) => void;
    /** Function to get URL for SEO-friendly links */
    getPageUrl?: (page: number) => string;
    /** Number of page buttons to show */
    maxVisible?: number;
    /** Additional CSS classes */
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    getPageUrl,
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

    const renderPageElement = (
        targetPage: number, 
        content: React.ReactNode, 
        baseClass: string, 
        ariaLabel?: string, 
        ariaCurrent?: "page",
        disabled?: boolean
    ) => {
        const defaultClass = `${baseClass} transition-colors flex items-center justify-center`;
        
        if (disabled) {
            return (
                <span className={`${defaultClass} opacity-50 cursor-not-allowed`} aria-label={ariaLabel}>
                    {content}
                </span>
            );
        }

        if (getPageUrl) {
            return (
                <Link
                    href={getPageUrl(targetPage)}
                    className={defaultClass}
                    aria-label={ariaLabel}
                    aria-current={ariaCurrent}
                >
                    {content}
                </Link>
            );
        }

        return (
            <button
                onClick={() => onPageChange?.(targetPage)}
                className={defaultClass}
                aria-label={ariaLabel}
                aria-current={ariaCurrent}
            >
                {content}
            </button>
        );
    };

    return (
        <nav
            className={`flex flex-wrap items-center justify-center gap-1 ${className}`}
            aria-label="التنقل بين الصفحات"
        >
            {/* Previous Button */}
            {renderPageElement(
                currentPage - 1,
                <Icon name="ri-arrow-right-s-line" />,
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 hover:bg-gray-50",
                "الصفحة السابقة",
                undefined,
                currentPage === 1
            )}

            {/* First Page */}
            {visiblePages[0] > 1 && renderPageElement(
                1,
                "1",
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
            )}

            {/* First Ellipsis */}
            {showFirstEllipsis && (
                <span className="w-6 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400">...</span>
            )}

            {/* Page Numbers */}
            {visiblePages.map((page) => renderPageElement(
                page,
                page.toLocaleString('ar-YE'),
                `w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base ${
                    page === currentPage
                        ? 'bg-primary text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                }`,
                undefined,
                page === currentPage ? 'page' : undefined
            ))}

            {/* Last Ellipsis */}
            {showLastEllipsis && (
                <span className="w-6 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400">...</span>
            )}

            {/* Last Page */}
            {visiblePages[visiblePages.length - 1] < totalPages && renderPageElement(
                totalPages,
                totalPages.toLocaleString('ar-YE'),
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
            )}

            {/* Next Button */}
            {renderPageElement(
                currentPage + 1,
                <Icon name="ri-arrow-left-s-line" />,
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 hover:bg-gray-50",
                "الصفحة التالية",
                undefined,
                currentPage === totalPages
            )}
        </nav>
    );
};

export default Pagination;
