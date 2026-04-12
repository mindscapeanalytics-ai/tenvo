/**
 * useScrollDepth Hook
 * Track scroll depth for analytics
 * Following 2026 React hooks best practices
 */

import { useEffect, useRef } from 'react';
import { trackScrollDepth } from '@/lib/analytics/tracking';

/**
 * Track scroll depth at 25%, 50%, 75%, 100%
 * Fires analytics events when user reaches each milestone
 */
export function useScrollDepth() {
  const trackedDepths = useRef(new Set());
  
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      // Track at 25%, 50%, 75%, 100%
      const depths = [25, 50, 75, 100];
      depths.forEach(depth => {
        if (scrollPercentage >= depth && !trackedDepths.current.has(depth)) {
          trackedDepths.current.add(depth);
          trackScrollDepth(depth);
        }
      });
    };
    
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}

/**
 * Track scroll depth with custom thresholds
 * @param {Array<number>} thresholds - Custom depth thresholds (e.g., [10, 25, 50, 75, 90, 100])
 */
export function useCustomScrollDepth(thresholds = [25, 50, 75, 100]) {
  const trackedDepths = useRef(new Set());
  
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      thresholds.forEach(depth => {
        if (scrollPercentage >= depth && !trackedDepths.current.has(depth)) {
          trackedDepths.current.add(depth);
          trackScrollDepth(depth);
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [thresholds]);
}
