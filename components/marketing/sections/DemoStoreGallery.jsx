'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Car,
  CarFront,
  CircleGauge,
  Croissant,
  Dumbbell,
  ExternalLink,
  Gem,
  Layers,
  Pill,
  Scissors,
  Ship,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Sofa,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import {
  getFeaturedDemoGalleryItems,
  getHeroDemoGalleryItems,
  HERO_EXCLUDED_DEMO_DOMAINS,
} from '@/lib/marketing/demoStoreGalleryMeta';
import { CLIENT_DEMO_STORES } from '@/lib/marketing/demoStores';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  shirt: Shirt,
  layers: Layers,
  gem: Gem,
  'utensils-crossed': UtensilsCrossed,
  pill: Pill,
  'shopping-basket': ShoppingBasket,
  'shopping-bag': ShoppingBag,
  wrench: Wrench,
  croissant: Croissant,
  scissors: Scissors,
  sofa: Sofa,
  gauge: CircleGauge,
  dumbbell: Dumbbell,
  car: Car,
  'car-front': CarFront,
  stethoscope: Stethoscope,
  ship: Ship,
  store: Store,
};

const FADE_MS = 700;
const HOLD_MS = 5200;

/**
 * @param {ReturnType<typeof getHeroDemoGalleryItems>[number]} store
 */
function StoreIconBadge({ store, className }) {
  const Icon = ICON_MAP[store.icon] || Store;
  if (store.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={store.logo}
        alt=""
        className={cn('h-8 w-8 object-contain', className)}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <Icon
      className={cn('h-5 w-5', className)}
      strokeWidth={1.75}
      aria-hidden
      style={{ color: store.glowGradient }}
    />
  );
}

/**
 * @param {{
 *   store: ReturnType<typeof getHeroDemoGalleryItems>[number];
 *   active: boolean;
 *   priority?: boolean;
 * }} props
 */
function StoreSlide({ store, active, priority = false }) {
  const [imgSrc, setImgSrc] = useState(store.heroImage);
  const [imgFailed, setImgFailed] = useState(false);
  const isDark = store.slideTheme === 'dark';

  useEffect(() => {
    setImgSrc(store.heroImage);
    setImgFailed(false);
  }, [store.heroImage]);

  const showImage = Boolean(imgSrc) && !imgFailed;

  return (
    <div
      className={cn(
        'absolute inset-0 transition-opacity ease-in-out motion-reduce:transition-none',
        active ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-hidden={!active}
    >
      <div
        className={cn('absolute inset-0 z-0', store.slideBackdropClass || 'bg-slate-100')}
        aria-hidden
      />
      {showImage ? (
        <Image
          src={imgSrc}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className={cn(
            'z-[1]',
            store.heroObjectFit || 'object-cover',
            store.heroObjectPosition || 'object-center'
          )}
          onError={() => {
            if (!imgFailed) setImgFailed(true);
          }}
        />
      ) : null}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-[2]',
          isDark
            ? 'bg-gradient-to-t from-black/90 from-20% via-black/45 via-55% to-black/15'
            : 'bg-gradient-to-t from-white/95 from-18% via-white/40 via-45% to-transparent'
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-[2]',
          isDark
            ? 'bg-gradient-to-r from-black/50 via-transparent to-transparent'
            : 'bg-gradient-to-r from-white/20 via-transparent to-transparent'
        )}
        aria-hidden
      />

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 flex flex-col gap-5 px-5 pb-28 pt-20 sm:px-10 sm:pb-32 lg:px-14 lg:pb-36',
          'sm:flex-row sm:items-end sm:justify-between'
        )}
      >
        <div className="flex min-w-0 max-w-3xl gap-4 sm:gap-5">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg sm:h-14 sm:w-14',
              isDark
                ? 'border-white/15 bg-white/10 backdrop-blur-sm'
                : 'border-white/90 bg-white/95'
            )}
          >
            <StoreIconBadge store={store} className={isDark ? 'text-white' : undefined} />
          </div>
          <div className="min-w-0 space-y-1.5 sm:space-y-2">
            <p
              className={cn(
                'text-[11px] font-semibold uppercase tracking-[0.22em]',
                isDark ? 'text-white/60' : 'text-neutral-500'
              )}
            >
              {store.vertical}
            </p>
            <h3
              className={cn(
                'text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl',
                isDark ? 'text-white' : 'text-neutral-900'
              )}
            >
              {store.name}
            </h3>
            <p
              className={cn(
                'line-clamp-2 text-sm font-medium leading-relaxed sm:line-clamp-3 sm:text-base lg:text-lg',
                isDark ? 'text-white/75' : 'text-neutral-600'
              )}
            >
              {store.description}
            </p>
            <p
              className={cn(
                'text-xs font-medium uppercase tracking-wide',
                isDark ? 'text-white/45' : 'text-neutral-400'
              )}
            >
              {store.city || store.country}
              {store.tier === 'full' ? ' · Full hub demo' : ''}
            </p>
          </div>
        </div>

        <Link
          href={store.href}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={active ? 0 : -1}
          className={cn(
            'inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full',
            'px-6 py-3 text-sm font-semibold shadow-md backdrop-blur-md transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2',
            isDark
              ? 'border border-white/20 bg-white text-neutral-900 hover:bg-rose-50 hover:shadow-lg'
              : 'border border-neutral-300/90 bg-white/85 text-neutral-900 hover:border-neutral-400 hover:bg-white hover:shadow-lg'
          )}
        >
          Visit store
          <ArrowUpRight className="h-4 w-4 text-neutral-500" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/**
 * @param {{ stores: ReturnType<typeof getHeroDemoGalleryItems> }} props
 */
function FullScreenStoreShowcase({ stores }) {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % stores.length);
  }, [stores.length]);

  useEffect(() => {
    if (stores.length <= 1) return undefined;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return undefined;

    const interval = setInterval(advance, HOLD_MS);
    return () => clearInterval(interval);
  }, [advance, stores.length]);

  if (!stores.length) return null;

  return (
    <div className="relative h-full w-full">
      {stores.map((store, i) => (
        <StoreSlide key={store.domain} store={store} active={i === index} priority={i === 0} />
      ))}

      <div
        className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-4 border-t border-white/60 bg-white/70 px-4 py-4 backdrop-blur-md sm:py-5"
        role="tablist"
        aria-label="Demo storefront slides"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {stores.map((store, i) => (
            <button
              key={store.domain}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${store.name}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === index ? 'w-8 bg-brand-primary' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
              )}
            />
          ))}
        </div>
        <p className="text-center text-xs font-medium text-neutral-500">
          {index + 1} / {stores.length} live demo storefronts
        </p>
      </div>
    </div>
  );
}

/**
 * Full-viewport light hero — edge-to-edge store imagery cycling all ready demos.
 * @param {{ stores: ReturnType<typeof getHeroDemoGalleryItems> }} props
 */
function DemoStoreHeroGallery({ stores }) {
  if (stores.length === 0) return null;

  return (
    <section
      aria-label="Live demo storefronts"
      className="relative h-svh w-full overflow-hidden border-y border-slate-200/80 bg-slate-100"
    >
      <FullScreenStoreShowcase stores={stores} />
    </section>
  );
}

/**
 * Compact featured spotlight — not full-viewport (homepage mid-page friendly).
 * @param {{ stores: ReturnType<typeof getFeaturedDemoGalleryItems> }} props
 */
function FeaturedSpotlight({ stores }) {
  const spotlightStores = stores.slice(0, 8);
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % spotlightStores.length);
  }, [spotlightStores.length]);

  useEffect(() => {
    if (spotlightStores.length <= 1) return undefined;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;
    const interval = setInterval(advance, HOLD_MS);
    return () => clearInterval(interval);
  }, [advance, spotlightStores.length]);

  if (!spotlightStores.length) return null;
  const active = spotlightStores[index];

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-neutral-900 ring-1 ring-neutral-800 sm:rounded-[2rem]">
      <div className="relative aspect-[16/11] w-full sm:aspect-[21/10] lg:aspect-[2.4/1]">
        {spotlightStores.map((store, i) => {
          const isActive = i === index;
          // Keep only active + neighbors mounted to cut paint cost
          if (Math.abs(i - index) > 1 && !(index === 0 && i === spotlightStores.length - 1) && !(index === spotlightStores.length - 1 && i === 0)) {
            return null;
          }
          const isDark = store.slideTheme === 'dark';
          return (
            <div
              key={store.domain}
              className={cn(
                'absolute inset-0 transition-opacity ease-in-out motion-reduce:transition-none',
                isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'
              )}
              style={{ transitionDuration: `${FADE_MS}ms` }}
              aria-hidden={!isActive}
            >
              <div
                className={cn('absolute inset-0', store.slideBackdropClass || 'bg-neutral-800')}
                aria-hidden
              />
              {store.heroImage ? (
                <Image
                  src={store.heroImage}
                  alt=""
                  fill
                  priority={i === 0}
                  className={cn(
                    store.heroObjectFit || 'object-cover',
                    store.heroObjectPosition || 'object-center'
                  )}
                  sizes="(max-width: 1024px) 100vw, 1200px"
                />
              ) : null}
              <div
                className={cn(
                  'pointer-events-none absolute inset-0',
                  isDark
                    ? 'bg-gradient-to-t from-black/85 via-black/35 to-black/10'
                    : 'bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-transparent'
                )}
                aria-hidden
              />
            </div>
          );
        })}

        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7 lg:p-8">
          <div className="min-w-0 max-w-2xl space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
              {active.vertical}
              {active.tier === 'full' ? ' · Full hub demo' : ''}
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              {active.name}
            </h3>
            <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white/75 sm:text-[0.9375rem]">
              {active.description}
            </p>
          </div>
          <Link
            href={active.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow-lg transition-colors hover:bg-brand-50"
          >
            Open live demo
            <ExternalLink className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
          </Link>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-neutral-950/80 px-4 py-3 sm:px-6"
        role="tablist"
        aria-label="Featured demo stores"
      >
        <div className="flex flex-wrap gap-1.5">
          {spotlightStores.map((store, i) => (
            <button
              key={store.domain}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${store.name}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === index ? 'w-7 bg-brand-primary' : 'w-2 bg-white/25 hover:bg-white/45'
              )}
            />
          ))}
        </div>
        <p className="text-[11px] font-medium tabular-nums text-white/45">
          {index + 1} / {spotlightStores.length}
        </p>
      </div>
    </div>
  );
}

/**
 * Browseable store card — CSS-only hover (no height:auto).
 * Marquee mode uses lightweight <img> to keep the track composited smoothly.
 * @param {{
 *   store: ReturnType<typeof getFeaturedDemoGalleryItems>[number];
 *   className?: string;
 *   compact?: boolean;
 * }} props
 */
function DemoStoreCard({ store, className, compact = false }) {
  const Icon = ICON_MAP[store.icon] || Store;

  return (
    <Link
      href={store.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex flex-col overflow-hidden rounded-[1.35rem] bg-white',
        'ring-1 ring-neutral-200/90',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        compact
          ? 'demo-store-marquee-card transition-[box-shadow,ring-color] duration-200 hover:ring-brand-primary/30'
          : cn(
              'transition-[transform,box-shadow,ring-color] duration-300',
              'motion-safe:hover:-translate-y-1',
              'hover:ring-brand-primary/30',
              'hover:shadow-[0_22px_44px_-28px_rgba(15,23,42,0.35)]'
            ),
        className
      )}
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-neutral-100">
        {store.heroImage ? (
          compact ? (
            // eslint-disable-next-line @next/next/no-img-element -- marquee needs lightweight imgs for smooth GPU scroll
            <img
              src={store.heroImage}
              alt={`${store.name} live demo storefront`}
              className={cn(
                'absolute inset-0 h-full w-full',
                store.heroObjectFit || 'object-cover',
                store.heroObjectPosition || 'object-top'
              )}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          ) : (
            <Image
              src={store.heroImage}
              alt={`${store.name} live demo storefront`}
              fill
              className={cn(
                'transition-transform duration-500 motion-safe:group-hover:scale-[1.04]',
                store.heroObjectFit || 'object-cover',
                store.heroObjectPosition || 'object-top'
              )}
              sizes="280px"
            />
          )
        ) : (
          <div
            className={cn('absolute inset-0', store.backgroundColor)}
            aria-hidden
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
          aria-hidden
        />
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-800 shadow-sm ring-1 ring-black/5"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            aria-hidden
          />
          Live
        </span>
        <div
          className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/95 shadow-sm"
          style={{ color: store.glowGradient }}
        >
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />
          ) : (
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-3.5 sm:px-4 sm:py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
          {store.vertical}
        </p>
        <h3 className="text-[0.9375rem] font-semibold tracking-tight text-neutral-900 group-hover:text-brand-primary">
          {store.name}
        </h3>
        <p className="line-clamp-2 text-xs font-medium leading-relaxed text-neutral-500">
          {store.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-neutral-400">
            {store.city || store.country}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
            Open demo
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Single-row seamless auto-scroll of ready store cards.
 * GPU translate3d track; lightweight imgs; pause on hover for clicks.
 * @param {{ stores: ReturnType<typeof getFeaturedDemoGalleryItems> }} props
 */
function DemoStoreMarquee({ stores }) {
  if (!stores.length) return null;

  return (
    <div
      className="demo-store-marquee relative -mx-4 overflow-hidden sm:mx-0"
      aria-label="Ready store demos scrolling gallery"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#F7F7F8] via-[#F7F7F8]/90 to-transparent sm:w-12"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#F7F7F8] via-[#F7F7F8]/90 to-transparent sm:w-12"
        aria-hidden
      />

      {/* Infinite CSS marquee (motion-safe) */}
      <div className="hidden motion-safe:block">
        <div className="flex w-max animate-marquee-stores">
          {[0, 1].map((set) => (
            <div
              key={set}
              className="flex shrink-0 items-stretch gap-4 pr-4 sm:gap-5 sm:pr-5"
              aria-hidden={set === 1}
            >
              {stores.map((store) => (
                <DemoStoreCard
                  key={`${set}-${store.domain}`}
                  store={store}
                  compact
                  className="w-[min(78vw,16.5rem)] shrink-0 sm:w-[17.5rem]"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Reduced-motion: manual horizontal scroll */}
      <div
        className="flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] motion-safe:hidden sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {stores.map((store) => (
          <DemoStoreCard
            key={store.domain}
            store={store}
            compact
            className="w-[min(78vw,16.5rem)] shrink-0 sm:w-[17.5rem]"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Homepage featured gallery — ready stores owners can open and inspect.
 * @param {{ stores: ReturnType<typeof getFeaturedDemoGalleryItems> }} props
 */
function FeaturedDemoStoreGallery({ stores }) {
  if (!stores.length) return null;

  return (
    <MarketingSection
      padding="loose"
      className="border-y border-neutral-200/80 bg-gradient-to-b from-[#F7F7F8] via-white to-[#F7F7F8]"
    >
      <div className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-12">
        <p className={MARKETING_EYEBROW}>Live demo storefronts</p>
        <h2 className={MARKETING_SECTION_HEADING}>
          Tenvo Ready Stores For{' '}
          <span className="text-brand-primary">Your Business</span>
        </h2>
        <p className={cn(MARKETING_LEAD, 'mx-auto')}>
          Open a live storefront built for your industry. See the catalog, chrome, and checkout
          experience you get on day one, then launch yours from the same platform.
        </p>
      </div>

      <FeaturedSpotlight stores={stores} />

      <div className="mt-8 sm:mt-10">
        <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Browse all ready stores</p>
            <p className="text-xs font-medium text-neutral-500">
              {stores.length} live demos · auto-scrolls · hover to pause
            </p>
          </div>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary underline-offset-4 hover:underline"
          >
            View demo hub
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <DemoStoreMarquee stores={stores} />
      </div>
    </MarketingSection>
  );
}

/**
 * Live demo storefront gallery.
 * @param {{ variant?: 'hero' | 'featured' | 'all' }} props
 */
export function DemoStoreGallery({ variant = 'hero' }) {
  if (variant === 'featured') {
    return <FeaturedDemoStoreGallery stores={getHeroDemoGalleryItems()} />;
  }

  if (variant === 'hero') {
    return <DemoStoreHeroGallery stores={getHeroDemoGalleryItems()} />;
  }

  const stores = CLIENT_DEMO_STORES.filter((store) => !HERO_EXCLUDED_DEMO_DOMAINS.has(store.domain));

  return (
    <MarketingSection padding="loose" className="border-y border-slate-200/80 bg-slate-50">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Link
            key={store.domain}
            href={store.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 motion-safe:hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-brand-primary">{store.name}</p>
              <p className="text-xs text-gray-500">{store.country}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-gray-400">{store.href}</p>
            </div>
          </Link>
        ))}
      </div>
    </MarketingSection>
  );
}
