/**
 * GrowthChart
 * 
 * Bar chart showing user growth over time.
 * Uses Recharts with design system colors.
 */

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface GrowthChartProps {
    className?: string;
    data?: any[];
}

// Design System Colors
const PRIMARY_COLOR = '#2563EB';
const SECONDARY_COLOR = '#94A3B8'; // gray-400

export const GrowthChart: React.FC<GrowthChartProps> = ({ className = '', data = [] }) => {
    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 ${className}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-brand">نمو المستخدمين</h3>
            <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#6B7280', fontFamily: 'Noto Sans Arabic' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis
                            tick={{ fill: '#6B7280', fontFamily: 'Noto Sans Arabic' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontFamily: 'Noto Sans Arabic',
                                textAlign: 'right',
                            }}
                            labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                        />
                        <Legend
                            wrapperStyle={{ fontFamily: 'Noto Sans Arabic', paddingTop: '10px' }}
                        />
                        <Bar
                            dataKey="newUsers"
                            name="مستخدمون جدد"
                            fill={PRIMARY_COLOR}
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="returning"
                            name="عائدون"
                            fill={SECONDARY_COLOR}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GrowthChart;
