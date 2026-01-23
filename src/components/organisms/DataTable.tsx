/**
 * DataTable Organism
 * 
 * High-density reusable table component for the CMS.
 * Supports custom rendering, actions, and pagination (UI only for now).
 */

import React from 'react';
import { Icon, Button } from '@/components/atoms';

export interface Column<T> {
    key: keyof T;
    header: string;
    render?: (item: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    actions?: (item: T) => React.ReactNode;
    isLoading?: boolean;
}

export const DataTable = <T extends { id: string | number }>({
    columns,
    data,
    actions,
    isLoading = false
}: DataTableProps<T>) => {

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                جاري التحميل...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Scroll Wrapper */}
            <div className="overflow-x-auto">
                <table className="w-full text-right text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-medium text-sm">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key.toString()}
                                    className="px-6 py-3 border-b border-gray-200 whitespace-nowrap"
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {actions && <th className="px-6 py-3 border-b border-gray-200 w-20">الإجراءات</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-gray-400">
                                    لا توجد بيانات لعرضها
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key.toString()} className="px-6 py-4 text-sm whitespace-nowrap">
                                            {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {actions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>عرض {data.length} عنصر</span>
                <div className="flex gap-1">
                    <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50" disabled>السابق</button>
                    <button className="px-2 py-1 rounded bg-primary text-white">1</button>
                    <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">2</button>
                    <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">التالي</button>
                </div>
            </div>
        </div>
    );
};
