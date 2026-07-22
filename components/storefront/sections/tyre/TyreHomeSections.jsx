'use client';

import Link from 'next/link';
import { ArrowRight, CircleDot, Crosshair, Disc, Phone, Wrench } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { TyreExploreSection } from '@/components/storefront/sections/tyre/TyreExploreSection';
import { TyreBrandStoryBlock } from '@/components/storefront/sections/tyre/TyreBrandStoryBlock';
import { StoreMarqueeRow } from '@/components/storefront/sections/shared/StoreMarqueeRow';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import { getFallbackProductImageUrl } from '@/lib/storefront/productImageFallback';
import {
  STORE_PRODUCT_RAIL_TRACK_CLASS,
  STORE_PRODUCT_RAIL_ITEM_CLASS,
} from '@/lib/utils/storefrontProductRail';
import {
  getTyreConfig,
  partitionTyreProducts,
  resolveTyreVehicleTiles,
  resolveTyreBrandWall,
  resolveTyreTrustPillars,
  resolveTyreServices,
  resolveTyreBayCtaImage,
  resolveTyreTestimonials,
  resolveTyreExploreSegments,
  resolveTyreExplorePresentation,
  resolveTyreLifestyleSpotlight,
  resolveTyreBrandStories,
  resolveTyreOemPartners,
  resolveTyreCareTips,
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
 * Elevated tyre homepage — brands under hero → trust → explore → catalogue → bay.
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
  const exploreSegments = resolveTyreExploreSegments(settings, storeBase, ctx);
  const explorePresentation = resolveTyreExplorePresentation(settings, businessDomain);
  const midBanner = resolveTyreLifestyleSpotlight(
    settings,
    products,
    businessDomain,
    businessCategory
  );
  const brandStories = resolveTyreBrandStories(
    settings,
    products,
    businessDomain,
    businessCategory,
    { storeName }
  );
  const oemPartners = resolveTyreOemPartners(settings, businessDomain);
  const careTips = resolveTyreCareTips(settings, businessDomain);
  const displayName = formatTyreStoreName(storeName);
  const brandStory = brandStories[0] || null;
  const featuredTitle = config.featuredRailTitle || 'Featured tyres';
  const featuredSubtitle =
    config.featuredRailSubtitle || `Bestsellers from ${displayName}`;
  const servicesProductsHref = `${productsUrl}?search=Fitting`;

  return (
    <>
      {config.showBrandWall && brands.length > 0 && (
        <section
          className="border-b border-zinc-100 bg-white py-4 sm:py-5"
          aria-label="Shop by brand"
        >
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <StoreMarqueeRow
              items={brands}
              reverse
              durationSec={42}
              fadeFrom="white"
              slideClassName="w-[118px] sm:w-[132px]"
              gapClassName="gap-2.5 pr-2.5 sm:gap-3 sm:pr-3"
              renderItem={(brand) => (
                <Link
                  href={brand.href}
                  className="group flex h-full flex-col items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-center motion-safe:transition hover:border-zinc-200 hover:bg-white"
                >
                  <div className="relative h-12 w-full overflow-hidden rounded-lg bg-white sm:h-14">
                    <SmartProductImage
                      src={brand.image}
                      alt={brand.label || ''}
                      fill
                      className="object-contain object-center p-1.5"
                      fallbackSrc={brand.image}
                      placeholderLabel={brand.label}
                    />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-zinc-900 sm:text-xs">
                    {brand.label}
                  </span>
                  {brand.sourcing ? (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                      {brand.sourcing}
                    </span>
                  ) : null}
                </Link>
              )}
            />
          </div>
        </section>
      )}

      {config.showTrustStrip && trustPillars.length > 0 && (
        <section className="border-b border-zinc-200 bg-white py-7 sm:py-9">
          <div className="mx-auto grid max-w-[1400px] gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8">
            {trustPillars.map((pillar) => (
              <div key={pillar.id}>
                <p className="text-sm font-semibold text-zinc-900">{pillar.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {config.showOemPartners && oemPartners.length > 0 && (
        <section
          className="border-b border-zinc-100 bg-[#fafafa] py-10 sm:py-12"
          aria-label="OEM partners"
        >
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: accent }}
              >
                Official fitment partners
              </p>
              <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-zinc-900')}>
                Trusted by leading OEMs
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-500">
                Sized and stocked for the vehicles Pakistan drives every day.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
              {oemPartners.map((partner) => (
                <li key={partner.id}>
                  <div
                    className={cn(
                      'group flex h-[88px] items-center justify-center rounded-2xl border border-zinc-200/80 bg-white px-5',
                      'shadow-[0_1px_2px_rgba(15,23,42,0.04)] motion-safe:transition',
                      'hover:border-zinc-300 hover:shadow-sm'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={partner.image}
                      alt={partner.label}
                      className="h-9 w-auto max-w-[140px] object-contain opacity-80 grayscale motion-safe:transition group-hover:opacity-100 group-hover:grayscale-0 sm:h-10"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {config.showExploreSection && exploreSegments.length > 0 && (
        <TyreExploreSection
          segments={exploreSegments}
          products={products}
          businessDomain={businessDomain}
          accent={accent}
          title={explorePresentation.title}
          subtitle={explorePresentation.subtitle}
        />
      )}

      {!config.showExploreSection && config.showVehicleTiles && vehicleTiles.length > 0 && (
        <section className="py-12 sm:py-16" style={{ backgroundColor: TYRE_SURFACE }}>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-4">
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
            <div className={STORE_PRODUCT_RAIL_TRACK_CLASS}>
              {vehicleTiles.map((tile) => (
                <Link
                  key={tile.id}
                  href={tile.href}
                  className={cn(
                    STORE_PRODUCT_RAIL_ITEM_CLASS,
                    'group relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm motion-safe:transition hover:shadow-md'
                  )}
                >
                  <SmartProductImage
                    src={tile.image}
                    alt={tile.label || ''}
                    fill
                    className="object-contain p-4 motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                    fallbackSrc={tile.image}
                    placeholderLabel={tile.label}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent p-3 pt-12">
                    <p className="text-sm font-semibold text-zinc-900">{tile.label}</p>
                    {tile.desc ? <p className="mt-0.5 text-[11px] text-zinc-500">{tile.desc}</p> : null}
                  </div>
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
          accentColor={accent}
          autoScroll
          className="bg-white"
        />
      )}

      {config.showSafetyBand && (
        <section className="border-y border-zinc-100 bg-zinc-50/80 py-12 sm:py-16">
          <div className="mx-auto grid max-w-[1400px] gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: accent }}
              >
                Technology &amp; assurance
              </p>
              <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-zinc-900')}>
                Your safety, our assurance
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                Local manufacturing expertise with imported touring lines, bay-ready fitting, and
                warranty-backed stock sized for Pakistani roads.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'Fresh DOT-dated inventory',
                'Load and speed ratings verified',
                'Mount, balance, and align on site',
                'Local + imported ranges in one bay',
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Single mid-page company banner — tall, image + copy */}
      {config.showLifestyleSpotlight && midBanner && (
        <section className="bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-2">
              <div className="relative isolate flex min-h-[280px] items-center justify-center bg-zinc-50 sm:min-h-[360px] lg:min-h-[440px]">
                <SmartProductImage
                  src={midBanner.image}
                  alt={midBanner.title || ''}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-center p-5 sm:p-8 lg:p-10"
                  fallbackSrc={getFallbackProductImageUrl(
                    { name: midBanner.title || midBanner.id || 'tyre', id: midBanner.id || 'mid' },
                    'tyre-shop'
                  )}
                  placeholderLabel={midBanner.title}
                />
              </div>
              <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
                {midBanner.eyebrow ? (
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: accent }}
                  >
                    {midBanner.eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
                  {midBanner.title}
                </h2>
                {midBanner.subtitle ? (
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base">
                    {midBanner.subtitle}
                  </p>
                ) : null}
                <Link
                  href={`${productsUrl}${midBanner.href || ''}`}
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm motion-safe:transition hover:opacity-95"
                  style={{ backgroundColor: accent }}
                >
                  Shop range
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
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
          accentColor={accent}
          autoScroll
          className="bg-zinc-50"
        />
      )}

      {config.showBrandStories && brandStory && (
        <section className="bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <TyreBrandStoryBlock story={brandStory} productsUrl={productsUrl} accent={accent} />
          </div>
        </section>
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
          accentColor={accent}
          autoScroll
          className="bg-white"
        />
      )}

      {(config.showServices && services.length > 0) || config.showBayCta ? (
        <section className="border-y border-zinc-100 bg-zinc-50/60 py-12 sm:py-16">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            {config.showServices && services.length > 0 && (
              <>
                <div className="mb-8 flex items-end justify-between gap-4">
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
                        className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm motion-safe:transition hover:border-zinc-300 hover:shadow-md"
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
                  'overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm',
                  config.showServices && services.length > 0 ? 'mt-10 sm:mt-12' : ''
                )}
              >
                <div className="grid lg:grid-cols-2">
                  <div className="relative order-1 isolate min-h-[260px] bg-zinc-50 sm:min-h-[320px] lg:order-2 lg:min-h-[380px]">
                    <SmartProductImage
                      src={bayCtaImage}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain object-center p-3 sm:p-5 lg:p-6"
                      fallbackSrc={bayCtaImage}
                      placeholderLabel="Fitting bay"
                    />
                  </div>
                  <div className="order-2 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:order-1 lg:px-12">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: accent }}
                    >
                      Fitting bay
                    </p>
                    <h2 className={cn(STORE_SECTION_HEADING, 'mt-3 text-zinc-900')}>
                      {config.bayCtaTitle || `Visit the ${displayName} fitting bay`}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base">
                      {config.bayCtaSubtitle ||
                        'Bring your size or vehicle details. We mount, balance, and align with care.'}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href={contactUrl}
                        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm motion-safe:transition hover:opacity-95"
                        style={{ backgroundColor: accent }}
                      >
                        <Phone className="h-4 w-4" aria-hidden />
                        {config.bayLabel}
                      </Link>
                      <Link
                        href={productsUrl}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 motion-safe:transition hover:border-zinc-400 hover:bg-zinc-50"
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
      ) : null}

      {config.showCareTips && careTips.length > 0 && (
        <section className="border-y border-zinc-100 bg-zinc-50/70 py-12 sm:py-14">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-7 max-w-2xl">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: accent }}
              >
                Tyre care
              </p>
              <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-zinc-900')}>Drive safer, longer</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Quick tips from the bay so your set lasts and performs.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {careTips.map((tip) => (
                <article
                  key={tip.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-zinc-900">{tip.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:text-sm">{tip.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <h2 className={cn(STORE_SECTION_HEADING, 'mb-7')}>Drivers who trust our bay</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <blockquote key={t.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
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
