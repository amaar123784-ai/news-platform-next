"use client";

/**
 * BreakingNewsTicker Component
 * 
 * Fixed top bar for breaking news.
 * Uses widely supported CSS animation for seamless looping.
 */

import React from 'react';
import { Container, Icon } from '@/components/atoms';

export interface BreakingNewsTickerProps {
    items: (string | { title: string })[];
    visible?: boolean;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
    items,
    visible = true,
}) => {
    if (!visible || items.length === 0) return null;

    // Ensure we have enough content to scroll smoothly
    // 4 repetitions is a safe balance for performance and infinite feel
    const repeatedItems = [...items, ...items, ...items, ...items];

    return (
        <div className="relative z-[100] w-full bg-red-700 text-white shadow-md border-b-2 border-red-800">
            <div className="container mx-auto px-4 h-10 flex items-center overflow-hidden">

                {/* Label Badge - Static */}
                <div className="flex items-center gap-2 pl-6 pr-2 bg-red-800 h-full relative z-20 flex-shrink-0 font-bold text-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span>عاجل</span>

                    {/* Angled Divider */}
                    <div className="absolute left-full top-0 h-0 w-0 border-t-[40px] border-t-red-800 border-r-[20px] border-r-transparent"></div>
                </div>

                {/* Marquee Track */}
                <div className="flex-1 overflow-hidden relative h-full flex items-center mask-fade-sides">
                    <div className="animate-marquee-continuous whitespace-nowrap flex items-center">
                        {repeatedItems.map((item, i) => (
                            <span key={i} className="inline-flex items-center mx-8 text-sm font-medium">
                                {typeof item === 'string' ? item : item.title}
                                <span className="mr-8 w-1.5 h-1.5 rounded-full bg-white/40"></span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakingNewsTicker;
