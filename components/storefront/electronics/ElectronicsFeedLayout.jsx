'use client';

import { Suspense } from 'react';
import {
  ElectronicsSidebar,
  ElectronicsSidebarDrawer,
} from '@/components/storefront/electronics/ElectronicsSidebar';

/**
 * Homepage feed shell — sticky department nav + main column (supermarket-style).
 */
export function ElectronicsFeedLayout({
  children,
  storeBase,
  settings = {},
  businessDomain,
  accent = '#2563eb',
}) {
  return (
    <>
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        <div className="flex items-start gap-5 lg:gap-6">
          <aside className="sticky top-[168px] hidden w-[232px] shrink-0 self-start lg:block xl:top-[176px] xl:w-[248px]">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-100" aria-hidden />}>
              <ElectronicsSidebar
                storeBase={storeBase}
                settings={settings}
                businessDomain={businessDomain}
                accent={accent}
              />
            </Suspense>
          </aside>
          <div className="min-w-0 flex-1 pb-8">{children}</div>
        </div>
      </div>
      <ElectronicsSidebarDrawer
        storeBase={storeBase}
        settings={settings}
        businessDomain={businessDomain}
        accent={accent}
      />
    </>
  );
}
