'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';
import MarketingAssistantWidget from '@/components/marketing/MarketingAssistantWidget';
import { useScrollDepth } from '@/hooks/useScrollDepth';
import { trackPageView } from '@/lib/analytics/tracking';
import { MARKETING_MAIN_BOTTOM } from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

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
  showAuthButtons = true,
  mainBottomClass = MARKETING_MAIN_BOTTOM,
}) {
  const pathname = usePathname();
  
  // Track scroll depth
  useScrollDepth();
  
  // Track page views
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip">
      <MarketingNav 
        transparent={transparentNav}
        currentPage={pathname}
        showAuthButtons={showAuthButtons}
      />
      
      <main className={cn('min-w-0 flex-1', mainBottomClass)}>
        {children}
      </main>
      
      <MarketingFooter variant={minimalFooter ? 'minimal' : 'default'} />
      <MarketingAssistantWidget />
    </div>
  );
}
