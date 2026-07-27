'use client';

import Link from 'next/link';
import {
  Car,
  Dumbbell,
  Gem,
  Globe2,
  Pill,
  ShoppingBasket,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { MARKETING_TRUST_BRAND_MARKS } from '@/lib/marketing/marketingIntegrationLogos';
import { cn } from '@/lib/utils';

/** Worldwide industry marks — icon only, no product screenshots */
const INDUSTRY_MARKS = [
  { label: 'Retail', icon: Store },
  { label: 'Restaurant', icon: UtensilsCrossed },
  { label: 'Pharmacy', icon: Pill },
  { label: 'Grocery', icon: ShoppingBasket },
  { label: 'Auto', icon: Car },
  { label: 'Fitness', icon: Dumbbell },
  { label: 'Jewellery', icon: Gem },
  { label: 'Global', icon: Globe2 },
];

function BrandMarkTile({ mark }) {
  return (
    <div
      className={cn(
        'inline-flex h-14 min-w-[7.5rem] shrink-0 items-center justify-center rounded-xl',
        'border border-neutral-200/80 bg-white px-5',
        'text-neutral-500 transition-colors duration-200',
        'hover:border-neutral-300 hover:text-neutral-800'
      )}
      title={mark.label}
    >
      <span className={cn(mark.className)}>{mark.wordmark}</span>
      <span className="sr-only">{mark.label}</span>
    </div>
  );
}

function IndustryMarkTile({ item }) {
  const Icon = item.icon;
  return (
    <div
      className={cn(
        'inline-flex shrink-0 flex-col items-center gap-2 px-3',
        'text-neutral-400 transition-colors duration-200 hover:text-neutral-700'
      )}
      title={item.label}
    >
      <span
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded-full',
          'border border-neutral-200/90 bg-white text-neutral-600 shadow-sm'
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
        {item.label}
      </span>
    </div>
  );
}

/**
 * Worldwide trust strip — integration logos + industry icons only (no UI screenshots).
 */
export default function HomeProductTrustStrip() {
  return (
    <MarketingSection padding="tight" className="border-b border-neutral-200/80 bg-[#FAFAFA]">
      <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400 sm:mb-8 sm:text-[11px]">
        Trusted by growing businesses around the world
      </p>

      {/* Payment & commerce channel logos */}
      <div
        className="relative integration-marquee-fade"
        aria-label="Commerce and payment integrations"
      >
        <div className="flex w-max animate-marquee-partners motion-reduce:animate-none hover:[animation-play-state:paused]">
          {[0, 1].map((set) => (
            <div
              key={set}
              className="flex shrink-0 items-center gap-4 pr-4 sm:gap-5 sm:pr-5"
              aria-hidden={set === 1}
            >
              {MARKETING_TRUST_BRAND_MARKS.map((mark) => (
                <BrandMarkTile key={`${set}-${mark.id}`} mark={mark} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Industry vertical icons */}
      <div className="mt-8 border-t border-neutral-200/70 pt-8 sm:mt-10">
        <div
          className="relative integration-marquee-fade"
          aria-label="Industries served worldwide"
        >
          <div className="flex w-max animate-marquee-partners motion-reduce:animate-none [animation-duration:65s] hover:[animation-play-state:paused]">
            {[0, 1].map((set) => (
              <div
                key={set}
                className="flex shrink-0 items-center gap-2 pr-6 sm:gap-4 sm:pr-8"
                aria-hidden={set === 1}
              >
                {INDUSTRY_MARKS.map((item) => (
                  <IndustryMarkTile key={`${set}-${item.label}`} item={item} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs font-medium text-neutral-500 sm:mt-8">
        Commerce, payments, and ops for retail, hospitality, and services.{' '}
        <Link href="/integrations" className="font-semibold text-brand-primary hover:underline">
          See integrations
        </Link>
      </p>
    </MarketingSection>
  );
}
