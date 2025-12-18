/**
 * VirtualizedTable Component
 * 
 * A high-performance virtualized table that only renders visible rows.
 * Uses @tanstack/react-virtual for efficient windowing.
 */

import React, { useRef, useContext } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ThemeContext } from '../App';

interface Column<T> {
    key: keyof T | string;
    header: string;
    width?: string;
    align?: 'left' | 'right' | 'center';
    render?: (item: T, index: number) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
    /** Array of data items */
    data: T[];
    /** Column definitions */
    columns: Column<T>[];
    /** Estimated row height in pixels */
    estimatedRowHeight?: number;
    /** Container height */
    containerHeight?: number | string;
    /** Number of rows to render outside visible area */
    overscan?: number;
    /** CSS class for the container */
    className?: string;
    /** Optional row key extractor */
    getRowKey?: (item: T, index: number) => string | number;
    /** Optional row click handler */
    onRowClick?: (item: T, index: number) => void;
}

export function VirtualizedTable<T extends Record<string, any>>({
    data,
    columns,
    estimatedRowHeight = 48,
    containerHeight = 400,
    overscan = 5,
    className = '',
    getRowKey,
    onRowClick
}: VirtualizedTableProps<T>) {
    const { isDarkMode } = useContext(ThemeContext);
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedRowHeight,
        overscan,
    });

    const virtualRows = virtualizer.getVirtualItems();

    const getCellValue = (item: T, column: Column<T>, index: number): React.ReactNode => {
        if (column.render) {
            return column.render(item, index);
        }
        const key = column.key as keyof T;
        return item[key] as React.ReactNode;
    };

    if (data.length === 0) {
        return (
            <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                No data to display
            </div>
        );
    }

    return (
        <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'} ${className}`}>
            {/* Fixed Header */}
            <div className={`border-b ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50'}`}>
                <div className="flex">
                    {columns.map((col, i) => (
                        <div
                            key={i}
                            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex-shrink-0 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                } ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
                            style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                        >
                            {col.header}
                        </div>
                    ))}
                </div>
            </div>

            {/* Virtualized Body */}
            <div
                ref={parentRef}
                className="overflow-auto scrollbar-hide"
                style={{ height: containerHeight, contain: 'strict' }}
            >
                <div
                    style={{
                        height: virtualizer.getTotalSize(),
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualRows.map((virtualRow) => {
                        const item = data[virtualRow.index];
                        const rowKey = getRowKey ? getRowKey(item, virtualRow.index) : virtualRow.index;

                        return (
                            <div
                                key={rowKey}
                                className={`absolute top-0 left-0 w-full flex items-center border-b transition-colors ${isDarkMode
                                        ? 'border-zinc-800 hover:bg-zinc-800/50'
                                        : 'border-zinc-100 hover:bg-zinc-50'
                                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                                style={{
                                    height: estimatedRowHeight,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                onClick={() => onRowClick?.(item, virtualRow.index)}
                            >
                                {columns.map((col, colIndex) => (
                                    <div
                                        key={colIndex}
                                        className={`px-4 text-xs flex-shrink-0 truncate ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                            } ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
                                        style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                                    >
                                        {getCellValue(item, col, virtualRow.index)}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer with count */}
            <div className={`px-4 py-2 text-xs border-t ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/30' : 'border-zinc-100 text-zinc-400 bg-zinc-50'}`}>
                {data.length.toLocaleString()} {data.length === 1 ? 'row' : 'rows'}
            </div>
        </div>
    );
}

export default VirtualizedTable;
