'use client';

import Link from 'next/link';
import { TopCollectionsCarousel } from '@/components/storefront/sections/TopCollectionsCarousel';
import { JewelleryCategoryCircles } from './JewelleryCategoryCircles';
import { JewellerySignaturePieces } from './JewellerySignaturePieces';
import { JewelleryTrustStrip } from './JewelleryTrustStrip';
import { JewelleryEditSection } from './JewelleryEditSection';
import { JewelleryProductsCarousel } from './JewelleryProductsCarousel';
import { NewArrivalsRail } from '@/components/storefront/sections/fashion/NewArrivalsRail';
import { StoreReveal } from '@/components/storefront/effects/StoreReveal';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  getJewelleryStorefrontConfig,
  formatJewelleryStoreName,
  resolveJewelleryTrustPillars,
  resolveJewelleryBrands,
} from '@/lib/storefront/jewelleryStorefront';

/**
 * Jewelry / Beauty homepage sections — clean, no duplicates, well structured.
 *
 * Render order:
 *  1.  Collections carousel     (curated sets)
 *  2.  Category Circles         (shop by style)
 *  3.  Signature Pieces         (featured high-value grid)
 *  4.  The Jewellery Edit       (editorial mosaic)
 *  5.  Offers rail              (sale / promotions)
 *  6.  New Arrivals rail        (latest pieces)
 *  7.  Products carousel        (optional featured strip)
 *  ── pre-footer ──────────────
 *  7a. Brands row
 *  7b. Trust strip  (4 compact pillars)
 *  7c. CTAs         (View collection · Book consultation)
 *  ── footer ──────────────────
 *
 * Notes:
 *  - Section toggles and copy resolve via settings.storefront.jewellery.*
 *  - jewelleryElevatedHero sets skipHomeNavSections=true in page.jsx so no
 *    generic retail sections appear below this component.
 */
export function JewelleryHomeSections({
  businessDomain,
  businessCategory,
  settings = {},
  products = [],
  accent = '#c9a227',
  accentDark,
  storeName = '',
  storeCurrency = 'PKR',
  topCollections = [],
  topCollectionsTitle = 'Featured Collections',
  jewelleryDepartments = null,
}) {
  const config      = getJewelleryStorefrontConfig(settings, businessDomain, businessCategory);
  const storeBase   = `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;

  const catalogPool = products.length
    ? products
    : jewelleryDepartments?.offers?.catalogPool
    || jewelleryDepartments?.newArrivals?.catalogPool
    || [];

  const displayName       = formatJewelleryStoreName(storeName);
  const signatureTitle    = config.signaturePiecesTitle;
  const signatureSubtitle = config.signaturePiecesSubtitle
    || `Handcrafted excellence from ${displayName}`;

  const trustPillars = config.showTrustStrip
    ? resolveJewelleryTrustPillars(settings, businessDomain, businessCategory)
    : [];

  const brands = config.showBrandsRow
    ? resolveJewelleryBrands(settings, catalogPool, businessDomain, businessCategory)
    : [];

  /* Brand section label — from settings */
  const brandLabel = config.brandsLabel;

  return (
    <>
      {/* ── 1. Collections carousel ─────────────────────────────────────── */}
      {config.showCollections && topCollections.length > 0 && (
        <StoreReveal enabled={config.animations}>
          <TopCollectionsCarousel
            title={topCollectionsTitle}
            items={topCollections}
            autoScroll={config.animations !== false}
          />
        </StoreReveal>
      )}

      {/* ── 2. Category Circles (shop by style) ─────────────────────────── */}
      {config.showCategories && jewelleryDepartments?.categories?.show && (
        <StoreReveal enabled={config.animations}>
          <JewelleryCategoryCircles
            title={jewelleryDepartments.categories.title}
            circles={jewelleryDepartments.categories.circles}
            viewAllHref={jewelleryDepartments.categories.viewAllHref}
            accent={accent}
            animations={config.animations}
          />
        </StoreReveal>
      )}

      {/* ── 3. Signature Pieces ──────────────────────────────────────────── */}
      {config.showSignaturePieces && jewelleryDepartments?.signaturePieces?.show && (
        <StoreReveal enabled={config.animations}>
          <JewellerySignaturePieces
            products={jewelleryDepartments.signaturePieces.products}
            businessDomain={businessDomain}
            businessCategory={businessCategory}
            accent={accent}
            currency={storeCurrency}
            title={signatureTitle}
            subtitle={signatureSubtitle}
            viewAllHref={jewelleryDepartments.signaturePieces.viewAllHref}
            animations={config.animations}
          />
        </StoreReveal>
      )}

      {/* ── 4. The Jewellery Edit mosaic ─────────────────────────────────── */}
      {config.showJewelleryEdit && jewelleryDepartments?.jewelleryEdit?.show && (
        <StoreReveal enabled={config.animations}>
          <JewelleryEditSection
            title={jewelleryDepartments.jewelleryEdit.title}
            subtitle={jewelleryDepartments.jewelleryEdit.subtitle}
            viewAllHref={jewelleryDepartments.jewelleryEdit.viewAllHref}
            tiles={jewelleryDepartments.jewelleryEdit.tiles || []}
            businessDomain={businessDomain}
            accent={accent}
            animations={config.animations}
          />
        </StoreReveal>
      )}

      {/* ── 5. Offers rail ───────────────────────────────────────────────── */}
      {config.showOffers && jewelleryDepartments?.offers?.show && (
        <StoreReveal enabled={config.animations}>
          <NewArrivalsRail
            title={jewelleryDepartments.offers.title}
            products={jewelleryDepartments.offers.products}
            catalogPool={jewelleryDepartments.offers.catalogPool}
            viewAllHref={jewelleryDepartments.offers.viewAllHref}
            businessDomain={businessDomain}
            businessCategory={businessCategory}
            variant="offers"
            autoScroll
            accent={accent}
            animations={config.animations}
          />
        </StoreReveal>
      )}

      {/* ── 6. New Arrivals rail ─────────────────────────────────────────── */}
      {config.showNewArrivals && jewelleryDepartments?.newArrivals?.show && (
        <StoreReveal enabled={config.animations}>
          <NewArrivalsRail
            title={jewelleryDepartments.newArrivals.title}
            products={jewelleryDepartments.newArrivals.products}
            catalogPool={jewelleryDepartments.newArrivals.catalogPool}
            viewAllHref={jewelleryDepartments.newArrivals.viewAllHref}
            businessDomain={businessDomain}
            businessCategory={businessCategory}
            variant="new"
            autoScroll={false}
            accent={accent}
            animations={config.animations}
          />
        </StoreReveal>
      )}

      {/* ── 7. Featured products carousel (optional) ─────────────────────── */}
      {config.showProductsCarousel && jewelleryDepartments?.productsCarousel?.show && (
        <StoreReveal enabled={config.animations}>
          <JewelleryProductsCarousel
            title={jewelleryDepartments.productsCarousel.title}
            subtitle={jewelleryDepartments.productsCarousel.subtitle}
            products={jewelleryDepartments.productsCarousel.products}
            businessDomain={businessDomain}
            businessCategory={businessCategory}
            currency={storeCurrency}
            accent={accent}
            autoScroll={config.animations !== false}
            scrollSpeed={jewelleryDepartments.productsCarousel.scrollSpeed}
          />
        </StoreReveal>
      )}

      {/* ── PRE-FOOTER BLOCK ─────────────────────────────────────────────── */}

      {/* 7a. Brands row — hidden on mobile, desktop only */}
      {config.showBrandsRow && brands.length > 0 && (
        <StoreReveal enabled={config.animations}>
          <section className="hidden border-t border-stone-200 bg-white py-5 sm:block sm:py-6">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">

                <div className="shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                    {brandLabel}
                  </p>
                  <h2 className={cn(STORE_SECTION_HEADING, 'mt-0.5 text-base text-stone-900 sm:text-lg')}>
                    Shop by brand
                  </h2>
                </div>

                <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex flex-nowrap items-center gap-2 pb-0.5 sm:justify-end">
                    {brands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`${productsUrl}?search=${encodeURIComponent(brand.name)}`}
                        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 hover:shadow-sm sm:px-3.5 sm:py-2 sm:text-[13px]"
                        style={{
                          borderColor: `${accent}35`,
                          backgroundColor: `${accent}06`,
                          color: accentDark || accent,
                        }}
                      >
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>
        </StoreReveal>
      )}

      {/* 7b. Trust strip — compact 4-pillar horizontal */}
      {config.showTrustStrip && trustPillars.length > 0 && (
        <StoreReveal enabled={config.animations}>
          <JewelleryTrustStrip pillars={trustPillars} accent={accent} compact />
        </StoreReveal>
      )}

      {/* 7c. CTAs — View collection · Book consultation */}
      <StoreReveal enabled={config.animations}>
        <section className="border-t border-stone-100 bg-gradient-to-b from-stone-50/50 to-white py-8 sm:py-10">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

            <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
              {config.footerEyebrow}
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">

              <Link
                href={`${storeBase}/products`}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full px-9 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 shadow-md transition-all hover:scale-[1.03] hover:shadow-xl sm:w-auto"
                style={{ backgroundColor: accent }}
              >
                <svg
                  className="h-[17px] w-[17px]"
                  fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2.5}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {config.collectionCtaLabel}
              </Link>

              <Link
                href={`${storeBase}/contact`}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border-2 bg-white px-9 py-3.5 text-sm font-semibold uppercase tracking-wider shadow-sm transition-all hover:scale-[1.03] hover:shadow-md sm:w-auto"
                style={{ borderColor: `${accent}55`, color: accent }}
              >
                {config.consultationCtaLabel}
                <svg
                  className="h-[17px] w-[17px] transition-transform group-hover:translate-x-0.5"
                  fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2.5}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

            </div>
          </div>
        </section>
      </StoreReveal>
    </>
  );
}
