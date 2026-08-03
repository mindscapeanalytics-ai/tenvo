'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  getMarinePartsStorefrontConfig,
  partitionMarinePartsCatalog,
  formatMarineStoreName,
  MARINE_EXPERTISE_CARDS,
  MARINE_EQUIPMENT_CATEGORIES,
} from '@/lib/storefront/marineParts';
import { buildMarineProductsUrl } from '@/lib/storefront/marinePartsFinder';
import { StoreConnectionCtaBanner } from '@/components/storefront/StoreConnectionCtaBanner';
import { getAboutStorefrontConfig } from '@/lib/storefront/aboutStorefront';
import { MarineSectorOverview } from '@/components/storefront/sections/marine/MarineSectorOverview';

function storeHref(storeBase, href) {
  if (!href) return storeBase;
  if (href.startsWith('http')) return href;
  const path = href.startsWith('/') ? href : `/${href}`;
  if (path.startsWith('/store/')) return path;
  return `${storeBase}${path}`;
}

/**
 * Tenvo Marine elevated homepage — industrial KPIs, expertise pillars, equipment grid, insights.
 * Section visibility and copy come from `settings.storefront.marine`.
 */
export function MarineHomeSections({
  businessDomain,
  products = [],
  accent = '#002d54',
  base,
  settings = {},
  storeName = '',
  business = null,
}) {
  const storeBase = base || `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const config = getMarinePartsStorefrontConfig(settings);
  const displayName = formatMarineStoreName(storeName);
  const { featured, spareParts, thrusters, seals } = partitionMarinePartsCatalog(products);
  const railProducts = featured.length ? featured : products.slice(0, 12);
  const spareRail = spareParts.length
    ? spareParts
    : products
        .filter((p) => {
          const c = String(p?.domain_data?.systemcondition || '').toLowerCase();
          return c === 'spare' || String(p?.category || '').toLowerCase().includes('spare');
        })
        .slice(0, 8);
  const kpiSubtitle =
    config.kpiSubtitle ||
    `${displayName} helps fleets source propulsion systems and spare parts with accurate OEM fitment and practical lead times.`;
  const stayAheadBody =
    config.stayAheadSubtitle ||
    'Are you stocking the propulsion parts that keep your fleet competitive tomorrow? Match OEM numbers and equipment type before you commit.';

  return (
    <>
      {config.showKpis && (
        <section className="border-b border-neutral-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-16">
            <div className="lg:col-span-4">
              <div className="mb-3 h-1 w-12 rounded-full bg-teal-600" />
              <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>{config.kpiTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{kpiSubtitle}</p>
              <Link
                href={
                  getAboutStorefrontConfig(settings, { category: 'marine-parts' }).enabled
                    ? `${storeBase}/about`
                    : `${storeBase}/contact`
                }
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: accent }}
              >
                About us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-8">
              {config.trustStats.map((stat) => (
                <div key={`${stat.value}-${stat.label}`} className="border-l-2 border-teal-600/30 pl-4">
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 lg:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-neutral-500 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.showSectorOverview && config.sectorCards?.length > 0 ? (
        <MarineSectorOverview
          storeBase={storeBase}
          accent={accent}
          eyebrow={config.sectorEyebrow}
          title={config.sectorTitle}
          layout={config.sectorLayout}
          cards={config.sectorCards}
        />
      ) : null}

      {config.showExpertise && (
        <section className="bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8 max-w-2xl">
              <div className="mb-3 h-1 w-12 rounded-full bg-teal-600" />
              <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>{config.expertiseTitle}</h2>
              <p className="mt-2 text-sm text-neutral-600">{config.expertiseSubtitle}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MARINE_EXPERTISE_CARDS.map((card) => (
                <Link
                  key={card.id}
                  href={`${productsUrl}${card.hrefSuffix}`}
                  className="group overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    <SmartProductImage
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      placeholderLabel={card.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-60" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-neutral-900">{card.title}</h3>
                    <p className="mt-1 text-sm text-neutral-500">{card.subtitle}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: accent }}>
                      Explore
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.showEquipmentGrid && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <div className="mb-3 h-1 w-12 rounded-full bg-teal-600" />
                <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>{config.equipmentTitle}</h2>
                <p className="mt-2 text-sm text-neutral-600">{config.equipmentSubtitle}</p>
              </div>
              <Link href={productsUrl} className="hidden text-sm font-semibold sm:inline-flex" style={{ color: accent }}>
                View all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {MARINE_EQUIPMENT_CATEGORIES.map((item) => {
                const href = item.hrefSuffix
                  ? `${productsUrl}${item.hrefSuffix}`
                  : buildMarineProductsUrl(productsUrl, { equipmentType: item.equipmentType });
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/80 transition-colors hover:border-teal-700/30 hover:bg-white"
                  >
                    <div className="relative aspect-square bg-white p-3">
                      <SmartProductImage
                        src={item.image}
                        alt={item.label}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        placeholderLabel={item.label}
                      />
                    </div>
                    <div className="border-t border-neutral-100 px-3 py-3">
                      <p className="text-xs font-semibold leading-snug text-neutral-800 sm:text-sm">
                        {item.label}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {config.showBrandChips && config.brandChips?.length > 0 && (
        <section className="border-y border-neutral-100 bg-neutral-50/80">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-5 sm:px-6 lg:gap-3 lg:px-8">
            <p className="mr-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              OEM focus
            </p>
            {config.brandChips.map((chip) => (
              <Link
                key={chip.id}
                href={storeHref(storeBase, chip.href)}
                className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-teal-600/40 hover:text-teal-800"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {config.showFeaturedRails && railProducts.length > 0 && (
        <StoreProductRail
          title={config.featuredRailTitle}
          subtitle={`Highlighted catalogue from ${displayName}`}
          href={`${productsUrl}?sort=featured`}
          linkLabel="View catalogue"
          products={railProducts.slice(0, 12)}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-neutral-50"
        />
      )}

      {config.showSpareRail && (spareRail.length > 0 || thrusters.length > 0 || seals.length > 0) && (
        <StoreProductRail
          title={config.spareRailTitle}
          subtitle="Kits and components for dry-dock and in-service maintenance"
          href={buildMarineProductsUrl(productsUrl, { category: 'spare-parts' })}
          linkLabel="Browse spares"
          products={(spareRail.length ? spareRail : [...seals, ...thrusters]).slice(0, 12)}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-white"
        />
      )}

      {config.showStayAhead && (
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-sm ring-1 ring-neutral-200/60 lg:aspect-[5/4]">
              <SmartProductImage
                src={config.stayAheadImageUrl}
                fallbackSrc={config.stayAheadFallbackUrl}
                alt={config.stayAheadTitle || 'Marine propulsion specialist'}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                placeholderLabel="Marine"
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/15 to-transparent"
                aria-hidden
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Stay ahead</p>
              <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-neutral-900')}>
                {config.stayAheadTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{stayAheadBody}</p>
              <Link
                href={productsUrl}
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                {config.stayAheadCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {config.showInsights && (
        <section className="border-y border-neutral-100 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8">
              <div className="mb-3 h-1 w-12 rounded-full bg-teal-600" />
              <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>{config.insightsTitle}</h2>
              <p className="mt-2 text-sm text-neutral-600">{config.insightsSubtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {config.insights.map((item) => (
                <Link
                  key={item.id}
                  href={storeHref(storeBase, item.hrefSuffix || '/contact')}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] bg-neutral-100">
                    <SmartProductImage
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      placeholderLabel={item.tag}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      {item.tag}
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-neutral-500">{item.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: accent }}>
                      Read more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.showBottomCta && (
        <StoreConnectionCtaBanner
          business={business || { category: 'marine-parts', business_name: storeName }}
          settings={settings}
          businessDomain={businessDomain}
          storeBase={storeBase}
          title={config.ctaTitle}
          subtitle={config.ctaSubtitle}
          imageUrl={config.ctaImageUrl}
          accent="#0d9488"
          force
        />
      )}
    </>
  );
}
