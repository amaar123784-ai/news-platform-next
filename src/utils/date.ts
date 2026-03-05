/**
 * Date/time utility functions
 * Shared across components to avoid duplication.
 */

/**
 * Format a date string as a relative "time ago" in Arabic.
 * @param date - ISO date string
 * @returns Arabic relative time string
 */
export function formatTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days === 1) return "منذ يوم";
    if (days < 7) return `منذ ${days} أيام`;
    return `منذ ${Math.floor(days / 7)} أسبوع`;
}
