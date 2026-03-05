"use client";

import React from 'react';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Pagination } from "./Pagination";

interface UrlPaginationProps {
    currentPage: number;
    totalPages: number;
    className?: string;
}

export const UrlPagination: React.FC<UrlPaginationProps> = ({
    currentPage,
    totalPages,
    className
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());

        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className={className}
        />
    );
};
