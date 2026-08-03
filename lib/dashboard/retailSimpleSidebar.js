/**
 * Retail Simple sidebar helpers — top sellers + recent activity rows.
 */

import { normalizeProductImageUrls } from '@/lib/utils/productImages';

/**
 * @param {Array<Record<string, unknown>>} products
 * @param {{ productId?: string | null; productName?: string | null }} match
 * @returns {string | null}
 */
export function resolveRetailProductImage(products = [], match = {}) {
  const matchObj =
    typeof match === 'string' ? { productName: match } : match && typeof match === 'object' ? match : {};
  const productId = String(matchObj?.productId || '').trim();
  const productName = String(matchObj?.productName || '').trim().toLowerCase();

  let found = null;
  if (productId) {
    found = products.find((p) => String(p?.id || '').trim() === productId) || null;
  }
  if (!found && productName) {
    found = products.find((p) => String(p?.name || '').trim().toLowerCase() === productName) || null;
  }
  if (!found) return null;
  const urls = normalizeProductImageUrls(found);
  return urls[0] || null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {string}
 */
export function formatRetailRecentLabel(row) {
  const source = String(row?.source || '').toLowerCase();
  const party = String(row?.party || '').trim();
  const ref = String(row?.ref || '').trim();

  if (source === 'storefront') {
    return ref ? `Online Order #${ref}` : 'Online Order';
  }
  if (source === 'pos') {
    return party || 'Walk-in Customer';
  }
  if (source === 'invoice') {
    return party || 'Walk-in Customer';
  }
  if (source === 'restaurant') {
    return party || 'Restaurant order';
  }
  if (party) return party;
  if (ref) return ref;
  return 'Sale';
}

/**
 * @param {Record<string, unknown>} row
 * @param {Array<Record<string, unknown>>} [products]
 * @param {number} [index]
 * @returns {{ id: string, name: string, qty: number, revenue: number, price?: number, imageUrl?: string | null }}
 */
export function normalizeRetailTopProduct(row, products = [], index = 0) {
  const productId = String(
    row?.product_id || row?.productId || row?.id || row?.product_key || ''
  ).trim();
  const name = String(row?.name || row?.product_name || 'Product').trim() || 'Product';
  const qty = Number(row?.volume ?? row?.qty ?? row?.quantity ?? 0) || 0;
  const revenue = Number(row?.revenue ?? row?.total ?? row?.value ?? 0) || 0;
  const price = Number(row?.price);
  const id = productId || `top-${index}-${name.toLowerCase()}`;
  return {
    id,
    name,
    qty,
    revenue,
    price: Number.isFinite(price) ? price : undefined,
    imageUrl: resolveRetailProductImage(products, { productId, productName: name }),
  };
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {Array<Record<string, unknown>>} [products]
 * @param {number} [limit]
 */
export function buildRetailTopSellingItems(rows = [], products = [], limit = 5) {
  const seen = new Set();
  const items = [];
  for (let i = 0; i < rows.length && items.length < limit; i += 1) {
    const item = normalizeRetailTopProduct(rows[i], products, i);
    const key = item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return items;
}

/**
 * @param {unknown} date
 */
export function formatRetailTrendLabel(date) {
  const parsed = date ? new Date(date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return String(date || '').slice(0, 3);
  }
  return parsed.toLocaleDateString(undefined, { month: 'short' });
}

/**
 * Prefer shell KPI when positive; otherwise unified sales-performance truth.
 * @param {number} preferred
 * @param {number} fallback
 */
export function resolveRetailKpiValue(preferred, fallback) {
  const a = Number(preferred);
  const b = Number(fallback);
  if (Number.isFinite(a) && a > 0) return a;
  if (Number.isFinite(b) && b > 0) return b;
  return Number.isFinite(a) ? a : Number.isFinite(b) ? b : 0;
}

/**
 * @param {Array<{ date?: unknown; revenue?: number; expenses?: number }>} salesTrend
 * @param {number} periodExpenses
 */
export function buildRetailPeriodChartRows(salesTrend = [], periodExpenses = 0) {
  if (!Array.isArray(salesTrend) || salesTrend.length === 0) return [];
  const expensePerBucket =
    periodExpenses > 0 ? periodExpenses / Math.max(salesTrend.length, 1) : 0;
  return salesTrend.map((row) => ({
    label: formatRetailTrendLabel(row.date),
    revenue: Number(row.revenue) || 0,
    expenses: Number(row.expenses) || expensePerBucket,
  }));
}
