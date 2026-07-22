'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Gauge, Phone } from 'lucide-react';
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

const CONTROL_H = 'h-9';

/**
 * Premium tyre homepage hero with a single-row compact finder dock.
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
    `${CONTROL_H} w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-sm font-semibold tabular-nums text-zinc-900 outline-none focus:border-zinc-400`;

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

      {/* Mobile */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-3 py-2.5 lg:hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-1.5">
          <select
            className={selectClass}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            aria-label="Width"
          >
            {TYRE_FINDER_WIDTHS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            aria-label="Profile"
          >
            {TYRE_FINDER_PROFILES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={rim}
            onChange={(e) => setRim(e.target.value)}
            aria-label="Rim"
          >
            {TYRE_FINDER_RIMS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={findBySize}
            className={`inline-flex ${CONTROL_H} shrink-0 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold text-white`}
            style={{ backgroundColor: finderAccent }}
            aria-label="Find tyres by size"
          >
            <Gauge className="h-3.5 w-3.5" aria-hidden />
            Find
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') search();
              }}
              placeholder={config.searchPlaceholder}
              className={`${CONTROL_H} w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-8 pr-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-500`}
            />
          </div>
          <Link
            href={`${base}/contact`}
            className={`inline-flex ${CONTROL_H} shrink-0 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold text-white`}
            style={{ backgroundColor: finderAccentDark }}
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Bay
          </Link>
        </div>
        {quickSearchTerms.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {quickSearchTerms.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => router.push(`${productsUrl}?search=${encodeURIComponent(term)}`)}
                className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-zinc-200 active:scale-[0.98]"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: one aligned row */}
      <div className="relative z-20 mx-auto hidden max-w-[1400px] px-4 sm:px-6 lg:block lg:px-8">
        <div className="-mt-10 xl:-mt-12">
          <div className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2 shadow-xl shadow-black/20 sm:px-3.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`inline-flex ${CONTROL_H} shrink-0 items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 text-[11px] font-semibold text-zinc-900`}
                aria-label={`Location: ${location}`}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                <span className="hidden text-zinc-500 xl:inline">{config.locationLabel}</span>
                <span>{location}</span>
              </button>

              <span className="hidden h-5 w-px shrink-0 bg-zinc-200 sm:block" aria-hidden />

              <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Search by tyre size">
                <select
                  className={`${CONTROL_H} w-[4.25rem] rounded-lg border border-zinc-200 bg-zinc-50 px-1.5 text-sm font-semibold tabular-nums text-zinc-900 outline-none focus:border-zinc-400`}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  aria-label="Width"
                  title="Width"
                >
                  {TYRE_FINDER_WIDTHS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-semibold text-zinc-300" aria-hidden>
                  /
                </span>
                <select
                  className={`${CONTROL_H} w-[3.75rem] rounded-lg border border-zinc-200 bg-zinc-50 px-1.5 text-sm font-semibold tabular-nums text-zinc-900 outline-none focus:border-zinc-400`}
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  aria-label="Profile"
                  title="Profile"
                >
                  {TYRE_FINDER_PROFILES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-semibold text-zinc-300" aria-hidden>
                  R
                </span>
                <select
                  className={`${CONTROL_H} w-[3.5rem] rounded-lg border border-zinc-200 bg-zinc-50 px-1.5 text-sm font-semibold tabular-nums text-zinc-900 outline-none focus:border-zinc-400`}
                  value={rim}
                  onChange={(e) => setRim(e.target.value)}
                  aria-label="Rim"
                  title="Rim"
                >
                  {TYRE_FINDER_RIMS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={findBySize}
                  className={`inline-flex ${CONTROL_H} shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white transition hover:opacity-95`}
                  style={{ backgroundColor: finderAccent }}
                >
                  <Gauge className="h-3.5 w-3.5" aria-hidden />
                  Find
                </button>
              </div>

              <span className="hidden h-5 w-px shrink-0 bg-zinc-200 lg:block" aria-hidden />

              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') search();
                  }}
                  placeholder={config.searchPlaceholder}
                  className={`${CONTROL_H} w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400`}
                  aria-label="Search size, brand, or model"
                />
                <button
                  type="button"
                  onClick={search}
                  className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                  aria-label="Search"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              <Link
                href={`${base}/contact`}
                className={`inline-flex ${CONTROL_H} shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white transition hover:opacity-95`}
                style={{ backgroundColor: finderAccentDark }}
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden xl:inline">{config.bayLabel}</span>
                <span className="xl:hidden">Bay</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
