'use client';

import Link from 'next/link';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreMarqueeRow } from '@/components/storefront/sections/shared/StoreMarqueeRow';
import { resolveRestaurantMenuIcon } from '@/lib/storefront/restaurantMenu';

function CategoryTile({ cat, accent }) {
  const Icon = resolveRestaurantMenuIcon(cat.slug || cat.label);
  const hasImage = Boolean(cat.image);

  return (
    <Link
      href={cat.href}
      className="group flex w-[5rem] shrink-0 flex-col items-center gap-2 text-center sm:w-[5.5rem]"
    >
      <div className="relative h-[4.75rem] w-[4.75rem] overflow-hidden rounded-full border-2 border-zinc-200 bg-white p-0.5 shadow-sm transition duration-300 motion-safe:group-hover:scale-105 motion-safe:group-hover:border-zinc-300 motion-safe:group-hover:shadow-md sm:h-[5.25rem] sm:w-[5.25rem]">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-zinc-50">
          {hasImage ? (
            <SmartProductImage
              src={cat.image}
              alt={cat.label}
              fill
              placeholderLabel={cat.label}
              className="object-cover object-center transition duration-300 motion-safe:group-hover:scale-105"
              sizes="84px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-red-50"
              style={{ color: accent }}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
            </div>
          )}
        </div>
      </div>
      <span className="line-clamp-2 w-full text-[10px] font-semibold leading-tight text-zinc-600 motion-safe:group-hover:text-zinc-900 sm:text-[11px]">
        {cat.label}
      </span>
    </Link>
  );
}

/**
 * Single-row auto-scrolling category rail with product-backed photos.
 */
export function RestaurantCategoryMarquee({ categoryIcons = [], accent = '#dc2626' }) {
  if (!categoryIcons.length) return null;

  return (
    <StoreMarqueeRow
      items={categoryIcons}
      fadeFrom="white"
      durationSec={42}
      slideClassName="w-[5rem] sm:w-[5.5rem]"
      gapClassName="gap-4 pr-4 sm:gap-5 sm:pr-5"
      renderItem={(cat) => <CategoryTile cat={cat} accent={accent} />}
    />
  );
}
