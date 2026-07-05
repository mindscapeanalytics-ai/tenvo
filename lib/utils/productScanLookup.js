/**
 * Shared product lookup by scan code (barcode, SKU, variant SKU, or id).
 * Used by POS terminals, Inventory, and Invoices.
 */

import { expandScanCandidates, normalizeScanCode } from '@/lib/utils/barcodeUtils';

function matchesCandidate(product, candidates) {
  const fields = [
    product?.barcode,
    product?.sku,
    product?.id,
  ];
  for (const field of fields) {
    if (field == null || field === '') continue;
    const val = String(field).toLowerCase();
    if (candidates.some((c) => c.toLowerCase() === val)) return true;
  }

  const variants = product?.variants || product?.product_variants || [];
  for (const v of variants) {
    const sku = v?.variant_sku || v?.sku;
    if (!sku) continue;
    const val = String(sku).toLowerCase();
    if (candidates.some((c) => c.toLowerCase() === val)) return true;
  }

  return false;
}

/**
 * @param {object[]} products
 * @param {string} code
 * @returns {object|null}
 */
export function findProductByScanCode(products, code) {
  const candidates = expandScanCandidates(code);
  if (!candidates.length) return null;

  return (products || []).find((p) => matchesCandidate(p, candidates)) || null;
}

/**
 * @param {object[]} products
 * @param {string} code
 * @returns {object|null}
 */
export function findProductByPartialScan(products, code) {
  const product = findProductByScanCode(products, code);
  if (product) return product;

  const q = normalizeScanCode(code).toLowerCase();
  if (!q || q.length < 3) return null;

  return (
    (products || []).find((p) => {
      const hay = [p.name, p.barcode, p.sku, p.brand]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    }) || null
  );
}

/**
 * Merge a server lookup result into the local products list shape.
 * @param {object[]} products
 * @param {object} serverProduct
 * @returns {object[]}
 */
export function mergeScannedProductIntoList(products, serverProduct) {
  if (!serverProduct?.id) return products || [];
  const list = products || [];
  const idx = list.findIndex((p) => p.id === serverProduct.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...serverProduct };
    return next;
  }
  return [...list, serverProduct];
}
