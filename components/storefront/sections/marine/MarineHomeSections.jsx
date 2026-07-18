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
  MARINE_ABOUT_IMAGE,
  MARINE_SERVICE_IMAGE,
} from '@/lib/storefront/marineParts';
import { buildMarineProductsUrl } from '@/lib/storefront/marinePartsFinder';

/**
 * Tenvo Marine elevated homepage — industrial KPIs, expertise pillars, equipment grid, insights.
 */
export function MarineHomeSections({
  businessDomain,
  products = [],
  accent = '#002d54',
  base,
  settings = {},
  storeName = '',
}) {
  const storeBase = base || `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const config = getMarinePartsStorefrontConfig(settings);
  const displayName = formatMarineStoreName(storeName);
  const { featured, spareParts, thrusters, seals } = partitionMarinePartsCatalog(products);
  const railProducts = featured.length ? featured : products.slice(0, 12);
  const spareRail = spareParts.length ? spareParts : products.filter((p) => {
    const c = String(p?.domain_data?.systemcondition || '').toLowerCase();
    return c === 'spare' || String(p?.category || '').toLowerCase().includes('spare');
  }).slice(0, 8);

  return (
    <>
      {config.showKpis && (
        <section className="border-b border-neutral-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
            <div className="lg:col-span-4">
              <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>
                Enabling cleaner, more reliable operations at sea
              </h2>
              <p className="mt-3 text-sm text-neutral-600">
                {displayName} helps fleets source propulsion systems and spare parts with accurate OEM fitment and practical lead times.
              </p>
              <Link
                href={`${storeBase}/about`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: accent }}
              >
                About us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-8">
              {config.trustStats.map((stat) => (
                <div key={stat.label} className="border-l border-neutral-200 pl-4">
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.showExpertise && (
        <section className="bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8 max-w-2xl">
              <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>
                New systems, used units, parts, and repair
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                One catalogue for procurement, yard retrofit, and emergency spare coverage.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MARINE_EXPERTISE_CARDS.map((card) => (
                <Link
                  key={card.id}
                  href={`${productsUrl}${card.hrefSuffix}`}
                  className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    <SmartProductImage
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-neutral-900">{card.title}</h3>
                    <p className="mt-1 text-sm text-neutral-500">{card.subtitle}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: accent }}>
                      Explore
                      <ArrowRight className="h-3.5 w-3.5" />
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
                <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>Shop by equipment</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Propulsion families operators request most often.
                </p>
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
                    className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 transition-colors hover:border-neutral-300 hover:bg-white"
                  >
                    <div className="relative aspect-square bg-white p-3">
                      <SmartProductImage
                        src={item.image}
                        alt={item.label}
                        fill
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
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

      {config.showFeaturedRails && railProducts.length > 0 && (
        <StoreProductRail
          title="Featured systems & parts"
          subtitle={`Highlighted catalogue from ${displayName}`}
          href={`${productsUrl}?sort=featured`}
          linkLabel="View catalogue"
          products={railProducts.slice(0, 12)}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-neutral-50"
        />
      )}

      {config.showFeaturedRails && (thrusters.length > 0 || seals.length > 0 || spareRail.length > 0) && (
        <StoreProductRail
          title="Spare parts & seals"
          subtitle="Kits and components for dry-dock and in-service maintenance"
          href={buildMarineProductsUrl(productsUrl, { category: 'Spare Parts' })}
          linkLabel="Browse spares"
          products={(spareRail.length ? spareRail : [...seals, ...thrusters]).slice(0, 12)}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-white"
        />
      )}

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 lg:aspect-[5/4]">
            <SmartProductImage
              src={MARINE_ABOUT_IMAGE}
              alt="Marine propulsion specialist"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Stay ahead</p>
            <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-neutral-900')}>
              Decide smarter on propulsion stock
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Match OEM numbers, interchange codes, and equipment type before you commit. Whether you need a complete thruster or a seal kit for the next docking, keep critical A-items available without overstocking C-class consumables.
            </p>
            <Link
              href={productsUrl}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              Start browsing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {config.showInsights && (
        <section className="border-y border-neutral-100 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8">
              <h2 className={cn(STORE_SECTION_HEADING, 'text-neutral-900')}>Insights in focus</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Practical notes for fleet engineers and procurement teams.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {config.insights.map((item) => (
                <Link
                  key={item.id}
                  href={`${storeBase}${item.hrefSuffix || '/contact'}`}
                  className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    {item.tag}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-neutral-900">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-neutral-500">{item.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: accent }}>
                    Read more
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.showBottomCta && (
        <section className="relative overflow-hidden bg-[#001a33] text-white">
          <div className="absolute inset-0 opacity-40" aria-hidden>
            <SmartProductImage
              src={MARINE_SERVICE_IMAGE}
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#001a33] via-[#001a33]/90 to-[#001a33]/70" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {config.ctaTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/75 sm:text-base">{config.ctaSubtitle}</p>
            <Link
              href={`${storeBase}/contact`}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500"
            >
              {config.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
