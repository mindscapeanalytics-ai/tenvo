'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';
import { useScrollDepth } from '@/hooks/useScrollDepth';
import { trackPageView } from '@/lib/analytics/tracking';

/**
 * MarketingLayout Component
 * Wrapper layout for all marketing pages
 * Includes navigation, footer, scroll tracking, and analytics
 * Following 2026 best practices for layout composition
 */
export default function MarketingLayout({ 
  children,
  transparentNav = false,
  minimalFooter = false,
  showAuthButtons = true
}) {
  const pathname = usePathname();
  
  // Track scroll depth
  useScrollDepth();
  
  // Track page views
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav 
        transparent={transparentNav}
        currentPage={pathname}
        showAuthButtons={showAuthButtons}
      />
      
      <main className="flex-1">
        {children}
      </main>
      
      <MarketingFooter variant={minimalFooter ? 'minimal' : 'default'} />
    </div>
  );
}
