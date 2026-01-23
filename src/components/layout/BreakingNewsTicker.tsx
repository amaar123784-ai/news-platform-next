"use client";

import { useEffect, useState } from "react";

interface BreakingNewsTickerProps {
    news: string[];
}

export function BreakingNewsTicker({ news }: BreakingNewsTickerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (news.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % news.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [news.length]);

    if (news.length === 0) return null;

    return (
        <div className="bg-red-600 text-white py-2">
            <div className="container mx-auto px-4 flex items-center gap-4">
                <span className="flex-shrink-0 bg-white text-red-600 px-3 py-1 rounded text-sm font-bold animate-pulse">
                    عاجل
                </span>
                <div className="overflow-hidden flex-1">
                    <p className="whitespace-nowrap animate-marquee">
                        {news[currentIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
}
