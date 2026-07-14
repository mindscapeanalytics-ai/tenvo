'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';

/**
 * Jewelry category circles showcase — Gold, Diamonds, Bridal, Earrings, etc.
 * 2026 design: Circular images with golden shimmer hover, smooth scale transitions.
 */
export function JewelleryCategoryCircles({
  title = 'SHOP BY CATEGORY',
  circles = [],
  viewAllHref,
  accent = '#c9a227',
  animations = true,
}) {
  if (!circles.length) return null;

  return (
    <section className="border-t border-stone-100 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Explore by style
            </p>
            <h2 className={cn(STORE_SECTION_HEADING, 'mt-1 text-stone-900')}>{title}</h2>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
              style={{ color: accent }}
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-6 lg:grid-cols-6 xl:grid-cols-8">
          {circles.map((circle, i) => (
            <Link
              key={circle.id}
              href={circle.href}
              className="group flex flex-col items-center gap-3"
              style={
                animations
                  ? {
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: 'both',
                    }
                  : undefined
              }
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-full border-2 border-stone-200 transition-all group-hover:scale-105 group-hover:border-stone-300 group-hover:shadow-lg">
                {/* Golden glow ring on hover */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-20"
                  style={{
                    boxShadow: `inset 0 0 24px ${accent}, 0 0 16px ${accent}`,
                  }}
                />

                <SmartProductImage
                  src={circle.image}
                  alt={circle.label}
                  fill
                  sizes="(max-width: 640px) 25vw, (max-width: 1024px) 15vw, 10vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="text-center">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 transition-colors group-hover:text-stone-700 sm:text-xs">
                  {circle.label}
                </h3>
                {circle.productCount != null && (
                  <p className="mt-0.5 text-[10px] text-stone-500 sm:text-[11px]">
                    {circle.productCount} {circle.productCount === 1 ? 'piece' : 'pieces'}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
