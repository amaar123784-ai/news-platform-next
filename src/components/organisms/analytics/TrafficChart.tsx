/**
 * TrafficChart
 * 
 * Pie chart showing traffic sources distribution.
 * Uses Recharts with design system colors.
 */

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';

interface TrafficChartProps {
    className?: string;
    data?: any[];
}

import { colors } from '../../../design-system/tokens';

// Design System Colors Palette
const COLORS = [
    colors.brand.primary,
    colors.brand.secondary,
    colors.semantic.warning.base,
    colors.semantic.error.base,
    colors.semantic.info.base
];

export const TrafficChart: React.FC<TrafficChartProps> = ({ className = '', data = [] }) => {
    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 ${className}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-brand">مصادر الزيارات</h3>
            <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => {
                                if ((percent || 0) < 0.05) return null; // Hide labels for < 5%
                                const safeName = name || '';
                                const truncatedName = safeName.length > 10 ? safeName.substring(0, 10) + '...' : safeName;
                                return `${truncatedName} ${((percent || 0) * 100).toFixed(0)}%`;
                            }}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontFamily: 'Noto Sans Arabic',
                                textAlign: 'right',
                            }}
                            formatter={(value) => [`${(value || 0).toLocaleString()} زيارة`, 'العدد']}
                        />
                        <Legend
                            wrapperStyle={{ fontFamily: 'Noto Sans Arabic', paddingTop: '10px' }}
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrafficChart;
