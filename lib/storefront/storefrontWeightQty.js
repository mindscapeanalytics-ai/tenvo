/**
 * Shared storefront weight / fractional quantity helpers.
 * Used so milk-shop (and any kg/g/litre SKUs) can sell 0.5 / 1.5 without
 * changing integer-only pcs/pack behaviour for other stores.
 */

const WEIGHT_UNITS = new Set(['kg', 'g', 'gm', 'gram', 'grams', 'kilogram', 'kilograms', 'litre', 'liter', 'l', 'ltr']);

/**
 * @param {unknown} unit
 * @returns {boolean}
 */
export function isStorefrontWeightUnit(unit) {
  const u = String(unit || '')
    .trim()
    .toLowerCase();
  return WEIGHT_UNITS.has(u);
}

/**
 * @param {{ unit?: string | null } | null | undefined} productOrItem
 */
export function allowsFractionalStorefrontQty(productOrItem) {
  return isStorefrontWeightUnit(productOrItem?.unit);
}

/**
 * @param {unknown} qty
 * @param {{ unit?: string | null } | null | undefined} productOrItem
 * @returns {number}
 */
export function normalizeStorefrontQty(qty, productOrItem) {
  const n = Number(qty);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (allowsFractionalStorefrontQty(productOrItem)) {
    return Math.round(n * 100) / 100;
  }
  return Math.max(1, Math.floor(n));
}

/**
 * Step size for +/- controls.
 * @param {{ unit?: string | null } | null | undefined} productOrItem
 */
export function storefrontQtyStep(productOrItem) {
  return allowsFractionalStorefrontQty(productOrItem) ? 0.1 : 1;
}

/**
 * Minimum order qty for the unit type.
 * @param {{ unit?: string | null } | null | undefined} productOrItem
 */
export function storefrontQtyMin(productOrItem) {
  return allowsFractionalStorefrontQty(productOrItem) ? 0.1 : 1;
}
