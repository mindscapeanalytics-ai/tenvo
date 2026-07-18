'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Anchor, Ship, Wrench, Package, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MARINE_EQUIPMENT_TYPES,
  MARINE_VESSEL_TYPES,
  MARINE_SYSTEM_CONDITIONS,
  buildMarineProductsUrl,
} from '@/lib/storefront/marinePartsFinder';
import { MARINE_ACCENT, MARINE_HERO_POSTER } from '@/lib/storefront/marinePartsArchiveMap';

/**
 * Full-bleed looping hero video with poster fallback.
 */
function MarineHeroVideoBackdrop({ videoUrl, poster }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const el = videoRef.current;
    if (!el || !videoUrl) return undefined;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    const tryPlay = () => {
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    tryPlay();
    el.addEventListener('canplay', tryPlay);
    return () => el.removeEventListener('canplay', tryPlay);
  }, [videoUrl]);

  if (!videoUrl || failed) {
    return (
      <div
        className="h-full w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${poster})` }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      key={videoUrl}
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      preload="auto"
      onError={() => setFailed(true)}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}

/**
 * Industrial marine finder hero: looping video backdrop + part / OEM / equipment / vessel search.
 */
export function MarinePartsFinderHero({ preset, businessDomain, accent, accentDark }) {
  const router = useRouter();
  const productsBase = `/store/${businessDomain}/products`;
  const storeBase = `/store/${businessDomain}`;
  const brandAccent = accent || MARINE_ACCENT;
  const brandAccentDark = accentDark || brandAccent;
  const slide = preset?.slides?.[0] || {};
  const videoUrl = slide.videoUrl || preset?.videoUrl || '';
  const poster = slide.image || MARINE_HERO_POSTER;
  const showFinder = preset?.showFinder !== false;

  const [mode, setMode] = useState('partNumber');
  const [query, setQuery] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [vesselType, setVesselType] = useState('');
  const [systemCondition, setSystemCondition] = useState('');

  const navigate = (params) => {
    router.push(buildMarineProductsUrl(productsBase, params));
  };

  const goSearch = () => {
    if (mode === 'equipment') {
      if (!equipmentType) return;
      navigate({
        equipmentType,
        vesselType: vesselType || undefined,
        systemCondition: systemCondition || undefined,
      });
      return;
    }
    if (mode === 'vessel') {
      if (!vesselType) return;
      navigate({
        vesselType,
        equipmentType: equipmentType || undefined,
        systemCondition: systemCondition || undefined,
      });
      return;
    }
    const term = String(query || '').trim();
    if (!term) return;
    navigate({
      search: term,
      searchMode: mode === 'oem' ? 'oem' : 'partNumber',
      equipmentType: equipmentType || undefined,
      vesselType: vesselType || undefined,
      systemCondition: systemCondition || undefined,
    });
  };

  const modes = [
    { id: 'partNumber', label: 'Part number', icon: Package },
    { id: 'oem', label: 'OEM number', icon: Wrench },
    { id: 'equipment', label: 'Equipment', icon: Anchor },
    { id: 'vessel', label: 'Vessel type', icon: Ship },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#001122] text-white">
      <div className="absolute inset-0" aria-hidden>
        <MarineHeroVideoBackdrop videoUrl={videoUrl} poster={poster} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001122]/96 via-[#001122]/78 to-[#001122]/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001122] via-transparent to-[#001122]/45" />
        {/* Subtle engineered angle accent */}
        <div
          className="pointer-events-none absolute -right-16 bottom-0 hidden h-[55%] w-[42%] skew-x-[-12deg] bg-teal-500/10 lg:block"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex min-h-[min(92svh,820px)] max-w-7xl flex-col justify-end gap-8 px-4 pb-12 pt-28 sm:px-6 lg:justify-center lg:gap-10 lg:px-8 lg:pb-20 lg:pt-32">
        <div className="max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300/95 sm:text-xs">
            {slide.eyebrow || preset?.accentLabel || 'Tenvo Marine'}
          </p>
          <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
            {slide.title || 'Shaping reliable power at sea'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base lg:text-lg">
            {slide.subtitle ||
              'Find thrusters, rudder propellers, seals, and lifecycle spare parts by part number, OEM, or equipment type.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={slide.ctaHref || productsBase}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity hover:opacity-95"
              style={{ backgroundColor: brandAccentDark }}
            >
              {slide.ctaLabel || 'Browse catalogue'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${storeBase}/contact`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              Request quote
            </Link>
          </div>
        </div>

        {showFinder ? (
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-white/97 text-neutral-900 shadow-2xl shadow-black/35 backdrop-blur-md">
            <div className="flex flex-wrap gap-1 border-b border-neutral-100 bg-neutral-50/80 p-2">
              {modes.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                      active ? 'text-white shadow-sm' : 'text-neutral-600 hover:bg-white'
                    )}
                    style={active ? { backgroundColor: brandAccent } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
              {(mode === 'partNumber' || mode === 'oem') && (
                <label className="block lg:col-span-5">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">
                    {mode === 'oem' ? 'OEM number' : 'Part number'}
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goSearch()}
                    placeholder={mode === 'oem' ? 'e.g. OEM-TT-1650-SK' : 'e.g. TM-SRP-1215'}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-neutral-400"
                  />
                </label>
              )}

              {(mode === 'equipment' || mode === 'partNumber' || mode === 'oem') && (
                <label className={cn('block', mode === 'equipment' ? 'lg:col-span-5' : 'lg:col-span-3')}>
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Equipment type</span>
                  <select
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  >
                    <option value="">Any equipment</option>
                    {MARINE_EQUIPMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {(mode === 'vessel' || mode === 'equipment') && (
                <label className={cn('block', mode === 'vessel' ? 'lg:col-span-5' : 'lg:col-span-3')}>
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Vessel type</span>
                  <select
                    value={vesselType}
                    onChange={(e) => setVesselType(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  >
                    <option value="">Any vessel</option>
                    {MARINE_VESSEL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block lg:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-neutral-500">Condition</span>
                <select
                  value={systemCondition}
                  onChange={(e) => setSystemCondition(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                >
                  <option value="">Any</option>
                  {MARINE_SYSTEM_CONDITIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 lg:col-span-2">
                <button
                  type="button"
                  onClick={goSearch}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                  style={{ backgroundColor: brandAccentDark }}
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
              <span className="font-medium text-neutral-400">Quick links</span>
              <Link href={`${productsBase}?systemCondition=new`} className="font-semibold hover:underline" style={{ color: brandAccent }}>
                New systems
              </Link>
              <Link href={`${productsBase}?systemCondition=used`} className="font-semibold hover:underline" style={{ color: brandAccent }}>
                Used systems
              </Link>
              <Link href={`${productsBase}?category=Spare%20Parts`} className="font-semibold hover:underline" style={{ color: brandAccent }}>
                Spare parts
              </Link>
              <Link href={`${storeBase}/contact`} className="font-semibold hover:underline" style={{ color: brandAccent }}>
                RFQ
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
