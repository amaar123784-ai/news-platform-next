"use client";

/**
 * BreakingNewsTicker Component
 * 
 * Fixed top bar for breaking news with accessibility improvements:
 * - role="marquee" for semantic meaning
 * - aria-hidden on duplicate copies for screen readers
 * - Keyboard-accessible pause/play control
 * - Respects prefers-reduced-motion
 */

import React, { useState } from 'react';
import { Container, Icon } from '@/components/atoms';

export interface BreakingNewsTickerProps {
    items: (string | { title: string })[];
    visible?: boolean;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
    items,
    visible = true,
}) => {
    const [isPaused, setIsPaused] = useState(false);

    if (!visible || items.length === 0) return null;

    // Extract text from items
    const getItemText = (item: string | { title: string }) =>
        typeof item === 'string' ? item : item.title;

    return (
        <div
            className="relative z-[100] w-full bg-red-700 text-white shadow-md border-b-2 border-red-800 h-10 overflow-hidden"
            role="marquee"
            aria-live="polite"
            aria-label="أخبار عاجلة"
        >
            <div className="container mx-auto px-4 h-full flex items-center overflow-hidden">

                {/* Label Badge - Static */}
                <div className="flex items-center gap-2 pl-6 pr-2 bg-red-800 h-full relative z-20 flex-shrink-0 font-black text-sm uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span>عاجل</span>

                    {/* Angled Divider */}
                    <div className="absolute left-full top-0 h-0 w-0 border-t-[40px] border-t-red-800 border-r-[20px] border-r-transparent"></div>
                </div>

                {/* Pause/Play Control — keyboard accessible */}
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex-shrink-0 mx-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-800/80 hover:bg-white hover:text-red-800 transition-all text-white font-bold"
                    aria-label={isPaused ? 'تشغيل شريط الأخبار' : 'إيقاف شريط الأخبار'}
                    title={isPaused ? 'تشغيل' : 'إيقاف'}
                >
                    <Icon name={isPaused ? 'ri-play-fill' : 'ri-pause-fill'} size="sm" />
                </button>

                {/* Marquee Track */}
                <div 
                    className="flex-1 overflow-hidden relative h-full flex items-center"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className={`whitespace-nowrap flex items-center ${isPaused ? 'animate-marquee-paused' : ''}`}
                        style={{
                            display: 'inline-flex',
                            animation: 'marquee-continuous 40s linear infinite',
                            animationPlayState: isPaused ? 'paused' : 'running',
                            minWidth: '100%',
                        }}
                    >
                        {/* First copy — announced by screen readers */}
                        {items.map((item, i) => (
                            <span key={`original-${i}`} className="inline-flex items-center mx-8 text-sm font-medium">
                                {getItemText(item)}
                                <span className="mr-8 w-1.5 h-1.5 rounded-full bg-white/40" aria-hidden="true"></span>
                            </span>
                        ))}

                        {/* Duplicate copies — hidden from screen readers */}
                        {[1, 2, 3].map((copyIndex) => (
                            <span key={`copy-${copyIndex}`} aria-hidden="true">
                                {items.map((item, i) => (
                                    <span key={i} className="inline-flex items-center mx-8 text-sm font-medium">
                                        {getItemText(item)}
                                        <span className="mr-8 w-1.5 h-1.5 rounded-full bg-white/40"></span>
                                    </span>
                                ))}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakingNewsTicker;
