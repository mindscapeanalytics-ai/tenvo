'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';
import { resolveAutomotiveTileImage } from '@/lib/storefront/storefrontImagePlaceholders';
import {
  MARKETPLACE_POPULAR_BRANDS,
  MARKETPLACE_BODY_TYPES,
  MARKETPLACE_FUEL_TYPES,
  MARKETPLACE_PRICE_BANDS,
  getMarketplaceConfig,
} from '@/lib/storefront/autoMarketplace';

const SEARCH_TABS = [
  { id: 'new', label: 'New', condition: 'new' },
  { id: 'used', label: 'Used', condition: 'pre-owned' },
  { id: 'rental', label: 'Rental', condition: 'rental' },
  { id: 'all', label: 'All', condition: '' },
];

/** Dark gradient overlay — keeps hero copy readable on any photo. */
const HERO_OVERLAY =
  'bg-gradient-to-t from-black/95 via-black/60 to-black/35';

/**
 * Marketplace hero — dark cinematic slides, centered copy, floating search widget.
 */
export function MarketplaceHero({ preset, accent, accentDark, settings = {} }) {
  const router = useRouter();
  const slides = preset.slides || [];
  const [index, setIndex] = useState(0);
  const [searchTab, setSearchTab] = useState('new');
  const [make, setMake] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const count = slides.length || 1;
  const base = preset.base || '/';
  const productsUrl = `${base}/products`;
  const cfg = getMarketplaceConfig(settings);

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
  }, [count, next]);

  const slide = slides[index] || slides[0];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const tab = SEARCH_TABS.find((t) => t.id === searchTab);
    if (tab?.condition) params.set('condition', tab.condition);
    if (make) params.set('brand', make);
    if (bodyType) params.set('body', bodyType);
    if (fuelType) params.set('fuel', fuelType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    router.push(`${productsUrl}?${params.toString()}`);
  };

  return (
    <section className="store-hero relative border-b border-neutral-800 bg-neutral-950">
      <div className="relative min-h-[340px] sm:min-h-[400px] lg:min-h-[440px]">
        {slides.map((s, i) => (
          <div
            key={`${s.image}-${i}`}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
          >
            <SmartProductImage
              src={s.image}
              alt=""
              fill
              className="object-cover brightness-[0.55] saturate-[1.05]"
              priority={i === 0}
              fallbackSrc={resolveAutomotiveTileImage(s.title || String(i))}
            />
            <div className={cn('absolute inset-0', HERO_OVERLAY)} aria-hidden />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex h-full min-h-[inherit] max-w-[1400px] flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          {slide ? (
            <div className="max-w-3xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                {slide.eyebrow}
              </p>
              <h1 className="store-heading text-2xl font-semibold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
                {slide.title}
              </h1>
              {slide.subtitle ? (
                <p className="store-hero-subtitle mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                  {slide.subtitle}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => router.push(slide.ctaHref || productsUrl)}
                className="mt-5 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:scale-[1.02] hover:opacity-95 sm:mt-6"
                style={{ backgroundColor: accent || '#E30613' }}
              >
                {slide.ctaLabel || 'Explore deals'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {count > 1 ? (
            <div className="mt-6 flex justify-center gap-2 sm:mt-8">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-8 bg-white' : 'w-4 bg-white/35 hover:bg-white/55'
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {cfg.coeTicker?.value ? (
        <div className="relative z-10 border-t border-white/10 bg-neutral-950/90 px-4 py-2.5 text-center text-xs text-white/80 backdrop-blur-sm sm:text-sm">
          <span className="font-semibold text-white">{cfg.coeTicker.label}:</span>{' '}
          <span className="font-semibold tabular-nums text-white">{cfg.coeTicker.value}</span>{' '}
          <span className="text-emerald-400">{cfg.coeTicker.change}</span>
        </div>
      ) : null}

      <div className="relative z-20 mx-auto max-w-[1400px] px-4 pb-6 sm:px-6 lg:-mt-8 lg:px-8 lg:pb-8">
        <form
          onSubmit={handleSearch}
          className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xl shadow-black/10 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap justify-center gap-1 border-b border-neutral-100 pb-3 sm:justify-start">
            {SEARCH_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchTab(tab.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                  searchTab === tab.id ? 'text-white' : 'text-neutral-600 hover:bg-neutral-50'
                )}
                style={searchTab === tab.id ? { backgroundColor: accent || '#E30613' } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <label className="block lg:col-span-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase text-neutral-500">Brand</span>
              <select
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">Any brand</option>
                {MARKETPLACE_POPULAR_BRANDS.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase text-neutral-500">Min price</span>
              <select
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">No min</option>
                {MARKETPLACE_PRICE_BANDS.map((b) => (
                  <option key={b.label} value={b.min}>{b.label.split(' - ')[0]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase text-neutral-500">Max price</span>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">No max</option>
                {MARKETPLACE_PRICE_BANDS.map((b) => (
                  <option key={`max-${b.label}`} value={b.max || 999999}>{b.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase text-neutral-500">Body type</span>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">Any type</option>
                {MARKETPLACE_BODY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase text-neutral-500">Fuel</span>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">Any fuel</option>
                {MARKETPLACE_FUEL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: accentDark || accent || '#E30613' }}
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
