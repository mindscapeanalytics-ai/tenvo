/**
 * Demo supermarket storefront seed — metadata from archive references
 * (supper-store.html / supper-store-reference.html).
 */
import {
  SUPERMARKET_DEFAULT_HERO_SLIDES,
  SUPERMARKET_DEFAULT_BRANDS,
  SUPERMARKET_DEFAULT_SECTION_TITLES,
  SUPERMARKET_DEFAULT_SUB_NAV,
  SUPERMARKET_DELIVERY_NOTICE,
  SUPERMARKET_FOOTER_TRUST,
  SUPERMARKET_HOME_RAILS,
  SUPERMARKET_HOME_TRUST_PILLARS,
  SUPERMARKET_MID_PROMO_TILES,
  SUPERMARKET_POPULAR_CATEGORIES,
  SUPERMARKET_PROMO_STRIP,
  SUPERMARKET_PROMO_TILES,
  SUPERMARKET_SIDEBAR_DEPARTMENTS,
  SUPERMARKET_UPPER_PROMO_TILES,
} from '../storefront/supermarketCatalogDefaults.js';

/** Shared branding + storefront metadata for grocery / FMCG / supermarket-family stores. */
export function getSupermarketFamilyProfileExtras() {
  return {
    accentColor: '#f97316',
    cover_image_url: SUPERMARKET_DEFAULT_HERO_SLIDES[0]?.image || null,
    storefront: buildSupermarketDemoStorefrontBlock(),
  };
}

/** Full `storefront` block for demo-supermarket bootstrap / refresh. */
export function buildSupermarketDemoStorefrontBlock() {
  return {
    heroSlides: SUPERMARKET_DEFAULT_HERO_SLIDES.map((slide) => ({ ...slide })),
    supermarket: {
      showAisleCarousel: true,
      showUpperPromoTiles: true,
      showBrandsRow: true,
      showMidPromoTiles: true,
      showPromoBanners: true,
      showHomeRails: true,
      showTrustStrip: true,
      showFooterTrustStrip: true,
      showDeliveryBanner: true,
      showWeeklyEssentials: true,
      deliveryNotice: SUPERMARKET_DELIVERY_NOTICE,
      promoStripLabel: SUPERMARKET_PROMO_STRIP.label,
      promoStripHref: SUPERMARKET_PROMO_STRIP.href,
      searchPlaceholder: 'Search groceries, brands, aisles…',
      sectionTitles: { ...SUPERMARKET_DEFAULT_SECTION_TITLES },
      categoryIcons: SUPERMARKET_POPULAR_CATEGORIES.map((item) => ({ ...item })),
      brands: SUPERMARKET_DEFAULT_BRANDS.map((item) => ({ ...item })),
      upperPromoTiles: SUPERMARKET_UPPER_PROMO_TILES.map((item) => ({ ...item })),
      midPromoTiles: SUPERMARKET_MID_PROMO_TILES.map((item) => ({ ...item })),
      promoTiles: SUPERMARKET_PROMO_TILES.map((item) => ({ ...item })),
      homeRails: SUPERMARKET_HOME_RAILS.map((item) => ({ ...item, enabled: true })),
      trustPillars: SUPERMARKET_HOME_TRUST_PILLARS.map((item) => ({ ...item })),
      footerTrustPillars: SUPERMARKET_FOOTER_TRUST.map((item) => ({ ...item })),
      sidebarDepartments: SUPERMARKET_SIDEBAR_DEPARTMENTS.map((item) => ({
        ...item,
        children: item.children?.map((child) => ({ ...child })),
      })),
      subNavLinks: SUPERMARKET_DEFAULT_SUB_NAV.map((item) => ({ ...item })),
    },
  };
}
