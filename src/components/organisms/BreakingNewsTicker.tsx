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
                        <div className="animate-marquee whitespace-nowrap inline-block">
                            {items.map((item, i) => (
                                <span key={i} className="mx-4 inline-flex items-center">
                                    {typeof item === 'string' ? item : item.title}
                                    {i < items.length - 1 && <span className="mr-4 text-white/50">•</span>}
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
