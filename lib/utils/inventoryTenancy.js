/**
 * Tenant scoping helpers for hub inventory lists.
 * Server queries already filter by business_id; these guards stop cross-tenant
 * client paint after shop switch / stale shell hydrate.
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeBusinessId(value) {
  return value == null ? '' : String(value).trim();
}

/**
 * Keep only rows that belong to `businessId` (or lack business_id — treated as same-tenant DTO).
 * @param {Array<Record<string, unknown>> | null | undefined} products
 * @param {string | null | undefined} businessId
 * @returns {Array<Record<string, unknown>>}
 */
export function scopeProductsToBusiness(products, businessId) {
  const list = Array.isArray(products) ? products : [];
  const bid = normalizeBusinessId(businessId);
  if (!bid) return list;
  return list.filter((p) => {
    if (!p || typeof p !== 'object') return false;
    const rowBid = normalizeBusinessId(p.business_id ?? p.businessId);
    return !rowBid || rowBid === bid;
  });
}

/**
 * True when a product row is known to belong to another tenant.
 * @param {Record<string, unknown> | null | undefined} product
 * @param {string | null | undefined} businessId
 */
export function isForeignTenantProduct(product, businessId) {
  const bid = normalizeBusinessId(businessId);
  const rowBid = normalizeBusinessId(product?.business_id ?? product?.businessId);
  return Boolean(bid && rowBid && rowBid !== bid);
}
