'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Anchor, Ship, Wrench, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MARINE_EQUIPMENT_TYPES,
  MARINE_VESSEL_TYPES,
  MARINE_SYSTEM_CONDITIONS,
  buildMarineProductsUrl,
} from '@/lib/storefront/marinePartsFinder';
import { MARINE_ACCENT, MARINE_HERO_POSTER } from '@/lib/storefront/marinePartsArchiveMap';

/**
 * Industrial marine finder hero: video backdrop + part / OEM / equipment / vessel search.
 */
export function MarinePartsFinderHero({ preset, businessDomain, accent, accentDark }) {
  const router = useRouter();
  const base = `/store/${businessDomain}/products`;
  const brandAccent = accent || MARINE_ACCENT;
  const brandAccentDark = accentDark || brandAccent;
  const slide = preset?.slides?.[0] || {};
  const videoUrl = slide.videoUrl || preset?.videoUrl || '';
  const poster = slide.image || MARINE_HERO_POSTER;

  const [mode, setMode] = useState('partNumber');
  const [query, setQuery] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [vesselType, setVesselType] = useState('');
  const [systemCondition, setSystemCondition] = useState('');

  const navigate = (params) => {
    router.push(buildMarineProductsUrl(base, params));
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
    <section className="relative w-full overflow-hidden bg-[#001a33] text-white">
      <div className="absolute inset-0" aria-hidden>
        {videoUrl ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={poster}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${poster})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001a33]/95 via-[#001a33]/75 to-[#001a33]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001a33] via-transparent to-[#001a33]/40" />
      </div>

      <div className="relative mx-auto flex min-h-[min(88svh,760px)] max-w-7xl flex-col justify-end gap-8 px-4 pb-10 pt-24 sm:px-6 lg:justify-center lg:px-8 lg:pb-16 lg:pt-28">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300/90">
            {slide.eyebrow || preset?.accentLabel || 'Tenvo Marine'}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {slide.title || 'Shaping reliable power at sea'}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {slide.subtitle ||
              'Find thrusters, rudder propellers, seals, and lifecycle spare parts by part number, OEM, or equipment type.'}
          </p>
        </div>

        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-white/95 text-neutral-900 shadow-2xl shadow-black/30 backdrop-blur-sm">
          <div className="flex flex-wrap gap-1 border-b border-neutral-100 p-2">
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
                    active ? 'text-white' : 'text-neutral-600 hover:bg-neutral-50'
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
            <span>Quick links</span>
            <Link href={`${base}?systemCondition=new`} className="font-semibold hover:underline" style={{ color: brandAccent }}>
              New systems
            </Link>
            <Link href={`${base}?systemCondition=used`} className="font-semibold hover:underline" style={{ color: brandAccent }}>
              Used systems
            </Link>
            <Link href={`${base}?category=Spare%20Parts`} className="font-semibold hover:underline" style={{ color: brandAccent }}>
              Spare parts
            </Link>
            <Link
              href={`/store/${businessDomain}/contact`}
              className="font-semibold hover:underline"
              style={{ color: brandAccent }}
            >
              Request quote
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
