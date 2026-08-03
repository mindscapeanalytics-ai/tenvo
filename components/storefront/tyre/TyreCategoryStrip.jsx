'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getTyreNavLinks } from '@/lib/storefront/tyreStorefront';

/**
 * Horizontal vehicle / category navigation for tyre shop catalog.
 */
export function TyreCategoryStrip({ businessDomain, categories = [], accent = '#CC1532', className }) {
  const storeBase = `/store/${businessDomain}`;
  const links = getTyreNavLinks(storeBase, categories);

  if (!links.length) return null;

  return (
    <div className={cn('border-b border-zinc-200 bg-zinc-50/80', className)}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={`${storeBase}/products`}
            className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300"
          >
            All tyres
          </Link>
          {links.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`${storeBase}/products?onSale=true`}
            className="inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            Offers
          </Link>
        </div>
      </div>
    </div>
  );
}
