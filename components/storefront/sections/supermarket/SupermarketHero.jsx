'use client';

import { HeroCarousel } from '@/components/storefront/sections/heroes/HeroCarousel';

/**
 * Feed-column hero — full-width carousel band (search lives in site header).
 */
export function SupermarketHero({ preset, accent, accentDark }) {
  const storeName = preset.storeName || '';

  return (
    <section className="relative mb-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-900 shadow-sm sm:mb-5">
      <HeroCarousel
        slides={preset.slides || []}
        accent={accent}
        accentDark={accentDark}
        variant="marketplace"
        storeName={storeName}
        minHeight="min-h-[180px] sm:min-h-[260px] lg:min-h-[320px]"
        className="supermarket-hero-carousel rounded-xl"
        contentClassName="pb-8 sm:pb-10 lg:pb-12"
      />
    </section>
  );
}
