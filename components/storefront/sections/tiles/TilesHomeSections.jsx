'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Mail } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { resolveSpotlightBannerImage } from '@/lib/storefront/storefrontImagePlaceholders';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { TilesCategoryIcons } from '@/components/storefront/sections/tiles/TilesCategoryIcons';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  getTilesConfig,
  partitionTilesProducts,
  filterTilesByCategorySlug,
  resolveTilesCategoryIcons,
  resolveTilesRoomCollections,
  resolveTilesCuratedTabs,
  resolveTilesPromoBanners,
  resolveTilesEditorialBanners,
  resolveTilesTestimonials,
  formatTilesStoreName,
  resolveTilesCategoryFallbackImage,
} from '@/lib/storefront/tilesStorefront';

/**
 * Elevated tiles & marble homepage — STILE-inspired spaces + natural stone collections.
 */
export function TilesHomeSections({
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = '#1c1917',
  base,
  settings = {},
  storeName = '',
  businessDescription = '',
}) {
  const storeBase = base || `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const config = getTilesConfig(settings, businessDomain);
  const ctx = { categories, businessDomain, products, businessCategory };
  const { topPicks, deals, newArrivals } = partitionTilesProducts(products);
  const categoryIcons = resolveTilesCategoryIcons(settings, storeBase, ctx);
  const roomCollections = resolveTilesRoomCollections(settings, storeBase, ctx);
  const promoBanners = resolveTilesPromoBanners(settings, products, businessDomain, businessCategory);
  const editorialBanners = resolveTilesEditorialBanners(settings, products, businessDomain, businessCategory);
  const curatedTabs = resolveTilesCuratedTabs(settings, categories);
  const testimonials = resolveTilesTestimonials(settings, businessDomain);
  const displayName = formatTilesStoreName(storeName);
  const featuredTitle = config.featuredRailTitle || 'Our top picks';
  const featuredSubtitle =
    config.featuredRailSubtitle || `Featured surfaces from ${displayName}`;

  const [activeTab, setActiveTab] = useState(curatedTabs[0]?.id || 'floor');
  const activeTabDef = curatedTabs.find((t) => t.id === activeTab) || curatedTabs[0];
  const curatedProducts = activeTabDef
    ? filterTilesByCategorySlug(products, activeTabDef.slug).slice(0, 8)
    : [];

  const marbleProducts = filterTilesByCategorySlug(products, 'marble').slice(0, 8);
  const wallProducts = filterTilesByCategorySlug(products, 'wall-tiles').slice(0, 8);

  return (
    <>
      <TilesCategoryIcons categoryIcons={categoryIcons} />

      {/* Top picks */}
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

      {/* Promo split banners */}
      {promoBanners.length > 0 && (
      <section className="bg-[#f5f5f4] py-8 sm:py-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {promoBanners.map((banner, bannerIndex) => {
              const isWalnut = banner.tone === 'walnut';
              const imageSrc = resolveSpotlightBannerImage(banner, businessCategory, bannerIndex);
              return (
                <Link
                  key={banner.id}
                  href={`${productsUrl}${banner.href}`}
                  className={cn(
                    'group relative flex min-h-[148px] items-end overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:shadow-md sm:min-h-[188px] sm:p-6',
                    isWalnut ? 'border-stone-900/20 bg-stone-950' : 'border-stone-100 bg-neutral-900'
                  )}
                >
                  <SmartProductImage
                    src={imageSrc}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    fallbackSrc={resolveSpotlightBannerImage(banner, businessCategory, bannerIndex + 1)}
                  />
                  <div
                    className={cn(
                      'absolute inset-0',
                      isWalnut
                        ? 'bg-gradient-to-t from-stone-950/92 via-stone-900/55 to-stone-800/18'
                        : 'bg-gradient-to-t from-white/95 via-white/82 to-white/35'
                    )}
                    aria-hidden
                  />
                  <div className="relative z-10 max-w-[85%]">
                    <h3 className={cn('text-lg font-semibold sm:text-xl', isWalnut ? 'text-white' : 'text-stone-900')}>
                      {banner.title}
                    </h3>
                    <p className={cn('mt-1 text-sm leading-snug', isWalnut ? 'text-stone-50/90' : 'text-stone-600')}>
                      {banner.subtitle}
                    </p>
                    <span
                      className={cn(
                        'mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-[gap] group-hover:gap-2',
                        isWalnut ? 'text-stone-100' : 'text-stone-800'
                      )}
                    >
                      Shop now <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Shop by room */}
      {config.showRoomTiles && roomCollections.length > 0 && (
        <section className="border-y border-stone-50 bg-white py-8 sm:py-12">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className={cn(STORE_SECTION_HEADING, 'text-stone-900')}>Explore by space</h2>
                <p className="mt-1 text-sm text-stone-500">Shop tiles and stone for every room</p>
              </div>
              <Link href={productsUrl} className="text-sm font-semibold text-stone-800 hover:text-stone-950">
                View all
              </Link>
            </div>
            <div
              className={cn(
                'grid gap-3',
                roomCollections.length >= 6
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                  : roomCollections.length === 5
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                    : roomCollections.length === 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-3'
              )}
            >
              {roomCollections.map((room) => (
                <Link
                  key={room.id}
                  href={room.href}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 shadow-sm transition hover:shadow-lg"
                >
                  <SmartProductImage
                    src={room.image}
                    alt={room.label || ''}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fallbackSrc={resolveTilesCategoryFallbackImage(room)}
                    placeholderLabel={room.label}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <p className="text-sm font-semibold text-white sm:text-base">{room.label}</p>
                    {room.desc ? (
                      <p className="mt-0.5 text-[11px] text-white/75 sm:text-xs">{room.desc}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Deals rail */}
      {deals.length > 0 && (
        <StoreProductRail
          title="Sale & offers"
          subtitle="Limited-time savings on selected surfaces"
          href={`${productsUrl}?onSale=true`}
          products={deals}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-stone-50/40"
        />
      )}

      {editorialBanners.length > 0 && (
      <section className="space-y-0 bg-white">
        {editorialBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              'border-b border-stone-50',
              index % 2 === 1 ? 'bg-[#f5f5f4]' : 'bg-white'
            )}
          >
            <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              <div
                className={cn(
                  'grid items-center gap-8 lg:grid-cols-2 lg:gap-12',
                  index % 2 === 1 && 'lg:[&>*:first-child]:order-2'
                )}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 shadow-md">
                  <SmartProductImage src={banner.image} alt="" fill className="object-cover" />
                </div>
                <div className="max-w-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-800">{banner.eyebrow}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                    {banner.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">{banner.subtitle}</p>
                  <Link
                    href={`${productsUrl}${banner.href}`}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                    style={{ backgroundColor: accent }}
                  >
                    Shop now
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
      )}

      {/* Marble rail */}
      {marbleProducts.length >= 2 && (
        <StoreProductRail
          title="Marble & natural stone"
          subtitle="Slabs and tiles for counters, floors, and feature walls"
          href={`${productsUrl}?category=${encodeURIComponent('marble')}`}
          products={marbleProducts}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-white"
        />
      )}

      {/* Wall tiles rail */}
      {wallProducts.length >= 2 && (
        <StoreProductRail
          title="Wall tiles"
          subtitle="Bathroom, kitchen, and decorative wall collections"
          href={`${productsUrl}?category=${encodeURIComponent('wall-tiles')}`}
          products={wallProducts}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-[#f5f5f4]"
        />
      )}

      {/* Curated tabs */}
      <section className="border-y border-stone-50 bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={cn(STORE_SECTION_HEADING, 'text-stone-900')}>Curated for you</h2>
              <p className="mt-1 text-sm text-stone-500">Browse by room essentials</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {curatedTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm',
                    activeTab === tab.id
                      ? 'text-white shadow-sm'
                      : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-200 hover:bg-stone-50'
                  )}
                  style={activeTab === tab.id ? { backgroundColor: accent } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {curatedProducts.length > 0 ? (
            <ProductGrid
              products={curatedProducts}
              catalogPool={products}
              businessDomain={businessDomain}
              showResultsCount={false}
              density="showcase"
              layout={curatedProducts.length < 6 ? 'rail' : 'grid'}
            />
          ) : null}
          <div className="mt-6 text-center">
            <Link
              href={`${productsUrl}?category=${encodeURIComponent(activeTabDef?.slug || '')}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-stone-800 hover:text-stone-950"
            >
              View all {activeTabDef?.label?.toLowerCase()}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <StoreProductRail
          title="Latest arrivals"
          subtitle="Fresh designs just landed"
          href={`${productsUrl}?sort=newest`}
          products={newArrivals}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-white"
        />
      )}

      {/* Testimonials */}
      {config.showTestimonials && testimonials.length > 0 && (
        <section className="border-t border-stone-50 bg-[#f5f5f4] py-10 sm:py-14">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <h2 className={cn(STORE_SECTION_HEADING, 'mb-6 text-center text-stone-900 sm:mb-8')}>
              What our customers say
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((item) => (
                <blockquote
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-stone-100/80 bg-white p-5 shadow-sm"
                >
                  <p className="flex-1 text-sm leading-relaxed text-stone-600">&ldquo;{item.quote}&rdquo;</p>
                  <footer className="mt-4 border-t border-stone-50 pt-3">
                    <p className="text-xs font-semibold text-stone-900">{item.product}</p>
                    <p className="text-[11px] text-stone-400">{item.author}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Showroom CTA */}
      {config.showShowroomCta && (
        <section className="bg-stone-900 py-12 sm:py-16">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-300">Experience in person</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  Visit a {displayName} emporium near you
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-stone-300 sm:text-base">
                  Compare finishes, match shades, and plan your project with our showroom team. Walk-ins welcome during store hours.
                </p>
              </div>
              <Link
                href={`${storeBase}/contact`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
              >
                <MapPin className="h-4 w-4" aria-hidden />
                Emporium locations
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-t border-stone-100 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <Mail className="mx-auto h-8 w-8 text-stone-800" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold text-stone-900 sm:text-2xl">Subscribe to our offers</h2>
            <p className="mt-2 text-sm text-stone-500">
              Be first to know about new collections, exclusive deals, and styling tips.
            </p>
            <form
              className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `${storeBase}/contact?newsletter=1`;
              }}
            >
              <input
                type="email"
                required
                placeholder="Your email"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 sm:max-w-xs"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                style={{ backgroundColor: accent }}
              >
                Sign up
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
