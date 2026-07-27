'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Barcode,
  MonitorSmartphone,
  Package,
  Printer,
} from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { VERTICAL_COUNT } from '@/lib/marketing/capabilities';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const PROOFS = [
  {
    icon: MonitorSmartphone,
    title: 'Hub + phone',
    body: 'Same Easy Mode workspace on desktop and mobile.',
  },
  {
    icon: Package,
    title: 'Live inventory',
    body: 'Low-stock alerts and stock counts stay in sync.',
  },
  {
    icon: Printer,
    title: 'Counter ready',
    body: 'Receipts, scan, and payment amount on one sale.',
  },
  {
    icon: Barcode,
    title: 'Scan to sell',
    body: 'Barcode flow wired from floor to checkout.',
  },
];

/**
 * Inventory / POS ecosystem showcase — pos-inv.webp composite.
 */
export default function HomeIndustryShowcase() {
  return (
    <MarketingSection
      padding="loose"
      className="border-b border-neutral-200/80 bg-gradient-to-b from-white via-[#F7F7F8] to-white"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14">
        <div className="min-w-0 space-y-6 lg:col-span-5 xl:col-span-4">
          <div className="space-y-3 sm:space-y-4">
            <p className={MARKETING_EYEBROW}>Inventory & counter</p>
            <h2 className={cn(MARKETING_SECTION_HEADING, 'max-w-lg')}>
              Stock, sales, and hardware in{' '}
              <span className="text-brand-primary">one picture.</span>
            </h2>
            <p className={cn(MARKETING_LEAD, 'max-w-md')}>
              Desktop hub, mobile ops, thermal receipts, barcode scan, and card
              payment, wired to the same TENVO workspace. {VERTICAL_COUNT}+
              industry presets ship day one.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {PROOFS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="flex gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-neutral-200/90"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary ring-1 ring-brand-100">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                    <p className="mt-0.5 text-xs font-medium leading-relaxed text-neutral-500">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            href="/industries"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary underline-offset-4 hover:underline"
          >
            Browse all industry presets
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="relative min-w-0 lg:col-span-7 xl:col-span-8">
          <div
            className="pointer-events-none absolute -inset-3 rounded-[2.25rem] bg-brand-primary/10 blur-2xl sm:-inset-5"
            aria-hidden
          />
          <div
            className={cn(
              'relative overflow-hidden rounded-[1.5rem] bg-neutral-100',
              'ring-1 ring-neutral-200/90',
              'shadow-[0_32px_72px_-32px_rgba(15,23,42,0.4)]',
              'sm:rounded-[1.75rem] lg:rounded-[2rem]'
            )}
          >
            {/* Native 3:2 — pos-inv.webp */}
            <div className="relative aspect-[3/2] w-full">
              <Image
                src={TENVO_IMG.inventoryEcosystem}
                alt="TENVO inventory hub on desktop and mobile with receipt printer, barcode scanner, and payment terminal"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 96vw, 62vw"
                quality={80}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start lg:mt-5">
            {['Desktop hub', 'Mobile ops', 'Printer', 'Scanner', 'EDC'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 ring-1 ring-neutral-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
