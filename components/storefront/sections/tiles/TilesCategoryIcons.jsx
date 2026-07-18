'use client';

import Link from 'next/link';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreMarqueeRow } from '@/components/storefront/sections/shared/StoreMarqueeRow';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';

function CategoryTile({ cat }) {
  return (
    <Link
      href={cat.href}
      className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5 text-center sm:w-[5.5rem] sm:gap-2"
    >
      <div
        className={cn(
          'relative h-14 w-14 overflow-hidden rounded-full border border-stone-100 bg-stone-50/60 shadow-sm',
          'transition duration-300 motion-safe:group-hover:scale-105 motion-safe:group-hover:border-stone-300 motion-safe:group-hover:shadow-md',
          'motion-safe:group-active:scale-[0.97] sm:h-[4.5rem] sm:w-[4.5rem]'
        )}
      >
        <SmartProductImage
          src={cat.image}
          alt={cat.label || ''}
          fill
          sizes="72px"
          className="object-cover transition duration-500 motion-safe:group-hover:scale-110"
        />
      </div>
      <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-stone-700 sm:text-[11px]">
        {cat.label}
      </span>
    </Link>
  );
}

/**
 * Tiles "Shop by category" — single-row auto-scroll marquee on all breakpoints
 * (shared StoreMarqueeRow pattern used by pharmacy / supermarket / restaurant).
 */
export function TilesCategoryIcons({ categoryIcons = [] }) {
  if (!categoryIcons.length) return null;

  const durationSec = Math.max(28, Math.min(48, 18 + categoryIcons.length * 3));

  return (
    <section className="border-b border-stone-50 bg-white pb-6 pt-3 sm:pb-10 sm:pt-6">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        <h2 className={cn(STORE_SECTION_HEADING, 'mb-3 text-stone-900 lg:mb-5')}>Shop by category</h2>

        <StoreMarqueeRow
          items={categoryIcons}
          fadeFrom="white"
          durationSec={durationSec}
          slideClassName="w-[4.75rem] sm:w-[5.5rem]"
          gapClassName="gap-3 pr-3 sm:gap-5 sm:pr-5"
          renderItem={(cat) => <CategoryTile cat={cat} />}
        />
      </div>
    </section>
  );
}

export default TilesCategoryIcons;
