'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter Component
 * Animates numbers from 0 to target value when scrolled into view
 */
export function AnimatedCounter({ 
  value, 
  duration = 2000, 
  format = 'number', // 'number' | 'K' | 'M' | 'percent'
  decimals = 0,
  className = '' 
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef(null);

  // Parse the value (handle strings like "450k", "99.9%", etc.)
  const parseValue = (val) => {
    if (typeof val === 'number') return val;
    
    const str = val.toString().toLowerCase();
    
    // Handle percentage
    if (str.includes('%')) {
      return parseFloat(str.replace('%', ''));
    }
    
    // Handle K (thousands)
    if (str.includes('k')) {
      return parseFloat(str.replace('k', '')) * 1000;
    }
    
    // Handle M (millions)
    if (str.includes('m')) {
      return parseFloat(str.replace('m', '')) * 1000000;
    }
    
    return parseFloat(str) || 0;
  };

  const targetValue = parseValue(value);

  // Format the displayed number
  const formatNumber = (num) => {
    const rounded = decimals > 0 ? num.toFixed(decimals) : Math.round(num);
    
    switch (format) {
      case 'K':
        return `${(rounded / 1000).toFixed(decimals)}K`;
      case 'M':
        return `${(rounded / 1000000).toFixed(decimals)}M`;
      case 'percent':
        return `${rounded}%`;
      default:
        return rounded.toLocaleString();
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounter();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [hasAnimated]);

  const animateCounter = () => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateCounter = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = targetValue * easeOut;
      setCount(currentCount);

      if (now < endTime) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(targetValue);
      }
    };

    requestAnimationFrame(updateCounter);
  };

  return (
    <span 
      ref={counterRef} 
      className={className}
      aria-live="polite"
    >
      {formatNumber(count)}
    </span>
  );
}
