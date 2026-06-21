/**
 * Business-aware copy for single-tenant public storefronts.
 * Each registered business gets its own store — avoid marketplace-style labels.
 */

/**
 * @param {{ business_name?: string }} business
 * @param {{ featuredSectionTitle?: string; newArrivalsSectionTitle?: string }} domainCfg
 */
export function getStoreHomeCopy(business, domainCfg = {}) {
  const name = business?.business_name?.trim() || 'Our Store';

  return {
    storeName: name,
    featuredTitle: domainCfg.featuredSectionTitle || 'Featured Products',
    featuredSubtitle: `From ${name}`,
    newArrivalsTitle: domainCfg.newArrivalsSectionTitle || 'New Arrivals',
    newArrivalsSubtitle: `Latest from ${name}`,
    onSaleTitle: 'Special Offers',
    onSaleSubtitle: `Deals at ${name}`,
    shopAllTitle: `Shop ${name}`,
    shopAllSubtitle: 'Browse the full catalog',
    emptyTitle: 'Products Coming Soon',
    emptyBody: `${name} is setting up the catalog. Check back soon or get in touch.`,
    searchPlaceholder: `Search ${name}…`,
    heroCta: domainCfg.ctaLabel || 'Shop Now',
  };
}
