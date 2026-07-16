import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualTableBodyProps<T> {
  items: T[];
  rowHeight?: number;
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function VirtualTableBody<T>({
  items,
  rowHeight = 56, // matches standard row height in our tables
  overscan = 8,
  renderRow,
  scrollContainerRef
}: VirtualTableBodyProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const fallbackRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    // If no custom scroll container is provided, find the closest overflow container of the element
    const scrollContainer = scrollContainerRef?.current || fallbackRef.current?.closest('.overflow-y-auto, .overflow-auto') as HTMLDivElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setScrollTop(scrollContainer.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height || 600);
      }
    });

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(scrollContainer);

    // Initial sync
    setScrollTop(scrollContainer.scrollTop);
    setContainerHeight(scrollContainer.clientHeight || 600);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [scrollContainerRef]);

  const { startIndex, endIndex } = useMemo(() => {
    const totalCount = items.length;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      totalCount - 1,
      Math.floor((scrollTop + containerHeight) / rowHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [items.length, scrollTop, containerHeight, rowHeight, overscan]);

  const topPadding = startIndex * rowHeight;
  const bottomPadding = Math.max(0, (items.length - 1 - endIndex) * rowHeight);

  return (
    <tbody ref={fallbackRef} className="divide-y divide-white/5">
      {topPadding > 0 && (
        <tr style={{ height: `${topPadding}px` }}>
          <td colSpan={100} style={{ padding: 0, height: `${topPadding}px` }} />
        </tr>
      )}
      {items.slice(startIndex, endIndex + 1).map((item, idx) => renderRow(item, startIndex + idx))}
      {bottomPadding > 0 && (
        <tr style={{ height: `${bottomPadding}px` }}>
          <td colSpan={100} style={{ padding: 0, height: `${bottomPadding}px` }} />
        </tr>
      )}
    </tbody>
  );
}
