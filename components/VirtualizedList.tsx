/**
 * VirtualizedList Component
 * 
 * A high-performance virtualized list that only renders visible items.
 * Supports infinite scroll with load-more callbacks.
 * Uses @tanstack/react-virtual for efficient windowing.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
    /** Array of items to render */
    items: T[];
    /** Estimated height of each item in pixels */
    estimatedItemHeight: number;
    /** Function to render each item */
    renderItem: (item: T, index: number) => React.ReactNode;
    /** Callback when user scrolls near bottom (for infinite scroll) */
    onLoadMore?: () => void;
    /** Whether there are more items to load */
    hasMore?: boolean;
    /** Whether currently loading more items */
    loading?: boolean;
    /** Container height - number (px) or string (e.g., 'calc(100vh - 280px)') */
    containerHeight?: number | string;
    /** Number of items to render outside visible area (default: 5) */
    overscan?: number;
    /** CSS class for the container */
    className?: string;
    /** Gap between items in pixels */
    gap?: number;
    /** Number of columns for grid layout (default: 1 for list) */
    columns?: number;
}

export function VirtualizedList<T>({
    items,
    estimatedItemHeight,
    renderItem,
    onLoadMore,
    hasMore = false,
    loading = false,
    containerHeight = 'calc(100vh - 280px)',
    overscan = 5,
    className = '',
    gap = 12,
    columns = 1
}: VirtualizedListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    const loadMoreTriggeredRef = useRef(false);

    // Calculate row count for grid layout
    const rowCount = Math.ceil(items.length / columns);

    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedItemHeight + gap,
        overscan,
    });

    // Infinite scroll detection
    const handleScroll = useCallback(() => {
        if (!parentRef.current || !onLoadMore || !hasMore || loading || loadMoreTriggeredRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Trigger load more when 80% scrolled
        if (scrollPercentage > 0.8) {
            loadMoreTriggeredRef.current = true;
            onLoadMore();
        }
    }, [onLoadMore, hasMore, loading]);

    // Reset load more trigger when items change
    useEffect(() => {
        loadMoreTriggeredRef.current = false;
    }, [items.length]);

    // Attach scroll listener
    useEffect(() => {
        const element = parentRef.current;
        if (!element) return;

        element.addEventListener('scroll', handleScroll, { passive: true });
        return () => element.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            ref={parentRef}
            className={`overflow-auto scrollbar-hide ${className}`}
            style={{ height: containerHeight, contain: 'strict' }}
        >
            <div
                style={{
                    height: virtualizer.getTotalSize(),
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualRow) => {
                    const startIndex = virtualRow.index * columns;
                    const rowItems = items.slice(startIndex, startIndex + columns);

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            {columns === 1 ? (
                                // Single column list
                                <div style={{ paddingBottom: gap }}>
                                    {renderItem(rowItems[0], startIndex)}
                                </div>
                            ) : (
                                // Multi-column grid
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                        gap: gap,
                                        paddingBottom: gap,
                                    }}
                                >
                                    {rowItems.map((item, colIndex) => (
                                        <div key={startIndex + colIndex}>
                                            {renderItem(item, startIndex + colIndex)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-400 border-t-transparent" />
                </div>
            )}

            {/* End of list indicator */}
            {!hasMore && items.length > 0 && (
                <div className="text-center py-4 text-xs text-zinc-500">
                    All items loaded
                </div>
            )}
        </div>
    );
}

export default VirtualizedList;
