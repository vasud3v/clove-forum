import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // Validate inputs
  if (itemHeight <= 0) {
    console.warn('useVirtualScroll: itemHeight must be greater than 0');
  }
  if (containerHeight <= 0) {
    console.warn('useVirtualScroll: containerHeight must be greater than 0');
  }

  const visibleCount = Math.ceil(containerHeight / Math.max(itemHeight, 1));
  const startIndex = Math.max(0, Math.floor(scrollTop / Math.max(itemHeight, 1)) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: Event) => {
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Use RAF to throttle scroll updates
    rafIdRef.current = requestAnimationFrame(() => {
      const target = e.target as HTMLDivElement;
      if (target) {
        setScrollTop(target.scrollTop);
      }
      rafIdRef.current = null;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      // Cancel any pending RAF on cleanup
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll]);

  return {
    containerRef,
    visibleItems,
    offsetY,
    totalHeight,
    startIndex,
    endIndex,
  };
}
