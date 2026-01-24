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

    // Repeat items substantially to ensure seamless scrolling on all screen sizes
    // 10x repetition guarantees width > viewport width even for 8K screens with short text
    const contentItems = Array(10).fill(items).flat();

    return (
        <div
            className="breaking-news-bg text-white py-2 overflow-hidden"
            role="region"
            aria-label="أخبار عاجلة"
        >
            <Container>
                <div className="flex items-center">
                    {/* Breaking News Label */}
                    <div className="flex items-center gap-2 ml-4 whitespace-nowrap flex-shrink-0 z-10 bg-inherit pl-4">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Icon name="ri-notification-3-fill" size="lg" />
                        </div>
                        <span className="font-bold">عاجل</span>
                    </div>

                    {/* Marquee Content */}
                    <div className="overflow-hidden flex-1 relative">
                        <div className="animate-marquee-seamless whitespace-nowrap flex items-center gap-16 min-w-full">
                            {/* Original Set */}
                            {contentItems.map((item, i) => (
                                <span key={`original-${i}`} className="inline-flex items-center text-sm font-medium">
                                    {typeof item === 'string' ? item : item.title}
                                    <span className="mr-16 text-white/40">•</span>
                                </span>
                            ))}
                            {/* Duplicate Set for Seamless Loop */}
                            {contentItems.map((item, i) => (
                                <span key={`duplicate-${i}`} className="inline-flex items-center text-sm font-medium">
                                    {typeof item === 'string' ? item : item.title}
                                    <span className="mr-16 text-white/40">•</span>
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
