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
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        return `${pathname}?${params.toString()}`;
    };

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            getPageUrl={getPageUrl}
            className={className}
        />
    );
};
