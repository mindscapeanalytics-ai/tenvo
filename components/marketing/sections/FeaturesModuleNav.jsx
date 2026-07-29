/**
 * Compact module jump nav for `/features` — links to deep sections without duplicating card grids.
 */
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MARKETING_CONTAINER, MARKETING_EYEBROW } from '@/lib/utils/marketingLayout';

const MODULE_LINKS = [
  { href: '#inventory', label: 'Inventory' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#manufacturing', label: 'Manufacturing' },
  { href: '#accounting', label: 'Finance' },
  { href: '#compliance', label: 'Tax' },
  { href: '#storefront', label: 'Storefront' },
  { href: '#pos-hospitality', label: 'POS' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#security', label: 'Security' },
  { href: '/solutions/marketing-crm', label: 'Marketing & CRM' },
];

export default function FeaturesModuleNav({ embedded = false }) {
  return (
    <div
      className={cn(
        embedded ? 'border-t border-neutral-200/70 pt-6' : 'scroll-mt-28 border-b border-neutral-200/80 bg-neutral-50/80 py-6 sm:py-8'
      )}
    >
      <div className={MARKETING_CONTAINER}>
        <p className={cn(MARKETING_EYEBROW, 'mb-3 text-center')}>Jump to module</p>
        <nav
          aria-label="Features modules"
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2"
        >
          {MODULE_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm',
                'motion-safe:transition-[border-color,box-shadow,color] motion-safe:duration-200',
                'hover:border-brand-primary/30 hover:text-brand-primary hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40'
              )}
              {...(href.startsWith('/') ? {} : { prefetch: false })}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
