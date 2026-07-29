'use client';

import Link from 'next/link';
import { ArrowRight, Truck, RefreshCw, Ruler, BadgeCheck } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { ProductCard } from '@/components/storefront/ProductCard';
import {
  getFootwearConfig,
  partitionFootwearProducts,
  resolveFootwearGenderTiles,
  resolveFootwearBrandGrid,
  resolveFootwearTrustPillars,
  resolveFootwearThreeUp,
  formatFootwearStoreName,
  FOOTWEAR_ACCENTS,
  FOOTWEAR_HERO_IMAGES,
} from '@/lib/storefront/footwearStorefront';

const TRUST_ICONS = {
  authentic: Truck,
  condition: RefreshCw,
  size: Ruler,
  returns: BadgeCheck,
};

/**
 * Foot Locker-shaped footwear homepage — screenshot sections only.
 * Order: Just for you → Energy → Rotation mosaic → 3-up → Feature split →
 * Trending → Category 4-up → Brand grid → Rewards → Trust.
 */
export function FootwearHomeSections({
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = FOOTWEAR_ACCENTS.accent,
  base,
  settings = {},
  storeName = '',
}) {
  const storeBase = base || `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const config = getFootwearConfig(settings, businessDomain);
  const ctx = { categories, businessDomain, products, businessCategory };
  const { topPicks, deals, newArrivals, trending, mosaicPool } = partitionFootwearProducts(products);
  const justForYou = (topPicks.length ? topPicks : newArrivals).slice(0, 12);
  const trendingRail = (trending.length ? trending : deals.length ? deals : newArrivals).slice(0, 10);
  const buyingBoxes = (mosaicPool.length ? mosaicPool : newArrivals).slice(0, 4);
  const categoryTiles = resolveFootwearGenderTiles(settings, storeBase, ctx).slice(0, 4);
  const brands = resolveFootwearBrandGrid(settings, storeBase, ctx);
  const threeUp = resolveFootwearThreeUp(settings, storeBase, ctx);
  const trustPillars = resolveFootwearTrustPillars(settings, businessDomain);
  const displayName = formatFootwearStoreName(storeName);
  const justTitle = config.featuredRailTitle || 'Just for you';
  const trendingTitle = config.trendingRailTitle || 'Trending now';

  return (
    <div className="bg-white" data-footwear-fl>
      {config.showJustForYou && justForYou.length > 0 ? (
        <StoreProductRail
          title={justTitle}
          subtitle={config.featuredRailSubtitle || `Picks from ${displayName}`}
          href={`${productsUrl}?sort=featured`}
          linkLabel="View all"
          products={justForYou}
          catalogPool={products}
          businessDomain={businessDomain}
          accentColor={accent}
          marquee
          marqueeDurationSec={42}
          cardVariant="dense"
          className="bg-white py-10 sm:py-12"
        />
      ) : null}

      {config.showEnergyBand ? (
        <section className="border-y border-zinc-800 bg-zinc-950" aria-label="Bring the energy">
          <div className="mx-auto grid max-w-[1400px] items-stretch lg:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {config.energyTitle || 'Bring the energy'}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-300 sm:text-base">
                {config.energySubtitle ||
                  'Make a stylish first impression with sneakers, clothing, and more that stand out.'}
              </p>
              <Link
                href={`${productsUrl}?sort=newest`}
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-950"
                style={{ backgroundColor: accent }}
              >
                Shop now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="relative min-h-[280px] lg:min-h-[420px]">
              <SmartProductImage
                src={FOOTWEAR_HERO_IMAGES.energy}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>
      ) : null}

      {config.showRotationMosaic ? (
        <section className="border-b border-zinc-100 bg-white py-10 sm:py-12" aria-label="Refresh the rotation">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-6 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                {config.rotationTitle || 'Refresh the rotation'}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 sm:text-base">
                {config.rotationSubtitle ||
                  'Get first-day-ready with Air Force energy, court classics, and more.'}
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr] lg:gap-4">
              <Link
                href={`${productsUrl}?sort=newest`}
                className="group relative min-h-[320px] overflow-hidden bg-zinc-100 lg:min-h-full"
              >
                <SmartProductImage
                  src={FOOTWEAR_HERO_IMAGES.lifestyle1}
                  alt=""
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <p className="text-lg font-semibold text-white">Shop court classics</p>
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {buyingBoxes.map((product) => (
                  <div key={product.id || product.sku} className="min-w-0">
                    <ProductCard
                      product={product}
                      businessDomain={businessDomain}
                      variant="dense"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {config.showThreeUp && threeUp.length > 0 ? (
        <section className="border-b border-zinc-100 bg-white py-10 sm:py-12" aria-label="Shop edits">
          <div className="mx-auto grid max-w-[1400px] gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:px-8">
            {threeUp.map((tile) => (
              <Link
                key={tile.id}
                href={tile.href}
                className="group relative aspect-[4/5] overflow-hidden bg-zinc-900 sm:aspect-[3/4]"
              >
                <SmartProductImage
                  src={tile.image}
                  alt={tile.title}
                  fill
                  className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <h3 className="text-xl font-semibold text-white sm:text-2xl">{tile.title}</h3>
                  {tile.subtitle ? (
                    <p className="mt-1 text-sm text-white/80">{tile.subtitle}</p>
                  ) : null}
                  <span className="mt-3 inline-flex border-b border-white pb-0.5 text-sm font-semibold text-white">
                    {tile.ctaLabel || 'Shop now'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {config.showFeatureSplit ? (
        <section className="border-b border-zinc-100" aria-label="Featured drop">
          <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
            <div className="relative min-h-[280px] bg-zinc-950 lg:min-h-[440px]">
              <SmartProductImage
                src={FOOTWEAR_HERO_IMAGES.lifestyle2}
                alt=""
                fill
                className="object-cover opacity-90"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 sm:p-10">
                <h2 className="max-w-md text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {config.featureSplitTitle || 'New Balance almost here'}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-white/85">
                  {config.featureSplitSubtitle ||
                    'Exclusive colorways on the floor. Shop the drop.'}
                </p>
                <Link
                  href={`${productsUrl}?brand=New%20Balance`}
                  className="mt-5 inline-flex w-fit rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-950"
                  style={{ backgroundColor: accent }}
                >
                  Shop New Balance
                </Link>
              </div>
            </div>
            <div className="relative min-h-[280px] lg:min-h-[440px]">
              <SmartProductImage
                src={FOOTWEAR_HERO_IMAGES.hero3}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>
      ) : null}

      {config.showTrendingRail && trendingRail.length > 0 ? (
        <StoreProductRail
          title={trendingTitle}
          subtitle={config.trendingRailSubtitle || 'Styles shoppers are adding this week'}
          href={`${productsUrl}?sort=newest`}
          linkLabel="Shop all"
          products={trendingRail}
          catalogPool={products}
          businessDomain={businessDomain}
          accentColor={accent}
          marquee
          marqueeDurationSec={40}
          marqueeReverse
          cardVariant="dense"
          minItems={5}
          maxItems={10}
          className="border-b border-zinc-100 bg-white py-10 sm:py-12"
        />
      ) : null}

      {config.showCategoryTiles && categoryTiles.length > 0 ? (
        <section className="border-b border-zinc-100 bg-white py-10 sm:py-12" aria-label="Shop categories">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {categoryTiles.map((tile) => (
                <Link
                  key={tile.id}
                  href={tile.href}
                  className="group relative aspect-[3/4] overflow-hidden bg-zinc-100"
                >
                  <SmartProductImage
                    src={tile.image}
                    alt={tile.label}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-lg font-semibold text-white">{tile.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {config.showBrandGrid && brands.length > 0 ? (
        <section className="border-b border-zinc-100 bg-white py-10 sm:py-12" aria-label="Shop our top brands">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Shop our top brands
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={brand.href}
                  className="group relative aspect-square overflow-hidden bg-zinc-100"
                >
                  <SmartProductImage
                    src={brand.image}
                    alt={brand.label}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
                    <p className="text-sm font-semibold text-white sm:text-base">{brand.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {config.showRewardsCta ? (
        <section className="relative min-h-[320px] overflow-hidden sm:min-h-[400px]" aria-label="Rewards">
          <SmartProductImage
            src={FOOTWEAR_HERO_IMAGES.rewards}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative mx-auto flex min-h-[320px] max-w-[1400px] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[400px] sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {config.rewardsTitle || 'Get more with member rewards'}
            </h2>
            <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">
              {config.rewardsSubtitle || 'Exclusive savings, early access, and size alerts.'}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`${storeBase}/contact`}
                className="inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-zinc-950"
                style={{ backgroundColor: accent }}
              >
                Join now
              </Link>
              <Link
                href={productsUrl}
                className="inline-flex rounded-full border-2 border-white px-6 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-zinc-950"
              >
                Shop the store
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {config.showTrustStrip && trustPillars.length > 0 ? (
        <section className="border-t border-zinc-200 bg-white py-8" aria-label="Store benefits">
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
            {trustPillars.map((pillar) => {
              const Icon = TRUST_ICONS[pillar.id] || BadgeCheck;
              return (
                <div key={pillar.id} className="flex flex-col items-start gap-2">
                  <Icon className="h-6 w-6 text-zinc-950" aria-hidden />
                  <p className="text-sm font-semibold text-zinc-950">{pillar.label}</p>
                  <p className="text-xs leading-snug text-zinc-500">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
