'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Mail,
  Truck,
  Ruler,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { resolveSpotlightBannerImage } from '@/lib/storefront/storefrontImagePlaceholders';
import { StoreProductRail } from '@/components/storefront/StoreProductRail';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { FurnitureVideoBackdrop } from '@/components/storefront/sections/furniture/FurnitureVideoBackdrop';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import {
  getFurnitureConfig,
  partitionFurnitureHomepageRails,
  filterFurnitureByCategorySlug,
  resolveFurnitureRoomCollections,
  resolveFurnitureCuratedTabs,
  resolveFurniturePromoMosaic,
  resolveFurnitureLifestyleSpotlight,
  resolveFurnitureBrandStories,
  resolveFurnitureTrustPillars,
  resolveFurnitureTestimonials,
  resolveFurnitureShowroomBanner,
  formatFurnitureStoreName,
  resolveFurnitureCategoryFallbackImage,
} from '@/lib/storefront/furnitureStorefront';
import { getFallbackProductImageUrl } from '@/lib/storefront/productImageFallback';

const TRUST_ICONS = {
  delivery: Truck,
  custom: Ruler,
  warranty: ShieldCheck,
  homes: Home,
};

function FurnitureBrandStoryBlock({ story, productsUrl, accent, reverse = false }) {
  if (!story) return null;
  const href = story.href
    ? story.href.startsWith('/store/') || story.href.startsWith('http')
      ? story.href
      : `${productsUrl}${story.href}`
    : productsUrl;

  return (
    <div
      className={cn(
        'group grid items-stretch overflow-hidden rounded-2xl border border-amber-100/80 bg-white shadow-sm lg:grid-cols-2',
        'motion-safe:transition motion-safe:hover:shadow-md'
      )}
    >
      <div
        className={cn(
          'relative min-h-[220px] sm:min-h-[280px] lg:min-h-[340px]',
          reverse && 'lg:order-2'
        )}
      >
        <SmartProductImage
          src={story.image}
          alt=""
          fill
          className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.02]"
          fallbackSrc={getFallbackProductImageUrl(
            { name: story.title || story.id || 'furniture', id: story.id || 'brand' },
            'furniture'
          )}
        />
      </div>
      <div
        className={cn(
          'flex flex-col justify-center bg-[#faf7f2] px-6 py-8 sm:px-8 sm:py-10 lg:px-10',
          reverse && 'lg:order-1'
        )}
      >
        {story.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">{story.eyebrow}</p>
        ) : null}
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          {story.title}
        </h3>
        {story.subtitle ? (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
            {story.subtitle}
          </p>
        ) : null}
        <Link
          href={href}
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          style={{ backgroundColor: accent }}
        >
          {story.ctaLabel || 'Shop now'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/**
 * Woodin elevated furniture homepage — curated brand → browse → shop → trust → visit.
 */
export function FurnitureHomeSections({
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = '#78350f',
  base,
  settings = {},
  storeName = '',
  businessDescription = '',
  coverImage = '',
}) {
  const storeBase = base || `/store/${businessDomain}`;
  const productsUrl = `${storeBase}/products`;
  const config = getFurnitureConfig(settings, businessDomain);
  const ctx = { categories, businessDomain, products, businessCategory };
  const { topPicks, deals } = partitionFurnitureHomepageRails(products);
  const roomCollections = resolveFurnitureRoomCollections(settings, storeBase, ctx);
  const promoMosaic = resolveFurniturePromoMosaic(settings, products, businessDomain, businessCategory);
  const spotlight = resolveFurnitureLifestyleSpotlight(
    settings,
    products,
    businessDomain,
    businessCategory
  );
  const brandStories = resolveFurnitureBrandStories(
    settings,
    products,
    businessDomain,
    businessCategory,
    { storeName }
  );
  const trustPillars = resolveFurnitureTrustPillars(settings, businessDomain);
  const curatedTabs = resolveFurnitureCuratedTabs(settings, categories);
  const testimonials = resolveFurnitureTestimonials(settings, businessDomain);
  const showroomBanner = resolveFurnitureShowroomBanner(settings, {
    businessDomain,
    storeName,
    coverImage,
    products,
  });
  const displayName = formatFurnitureStoreName(storeName);
  const featuredTitle = config.featuredRailTitle || 'Our top picks';
  const featuredSubtitle =
    config.featuredRailSubtitle || `Best-selling pieces from ${displayName}`;
  const roomEssentialsTitle = config.roomEssentialsTitle || 'Room essentials';
  const roomEssentialsSubtitle =
    config.roomEssentialsSubtitle ||
    `Curated pieces for every space at ${displayName}`;
  const [brandIntro, brandOutro] = brandStories;
  const [activeTab, setActiveTab] = useState(curatedTabs[0]?.id || 'all');
  const activeTabDef = curatedTabs.find((t) => t.id === activeTab) || curatedTabs[0];
  const curatedProducts = activeTabDef
    ? filterFurnitureByCategorySlug(products, activeTabDef.slug).slice(0, 8)
    : [];
  const tabLabel = String(activeTabDef?.label || '').trim();
  const viewAllLabel = !tabLabel
    ? 'View all furniture'
    : /^all(\s|$)/i.test(tabLabel)
      ? `View ${tabLabel.toLowerCase()}`
      : `View all ${tabLabel.toLowerCase()}`;

  return (
    <>
      {/* Trust strip */}
      {config.showTrustStrip && trustPillars.length > 0 && (
        <section className="border-b border-amber-50 bg-white py-5 sm:py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {trustPillars.map((pillar) => {
                const Icon = TRUST_ICONS[pillar.id] || Home;
                return (
                  <li key={pillar.id} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-900"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900">{pillar.label}</p>
                      {pillar.desc ? (
                        <p className="mt-0.5 text-xs leading-snug text-stone-500">{pillar.desc}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Shop by room */}
      {config.showRoomTiles && roomCollections.length > 0 && (
        <section className="bg-[#faf7f2] py-8 sm:py-12">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <h2 className={cn(STORE_SECTION_HEADING, 'text-stone-900')}>Shop by room</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {businessDescription?.trim()
                    ? 'Collections shaped for how you live'
                    : 'Browse furniture by space and collection'}
                </p>
              </div>
              <Link
                href={productsUrl}
                className="shrink-0 text-sm font-semibold text-amber-800 hover:text-amber-950"
              >
                View all
              </Link>
            </div>
            <div
              className={cn(
                'grid gap-3 sm:gap-4',
                roomCollections.length >= 6
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                  : roomCollections.length === 5
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                    : roomCollections.length === 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-3'
              )}
            >
              {roomCollections.map((room) => {
                const curatedFb = resolveFurnitureCategoryFallbackImage(room);
                const roomFallback =
                  curatedFb && curatedFb !== room.image
                    ? curatedFb
                    : getFallbackProductImageUrl(
                        { name: room.label || room.id || 'furniture', id: room.id || 'room' },
                        'furniture'
                      );
                return (
                  <Link
                    key={room.id}
                    href={room.href}
                    className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 shadow-sm transition motion-safe:hover:shadow-lg"
                  >
                    <SmartProductImage
                      src={room.image}
                      alt={room.label || ''}
                      fill
                      className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
                      fallbackSrc={roomFallback}
                      placeholderLabel={room.label}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <p className="text-sm font-semibold text-white sm:text-base">{room.label}</p>
                      {room.desc ? (
                        <p className="mt-0.5 text-[11px] text-white/75 sm:text-xs">{room.desc}</p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured picks */}
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

      {/* Lifestyle spotlight (single) */}
      {config.showLifestyleSpotlight && spotlight && (
        <section className="border-y border-amber-50 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 shadow-md">
                <SmartProductImage
                  src={spotlight.image}
                  alt=""
                  fill
                  className="object-cover transition duration-700 motion-safe:hover:scale-[1.02]"
                  fallbackSrc={getFallbackProductImageUrl(
                    { name: spotlight.title || spotlight.id || 'furniture', id: spotlight.id || 'spotlight' },
                    'furniture'
                  )}
                />
              </div>
              <div className="max-w-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
                {spotlight.eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                    {spotlight.eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  {spotlight.title}
                </h2>
                {spotlight.subtitle ? (
                  <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                    {spotlight.subtitle}
                  </p>
                ) : null}
                <Link
                  href={`${productsUrl}${spotlight.href || ''}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                  style={{ backgroundColor: accent }}
                >
                  Shop collection
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sale & offers */}
      {deals.length > 0 && (
        <StoreProductRail
          title="Sale & offers"
          subtitle="Limited-time savings on selected pieces"
          href={`${productsUrl}?onSale=true`}
          products={deals}
          catalogPool={products}
          businessDomain={businessDomain}
          className="bg-amber-50/40"
        />
      )}

      {/* Collection mosaic (max 2) */}
      {promoMosaic.length > 0 && (
        <section className="bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-5">
              <h2 className={cn(STORE_SECTION_HEADING, 'text-stone-900')}>Featured collections</h2>
              <p className="mt-1 text-sm text-stone-500">Spaces worth settling into</p>
            </div>
            <div
              className={cn(
                'grid gap-4',
                promoMosaic.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'
              )}
            >
              {promoMosaic.map((banner, bannerIndex) => {
                const isWalnut = banner.tone === 'walnut';
                const imageSrc = resolveSpotlightBannerImage(banner, businessCategory, bannerIndex);
                return (
                  <Link
                    key={banner.id}
                    href={`${productsUrl}${banner.href}`}
                    className={cn(
                      'group relative flex min-h-[168px] items-end overflow-hidden rounded-2xl border p-5 shadow-sm transition motion-safe:hover:shadow-md sm:min-h-[220px] sm:p-6',
                      isWalnut ? 'border-amber-900/20 bg-stone-950' : 'border-amber-100 bg-neutral-900'
                    )}
                  >
                    <SmartProductImage
                      src={imageSrc}
                      alt=""
                      fill
                      className="object-cover transition duration-500 motion-safe:group-hover:scale-[1.03]"
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
                      <h3
                        className={cn(
                          'text-lg font-semibold sm:text-xl',
                          isWalnut ? 'text-white' : 'text-stone-900'
                        )}
                      >
                        {banner.title}
                      </h3>
                      <p
                        className={cn(
                          'mt-1 text-sm leading-snug',
                          isWalnut ? 'text-amber-50/90' : 'text-stone-600'
                        )}
                      >
                        {banner.subtitle}
                      </p>
                      <span
                        className={cn(
                          'mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-[gap] motion-safe:group-hover:gap-2',
                          isWalnut ? 'text-amber-100' : 'text-amber-800'
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

      {/* Room essentials (curated tabs + brand stories) */}
      {curatedTabs.length > 0 && (
        <section className="border-y border-amber-50 bg-white py-8 sm:py-12">
          <div className="mx-auto max-w-[1400px] space-y-8 px-4 sm:px-6 sm:space-y-10 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <h2 className={cn(STORE_SECTION_HEADING, 'text-stone-900')}>{roomEssentialsTitle}</h2>
                <p className="mt-1 text-sm text-stone-500 sm:text-base">{roomEssentialsSubtitle}</p>
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
                        : 'border border-stone-200 bg-[#faf7f2] text-stone-700 hover:border-amber-200 hover:bg-amber-50'
                    )}
                    style={activeTab === tab.id ? { backgroundColor: accent } : undefined}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {config.showBrandStories && brandIntro ? (
              <FurnitureBrandStoryBlock
                story={brandIntro}
                productsUrl={productsUrl}
                accent={accent}
                reverse={false}
              />
            ) : null}

            {curatedProducts.length > 0 ? (
              <ProductGrid
                products={curatedProducts}
                catalogPool={products}
                businessDomain={businessDomain}
                showResultsCount={false}
                density="showcase"
                layout={curatedProducts.length < 6 ? 'rail' : 'grid'}
              />
            ) : (
              <p className="py-8 text-center text-sm text-stone-500">
                No pieces in this room yet. Explore the full catalog.
              </p>
            )}

            {config.showBrandStories && brandOutro ? (
              <FurnitureBrandStoryBlock
                story={brandOutro}
                productsUrl={productsUrl}
                accent={accent}
                reverse
              />
            ) : null}

            <div className="text-center">
              <Link
                href={
                  activeTabDef?.slug
                    ? `${productsUrl}?category=${encodeURIComponent(activeTabDef.slug)}`
                    : productsUrl
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-950"
              >
                {viewAllLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Showroom CTA — same width + rounded corners as Room essentials */}
      {config.showShowroomCta && showroomBanner ? (
        <section className="bg-white py-8 sm:py-12">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="relative h-[min(70vh,600px)] min-h-[320px] w-full overflow-hidden rounded-2xl bg-stone-950 shadow-sm sm:min-h-[420px]">
              <SmartProductImage
                src={showroomBanner.image}
                alt=""
                fill
                className="object-cover"
                fallbackSrc={getFallbackProductImageUrl(
                  { name: showroomBanner.title || 'showroom', id: 'furniture-showroom' },
                  'furniture'
                )}
                priority={false}
              />
              {showroomBanner.videoUrl ? (
                <FurnitureVideoBackdrop
                  videoUrl={showroomBanner.videoUrl}
                  poster={showroomBanner.image}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div
                className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/55 to-stone-900/25"
                aria-hidden
              />
              <div className="absolute inset-0 bg-black/20" aria-hidden />
              <div className="relative z-10 flex h-full flex-col justify-end px-5 py-8 sm:px-8 sm:py-12 lg:justify-center lg:px-12 lg:py-14">
                <div className="max-w-xl">
                  {showroomBanner.eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                      {showroomBanner.eyebrow}
                    </p>
                  ) : null}
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    {showroomBanner.title}
                  </h2>
                  {showroomBanner.subtitle ? (
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                      {showroomBanner.subtitle}
                    </p>
                  ) : null}
                  <Link
                    href={`${storeBase}/contact`}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-50"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                    {showroomBanner.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Testimonials */}
      {config.showTestimonials && testimonials.length > 0 && (
        <section className="border-t border-amber-50 bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <h2 className={cn(STORE_SECTION_HEADING, 'mb-6 text-center text-stone-900 sm:mb-8')}>
              What our customers say
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((item) => (
                <blockquote
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-amber-100/80 bg-[#faf7f2] p-5 shadow-sm transition motion-safe:hover:shadow-md"
                >
                  <p className="flex-1 text-sm leading-relaxed text-stone-600">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <footer className="mt-4 border-t border-amber-100/80 pt-3">
                    <p className="text-xs font-semibold text-stone-900">{item.product}</p>
                    <p className="text-[11px] text-stone-400">{item.author}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-t border-amber-100 bg-[#faf7f2] py-10 sm:py-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <Mail className="mx-auto h-8 w-8 text-amber-800" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold text-stone-900 sm:text-2xl">
              Subscribe to our offers
            </h2>
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
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 sm:max-w-xs"
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
