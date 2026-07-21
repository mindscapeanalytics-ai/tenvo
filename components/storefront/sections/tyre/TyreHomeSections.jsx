'use client';

import Link from 'next/link';
import { ArrowRight, CircleDot, Crosshair, Disc, Phone, Wrench } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  getTyreConfig,
  partitionTyreProducts,
  resolveTyreVehicleTiles,
  resolveTyreBrandWall,
  resolveTyreTrustPillars,
  resolveTyreServices,
  resolveTyreBayCtaImage,
  resolveTyreTestimonials,
  formatTyreStoreName,
  TYRE_ACCENTS,
  TYRE_SURFACE,
} from '@/lib/storefront/tyreStorefront';

const SERVICE_ICONS = {
  fit: Wrench,
  align: Crosshair,
  puncture: Disc,
  rims: CircleDot,
};

/**
 * Elevated tyre homepage — find → browse → shop → services → bay.
 */
export function TyreHomeSections({
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = TYRE_ACCENTS.accent,
  base,
  settings = {},
  storeName = '',
}) {
  const storeBase = base || `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const contactUrl = `${storeBase}/contact`;
  const config = getTyreConfig(settings, businessDomain);
  const ctx = { categories, businessDomain, products, businessCategory };
  const { topPicks, deals, alloy } = partitionTyreProducts(products);
  const vehicleTiles = resolveTyreVehicleTiles(settings, storeBase, ctx);
  const brands = resolveTyreBrandWall(settings, storeBase, ctx);
  const trustPillars = resolveTyreTrustPillars(settings, businessDomain);
  const services = resolveTyreServices(settings, storeBase, ctx);
  const bayCtaImage = resolveTyreBayCtaImage(settings, businessDomain);
  const testimonials = resolveTyreTestimonials(settings, businessDomain);
  const displayName = formatTyreStoreName(storeName);
  const featuredTitle = config.featuredRailTitle || 'Featured tyres';
  const featuredSubtitle =
    config.featuredRailSubtitle || `Bestsellers from ${displayName}`;
  const servicesProductsHref = `${productsUrl}?search=Fitting`;

  return (
    <>
      {trustPillars.length > 0 && (
        <section className="border-b border-zinc-200 bg-white py-6 sm:py-8">
          <div className="mx-auto grid max-w-[1400px] gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {trustPillars.map((pillar) => (
              <div key={pillar.id} className="motion-safe:transition-opacity">
                <p className="text-sm font-semibold text-zinc-900">{pillar.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {vehicleTiles.length > 0 && (
        <section className="py-10 sm:py-12" style={{ backgroundColor: TYRE_SURFACE }}>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className={STORE_SECTION_HEADING}>Shop by vehicle type</h2>
                <p className="mt-1 text-sm text-zinc-500">Passenger to agri ranges in one catalogue</p>
              </div>
              <Link
                href={productsUrl}
                className="hidden items-center gap-1 text-sm font-semibold sm:inline-flex"
                style={{ color: accent }}
              >
                View all
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {vehicleTiles.map((tile) => (
                <Link
                  key={tile.id}
                  href={tile.href}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-900"
                >
                  <SmartProductImage
                    src={tile.image}
                    alt=""
                    fill
                    className="object-cover motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                    fallbackSrc={tile.image}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-semibold text-white">{tile.label}</p>
                    {tile.desc ? <p className="mt-0.5 text-[11px] text-zinc-300">{tile.desc}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section className="bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className={STORE_SECTION_HEADING}>Shop by brand</h2>
              <p className="mt-1 text-sm text-zinc-500">Local manufacturers and imported touring lines</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={brand.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-center motion-safe:transition hover:border-zinc-200 hover:bg-white"
                >
                  <div className="relative h-14 w-full overflow-hidden rounded-lg bg-white">
                    <SmartProductImage
                      src={brand.image}
                      alt=""
                      fill
                      className="object-contain p-2"
                      fallbackSrc={brand.image}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-900">{brand.label}</span>
                  {brand.sourcing ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      {brand.sourcing}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {topPicks.length > 0 && (
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

      {deals.length > 0 && (
        <StoreProductRail
          title="Sale & offers"
          subtitle="Sized deals ready for fitting"
          href={`${productsUrl}?onSale=true`}
          linkLabel="View offers"
          products={deals}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-zinc-50"
        />
      )}

      {config.showAlloyRail && alloy.length > 0 && (
        <StoreProductRail
          title="Alloy & wheels"
          subtitle="Complete the look with rim sets"
          href={`${productsUrl}?category=alloy-rims`}
          linkLabel="Shop rims"
          products={alloy}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-white"
        />
      )}

      {(services.length > 0 || config.showBayCta) && (
        <section className="border-y border-zinc-100 bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            {services.length > 0 && (
              <>
                <div className="mb-7 flex items-end justify-between gap-4">
                  <div>
                    <h2 className={cn(STORE_SECTION_HEADING, 'text-zinc-900')}>Bay services</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Fitting, alignment, and repair when you need them
                    </p>
                  </div>
                  <Link
                    href={servicesProductsHref}
                    className="hidden items-center gap-1 text-sm font-semibold sm:inline-flex"
                    style={{ color: accent }}
                  >
                    View services
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {services.map((svc) => {
                    const Icon = SERVICE_ICONS[svc.id] || Wrench;
                    return (
                      <Link
                        key={svc.id}
                        href={svc.href}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm motion-safe:transition motion-safe:duration-300 hover:border-zinc-300 hover:shadow-md"
                      >
                        <div className="relative aspect-[5/4] overflow-hidden bg-zinc-100">
                          <SmartProductImage
                            src={svc.image}
                            alt=""
                            fill
                            className="object-cover motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                            fallbackSrc={svc.image}
                            placeholderLabel={svc.title}
                          />
                          <div
                            className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm"
                            aria-hidden
                          >
                            <Icon className="h-4 w-4" style={{ color: accent }} />
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <p className="text-sm font-semibold text-zinc-900 sm:text-base">{svc.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                            {svc.subtitle}
                          </p>
                          <span
                            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold sm:text-sm"
                            style={{ color: accent }}
                          >
                            {svc.ctaLabel || 'Learn more'}
                            <ArrowRight
                              className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {config.showBayCta && (
              <div
                className={cn(
                  'overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm',
                  services.length > 0 ? 'mt-8 sm:mt-10' : ''
                )}
              >
                <div className="grid lg:grid-cols-2">
                  <div className="relative order-1 min-h-[220px] lg:order-2 lg:min-h-full">
                    <SmartProductImage
                      src={bayCtaImage}
                      alt=""
                      fill
                      className="object-cover"
                      fallbackSrc={bayCtaImage}
                      placeholderLabel="Fitting bay"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent lg:bg-gradient-to-l"
                      aria-hidden
                    />
                  </div>
                  <div className="order-2 flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:order-1 lg:px-10">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: accent }}
                    >
                      Fitting bay
                    </p>
                    <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-zinc-900')}>
                      {config.bayCtaTitle || `Visit the ${displayName} fitting bay`}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
                      {config.bayCtaSubtitle ||
                        'Bring your size or vehicle details. We mount, balance, and align with care.'}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={contactUrl}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm motion-safe:transition hover:opacity-95"
                        style={{ backgroundColor: accent }}
                      >
                        <Phone className="h-4 w-4" aria-hidden />
                        {config.bayLabel}
                      </Link>
                      <Link
                        href={productsUrl}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 motion-safe:transition hover:border-zinc-400 hover:bg-zinc-50"
                      >
                        Shop tyres
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <h2 className={cn(STORE_SECTION_HEADING, 'mb-6')}>Drivers who trust our bay</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <blockquote key={t.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
                  <p className="text-sm leading-relaxed text-zinc-700">{t.quote}</p>
                  <footer className="mt-4 text-xs font-semibold text-zinc-900">
                    {t.author}
                    {t.product ? <span className="font-normal text-zinc-500"> · {t.product}</span> : null}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
