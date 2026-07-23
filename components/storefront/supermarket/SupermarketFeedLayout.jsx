'use client';

import { Suspense } from 'react';
import { SupermarketSidebar } from '@/components/storefront/supermarket/SupermarketSidebar';

/**
 * Homepage feed shell — sticky left nav + scrollable main column (Naheed / DSM layout).
 * Categories slide-over lives in the store layout so the header button works on every page.
 */
export function SupermarketFeedLayout({
  children,
  storeBase,
  settings = {},
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = '#f97316',
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pt-4">
      <div className="flex items-start gap-4 lg:gap-5">
        <aside className="sticky top-[152px] hidden w-[232px] shrink-0 self-start lg:block xl:top-[160px] xl:w-[248px]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-100" aria-hidden />}>
            <SupermarketSidebar
              storeBase={storeBase}
              settings={settings}
              businessDomain={businessDomain}
              businessCategory={businessCategory}
              categories={categories}
              products={products}
              accent={accent}
            />
          </Suspense>
        </aside>
        <div className="min-w-0 flex-1 space-y-0 pb-8">{children}</div>
      </div>
    </div>
  );
}
