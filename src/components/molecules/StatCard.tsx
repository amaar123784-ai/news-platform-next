/**
 * StatCard Component
 * 
 * Dashboard statistic card with icon, value, label, and trend indicator.
 * 
 * @see components.cards.statCard in design-system.json
 * 
 * @example
 * <StatCard
 *   icon="ri-article-line"
 *   iconBg="bg-blue-100"
 *   iconColor="text-blue-600"
 *   value="1,247"
 *   label="إجمالي الأخبار"
 *   trend={{ value: 12, direction: 'up' }}
 * />
 */

import React from 'react';
import { Icon, Badge } from '@/components/atoms';

export interface StatCardProps {
    /** Remix Icon class */
    icon: string;
    /** Background color class for icon container */
    iconBg?: string;
    /** Text color class for icon */
    iconColor?: string;
    /** Main stat value */
    value: string | number;
    /** Stat label/description */
    label: string;
    /** Trend indicator */
    trend?: {
        value: number;
        direction: 'up' | 'down';
    };
    /** Additional CSS classes */
    className?: string;
}

// Classes from design-system.json components.cards.statCard
const containerClass = 'stat-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100';
const iconContainerClass = 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center';
const valueClass = 'text-xl sm:text-2xl font-bold text-gray-900 mb-1';
const labelClass = 'text-gray-600 text-xs sm:text-sm';

export const StatCard: React.FC<StatCardProps> = ({
    icon,
    iconBg = 'bg-blue-100',
    iconColor = 'text-blue-600',
    value,
    label,
    trend,
    className = '',
}) => {
    return (
        <article className={`${containerClass} ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`${iconContainerClass} ${iconBg}`}>
                    <Icon name={icon} size="2xl" className={iconColor} />
                </div>
                {trend && (
                    <Badge
                        variant="status"
                        status={trend.direction === 'up' ? 'positive' : 'negative'}
                    >
                        {trend.direction === 'up' ? '+' : '-'}{Math.abs(trend.value)}%
                    </Badge>
                )}
            </div>
            <h3 className={valueClass}>{value}</h3>
            <p className={labelClass}>{label}</p>
        </article>
    );
};

export default StatCard;
