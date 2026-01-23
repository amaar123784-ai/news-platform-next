/**
 * ViewsChart
 * 
 * Line chart showing article views over time.
 * Uses Recharts with design system colors.
 */

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface ViewsChartProps {
    className?: string;
    data?: any[];
}

import { colors } from '../../../design-system/tokens';

// Design System Colors
const PRIMARY_COLOR = colors.brand.primary;
const SECONDARY_COLOR = colors.brand.secondary;

export const ViewsChart: React.FC<ViewsChartProps> = ({ className = '', data = [] }) => {
    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 ${className}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-brand">إحصائيات المشاهدات</h3>
            <div className="h-72" dir="ltr"> {/* LTR for chart axes */}
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart
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
                        <Line
                            type="monotone"
                            dataKey="views"
                            name="المشاهدات"
                            stroke={PRIMARY_COLOR}
                            strokeWidth={2}
                            dot={{ r: 4, fill: PRIMARY_COLOR }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="visitors"
                            name="الزوار"
                            stroke={SECONDARY_COLOR}
                            strokeWidth={2}
                            dot={{ r: 4, fill: SECONDARY_COLOR }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ViewsChart;
