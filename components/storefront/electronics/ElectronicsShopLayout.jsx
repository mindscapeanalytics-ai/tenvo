'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ElectronicsCategoryStrip } from '@/components/storefront/electronics/ElectronicsCategoryStrip';
import { ELECTRONICS_BLUE } from '@/lib/storefront/electronicsStorefront';

/**
 * Electronics catalog shell — supermarket-style chips + blue shop chrome.
 */
export function ElectronicsShopLayout({
  children,
  businessDomain,
  settings = {},
  accent = ELECTRONICS_BLUE,
  title = 'Shop electronics',
  subtitle = '',
  storeBase,
  className,
}) {
  const root = storeBase || `/store/${businessDomain}`;

  return (
    <div className={cn('min-h-screen bg-slate-50', className)} data-electronics-shop>
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          <Link
            href={`${root}/contact?subject=installment`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            Installment enquiry
          </Link>
        </div>
      </div>

      <ElectronicsCategoryStrip
        businessDomain={businessDomain}
        settings={settings}
        accent={accent}
        storeBase={root}
      />

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
