'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Star, Truck, RefreshCw, CreditCard, MapPin, Phone } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import { resolveStoreContact } from '@/lib/storefront/businessContact';
import {
  getElectronicsConfig,
  partitionElectronicsProducts,
  resolveElectronicsCategoryTiles,
  resolveElectronicsBrandWall,
  resolveElectronicsTrustPillars,
  formatElectronicsStoreName,
  resolveElectronicsCategoryFallbackImage,
} from '@/lib/storefront/electronicsStorefront';

const TRUST_ICONS = {
  shield: ShieldCheck,
  star: Star,
  truck: Truck,
  refresh: RefreshCw,
};

/**
 * Elevated electronics homepage — appliances, gadgets, installment enquiry.
 */
export function ElectronicsHomeSections({
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = '#2563eb',
  base,
  settings = {},
  storeName = '',
  business = null,
}) {
  const storeBase = base || `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const contactUrl = `${storeBase}/contact?subject=installment`;
  const visitContactUrl = `${storeBase}/contact`;
  const config = getElectronicsConfig(settings, businessDomain);
  const ctx = { categories, businessDomain, products, businessCategory };
  const { topPicks, deals, gadgets, appliances } = partitionElectronicsProducts(products);
  const categoryTiles = config.showCategoryTiles
    ? resolveElectronicsCategoryTiles(settings, storeBase, ctx)
    : [];
  const brandWall = config.showBrandWall ? resolveElectronicsBrandWall(settings, storeBase, ctx) : [];
  const trustPillars = config.showTrustStrip
    ? resolveElectronicsTrustPillars(settings, businessDomain)
    : [];
  const displayName = formatElectronicsStoreName(storeName);
  const featuredTitle = config.featuredRailTitle || 'Top picks';
  const featuredSubtitle =
    config.featuredRailSubtitle || `Featured appliances and gadgets from ${displayName}`;
  const contact = resolveStoreContact({ business, settings });
  const phoneHref = contact.phone ? `tel:${String(contact.phone).replace(/\s+/g, '')}` : null;
  const locationLine = contact.fullAddress || contact.city || config.defaultLocation;

  return (
    <>
      {trustPillars.length > 0 && (
        <section className="border-b border-slate-100 bg-white py-6 sm:py-8">
          <div className="mx-auto grid max-w-[1400px] gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {trustPillars.map((pillar) => {
              const Icon = TRUST_ICONS[pillar.icon] || ShieldCheck;
              return (
                <div key={pillar.id || pillar.title} className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: accent }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{pillar.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{pillar.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {categoryTiles.length > 0 && (
        <section className="bg-slate-50 py-8 sm:py-10">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className={STORE_SECTION_HEADING}>Shop by category</h2>
                <p className="mt-1 text-sm text-slate-600">Appliances and gadgets for every home</p>
              </div>
              <Link
                href={productsUrl}
                className="hidden items-center gap-1 text-sm font-semibold sm:inline-flex"
                style={{ color: accent }}
              >
                View all <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categoryTiles.map((tile) => (
                <Link
                  key={tile.id || tile.label}
                  href={tile.href}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white motion-safe:transition motion-safe:hover:border-slate-200"
                >
                  <div className="relative aspect-square bg-slate-100">
                    <SmartProductImage
                      src={tile.image}
                      alt=""
                      fill
                      className="object-cover motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
                      fallbackSrc={resolveElectronicsCategoryFallbackImage(tile, businessCategory)}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-900">{tile.label}</p>
                    {tile.description ? (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{tile.description}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {brandWall.length > 0 && (
        <section className="border-y border-slate-100 bg-white py-6 sm:py-8">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <h2 className={cn(STORE_SECTION_HEADING, 'mb-4')}>Shop by brand</h2>
            <div className="flex flex-wrap gap-2">
              {brandWall.map((brand) => (
                <Link
                  key={brand.id || brand.label}
                  href={brand.href}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 motion-safe:transition hover:border-slate-300 hover:bg-white"
                >
                  {brand.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.showFeaturedRail && topPicks.length > 0 && (
        <StoreProductRail
          title={featuredTitle}
          subtitle={featuredSubtitle}
          href={`${productsUrl}?sort=featured`}
          linkLabel="View all"
          products={topPicks}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-white"
        />
      )}

      {config.showDealsRail && deals.length > 0 && (
        <StoreProductRail
          title={config.dealsRailTitle || 'Deals & offers'}
          subtitle="Limited-time savings on appliances and gadgets"
          href={`${productsUrl}?onSale=true`}
          linkLabel="Shop deals"
          products={deals}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-slate-50"
        />
      )}

      {config.showGadgetsRail && gadgets.length > 0 && (
        <StoreProductRail
          title={config.gadgetsRailTitle || 'Gadgets & wearables'}
          subtitle="Smart watches, speakers, and everyday tech"
          href={`${productsUrl}?category=gadgets-wearables`}
          linkLabel="Shop gadgets"
          products={gadgets}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-white"
        />
      )}

      {config.showAppliancesRail && appliances.length > 0 && (
        <StoreProductRail
          title={config.appliancesRailTitle || 'Home appliances'}
          subtitle="Air conditioners and household essentials"
          href={`${productsUrl}?category=air-conditioners`}
          linkLabel="Shop appliances"
          products={appliances}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-slate-50"
        />
      )}

      {config.showInstallmentCta && (
        <section className="bg-[#0a0a0a] py-10 sm:py-14">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                Flexible buying
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                {config.installmentTitle || 'Ask about installment plans'}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {config.installmentSubtitle ||
                  'Send an enquiry and our team will guide you. No online loan approval.'}
              </p>
            </div>
            <Link
              href={contactUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white motion-safe:transition hover:opacity-95"
              style={{ backgroundColor: accent }}
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {config.installmentLabel || 'Installment enquiry'}
            </Link>
          </div>
        </section>
      )}

      {config.showVisitCta && (
        <section className="border-t border-slate-100 bg-white py-10 sm:py-12">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                In-store experience
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                {config.visitTitle || `Visit ${displayName}`}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {config.visitSubtitle ||
                  'See appliances in person and talk to our team about warranty and delivery.'}
              </p>
              {locationLine ? (
                <p className="mt-3 inline-flex items-start gap-2 text-sm text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span>{locationLine}</span>
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 motion-safe:transition hover:bg-slate-50"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Call store
                </a>
              ) : null}
              <Link
                href={visitContactUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white motion-safe:transition hover:opacity-95"
                style={{ backgroundColor: accent }}
              >
                <MapPin className="h-4 w-4" aria-hidden />
                Contact & directions
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
