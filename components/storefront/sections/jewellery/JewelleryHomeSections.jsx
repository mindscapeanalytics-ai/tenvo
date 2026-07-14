'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopCollectionsCarousel } from '@/components/storefront/sections/TopCollectionsCarousel';
import { TopPicksSection } from '@/components/storefront/sections/TopPicksSection';
import { JewelleryCategoryCircles } from './JewelleryCategoryCircles';
import { JewellerySignaturePieces } from './JewellerySignaturePieces';
import { JewelleryTrustStrip } from './JewelleryTrustStrip';
import { NewArrivalsRail } from '@/components/storefront/sections/fashion/NewArrivalsRail';
import { StoreReveal } from '@/components/storefront/effects/StoreReveal';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  getJewelleryStorefrontConfig,
  formatJewelleryStoreName,
  resolveJewelleryTrustPillars,
  resolveJewelleryBrands,
  resolveJewellerySeoBlocks,
} from '@/lib/storefront/jewelleryStorefront';

function JewellerySeoBlock({ storeName, businessDescription, country, settings, businessDomain }) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain);
  if (!config.showSeoBlock) return null;
  const blocks = resolveJewellerySeoBlocks(storeName, businessDescription, country);
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="border-t border-stone-200 bg-stone-50/80 py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <h2 className={cn(STORE_SECTION_HEADING, 'mb-6 text-stone-900')}>{blocks[0]?.title}</h2>
        <div className={cn('space-y-6', !expanded && 'max-h-[280px] overflow-hidden relative')}>
          {blocks.map((block) => (
            <div key={block.id}>
              {block.id !== 'about' && (
                <h3 className="text-base font-semibold text-stone-900 sm:text-lg">{block.title}</h3>
              )}
              <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">{block.body}</p>
            </div>
          ))}
          {!expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50/95 to-transparent" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-sm font-semibold text-stone-700 hover:text-stone-900"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      </div>
    </section>
  );
}

/**
 * Jewelry homepage sections with 2026 design principles — immersive visuals,
 * certification trust, premium micro-interactions, and luxury storytelling.
 */
export function JewelleryHomeSections({
  businessDomain,
  businessCategory,
  settings = {},
  products = [],
  accent = '#c9a227',
  accentDark,
  storeName = '',
  businessDescription = '',
  country = '',
  topCollections = [],
  topCollectionsTitle = 'Featured Collections',
  jewelleryDepartments = null,
  categories = [],
}) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain);
  const storeBase = `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const catalogPool = products.length
    ? products
    : jewelleryDepartments?.offers?.catalogPool
      || jewelleryDepartments?.newArrivals?.catalogPool
      || [];
  const displayName = formatJewelleryStoreName(storeName);
  const signatureTitle = config.signaturePiecesTitle;
  const signatureSubtitle = config.signaturePiecesSubtitle || `Handcrafted excellence from ${displayName}`;
  const trustPillars = config.showTrustStrip
    ? resolveJewelleryTrustPillars(settings, businessDomain)
    : [];
  const brands = config.showBrandsRow
    ? resolveJewelleryBrands(settings, catalogPool, businessDomain)
    : [];

  return (
    <>
      {config.showTrustStrip && trustPillars.length > 0 && (
        <StoreReveal enabled={config.animations}>
          <JewelleryTrustStrip pillars={trustPillars} accent={accent} />
        </StoreReveal>
      )}

      {config.showCollections && topCollections.length > 0 && (
        <StoreReveal enabled={config.animations}>
          <TopCollectionsCarousel
            title={topCollectionsTitle}
            items={topCollections}
            autoScroll={config.animations !== false}
          />
        </StoreReveal>
      )}

      {config.showSignaturePieces && jewelleryDepartments?.signaturePieces?.show && (
        <StoreReveal enabled={config.animations}>
          <JewellerySignaturePieces
            products={jewelleryDepartments.signaturePieces.products}
            businessDomain={businessDomain}
            businessCategory={businessCategory}
            accent={accent}
            title={signatureTitle}
            subtitle={signatureSubtitle}
            viewAllHref={jewelleryDepartments.signaturePieces.viewAllHref}
            animations={config.animations}
          />
        </StoreReveal>
      )}

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

      {config.showBrandsRow && brands.length > 0 && (
        <StoreReveal enabled={config.animations}>
          <section className="border-y border-stone-200 bg-white py-5 sm:py-6">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Heritage Jewelers
                  </p>
                  <h2 className={cn(STORE_SECTION_HEADING, 'mt-1 text-base text-stone-900 sm:text-lg')}>
                    Shop by brand
                  </h2>
                </div>
                <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex flex-nowrap items-center gap-2 pb-0.5 sm:justify-end">
                    {brands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`${productsUrl}?search=${encodeURIComponent(brand.name)}`}
                        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition hover:scale-105 sm:px-3.5 sm:py-2 sm:text-[13px]"
                        style={{
                          borderColor: `${accent}30`,
                          backgroundColor: `${accent}05`,
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

      <JewellerySeoBlock
        storeName={storeName}
        businessDescription={businessDescription}
        country={country}
        settings={settings}
        businessDomain={businessDomain}
      />
    </>
  );
}
