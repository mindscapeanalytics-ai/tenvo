'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, CreditCard } from 'lucide-react';
import { HeroCarousel } from '@/components/storefront/sections/heroes/HeroCarousel';
import { getElectronicsConfig } from '@/lib/storefront/electronicsStorefront';
import {
  ELEVATED_CAROUSEL_HERO_CONTENT,
  ELEVATED_CAROUSEL_HERO_HEIGHT,
} from '@/lib/storefront/elevatedCarouselHero';

/**
 * Premium screen-aware electronics homepage hero.
 */
export function ElectronicsHero({ preset, businessDomain, accent, accentDark, contactCity }) {
  const router = useRouter();
  const base = preset.base || `/store/${businessDomain}`;
  const productsUrl = `${base}/products`;
  const contactUrl = `${base}/contact?subject=installment`;
  const [query, setQuery] = useState('');
  const config = getElectronicsConfig(preset.settings, businessDomain);
  const location = contactCity || config.defaultLocation || 'Your area';
  const quickSearchTerms = preset.quickSearchTerms || [];
  const storeName = preset.storeName || '';

  const search = () => {
    const q = query.trim();
    if (!q) {
      router.push(productsUrl);
      return;
    }
    router.push(`${productsUrl}?search=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative bg-slate-50">
      <div className="relative isolate">
        <HeroCarousel
          slides={preset.slides || []}
          accent={accent}
          variant="electronics"
          storeName={storeName}
          minHeight={ELEVATED_CAROUSEL_HERO_HEIGHT}
          className="electronics-hero-carousel"
          contentClassName={ELEVATED_CAROUSEL_HERO_CONTENT}
        />
      </div>

      {quickSearchTerms.length > 0 && (
        <div className="border-b border-slate-100/80 bg-white px-3 py-3 lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Trending
            </span>
            {quickSearchTerms.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => router.push(`${productsUrl}?search=${encodeURIComponent(term)}`)}
                className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-900 active:scale-[0.98]"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {config.showInstallmentCta && (
        <div className="border-b border-slate-100 bg-white px-3 py-3 lg:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={search}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900"
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              Browse catalog
            </button>
            <Link
              href={contactUrl}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white"
              style={{ backgroundColor: accent || '#2563eb' }}
            >
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              {config.installmentLabel || 'Installment'}
            </Link>
          </div>
        </div>
      )}

      <div className="relative z-20 mx-auto hidden max-w-[1400px] px-4 sm:px-6 lg:block lg:px-8">
        <div className="-mt-16 xl:-mt-[4.5rem]">
          <div className="rounded-2xl border border-slate-100/90 bg-white/95 p-4 shadow-xl shadow-slate-950/10 backdrop-blur-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <button
                type="button"
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-900"
                aria-label={`Delivery location: ${location}`}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="text-slate-700">{config.locationLabel}</span>
                <span className="max-w-[140px] truncate sm:max-w-none">{location}</span>
              </button>

              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder={config.searchPlaceholder}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    aria-label="Search electronics"
                  />
                </div>
                <button
                  type="button"
                  onClick={search}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                  style={{ backgroundColor: accent || '#2563eb' }}
                >
                  Search
                </button>
                <Link
                  href={contactUrl}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  {config.installmentLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
