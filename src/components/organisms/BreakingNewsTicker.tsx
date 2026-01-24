"use client";

/**
 * BreakingNewsTicker Component
 * 
 * Animated breaking news marquee bar with auto-scroll.
 * Pauses on hover for accessibility.
 * 
 * @see components.breakingNews in design-system.json
 * 
 * @example
 * <BreakingNewsTicker items={['خبر عاجل 1', 'خبر عاجل 2']} />
 */

import React from 'react';
import { Container, Icon } from '@/components/atoms';

export interface BreakingNewsTickerProps {
    /** Array of news headlines or articles */
    items: (string | { title: string })[];
    /** Whether to show the ticker */
    visible?: boolean;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
    items,
    visible = true,
}) => {
    if (!visible || items.length === 0) return null;

    // Repeat items to ensure they fill the screen width
    // We repeat 4 times strictly to ensure length > 100vw even on huge screens
    const contentItems = [...items, ...items, ...items, ...items];

    return (
        <div
            className="breaking-news-bg text-white py-2 overflow-hidden"
            role="region"
            aria-label="أخبار عاجلة"
        >
            <Container>
                <div className="flex items-center">
                    {/* Breaking News Label */}
                    <div className="flex items-center gap-2 ml-4 whitespace-nowrap flex-shrink-0">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Icon name="ri-notification-3-fill" size="lg" />
                        </div>
                        <span className="font-bold">عاجل</span>
                    </div>

                    {/* Marquee Content */}
                    <div className="overflow-hidden flex-1 relative">
                        <div className="animate-marquee-seamless whitespace-nowrap flex items-center">
                            {/* Original Set (Repeated 4x) */}
                            {contentItems.map((item, i) => (
                                <span key={`original-${i}`} className="mx-8 inline-flex items-center text-sm font-medium">
                                    {typeof item === 'string' ? item : item.title}
                                    <span className="mr-8 text-white/40">•</span>
                                </span>
                            ))}
                            {/* Duplicate Set for Seamless Loop (Repeated 4x) */}
                            {contentItems.map((item, i) => (
                                <span key={`duplicate-${i}`} className="mx-8 inline-flex items-center text-sm font-medium">
                                    {typeof item === 'string' ? item : item.title}
                                    <span className="mr-8 text-white/40">•</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default BreakingNewsTicker;
