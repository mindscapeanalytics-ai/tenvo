'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { StoreMarqueeRow } from '@/components/storefront/sections/shared/StoreMarqueeRow';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  STORE_PRODUCT_RAIL_TRACK_CLASS,
  STORE_PRODUCT_RAIL_ITEM_CLASS,
  STORE_PRODUCT_RAIL_MARQUEE_SLIDE_CLASS,
  ensureRailProducts,
  resolveRailProductId,
} from '@/lib/utils/storefrontProductRail';
import { useRailAutoScroll } from '@/lib/hooks/storefront/useRailAutoScroll';

/**
 * Shared storefront product rail — 6 equal columns on lg, backfilled from catalog pool.
 * Pass `marquee` for gym-style seamless CSS auto-scroll (dual track, pause on hover).
 */
export function StoreProductRail({
  title,
  subtitle,
  href,
  linkLabel = 'View all',
  products = [],
  catalogPool,
  businessDomain,
  cardVariant = 'dense',
  className,
  id,
  minItems = 6,
  maxItems = 12,
  accentColor,
  autoScroll = false,
  /** Gym / fitness-style continuous CSS marquee (preferred over stepped autoScroll). */
  marquee = false,
  marqueeDurationSec = 42,
  marqueeReverse = false,
  /** Optional card override (e.g. restaurant quiet-add menu cards). */
  CardComponent = ProductCard,
  cardAccent,
}) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const railProducts = useMemo(
    () => ensureRailProducts(products, catalogPool ?? products, minItems, maxItems),
    [products, catalogPool, minItems, maxItems]
  );

  const useMarquee = marquee && railProducts.length >= 4;

  useRailAutoScroll(trackRef, {
    enabled: autoScroll && !useMarquee,
    interval: 4000,
    cooldown: 6000,
  });

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    if (useMarquee) return undefined;
    update();
    const el = trackRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [railProducts, update, useMarquee]);

  const scroll = (dir) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = trackRef.current;
    const amount = el?.clientWidth ? el.clientWidth * 0.92 : 280;
    el?.scrollBy({ left: dir * amount, behavior: reduced ? 'auto' : 'smooth' });
  };

  if (!railProducts.length) return null;

  const renderCard = (product) => (
    <CardComponent
      product={product}
      businessDomain={businessDomain}
      variant={cardVariant}
      accent={cardAccent || accentColor}
    />
  );

  return (
    <section id={id} className={cn('py-8 sm:py-12', className)}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className={cn(STORE_SECTION_HEADING, 'text-slate-900')}>{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {href ? (
              <Link
                href={href}
                className={cn(
                  'mr-2 hidden items-center gap-1 text-sm font-semibold sm:inline-flex',
                  !accentColor && 'text-emerald-700'
                )}
                style={accentColor ? { color: accentColor } : undefined}
              >
                {linkLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            {!useMarquee ? (
              <>
                <button
                  type="button"
                  onClick={() => scroll(-1)}
                  disabled={!canLeft}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-300 disabled:opacity-30"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll(1)}
                  disabled={!canRight}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-300 disabled:opacity-30"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {useMarquee ? (
          <StoreMarqueeRow
            items={railProducts}
            enabled
            fadeFrom="white"
            durationSec={marqueeDurationSec}
            reverse={marqueeReverse}
            slideClassName={STORE_PRODUCT_RAIL_MARQUEE_SLIDE_CLASS}
            gapClassName="gap-3 pr-3 sm:gap-4 sm:pr-4"
            renderItem={(product) => renderCard(product)}
          />
        ) : (
          <div ref={trackRef} className={STORE_PRODUCT_RAIL_TRACK_CLASS}>
            {railProducts.map((product) => (
              <div key={resolveRailProductId(product)} className={STORE_PRODUCT_RAIL_ITEM_CLASS}>
                {renderCard(product)}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
