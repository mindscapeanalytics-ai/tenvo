/**
 * Shared sales performance filter contract for Sales Manager + Report Builder.
 * channel: all | invoice | pos | storefront (UI: All | Invoices | POS | Online)
 */

import { resolveAnalyticsRange, toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';

export const SALES_CHANNELS = Object.freeze(['all', 'invoice', 'pos', 'storefront']);

export const SALES_CHANNEL_OPTIONS = Object.freeze([
  { value: 'all', label: 'All' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'pos', label: 'POS' },
  { value: 'storefront', label: 'Online' },
]);

/**
 * @param {unknown} raw
 * @returns {'all' | 'invoice' | 'pos' | 'storefront'}
 */
export function normalizeSalesChannel(raw) {
  const v = String(raw || 'all').trim().toLowerCase();
  if (v === 'online' || v === 'storefront' || v === 'web') return 'storefront';
  if (v === 'offline' || v === 'pos' || v === 'terminal') return 'pos';
  if (v === 'hub' || v === 'invoice' || v === 'invoices') return 'invoice';
  if (v === 'all' || v === '') return 'all';
  if (SALES_CHANNELS.includes(v)) return /** @type {'all' | 'invoice' | 'pos' | 'storefront'} */ (v);
  return 'all';
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizeSalesCategory(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === 'all' || s.toLowerCase() === 'all categories') return null;
  return s;
}

/**
 * Resolve inclusive from/to plus equal-length prior window for growth.
 * @param {{ from?: unknown; to?: unknown }} [filter]
 */
export function resolveSalesPerformanceRange(filter = {}) {
  const { from, to } = resolveAnalyticsRange(filter);
  const fromDate = new Date(`${from}T12:00:00Z`);
  const toDate = new Date(`${to}T12:00:00Z`);
  const spanMs = Math.max(toDate.getTime() - fromDate.getTime(), 0);
  const spanDays = Math.max(Math.round(spanMs / 86400000) + 1, 1);
  const prevToDate = new Date(fromDate);
  prevToDate.setUTCDate(prevToDate.getUTCDate() - 1);
  const prevFromDate = new Date(prevToDate);
  prevFromDate.setUTCDate(prevFromDate.getUTCDate() - (spanDays - 1));
  return {
    from,
    to,
    prevFrom: prevFromDate.toISOString().slice(0, 10),
    prevTo: prevToDate.toISOString().slice(0, 10),
    spanDays,
  };
}

/**
 * Normalize full options bag for getSalesPerformanceAction / analytics bundle.
 * @param {{
 *   from?: unknown;
 *   to?: unknown;
 *   channel?: unknown;
 *   category?: unknown;
 *   topLimit?: unknown;
 * }} [options]
 */
export function normalizeSalesPerformanceOptions(options = {}) {
  const range = resolveSalesPerformanceRange(options);
  const channel = normalizeSalesChannel(options.channel);
  const category = normalizeSalesCategory(options.category);
  const topLimit = Math.min(Math.max(Number(options.topLimit) || 8, 1), 25);
  return {
    ...range,
    channel,
    category,
    topLimit,
    /** Category filter disables payment/retention header heuristics */
    categoryScoped: Boolean(category),
  };
}

/**
 * Format a short period label for UI subtitles.
 * @param {string} from
 * @param {string} to
 */
export function formatSalesPeriodLabel(from, to) {
  const a = toAnalyticsIsoDate(from);
  const b = toAnalyticsIsoDate(to);
  if (!a || !b) return 'Selected period';
  try {
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    const fromLbl = new Date(`${a}T12:00:00`).toLocaleDateString('en', opts);
    const toLbl = new Date(`${b}T12:00:00`).toLocaleDateString('en', opts);
    if (a === b) return fromLbl;
    return `${fromLbl} – ${toLbl}`;
  } catch {
    return `${a} – ${b}`;
  }
}

/**
 * Channel label for chips / meta.
 * @param {string} channel
 */
export function salesChannelLabel(channel) {
  const opt = SALES_CHANNEL_OPTIONS.find((o) => o.value === normalizeSalesChannel(channel));
  return opt?.label || 'All';
}
