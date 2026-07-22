'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bike,
  Car,
  CarFront,
  HardHat,
  Sprout,
  Truck,
} from 'lucide-react';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  filterTyreExploreProducts,
  pickTyreExploreSegmentWithStock,
} from '@/lib/storefront/tyreStorefront';

const ICONS = {
  truck: Truck,
  bike: Bike,
  car: Car,
  'car-front': CarFront,
  sprout: Sprout,
  'hard-hat': HardHat,
};

/**
 * Vehicle-type explorer — light theme, filter chips + auto-scrolling product rail.
 * Starts on a segment that has stock; soft category match avoids empty gaps.
 */
export function TyreExploreSection({
  segments = [],
  products = [],
  businessDomain,
  accent = '#CC1532',
  title = 'Explore our tyres',
  subtitle = 'Choose a vehicle type to discover tyres suited for it.',
}) {
  const initialId = useMemo(
    () => pickTyreExploreSegmentWithStock(segments, products)?.id || segments[0]?.id || '',
    [segments, products]
  );
  const [activeId, setActiveId] = useState(initialId);

  useEffect(() => {
    if (!segments.some((s) => s.id === activeId)) {
      setActiveId(initialId);
    }
  }, [segments, activeId, initialId]);

  const activeSegment = segments.find((s) => s.id === activeId) || segments[0];
  const segmentProducts = useMemo(
    () => filterTyreExploreProducts(products, activeSegment?.slug),
    [products, activeSegment?.slug]
  );
  const retailCount = useMemo(
    () =>
      (products || []).filter((p) => {
        const cat = String(p?.category_name || p?.category || '').toLowerCase();
        return !/service|fitting|alignment|puncture/.test(cat) && !/alloy|rim/.test(cat);
      }).length,
    [products]
  );

  if (!segments.length) return null;

  const shopHref = activeSegment?.href || `/store/${businessDomain}/products`;
  const showExactEmpty = segmentProducts.length === 0 && retailCount === 0;

  return (
    <section className="border-y border-zinc-100 bg-zinc-50/80 py-12 sm:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            Vehicle finder
          </p>
          <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-zinc-900')}>{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-base">{subtitle}</p>
        </div>

        <div
          className="mt-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10 sm:flex-wrap sm:justify-center sm:overflow-visible"
          role="tablist"
          aria-label="Vehicle types"
        >
          {segments.map((seg) => {
            const Icon = ICONS[seg.icon] || Car;
            const active = seg.id === activeSegment?.id;
            return (
              <button
                key={seg.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveId(seg.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold motion-safe:transition sm:text-sm',
                  active
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                )}
                style={active ? { backgroundColor: accent } : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">
                  {seg.tabLabel?.replace(/ tyres$/i, '') || seg.label || 'Tyres'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {segmentProducts.length > 0 ? (
        <div className="mt-4">
          <StoreProductRail
            key={activeSegment?.id || 'explore'}
            title={activeSegment?.tabLabel || 'Matching tyres'}
            subtitle="Live catalogue for this vehicle type"
            href={shopHref}
            linkLabel="View all"
            products={segmentProducts}
            catalogPool={products}
            businessDomain={businessDomain}
            accentColor={accent}
            autoScroll
            minItems={6}
            maxItems={12}
            className="bg-transparent pt-2 pb-4 sm:pt-4 sm:pb-6"
          />
        </div>
      ) : showExactEmpty ? (
        <div className="mx-auto mt-8 max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center">
            <p className="text-sm text-zinc-500">Catalogue is loading or empty for this store.</p>
            <Link
              href={shopHref}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: accent }}
            >
              Browse full catalogue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1400px] justify-center px-4 pb-2 sm:px-6 lg:px-8">
        <Link
          href={shopHref}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm motion-safe:transition hover:opacity-95"
          style={{ backgroundColor: accent }}
        >
          Shop {activeSegment?.tabLabel?.replace(/ tyres$/i, '') || 'this range'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
