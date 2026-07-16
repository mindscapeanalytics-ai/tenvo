'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Shield, Sparkles } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';

/* ─── Unique image per category tile ─────────────────────────────────────── */
const TILE_IMAGES = {
  gold: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80&auto=format&fit=crop',
  diamonds: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80&auto=format&fit=crop',
  bridal: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80&auto=format&fit=crop',
  gifts: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80&auto=format&fit=crop',
  silver: 'https://images.unsplash.com/photo-1589128777073-263566ae57e4?w=600&q=80&auto=format&fit=crop',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80&auto=format&fit=crop',
  necklaces: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80&auto=format&fit=crop',
  rings: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80&auto=format&fit=crop',
  polish: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&auto=format&fit=crop',
  'press-ons': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop',
  care: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop',
  kits: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&auto=format&fit=crop',
};

const JEWELLERY_TRUST = ['Certified Gold', 'Insured Shipping', 'Gift Packaging', 'Hallmark Assured'];

function resolveTileImg(label, presetImg, imageKey) {
  if (presetImg) return presetImg;
  const key = String(imageKey || label || '').toLowerCase();
  return TILE_IMAGES[key] ?? null;
}

/**
 * Luxury jewellery / beauty hero
 * - Left editorial copy with primary + secondary CTAs fully above tiles
 * - Category tiles overlap the hero bottom without covering buttons
 * - Owner-configurable slides, tiles, and trust pills via preset
 */
export function JewelleryHero({ preset, accent }) {
  const router = useRouter();
  const slides = preset.slides || [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const count = slides.length || 1;
  const touchX = useRef(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
  }, [count, next, paused]);

  useEffect(() => {
    const fn = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, []);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const onTouchStart = (e) => { touchX.current = e.touches?.[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 44) dx < 0 ? next() : prev();
    touchX.current = null;
  };

  const slide = slides[index] || slides[0];
  const parallaxY = Math.min(scrollY * 0.2, 100);
  const base = preset.base || '';

  const rawTiles = preset.tiles || [
    { label: 'Gold', desc: 'Rings & sets', href: `${base}/products?category=gold`, imageKey: 'gold' },
    { label: 'Diamonds', desc: 'Fine jewellery', href: `${base}/products?category=diamonds`, imageKey: 'diamonds' },
    { label: 'Bridal', desc: 'Wedding sets', href: `${base}/products?category=bridal`, imageKey: 'bridal' },
    { label: 'Gifts', desc: 'Occasion picks', href: `${base}/products?sort=featured`, imageKey: 'gifts' },
  ];

  const tiles = rawTiles.map((t) => ({
    label: t.label,
    desc: t.desc || '',
    href: t.href ?? (t.hrefSuffix ? `${base}/products${t.hrefSuffix}` : `${base}/products`),
    img: resolveTileImg(t.label, t.image, t.imageKey),
  }));

  const trustPills = preset.trustPills || JEWELLERY_TRUST;
  const hideRating = preset.hideRating === true;
  const secondaryCtaLabel = preset.secondaryCtaLabel || 'Browse collection';
  const secondaryCtaHref = preset.secondaryCtaHref || `${base}/products`;

  const floatConfig = [
    { dur: '5.2s', delay: '0s', distance: '-6px' },
    { dur: '6.4s', delay: '1.3s', distance: '-8px' },
    { dur: '4.9s', delay: '0.7s', distance: '-5px' },
    { dur: '5.8s', delay: '2.1s', distance: '-7px' },
  ];

  return (
    <div
      className="relative bg-stone-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ─── Hero media + copy ─────────────────────────────────────────── */}
      <section className="relative z-0 overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 transition-opacity duration-[800ms]',
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-hidden={i !== index}
          >
            <div
              className="absolute inset-0"
              style={{ transform: `translateY(${parallaxY}px) scale(1.06)`, transformOrigin: 'center center' }}
            >
              <SmartProductImage
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="absolute inset-0 bg-stone-950/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.09]"
              style={{ background: `radial-gradient(ellipse 60% 70% at 8% 55%, ${accent}, transparent 60%)` }}
              aria-hidden
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full motion-safe:animate-shimmer-float motion-reduce:hidden"
              style={{
                left: `${5 + i * 11}%`,
                top: `${10 + (i % 4) * 22}%`,
                width: '3px',
                height: '3px',
                background: accent,
                opacity: 0.3,
                animationDelay: `${i * 0.65}s`,
                animationDuration: `${5.5 + (i % 3) * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Copy sits above tiles; reserved bottom padding keeps CTAs clear */}
        <div className="relative z-10 mx-auto flex min-h-[min(72vh,640px)] max-w-[1400px] flex-col justify-end px-5 pb-36 pt-24 text-left sm:min-h-[min(68vh,600px)] sm:px-10 sm:pb-40 sm:pt-28 lg:min-h-[560px] lg:px-14 lg:pb-44 lg:pt-32">
          <div className="w-full max-w-[540px] space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {slide?.promoTag && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm"
                  style={{ borderColor: `${accent}50`, backgroundColor: `${accent}15`, color: accent }}
                >
                  <Shield className="h-3 w-3 shrink-0" aria-hidden />
                  {slide.promoTag}
                  <Sparkles className="h-3 w-3 shrink-0 opacity-70 motion-safe:animate-pulse" aria-hidden />
                </span>
              )}
              {slide?.eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-200/85 sm:text-xs">
                  {slide.eyebrow}
                </p>
              )}
            </div>

            <h1 className="font-serif text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
              {slide?.title || 'Timeless Pieces, Crafted to Last'}
            </h1>

            {slide?.subtitle && (
              <p className="max-w-md text-sm leading-relaxed text-stone-300/90 sm:text-[15px]">
                {slide.subtitle}
              </p>
            )}

            {!hideRating && slide?.rating && (
              <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-md">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className={cn(
                        'h-3.5 w-3.5',
                        i < Math.floor(slide.rating) ? 'fill-amber-400 text-amber-400' : 'fill-stone-600 text-stone-600'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold tabular-nums text-white">{slide.rating.toFixed(1)}</span>
                {slide.ratingText && (
                  <span className="hidden text-xs text-stone-400 sm:inline">{slide.ratingText}</span>
                )}
              </div>
            )}

            {/* Primary + secondary CTAs — always above overlapping tiles */}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              {slide?.ctaLabel && (
                <button
                  type="button"
                  onClick={() => slide.ctaHref && router.push(slide.ctaHref)}
                  className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[13px] font-semibold uppercase tracking-wide text-stone-950 shadow-lg transition-all hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] active:scale-[0.97] sm:px-8 sm:py-3.5"
                  style={{ backgroundColor: accent }}
                >
                  {slide.ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              )}
              {secondaryCtaLabel && (
                <button
                  type="button"
                  onClick={() => router.push(secondaryCtaHref)}
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3 text-[13px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/12 active:scale-[0.97] sm:px-8 sm:py-3.5"
                >
                  {secondaryCtaLabel}
                  <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {count > 1 && (
            <div className="absolute bottom-[9.5rem] left-5 z-10 flex items-center gap-2 sm:bottom-40 sm:left-10 lg:bottom-44 lg:left-14">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  className="h-[3px] overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: i === index ? '28px' : '8px' }}
                >
                  <div
                    className="h-full w-full rounded-full"
                    style={{
                      backgroundColor: i === index ? accent : 'rgba(255,255,255,0.4)',
                      boxShadow: i === index ? `0 0 6px ${accent}80` : 'none',
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {count > 1 && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 hidden items-center justify-between px-4 lg:flex lg:px-5">
            {[
              { fn: prev, icon: ChevronLeft, label: 'Previous slide' },
              { fn: next, icon: ChevronRight, label: 'Next slide' },
            ].map(({ fn, icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={fn}
                aria-label={label}
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95"
              >
                <Icon className="h-5 w-5 text-white" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ─── Tiles + trust — overlap hero without covering CTAs ────────── */}
      <div className="relative z-30 bg-gradient-to-b from-transparent via-stone-100 to-stone-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="-mt-[7.5rem] grid grid-cols-2 gap-3 sm:-mt-[8.5rem] sm:grid-cols-4 sm:gap-4 lg:-mt-36 lg:gap-5">
            {tiles.map((tile, idx) => {
              const { dur, delay, distance } = floatConfig[idx] || floatConfig[0];
              return (
                <button
                  key={tile.label}
                  type="button"
                  onClick={() => router.push(tile.href)}
                  aria-label={tile.label}
                  className={cn(
                    'group relative z-10 overflow-hidden rounded-2xl text-left',
                    'shadow-[0_8px_32px_rgba(0,0,0,0.28)]',
                    'transition-shadow duration-300',
                    'hover:shadow-[0_16px_40px_rgba(0,0,0,0.38)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    tile.img ? 'aspect-[4/5] max-h-[240px] sm:max-h-[260px] lg:max-h-[280px]' : 'bg-white p-4 sm:p-5'
                  )}
                  style={{
                    animation: `jewel-hang ${dur} ease-in-out ${delay} infinite`,
                    '--float-dist': distance,
                  }}
                >
                  {tile.img ? (
                    <>
                      <SmartProductImage
                        src={tile.img}
                        alt=""
                        fill
                        sizes="(max-width:639px) 50vw, 25vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.06]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-900/40 to-transparent" />
                      <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: `radial-gradient(ellipse 100% 60% at 50% 110%, ${accent}28, transparent 65%)` }}
                      />
                      <div
                        className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                      />
                      <div className="absolute right-2.5 top-2.5 flex h-7 w-7 translate-y-1 items-center justify-center rounded-full bg-black/35 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:right-3 sm:top-3">
                        <ArrowRight className="h-3.5 w-3.5 text-white" aria-hidden />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
                        <p className="text-[13px] font-semibold tracking-wide text-white sm:text-sm">{tile.label}</p>
                        {tile.desc && (
                          <p className="mt-0.5 text-[10px] text-white/65 sm:text-[11px]">{tile.desc}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col justify-end p-4">
                      <p className="text-sm font-semibold text-stone-900">{tile.label}</p>
                      {tile.desc && <p className="mt-1 text-xs text-stone-500">{tile.desc}</p>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <style>{`
            @keyframes jewel-hang {
              0%,100% { transform: translateY(0); }
              50%      { transform: translateY(var(--float-dist, -6px)); }
            }
            @media (prefers-reduced-motion: reduce) {
              @keyframes jewel-hang {
                0%,100% { transform: none; }
              }
            }
          `}</style>

          {trustPills.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 pb-7 sm:mt-6 sm:gap-3 sm:pb-9">
              {trustPills.map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-600 shadow-sm sm:text-[11px]"
                  style={{ borderColor: `${accent}30` }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
