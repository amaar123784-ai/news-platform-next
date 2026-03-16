"use client";

import { useEffect, useRef } from 'react';
import axios from 'axios';

interface ViewTrackerProps {
    slug: string;
}

/**
 * ViewTracker Component
 * 
 * Silently notifies the backend when an article is viewed.
 * Executed on the client to ensure JavaScript is enabled (filters out basic bots).
 * Backend handles deeper bot detection and cookie-based deduplication.
 */
export function ViewTracker({ slug }: ViewTrackerProps) {
    const tracked = useRef(false);

    useEffect(() => {
        // Prevent double tracking in StrictMode or during re-renders
        if (tracked.current) return;
        tracked.current = true;

        const trackView = async () => {
            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
                await axios.post(`${apiBaseUrl}/articles/${slug}/view`, {}, {
                    withCredentials: true // Ensure cookies are sent and received
                });
            } catch (error) {
                // Silently fail to not disturb the user experience
                console.error('[ViewTracker] Failed to track view:', error);
            }
        };

        // Delay tracking slightly to ensure it's a "real" view
        const timer = setTimeout(trackView, 2000);

        return () => clearTimeout(timer);
    }, [slug]);

    return null; // This component has no UI
}
