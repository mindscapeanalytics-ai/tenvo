'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Shield, Sparkles } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';

/**
 * 2026 Luxury Jewelry Hero — immersive full-bleed with golden shimmer particles,
 * certification badges, smooth parallax scroll, and premium micro-interactions.
 * @param {{ preset: object; accent: string }} props
 */
export function JewelleryHero({ preset, accent }) {
  const router = useRouter();
  const slides = preset.slides || [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const count = slides.length || 1;
  const touchStartX = useRef(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  // Auto-advance carousel
  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return undefined;
    }
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
  }, [count, next, paused]);

  // Pause on hidden tab
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Subtle parallax effect
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Touch swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = (e.changedTouches?.[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  const slide = slides[index] || slides[0];
  const hideRating = preset.hideRating === true;
  const parallaxY = Math.min(scrollY * 0.3, 200);

  return (
    <section
      className="jewelry-hero relative min-h-[100svh] overflow-hidden bg-stone-950 lg:min-h-[92vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background image with subtle parallax */}
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        <SmartProductImage
          src={slide?.image}
          alt={slide?.title || 'Jewelry Hero'}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Premium gradient overlay with golden shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-950/85 via-stone-950/60 to-transparent" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, ${accent}22 0%, transparent 60%)`,
        }}
      />

      {/* Golden shimmer particles (CSS-only animation) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full motion-safe:animate-shimmer-float motion-reduce:hidden"
            style={{
              left: `${10 + i * 8}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: accent,
              opacity: 0.15,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${8 + (i % 3) * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content overlay */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-end px-4 pb-16 sm:px-6 lg:min-h-[92vh] lg:justify-center lg:px-8 lg:pb-0">
        <div className="max-w-2xl space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Trust badge + eyebrow */}
          <div className="flex flex-wrap items-center gap-3">
            {slide?.promoTag && (
              <div
                className="group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm transition-all sm:px-3.5 sm:py-2 sm:text-[13px]"
                style={{
                  borderColor: `${accent}40`,
                  backgroundColor: `${accent}10`,
                  color: accent,
                }}
              >
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {slide.promoTag}
                <Sparkles className="ml-0.5 h-3 w-3 opacity-60 motion-safe:animate-pulse-slow sm:h-3.5 sm:w-3.5" />
              </div>
            )}
            {slide?.eyebrow && (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-200/90 sm:text-[13px]">
                {slide.eyebrow}
              </p>
            )}
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {slide?.title || 'Timeless Pieces, Crafted to Last'}
          </h1>

          {/* Subtitle */}
          {slide?.subtitle && (
            <p className="max-w-xl text-base leading-relaxed text-stone-200 sm:text-lg lg:text-xl">
              {slide.subtitle}
            </p>
          )}

          {/* Social proof rating */}
          {!hideRating && slide?.rating && (
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur-md sm:inline-flex sm:px-5 sm:py-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4 sm:h-[18px] sm:w-[18px]',
                      i < Math.floor(slide.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-stone-400 text-stone-400'
                    )}
                  />
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white sm:text-base">{slide.rating.toFixed(1)}</span>
                {slide.ratingText && (
                  <span className="text-xs text-stone-300 sm:text-[13px]">{slide.ratingText}</span>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          {slide?.ctaLabel && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => slide.ctaHref && router.push(slide.ctaHref)}
                className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-stone-950 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100 sm:px-8 sm:py-4 sm:text-lg"
                style={{ backgroundColor: accent }}
              >
                {slide.ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation arrows (desktop) */}
        {count > 1 && (
          <div className="absolute inset-y-0 left-4 right-4 hidden items-center justify-between lg:flex lg:left-8 lg:right-8">
            <button
              type="button"
              onClick={prev}
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 text-white transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Slide indicators (bottom center) */}
      {count > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 lg:bottom-12">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="group relative h-1 overflow-hidden rounded-full transition-all hover:h-1.5"
              style={{ width: i === index ? '2.5rem' : '1.5rem' }}
              aria-label={`Go to slide ${i + 1}`}
            >
              <div
                className="h-full w-full transition-all"
                style={{
                  backgroundColor: i === index ? accent : '#ffffff40',
                  boxShadow: i === index ? `0 0 12px ${accent}60` : 'none',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
