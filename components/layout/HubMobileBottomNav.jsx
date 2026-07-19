'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { MobileActionRow } from '@/components/mobile/MobileHubPrimitives';
import { useHubMobileNav } from '@/lib/hooks/useHubMobileNav';
import { normalizeDashboardTab } from '@/lib/config/tabs';
import {
  HUB_TAB_NAVIGATE_EVENT,
  navigateHubTab,
  prefetchHubTabChunk,
} from '@/lib/utils/hubTabNavigation';
import {
  MOBILE_BOTTOM_SHEET,
  MOBILE_BOTTOM_SHEET_BODY,
  MOBILE_BOTTOM_SHEET_HANDLE,
  MOBILE_BOTTOM_SHEET_HEADER,
} from '@/lib/utils/mobileLayout';

/**
 * Fixed bottom navigation for mobile hub, app-like primary tabs + overflow sheet.
 * Hidden on lg+ where the sidebar is the canonical nav.
 */
export function HubMobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { primaryItems, overflowItems, ready } = useHubMobileNav();
  const [moreOpen, setMoreOpen] = useState(false);

  const urlTab = normalizeDashboardTab(searchParams.get('tab') || 'dashboard');
  const [optimisticNavTab, setOptimisticNavTab] = useState(null);
  const currentTab = optimisticNavTab ?? urlTab;

  const handleFromUrl = useMemo(() => {
    const parts = pathname?.split('/') || [];
    return parts[2] || 'retail-shop';
  }, [pathname]);

  const baseUrl = `/business/${handleFromUrl}`;

  useEffect(() => {
    const onHubTab = (e) => {
      const tab = e.detail?.tab;
      if (tab) setOptimisticNavTab(normalizeDashboardTab(tab));
    };
    window.addEventListener(HUB_TAB_NAVIGATE_EVENT, onHubTab);
    return () => window.removeEventListener(HUB_TAB_NAVIGATE_EVENT, onHubTab);
  }, []);

  useEffect(() => {
    if (optimisticNavTab == null || optimisticNavTab !== urlTab) return;
    queueMicrotask(() => setOptimisticNavTab(null));
  }, [optimisticNavTab, urlTab]);

  if (!ready) return null;

  const hrefFor = (key, item) => {
    if (item?.externalPath) return item.externalPath;
    return key === 'dashboard' ? baseUrl : `${baseUrl}?tab=${key}`;
  };

  const goToTab = (key, item) => {
    if (item?.locked) return;
    if (item?.externalPath) {
      router.push(item.externalPath, { scroll: false });
      return;
    }
    const result = navigateHubTab({ domain: handleFromUrl, tab: key });
    if (result.type === 'route') {
      router.push(result.href, { scroll: false });
    }
  };

  const isOverflowActive = overflowItems.some((item) => item.key === currentTab);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Primary navigation"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {primaryItems.map((item) => {
            const isMore = item.key === '__more__';
            const isActive = isMore ? isOverflowActive : currentTab === item.key;
            const Icon = item.icon;

            if (isMore) {
              return (
                <li key={item.key} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className={cn(
                      'flex w-full flex-col items-center gap-0.5 px-1 py-2 transition-colors',
                      isActive ? 'text-brand-primary' : 'text-gray-500'
                    )}
                    aria-expanded={moreOpen}
                    aria-haspopup="dialog"
                  >
                    <MoreHorizontal className={cn('h-5 w-5', isActive && 'scale-110')} />
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.key} className="flex-1">
                <Link
                  href={hrefFor(item.key, item)}
                  onMouseEnter={() => {
                    if (!item.locked && !item.externalPath) prefetchHubTabChunk(item.key);
                  }}
                  onClick={(e) => {
                    if (item.locked) {
                      e.preventDefault();
                      return;
                    }
                    if (item.externalPath) return;
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      goToTab(item.key, item);
                    }
                  }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-1 py-2 transition-colors',
                    isActive ? 'text-brand-primary' : 'text-gray-500',
                    item.locked && 'pointer-events-none opacity-40'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className={MOBILE_BOTTOM_SHEET}>
          <div className={MOBILE_BOTTOM_SHEET_HANDLE} aria-hidden />
          <SheetHeader className={MOBILE_BOTTOM_SHEET_HEADER}>
            <SheetTitle className="text-base font-bold text-gray-900">More modules</SheetTitle>
            <SheetDescription className="text-xs text-gray-500">
              Customers, purchases, reports, settings, and more
            </SheetDescription>
          </SheetHeader>
          <div className={MOBILE_BOTTOM_SHEET_BODY}>
            <div className="space-y-2">
              {overflowItems.map((item) => (
                <MobileActionRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  sublabel={item.locked ? 'Upgrade plan to unlock' : undefined}
                  active={currentTab === item.key}
                  disabled={item.locked}
                  onClick={() => {
                    if (item.locked) return;
                    setMoreOpen(false);
                    goToTab(item.key, item);
                  }}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default HubMobileBottomNav;
