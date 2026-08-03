'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';

/**
 * Per-category Unsplash fallback images — unique per jewelry category
 * so circles never all show the same photo.
 */
const CATEGORY_FALLBACKS = {
  gold:      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=75&auto=format&fit=crop',
  diamonds:  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=75&auto=format&fit=crop',
  bridal:    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&q=75&auto=format&fit=crop',
  earrings:  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=75&auto=format&fit=crop',
  necklaces: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=75&auto=format&fit=crop',
  rings:     'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=75&auto=format&fit=crop',
  bracelets: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=75&auto=format&fit=crop',
  pearls:    'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&q=75&auto=format&fit=crop',
  silver:    'https://images.unsplash.com/photo-1589128777073-263566ae57e4?w=400&q=75&auto=format&fit=crop',
  gifts:     'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=75&auto=format&fit=crop',
  // beauty
  polish:    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=75&auto=format&fit=crop',
  'press-on':'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=75&auto=format&fit=crop',
  kits:      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=75&auto=format&fit=crop',
  tools:     'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=400&q=75&auto=format&fit=crop',
  care:      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=75&auto=format&fit=crop',
  lamps:     'https://images.unsplash.com/photo-1585232351009-aa97f53b2a5d?w=400&q=75&auto=format&fit=crop',
};

/**
 * Resolve the best image for a circle — prefer live catalog image,
 * fall back to per-category Unsplash (never reuses the same fallback).
 */
function resolveCircleImage(circle) {
  if (circle.image && !circle.image.includes('1515562141207-7a88fb7ce338')) {
    // Has a real unique image
    return circle.image;
  }
  // Use per-category fallback keyed by circle id
  return CATEGORY_FALLBACKS[circle.id] || CATEGORY_FALLBACKS[circle.id?.split('-')[0]] || circle.image;
}

/**
 * Jewelry / Beauty category circles — compact auto-scroll marquee.
 *
 * Desktop: single-row infinite marquee (CSS animation, pauses on hover).
 * Mobile:  same marquee, slightly smaller circles.
 * Accessibility: respects prefers-reduced-motion (static scrollable row).
 */
export function JewelleryCategoryCircles({
  title = 'SHOP BY CATEGORY',
  circles = [],
  viewAllHref,
  accent = '#c9a227',
  animations = true,
}) {
  if (!circles.length) return null;

  // Duplicate items for seamless infinite loop (need at least 2 full sets)
  const loopItems = circles.length < 6 ? [...circles, ...circles, ...circles] : [...circles, ...circles];

  return (
    <section className="border-t border-stone-100 bg-white py-8 sm:py-10 overflow-hidden">
      {/* Inject marquee keyframe once */}
      <style>{`
        @keyframes jewellery-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes jewellery-marquee-reverse {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .jewellery-marquee-track {
          animation: jewellery-marquee-reverse 28s linear infinite;
        }
        .jewellery-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .jewellery-marquee-track {
            animation: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Browse collections
            </p>
            <h2 className={cn(STORE_SECTION_HEADING, 'mt-0.5 text-stone-900')}>
              {title}
            </h2>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
              style={{ color: accent }}
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

      </div>

      {/* Full-bleed marquee track — no side padding so circles touch viewport edges */}
      <div className="relative w-full overflow-hidden">

        {/* Gradient fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-20" />

        <div
          className={cn(
            'flex w-max gap-5 px-5 sm:gap-6 sm:px-6',
            animations ? 'jewellery-marquee-track' : 'overflow-x-auto scrollbar-hide'
          )}
          aria-hidden={animations ? 'true' : undefined}
        >
          {loopItems.map((circle, i) => {
            const img = resolveCircleImage(circle);
            return (
              <Link
                key={`${circle.id}-${i}`}
                href={circle.href}
                tabIndex={i >= circles.length ? -1 : 0}
                className="group flex shrink-0 flex-col items-center gap-2"
              >
                {/* Circle */}
                <div
                  className="relative h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-stone-200 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg sm:h-20 sm:w-20"
                  style={{ '--ring': accent }}
                >
                  {/* Golden ring on hover */}
                  <div
                    className="pointer-events-none absolute inset-0 z-10 rounded-full opacity-0 ring-2 ring-inset transition-opacity duration-300 group-hover:opacity-100"
                    style={{ ringColor: accent, boxShadow: `inset 0 0 0 2px ${accent}` }}
                  />

                  <SmartProductImage
                    src={img}
                    alt={circle.label}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Label */}
                <span className="text-center text-[10px] font-bold uppercase tracking-wider text-stone-700 transition-colors group-hover:text-stone-950 sm:text-[11px]">
                  {circle.label}
                </span>
                {circle.productCount != null && circle.productCount > 0 && (
                  <span className="-mt-1.5 text-[9px] text-stone-400 sm:text-[10px]">
                    {circle.productCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Accessible static version for reduced-motion */}
        {!animations && (
          <div
            className="flex gap-5 overflow-x-auto px-4 scrollbar-hide sm:gap-6 sm:px-6"
            role="list"
            aria-label={title}
          >
            {circles.map((circle) => {
              const img = resolveCircleImage(circle);
              return (
                <Link
                  key={circle.id}
                  href={circle.href}
                  role="listitem"
                  className="group flex shrink-0 flex-col items-center gap-2"
                >
                  <div className="relative h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-stone-200 transition-all group-hover:scale-105 group-hover:shadow-lg sm:h-20 sm:w-20">
                    <SmartProductImage
                      src={img}
                      alt={circle.label}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-center text-[10px] font-bold uppercase tracking-wider text-stone-700 sm:text-[11px]">
                    {circle.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
