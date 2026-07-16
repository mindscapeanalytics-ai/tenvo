'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';

/**
 * Premium "Jewellery Edit" marketing section with asymmetric mosaic layout.
 * 2026 design: immersive visuals, golden accents, premium hover effects.
 * FULL-SCREEN layout with perfect alignment and organization.
 * 
 * Layout structure:
 * Desktop (12-column grid):
 * ┌───────────────────────────┬──────────────┐
 * │                           │   Banner     │
 * │      Hero (7 cols)        │   (5 cols)   │
 * │      (2 rows tall)        ├──────┬───────┤
 * │                           │ Half │ Half  │
 * └───────────────────────────┴──────┴───────┘
 * 
 * Mobile: Full-width stacked cards
 * 
 * @param {{
 *   title?: string;
 *   subtitle?: string;
 *   viewAllHref?: string;
 *   tiles: Array<{ id: string; slot: string; eyebrow?: string; title?: string; ctaLabel?: string; href: string; image: string }>;
 *   businessDomain: string;
 *   accent?: string;
 *   animations?: boolean;
 * }} props
 */
export function JewelleryEditSection({
  title = 'The Jewellery Edit',
  subtitle = 'Timeless gold, diamonds, and bridal sets crafted for every milestone.',
  viewAllHref,
  tiles = [],
  businessDomain,
  accent = '#c9a227',
  animations = true,
}) {
  const router = useRouter();
  const base = `/store/${businessDomain}`;

  // Map tiles by slot
  const hero = tiles.find((t) => t.slot === 'hero');
  const banner = tiles.find((t) => t.slot === 'banner');
  const halfLeft = tiles.find((t) => t.slot === 'half-left');
  const halfRight = tiles.find((t) => t.slot === 'half-right');

  const hasContent = hero || banner || halfLeft || halfRight;
  if (!hasContent) return null;

  const goTo = (href) => {
    if (!href) return;
    const url = href.startsWith('http') ? href : href.startsWith('/') ? href : `${base}/${href}`;
    router.push(url);
  };

  return (
    <section className="relative border-t border-stone-200 bg-gradient-to-br from-white via-stone-50/30 to-white py-12 sm:py-16 lg:py-20">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -left-32 top-20 h-96 w-96 rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: accent }}
        />
        <div 
          className="absolute -right-32 bottom-20 h-96 w-96 rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: accent }}
        />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-12">
        {/* Section header with golden accent */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 lg:mb-12 sm:flex-row sm:items-end">
          <div className="max-w-3xl">
            <div 
              className="mb-3 inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm"
              style={{ borderColor: `${accent}60`, backgroundColor: `${accent}10`, color: accent }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Curated Collection
            </div>
            <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-3xl font-bold text-stone-900 sm:text-4xl lg:text-5xl')}>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-3 text-base leading-relaxed text-stone-600 sm:text-lg lg:text-xl">
                {subtitle}
              </p>
            )}
          </div>
          {viewAllHref && (
            <button
              type="button"
              onClick={() => goTo(viewAllHref)}
              className="group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide shadow-md transition-all hover:shadow-lg"
              style={{ backgroundColor: `${accent}15`, color: accent }}
            >
              Explore All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* Desktop: Full-screen 12-column asymmetric grid */}
        <div className="hidden gap-5 lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left: Hero tile (7 cols, 2 rows tall) */}
          {hero && (
            <button
              type="button"
              onClick={() => goTo(hero.href)}
              className="group relative col-span-7 row-span-2 overflow-hidden rounded-3xl bg-stone-900 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-3xl"
              style={{ minHeight: '600px' }}
            >
              <SmartProductImage
                src={hero.image}
                alt={hero.title || hero.eyebrow || 'Fine Gold'}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-stone-950/80 via-stone-950/50 to-stone-950/20" />
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 35%, ${accent}40 0%, transparent 55%)`,
                }}
              />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-left lg:p-10 xl:p-12">
                {hero.eyebrow && (
                  <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-amber-200/95 lg:text-base">
                    {hero.eyebrow}
                  </p>
                )}
                <h3 className="max-w-xl text-3xl font-extrabold leading-[1.15] tracking-tight text-white lg:text-4xl xl:text-5xl">
                  {hero.title || 'Celebrate every occasion with hallmarked purity.'}
                </h3>
                {hero.ctaLabel && (
                  <div
                    className="mt-6 inline-flex w-fit items-center gap-2.5 rounded-full px-7 py-3.5 text-base font-bold uppercase tracking-wide text-stone-950 shadow-xl transition-all group-hover:scale-105 lg:px-8 lg:py-4"
                    style={{ backgroundColor: accent }}
                  >
                    {hero.ctaLabel}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </div>
            </button>
          )}

          {/* Right column: Banner + 2 half tiles (5 cols) */}
          <div className="col-span-5 flex flex-col gap-5 lg:gap-6">
            {/* Banner tile (top, wider aspect) */}
            {banner && (
              <button
                type="button"
                onClick={() => goTo(banner.href)}
                className="group relative overflow-hidden rounded-3xl bg-stone-900 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-3xl"
                style={{ minHeight: '280px' }}
              >
                <SmartProductImage
                  src={banner.image}
                  alt={banner.title || banner.eyebrow || 'Diamonds'}
                  fill
                  sizes="(min-width: 1024px) 35vw, 100vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/40 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-center p-6 text-center lg:p-8">
                  {banner.eyebrow && (
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/95 lg:text-sm">
                      {banner.eyebrow}
                    </p>
                  )}
                  {banner.title && (
                    <h3 className="text-xl font-extrabold leading-tight text-white lg:text-2xl">
                      {banner.title}
                    </h3>
                  )}
                  {banner.ctaLabel && (
                    <span
                      className="mt-4 inline-flex w-fit self-center items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-stone-950 shadow-lg transition-all group-hover:scale-105"
                      style={{ backgroundColor: accent }}
                    >
                      {banner.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </button>
            )}

            {/* Half tiles (bottom, 2-column grid) */}
            <div className="grid grid-cols-2 gap-5 lg:gap-6">
              {halfLeft && (
                <button
                  type="button"
                  onClick={() => goTo(halfLeft.href)}
                  className="group relative overflow-hidden rounded-3xl bg-stone-900 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl"
                  style={{ minHeight: '280px' }}
                >
                  <SmartProductImage
                    src={halfLeft.image}
                    alt={halfLeft.eyebrow || 'Bridal'}
                    fill
                    sizes="(min-width: 1024px) 17vw, 50vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 text-center">
                    {halfLeft.eyebrow && (
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                        {halfLeft.eyebrow}
                      </p>
                    )}
                    {halfLeft.ctaLabel && (
                      <span
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-950 shadow-lg transition-all group-hover:scale-105"
                        style={{ backgroundColor: accent }}
                      >
                        {halfLeft.ctaLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              )}

              {halfRight && (
                <button
                  type="button"
                  onClick={() => goTo(halfRight.href)}
                  className="group relative overflow-hidden rounded-3xl bg-stone-900 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl"
                  style={{ minHeight: '280px' }}
                >
                  <SmartProductImage
                    src={halfRight.image}
                    alt={halfRight.eyebrow || 'Gifts'}
                    fill
                    sizes="(min-width: 1024px) 17vw, 50vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 text-center">
                    {halfRight.eyebrow && (
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                        {halfRight.eyebrow}
                      </p>
                    )}
                    {halfRight.ctaLabel && (
                      <span
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-950 shadow-lg transition-all group-hover:scale-105"
                        style={{ backgroundColor: accent }}
                      >
                        {halfRight.ctaLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Full-width stacked cards */}
        <div className="flex flex-col gap-4 lg:hidden">
          {hero && (
            <button
              type="button"
              onClick={() => goTo(hero.href)}
              className="group relative overflow-hidden rounded-2xl bg-stone-900 shadow-lg"
              style={{ aspectRatio: '16/11' }}
            >
              <SmartProductImage
                src={hero.image}
                alt={hero.title || hero.eyebrow || 'Fine Gold'}
                fill
                sizes="100vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-stone-950/75 via-stone-950/40 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-5 text-left">
                {hero.eyebrow && (
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.18em] text-amber-200/90">
                    {hero.eyebrow}
                  </p>
                )}
                <h3 className="text-xl font-bold leading-tight text-white sm:text-2xl">
                  {hero.title || 'Celebrate every occasion with hallmarked purity.'}
                </h3>
                {hero.ctaLabel && (
                  <span
                    className="mt-3 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-md"
                    style={{ backgroundColor: accent }}
                  >
                    {hero.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </button>
          )}

          {banner && (
            <button
              type="button"
              onClick={() => goTo(banner.href)}
              className="group relative overflow-hidden rounded-2xl bg-stone-900 shadow-lg"
              style={{ aspectRatio: '16/9' }}
            >
              <SmartProductImage
                src={banner.image}
                alt={banner.title || banner.eyebrow || 'Diamonds'}
                fill
                sizes="100vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-stone-950/60 via-stone-950/30 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-center p-5 text-center">
                {banner.eyebrow && (
                  <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-200/90">
                    {banner.eyebrow}
                  </p>
                )}
                {banner.title && (
                  <h3 className="text-lg font-bold leading-tight text-white">
                    {banner.title}
                  </h3>
                )}
                {banner.ctaLabel && (
                  <span
                    className="mt-3 inline-flex w-fit self-center items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-stone-950 shadow-sm"
                    style={{ backgroundColor: accent }}
                  >
                    {banner.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </button>
          )}

          {(halfLeft || halfRight) && (
            <div className="grid grid-cols-2 gap-4">
              {halfLeft && (
                <button
                  type="button"
                  onClick={() => goTo(halfLeft.href)}
                  className="group relative overflow-hidden rounded-2xl bg-stone-900 shadow-lg"
                  style={{ aspectRatio: '4/5' }}
                >
                  <SmartProductImage
                    src={halfLeft.image}
                    alt={halfLeft.eyebrow || 'Bridal'}
                    fill
                    sizes="50vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                    {halfLeft.eyebrow && (
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">
                        {halfLeft.eyebrow}
                      </p>
                    )}
                    {halfLeft.ctaLabel && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-stone-950 shadow-sm"
                        style={{ backgroundColor: accent }}
                      >
                        {halfLeft.ctaLabel}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </button>
              )}

              {halfRight && (
                <button
                  type="button"
                  onClick={() => goTo(halfRight.href)}
                  className="group relative overflow-hidden rounded-2xl bg-stone-900 shadow-lg"
                  style={{ aspectRatio: '4/5' }}
                >
                  <SmartProductImage
                    src={halfRight.image}
                    alt={halfRight.eyebrow || 'Gifts'}
                    fill
                    sizes="50vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                    {halfRight.eyebrow && (
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">
                        {halfRight.eyebrow}
                      </p>
                    )}
                    {halfRight.ctaLabel && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-stone-950 shadow-sm"
                        style={{ backgroundColor: accent }}
                      >
                        {halfRight.ctaLabel}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
