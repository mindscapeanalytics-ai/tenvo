'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Gauge } from 'lucide-react';
import { HeroCarousel } from '@/components/storefront/sections/heroes/HeroCarousel';
import {
  getTyreConfig,
  buildTyreFinderHref,
  TYRE_FINDER_WIDTHS,
  TYRE_FINDER_PROFILES,
  TYRE_FINDER_RIMS,
  TYRE_ACCENTS,
} from '@/lib/storefront/tyreStorefront';
import {
  ELEVATED_CAROUSEL_HERO_CONTENT,
  ELEVATED_CAROUSEL_HERO_HEIGHT,
} from '@/lib/storefront/elevatedCarouselHero';

/**
 * Premium tyre homepage hero with size-first finder dock.
 */
export function TyreHero({ preset, businessDomain, accent, accentDark, contactCity }) {
  const router = useRouter();
  const base = preset.base || `/store/${businessDomain}`;
  const productsUrl = `${base}/products`;
  const config = getTyreConfig(preset.settings, businessDomain);
  const location = contactCity || config.defaultLocation || 'Your area';
  const quickSearchTerms = preset.quickSearchTerms || [];
  const storeName = preset.storeName || '';
  const finderAccent = accent || TYRE_ACCENTS.accent;
  const finderAccentDark = accentDark || TYRE_ACCENTS.accentDark;

  const defaults = config.finderDefaults || {};
  const [width, setWidth] = useState(String(defaults.width || '205'));
  const [profile, setProfile] = useState(String(defaults.profile || '55'));
  const [rim, setRim] = useState(String(defaults.rim || '16'));
  const [query, setQuery] = useState('');

  const findBySize = () => {
    router.push(buildTyreFinderHref(base, { width, profile, rim }));
  };

  const search = () => {
    const q = query.trim();
    if (!q) {
      router.push(productsUrl);
      return;
    }
    router.push(`${productsUrl}?search=${encodeURIComponent(q)}`);
  };

  const selectClass =
    'h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400';

  return (
    <section className="relative bg-zinc-950">
      <div className="relative isolate">
        <HeroCarousel
          slides={preset.slides || []}
          accent={finderAccent}
          variant="tyre"
          storeName={storeName}
          minHeight={ELEVATED_CAROUSEL_HERO_HEIGHT}
          className="tyre-hero-carousel"
          contentClassName={ELEVATED_CAROUSEL_HERO_CONTENT}
        />
      </div>

      {/* Mobile: size chips + quick search */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-3 py-3 lg:hidden">
        <div className="mb-3 grid grid-cols-3 gap-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Width
            </span>
            <select className={selectClass} value={width} onChange={(e) => setWidth(e.target.value)}>
              {TYRE_FINDER_WIDTHS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Profile
            </span>
            <select className={selectClass} value={profile} onChange={(e) => setProfile(e.target.value)}>
              {TYRE_FINDER_PROFILES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Rim
            </span>
            <select className={selectClass} value={rim} onChange={(e) => setRim(e.target.value)}>
              {TYRE_FINDER_RIMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={findBySize}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: finderAccent }}
        >
          <Gauge className="h-4 w-4" aria-hidden />
          Find tyres
        </button>
        {quickSearchTerms.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Popular
            </span>
            {quickSearchTerms.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => router.push(`${productsUrl}?search=${encodeURIComponent(term)}`)}
                className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-100 active:scale-[0.98]"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop finder dock */}
      <div className="relative z-20 mx-auto hidden max-w-[1400px] px-4 sm:px-6 lg:block lg:px-8">
        <div className="-mt-16 xl:-mt-[4.5rem]">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xl shadow-black/20 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-zinc-900"
                  aria-label={`Location: ${location}`}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="text-zinc-600">{config.locationLabel}</span>
                  <span>{location}</span>
                </button>
                <span className="text-xs font-semibold text-zinc-500">Search by tyre size</span>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <label className="block min-w-0 flex-1">
                  <span className="mb-1 block text-[11px] font-semibold text-zinc-500">Width</span>
                  <select className={selectClass} value={width} onChange={(e) => setWidth(e.target.value)}>
                    {TYRE_FINDER_WIDTHS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0 flex-1">
                  <span className="mb-1 block text-[11px] font-semibold text-zinc-500">Profile</span>
                  <select className={selectClass} value={profile} onChange={(e) => setProfile(e.target.value)}>
                    {TYRE_FINDER_PROFILES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0 flex-1">
                  <span className="mb-1 block text-[11px] font-semibold text-zinc-500">Rim</span>
                  <select className={selectClass} value={rim} onChange={(e) => setRim(e.target.value)}>
                    {TYRE_FINDER_RIMS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={findBySize}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-95"
                  style={{ backgroundColor: finderAccent }}
                >
                  <Gauge className="h-4 w-4" aria-hidden />
                  Find tyres
                </button>
              </div>

              <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') search();
                    }}
                    placeholder={config.searchPlaceholder}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={search}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Search
                </button>
                <Link
                  href={`${base}/contact`}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                  style={{ backgroundColor: finderAccentDark }}
                >
                  {config.bayLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
