import { useState, useEffect, useRef, RefObject } from 'react';

interface ChartDimensionsResult {
    containerRef: RefObject<HTMLDivElement>;
    isReady: boolean;
    dimensions: { width: number; height: number };
}

/**
 * Hook to ensure chart containers have valid dimensions before rendering Recharts components.
 * Prevents "width(0) and height(0)" warnings from Recharts ResponsiveContainer.
 *
 * @param minWidth - Minimum width required (default: 100)
 * @param minHeight - Minimum height required (default: 100)
 * @param delay - Delay in ms before checking dimensions (default: 50)
 * @returns Object with containerRef, isReady flag, and actual dimensions
 */
export function useChartDimensions(
    minWidth: number = 100,
    minHeight: number = 100,
    delay: number = 50
): ChartDimensionsResult {
    const [isReady, setIsReady] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkDimensions = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                
                setDimensions({ width: offsetWidth, height: offsetHeight });

                // Only mark as ready if dimensions meet minimum requirements
                if (offsetWidth >= minWidth && offsetHeight >= minHeight) {
                    setIsReady(true);
                }
            }
        };

        // Check immediately (might work if parent is already laid out)
        checkDimensions();

        // Check again after delay to ensure layout has completed
        const timer = setTimeout(checkDimensions, delay);

        // Optional: Add resize observer for dynamic containers
        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                checkDimensions();
            });
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timer);
            if (resizeObserver && containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [minWidth, minHeight, delay]);

    return { containerRef, isReady, dimensions };
}
