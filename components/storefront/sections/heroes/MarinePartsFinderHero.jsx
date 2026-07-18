'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Anchor, Ship, Wrench, Package, ArrowRight, SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MARINE_EQUIPMENT_TYPES,
  MARINE_VESSEL_TYPES,
  MARINE_SYSTEM_CONDITIONS,
  buildMarineProductsUrl,
} from '@/lib/storefront/marinePartsFinder';
import { MARINE_ACCENT, MARINE_HERO_POSTER } from '@/lib/storefront/marinePartsArchiveMap';
import { getMarinePartsStorefrontConfig } from '@/lib/storefront/marineParts';
import { StoreConnectionButtons } from '@/components/storefront/StoreConnectionButtons';
import { resolveStoreConnectionActions } from '@/lib/storefront/storeConnectionActions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const SEARCH_MODES = [
  { id: 'partNumber', label: 'Part number', icon: Package },
  { id: 'oem', label: 'OEM number', icon: Wrench },
  { id: 'equipment', label: 'Equipment', icon: Anchor },
  { id: 'vessel', label: 'Vessel type', icon: Ship },
];

const HERO_INTELLIGENCE = [
  { label: 'New & used systems', hint: 'Install-ready and yard stock' },
  { label: 'OEM cross-reference', hint: 'Part and interchange lookup' },
  { label: 'RFQ-ready quoting', hint: 'Lead times on request' },
];

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

function MarineQuickLinks({ links, storeBase, accent, className, muted = false }) {
  const linkClass = muted
    ? 'font-semibold text-white/75 transition-colors hover:text-white'
    : 'font-semibold transition-opacity hover:opacity-80';
  if (!links?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', className)}>
      <span className={muted ? 'font-medium text-white/45' : 'font-medium text-neutral-400'}>
        Quick
      </span>
      {links.map((link) => {
        const href = link.href?.startsWith('http')
          ? link.href
          : `${storeBase}${link.href?.startsWith('/') ? link.href : `/${link.href || ''}`}`;
        return (
          <Link
            key={link.id || link.label}
            href={href}
            className={linkClass}
            style={muted ? undefined : { color: accent }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Full multi-mode marine parts finder (used inside the side panel).
 */
function MarinePartsSearchPanel({
  mode,
  setMode,
  query,
  setQuery,
  equipmentType,
  setEquipmentType,
  vesselType,
  setVesselType,
  systemCondition,
  setSystemCondition,
  onSearch,
  accent,
  accentDark,
  storeBase,
  quickLinks,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-1 border-b border-neutral-100 bg-neutral-50/90 p-2">
        {SEARCH_MODES.map((m) => {
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
              style={active ? { backgroundColor: accent } : undefined}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {(mode === 'partNumber' || mode === 'oem') && (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
                {mode === 'oem' ? 'OEM number' : 'Part number'}
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder={mode === 'oem' ? 'e.g. OEM-TT-1650-SK' : 'e.g. TM-SRP-1215'}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                autoFocus
              />
            </label>
          )}

          {(mode === 'equipment' || mode === 'partNumber' || mode === 'oem') && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-500">Equipment type</span>
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
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-500">Vessel type</span>
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-500">Condition</span>
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
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          style={{ backgroundColor: accentDark }}
        >
          <Search className="h-4 w-4" aria-hidden />
          Search catalogue
        </button>

        <MarineQuickLinks
          links={quickLinks}
          storeBase={storeBase}
          accent={accent}
          className="border-t border-neutral-100 pt-4"
        />
      </div>
    </div>
  );
}

/**
 * Industrial marine finder hero: cinematic messaging + glass dock + side panel search.
 */
export function MarinePartsFinderHero({
  preset,
  businessDomain,
  accent,
  accentDark,
  business = null,
  settings = null,
}) {
  const router = useRouter();
  const titleId = useId();
  const productsBase = `/store/${businessDomain}/products`;
  const storeBase = `/store/${businessDomain}`;
  const brandAccent = accent || MARINE_ACCENT;
  const brandAccentDark = accentDark || brandAccent;
  const slide = preset?.slides?.[0] || {};
  const videoUrl = slide.videoUrl || preset?.videoUrl || '';
  const poster = slide.image || MARINE_HERO_POSTER;
  const showFinder = preset?.showFinder !== false;
  const marineConfig = getMarinePartsStorefrontConfig(settings || {});
  const quickLinks = marineConfig.quickLinks || [];
  const brandChips = marineConfig.showBrandChips ? marineConfig.brandChips || [] : [];
  const connectionActions = resolveStoreConnectionActions({
    business: business || { category: 'marine-parts' },
    settings: settings || {},
    businessDomain,
    storeBase,
    force: true,
  });

  const [panelOpen, setPanelOpen] = useState(false);
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
      setPanelOpen(false);
      return;
    }
    if (mode === 'vessel') {
      if (!vesselType) return;
      navigate({
        vesselType,
        equipmentType: equipmentType || undefined,
        systemCondition: systemCondition || undefined,
      });
      setPanelOpen(false);
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
    setPanelOpen(false);
  };

  const goQuickPartSearch = () => {
    const term = String(query || '').trim();
    if (!term) {
      setMode('partNumber');
      setPanelOpen(true);
      return;
    }
    setMode('partNumber');
    navigate({
      search: term,
      searchMode: 'partNumber',
      equipmentType: equipmentType || undefined,
      systemCondition: systemCondition || undefined,
    });
  };

  const openAdvanced = (nextMode) => {
    if (nextMode) setMode(nextMode);
    setPanelOpen(true);
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#001122] text-white">
      <div className="absolute inset-0" aria-hidden>
        <MarineHeroVideoBackdrop videoUrl={videoUrl} poster={poster} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001122]/97 via-[#001122]/72 to-[#001122]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001122] via-[#001122]/20 to-[#001122]/50" />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 hidden h-[58%] w-[40%] skew-x-[-12deg] bg-teal-400/10 lg:block"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex min-h-[min(88svh,780px)] max-w-7xl flex-col px-4 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        {/* Hero messaging — first viewport stays brand-first */}
        <div className="flex flex-1 flex-col justify-center pb-8 lg:pb-10">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300/95 sm:text-xs">
              {slide.eyebrow || preset?.accentLabel || 'Marine propulsion'}
            </p>
            <h1
              id={titleId}
              className="text-[2.15rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-[3.35rem]"
            >
              {slide.title || 'Shaping reliable power at sea'}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base lg:text-[1.05rem]">
              {slide.subtitle ||
                'New and used thrusters, rudder propellers, seals, and lifecycle spare parts for fleet and yard teams.'}
            </p>

            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Catalogue strengths">
              {HERO_INTELLIGENCE.map((item) => (
                <li
                  key={item.label}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm sm:text-xs"
                  title={item.hint}
                >
                  {item.label}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {connectionActions.length > 0 ? (
                <StoreConnectionButtons
                  actions={connectionActions}
                  accent={brandAccentDark}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={slide.ctaHref || productsBase}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity hover:opacity-95"
                    style={{ backgroundColor: brandAccentDark }}
                  >
                    {slide.ctaLabel || 'Browse catalogue'}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href={`${storeBase}/contact`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    Request quote
                  </Link>
                </div>
              )}

              {showFinder ? (
                <button
                  type="button"
                  onClick={() => openAdvanced('partNumber')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-300/40 bg-teal-400/10 px-5 py-2.5 text-sm font-semibold text-teal-100 backdrop-blur-sm transition-colors hover:bg-teal-400/20"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Parts search
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Slim glass dock — always available, does not dominate the hero */}
        {showFinder ? (
          <div className="pb-6 lg:pb-8">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#001830]/72 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-2 sm:p-3.5">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <Package className="h-4 w-4 shrink-0 text-teal-300/90" aria-hidden />
                  <label className="sr-only" htmlFor={`${titleId}-dock-query`}>
                    Part number
                  </label>
                  <input
                    id={`${titleId}-dock-query`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goQuickPartSearch()}
                    placeholder="Search by part number…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={goQuickPartSearch}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 sm:flex-none"
                    style={{ backgroundColor: brandAccentDark }}
                  >
                    <Search className="h-4 w-4" aria-hidden />
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => openAdvanced()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Advanced</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3.5 py-2.5">
                <MarineQuickLinks
                  links={quickLinks}
                  storeBase={storeBase}
                  accent={brandAccent}
                  muted
                />
                <div className="hidden flex-wrap items-center gap-1.5 text-[11px] text-white/45 sm:flex">
                  {brandChips.slice(0, 5).map((chip) => {
                    const href = chip.href?.startsWith('http')
                      ? chip.href
                      : `${storeBase}${chip.href?.startsWith('/') ? chip.href : `/${chip.href || ''}`}`;
                    return (
                      <Link
                        key={chip.id}
                        href={href}
                        className="rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {chip.label}
                      </Link>
                    );
                  })}
                  {!brandChips.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openAdvanced('oem')}
                        className="rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        OEM
                      </button>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        onClick={() => openAdvanced('equipment')}
                        className="rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        Equipment
                      </button>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        onClick={() => openAdvanced('vessel')}
                        className="rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        Vessel
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto border-neutral-200 p-0 sm:max-w-lg"
        >
          <SheetHeader className="space-y-1 border-b border-neutral-100 px-5 py-4 text-left">
            <SheetTitle className="text-base font-semibold text-neutral-900">Parts search</SheetTitle>
            <SheetDescription className="text-sm text-neutral-500">
              Look up by part number, OEM, equipment, or vessel type.
            </SheetDescription>
          </SheetHeader>
          <MarinePartsSearchPanel
            mode={mode}
            setMode={setMode}
            query={query}
            setQuery={setQuery}
            equipmentType={equipmentType}
            setEquipmentType={setEquipmentType}
            vesselType={vesselType}
            setVesselType={setVesselType}
            systemCondition={systemCondition}
            setSystemCondition={setSystemCondition}
            onSearch={goSearch}
            accent={brandAccent}
            accentDark={brandAccentDark}
            storeBase={storeBase}
            quickLinks={quickLinks}
          />
        </SheetContent>
      </Sheet>
    </section>
  );
}
