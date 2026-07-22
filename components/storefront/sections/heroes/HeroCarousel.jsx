'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { FurnitureVideoBackdrop } from '@/components/storefront/sections/furniture/FurnitureVideoBackdrop';
import { TyreHeroRunningWheel } from '@/components/storefront/sections/tyre/TyreHeroRunningWheel';
import { cn } from '@/lib/utils';
import { resolveHeroCarouselFallback } from '@/lib/storefront/storefrontImagePlaceholders';

/**
 * Auto-advancing hero background carousel with manual controls.
 * @param {{ slides: Array<{ title: string; subtitle?: string; image: string; eyebrow?: string; ctaLabel?: string; ctaHref?: string; videoUrl?: string }>; accent: string; className?: string; minHeight?: string; variant?: 'default' | 'luxury' | 'pharmacy' | 'parts' | 'furniture' | 'restaurant' | 'tiles' | 'tyre'; contentClassName?: string; storeName?: string }} props
 */
export function HeroCarousel({ slides = [], accent, className, minHeight = 'min-h-[280px] sm:min-h-[360px] lg:min-h-[420px]', variant = 'default', contentClassName, storeName = '' }) {
  const [index, setIndex] = useState(0);
  const count = slides.length || 1;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [count, next]);

  const slide = slides[index] || slides[0];
  const isLuxury = variant === 'luxury';
  const isPharmacy = variant === 'pharmacy';
  const isFurniture = variant === 'furniture';
  const isTiles = variant === 'tiles';
  const isTyre = variant === 'tyre';
  const isRestaurant = variant === 'restaurant';
  const isParts = variant === 'parts';
  const slideAccent = slide?.accent || accent;

  return (
    <div className={cn('store-hero relative overflow-hidden', isParts || isTyre ? 'bg-neutral-950' : 'bg-slate-900', minHeight, className)}>
      {slides.map((s, i) => {
        const showSlideVideo = (isFurniture || isTyre) && Boolean(s.videoUrl) && i === index;
        return (
          <div
            key={(s.image || s.title || 'slide') + i}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              i === index ? 'opacity-100 z-0' : 'opacity-0 z-0'
            )}
          >
            <SmartProductImage
              src={s.image}
              alt=""
              fill
              className="object-cover"
              priority={i === 0}
              fallbackSrc={resolveHeroCarouselFallback(variant, s.title || String(i))}
            />
            {showSlideVideo ? (
              <FurnitureVideoBackdrop
                videoUrl={s.videoUrl}
                poster={s.image}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              className={cn(
                'absolute inset-0',
                isLuxury
                  ? 'bg-gradient-to-t from-stone-950/95 via-stone-950/55 to-stone-900/25'
                  : isPharmacy
                    ? 'bg-gradient-to-r from-emerald-950/78 via-emerald-950/35 to-transparent'
                    : isFurniture
                      ? 'bg-gradient-to-r from-stone-950/78 via-stone-950/35 to-transparent'
                      : isTiles
                        ? 'bg-gradient-to-r from-stone-950/78 via-stone-950/35 to-transparent'
                        : isTyre
                          ? 'bg-gradient-to-r from-black/92 via-zinc-950/70 to-zinc-950/25'
                        : isRestaurant
                          ? 'bg-gradient-to-r from-neutral-950/78 via-neutral-950/35 to-transparent'
                          : isParts
                            ? 'bg-gradient-to-t from-black/85 via-black/45 to-black/15'
                            : 'bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-900/55'
              )}
            />
            <div
              className={cn(
                'absolute inset-0',
                isLuxury
                  ? 'bg-black/15'
                  : isPharmacy
                    ? 'bg-gradient-to-t from-emerald-950/50 via-transparent to-emerald-950/15'
                    : isFurniture
                      ? 'bg-gradient-to-t from-stone-950/55 via-transparent to-stone-950/15'
                      : isTiles
                        ? 'bg-gradient-to-t from-stone-950/55 via-transparent to-stone-950/15'
                        : isTyre
                          ? 'bg-gradient-to-t from-black/55 via-transparent to-black/30'
                        : isRestaurant
                          ? 'bg-gradient-to-t from-neutral-950/55 via-transparent to-neutral-950/15'
                          : isParts
                            ? 'bg-black/10'
                            : 'bg-black/25'
              )}
            />
            {isParts ? (
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 20%, ${s.accent || accent || '#cd232a'}33, transparent 45%)`,
                }}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}

      {isTyre ? <TyreHeroRunningWheel /> : null}

      <div
        className={cn(
          'relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16',
          (isLuxury || isParts) && 'items-center text-center',
          contentClassName
        )}
      >
        {slide ? (
          <div
            className={cn(
              'max-w-xl',
              (isFurniture || isPharmacy || isTiles || isRestaurant) && 'max-w-2xl',
              isTyre && 'max-w-2xl rounded-2xl bg-black/25 p-5 backdrop-blur-[2px] sm:p-6 lg:p-7',
              (isLuxury || isParts) && 'max-w-2xl'
            )}
          >
            <p
              className={cn(
                'store-hero-eyebrow mb-2 text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm',
                isPharmacy && 'mb-3 text-emerald-100/95',
                isFurniture && 'mb-3 text-amber-100/95',
                isTiles && 'mb-3 text-amber-100/95',
                isRestaurant && 'mb-3 text-red-100/95',
                isTyre && 'mb-3 tracking-[0.18em] text-white',
                (isLuxury || isParts) && 'text-white/90'
              )}
              style={
                isTyre && slideAccent
                  ? { color: '#ffffff', textShadow: `0 0 24px ${slideAccent}88` }
                  : (isLuxury || isParts) && slideAccent
                    ? { color: slideAccent }
                    : undefined
              }
            >
              {slide.eyebrow ||
                (isLuxury
                  ? 'Curated collection'
                  : isPharmacy
                    ? storeName || 'Pharmacy'
                    : isFurniture
                      ? storeName || 'Furniture'
                      : isTiles
                        ? storeName || 'Tiles & marble'
                        : isRestaurant
                          ? storeName || 'Restaurant'
                          : isTyre
                            ? storeName || 'Tyre store'
                          : isParts
                            ? 'Auto parts'
                            : 'Welcome')}
            </p>
            <h1
              className={cn(
                'font-semibold leading-tight text-white',
                isLuxury
                  ? 'store-heading store-heading--inverse text-3xl tracking-wide sm:text-5xl lg:text-6xl'
                  : isPharmacy || isFurniture || isTiles || isRestaurant
                    ? 'text-3xl tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl'
                    : isTyre
                      ? 'store-heading store-heading--inverse text-3xl tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.25rem]'
                    : isParts
                      ? 'store-heading store-heading--inverse text-2xl tracking-tight sm:text-4xl lg:text-[2.85rem]'
                      : 'store-heading store-heading--inverse text-2xl tracking-tight sm:text-4xl lg:text-[2.75rem]'
              )}
            >
              {slide.title}
            </h1>
            {slide.subtitle ? (
              <p
                className={cn(
                  'store-hero-subtitle mt-3 text-sm leading-relaxed sm:text-base lg:text-lg',
                  isParts ? 'mx-auto max-w-xl text-white/85' : 'text-white/90',
                  (isFurniture || isPharmacy || isTiles || isRestaurant) &&
                    'mt-4 max-w-xl text-base text-white/88 sm:text-lg',
                  isTyre && 'mt-4 max-w-xl text-base text-white/95 sm:text-lg',
                  isLuxury && 'mx-auto max-w-xl'
                )}
              >
                {slide.subtitle}
              </p>
            ) : null}
            {slide.ctaLabel && slide.ctaHref ? (
              <Link
                href={slide.ctaHref}
                className={cn(
                  'mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-95 sm:px-7',
                  isPharmacy
                    ? 'mt-7 rounded-xl bg-white px-7 py-3.5 text-emerald-950 shadow-lg shadow-emerald-950/25 hover:bg-emerald-50'
                    : isFurniture
                      ? 'mt-7 rounded-xl bg-white px-7 py-3.5 text-stone-900 shadow-lg shadow-stone-950/25 hover:bg-amber-50'
                      : isTiles
                        ? 'mt-7 rounded-xl bg-white px-7 py-3.5 text-stone-900 shadow-lg shadow-stone-950/25 hover:bg-stone-50'
                        : isRestaurant
                          ? 'mt-7 rounded-xl bg-white px-7 py-3.5 text-zinc-900 shadow-lg shadow-black/25 hover:bg-zinc-50'
                          : isTyre
                            ? 'mt-7 rounded-xl bg-white px-7 py-3.5 text-zinc-900 shadow-lg shadow-black/35 hover:bg-zinc-100'
                          : 'text-white shadow-lg',
                  isParts && 'hover:shadow-xl motion-safe:hover:scale-[1.02]'
                )}
                style={
                  !isPharmacy && !isFurniture && !isTiles && !isRestaurant && !isTyre
                    ? { backgroundColor: slideAccent || accent }
                    : undefined
                }
              >
                {slide.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className={cn(
              'absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition sm:left-4',
              isParts
                ? 'left-2 border border-white/25 bg-black/35 text-white hover:bg-black/50 sm:left-4'
                : 'border border-white/20 bg-black/30 text-white hover:bg-black/50 left-2 sm:left-4',
              isPharmacy && 'hidden sm:flex'
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className={cn(
              'absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition sm:right-4',
              isParts
                ? 'right-2 border border-white/25 bg-black/35 text-white hover:bg-black/50 sm:right-4'
                : 'border border-white/20 bg-black/30 text-white hover:bg-black/50 right-2 sm:right-4',
              isPharmacy && 'hidden sm:flex'
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index
                    ? cn('w-6', isParts ? 'bg-white' : 'bg-white')
                    : cn('w-1.5', isParts ? 'bg-white/40 hover:bg-white/70' : 'bg-white/40 hover:bg-white/70')
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
