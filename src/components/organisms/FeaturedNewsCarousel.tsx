"use client";

/**
 * FeaturedNewsCarousel Component
 * 
 * Auto-rotating carousel for featured news articles.
 * Displays one article at a time, transitioning every N seconds.
 */

import { useState, useEffect, useCallback } from 'react';
import { FeaturedNews, type FeaturedNewsProps } from './FeaturedNews';
import { Icon } from '@/components/atoms';

interface FeaturedNewsCarouselProps {
    /** Array of featured articles */
    articles: Omit<FeaturedNewsProps, 'id'>[];
    /** Auto-rotation interval in milliseconds (default: 5000ms = 5 seconds) */
    interval?: number;
    /** Whether to pause on hover */
    pauseOnHover?: boolean;
}

export const FeaturedNewsCarousel: React.FC<FeaturedNewsCarouselProps> = ({
    articles,
    interval = 5000,
    pauseOnHover = true,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const totalSlides = articles.length;

    // Go to next slide
    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, [totalSlides]);

    // Go to previous slide
    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }, [totalSlides]);

    // Go to specific slide
    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // Auto-rotation effect
    useEffect(() => {
        if (totalSlides <= 1 || isPaused) return;

        const timer = setInterval(() => {
            nextSlide();
        }, interval);

        return () => clearInterval(timer);
    }, [totalSlides, interval, isPaused, nextSlide]);

    // If no articles or only one, render FeaturedNews directly
    if (!articles || articles.length === 0) {
        return null;
    }

    if (articles.length === 1) {
        return <FeaturedNews {...articles[0]} />;
    }

    const currentArticle = articles[currentIndex];

    return (
        <div
            className="relative group"
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
            {/* Main Content */}
            <div className="relative overflow-hidden rounded-lg">
                <FeaturedNews {...currentArticle} />

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="السابق"
                >
                    <Icon name="ri-arrow-right-s-line" size="lg" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="التالي"
                >
                    <Icon name="ri-arrow-left-s-line" size="lg" />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                    {articles.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'bg-white w-6'
                                    : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`انتقل إلى الخبر ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Progress Bar (optional visual indicator) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-20">
                    <div
                        className="h-full bg-primary transition-all duration-100"
                        style={{
                            width: `${((currentIndex + 1) / totalSlides) * 100}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default FeaturedNewsCarousel;
