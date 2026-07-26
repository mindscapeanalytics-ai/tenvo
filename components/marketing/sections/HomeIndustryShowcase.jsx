'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { VERTICAL_COUNT } from '@/lib/marketing/capabilities';
import { TENVO_IMG_INDUSTRY_CARDS } from '@/lib/marketing/tenvoMarketingImages';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
  MARKETING_STAT_VALUE,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

/**
 * Light industry showcase using optimized WebP product screenshots.
 */
export default function HomeIndustryShowcase() {
  return (
    <MarketingSection
      padding="loose"
      className="border-b border-neutral-200/80 bg-white"
    >
      <div className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-14">
        <p className={MARKETING_EYEBROW}>Industry showcase</p>
        <h2 className={MARKETING_SECTION_HEADING}>Every business. One platform.</h2>
        <p className={MARKETING_LEAD}>
          Real TENVO screens from retail, restaurant, supermarket, auto parts, milk, fitness, and
          finance. {VERTICAL_COUNT}+ industry presets ship with day-one storefront and ops chrome.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {TENVO_IMG_INDUSTRY_CARDS.map((item) => (
          <Link
            key={item.title + item.href}
            href={item.href}
            className="group overflow-hidden rounded-[1.5rem] border border-neutral-200/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[0_20px_44px_-28px_rgba(15,23,42,0.35)] sm:rounded-[1.75rem]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
              <Image
                src={item.image}
                alt={`${item.title} on TENVO`}
                fill
                className={cn(
                  'object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]',
                  item.object || 'object-top'
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                    {item.metric}
                  </p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight text-neutral-900">
                    {item.title}
                  </h3>
                </div>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 transition-colors group-hover:bg-brand-primary group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-neutral-500">{item.blurb}</p>
              <p className={cn(MARKETING_STAT_VALUE, 'sr-only')}>{item.metric}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center sm:mt-10">
        <Link
          href="/industries"
          className="text-sm font-semibold text-brand-primary underline-offset-4 hover:underline"
        >
          Browse all industry presets
        </Link>
      </div>
    </MarketingSection>
  );
}
