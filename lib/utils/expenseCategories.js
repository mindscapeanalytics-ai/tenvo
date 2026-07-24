/**
 * Domain-aware expense category presets for hub Expense form / filters.
 * Base list stays in lib/config/accounting.js; overlays append per vertical.
 */

import { EXPENSE_CATEGORIES, ACCOUNT_CODES } from '@/lib/config/accounting';
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';

/** @typedef {{ value: string, label: string, account_code?: string, color?: string }} ExpenseCategory */

const DEFAULT_COLORS = Object.freeze({
  rent: 'bg-brand-50 text-brand-primary',
  utilities: 'bg-sky-100 text-sky-700',
  salaries: 'bg-wine-100 text-wine-700',
  marketing: 'bg-pink-100 text-pink-700',
  logistics: 'bg-emerald-100 text-emerald-700',
  office: 'bg-amber-100 text-amber-700',
  insurance: 'bg-indigo-100 text-indigo-700',
  repairs: 'bg-orange-100 text-orange-700',
  professional: 'bg-violet-100 text-violet-700',
  travel: 'bg-cyan-100 text-cyan-700',
  communication: 'bg-teal-100 text-teal-700',
  bank_charges: 'bg-slate-100 text-slate-700',
  depreciation: 'bg-stone-100 text-stone-700',
  miscellaneous: 'bg-gray-100 text-gray-700',
  supplier_milk: 'bg-blue-100 text-blue-700',
  chilling: 'bg-sky-100 text-sky-800',
  route_fuel: 'bg-emerald-100 text-emerald-800',
  packaging: 'bg-amber-100 text-amber-800',
  kitchen_supplies: 'bg-orange-100 text-orange-800',
  delivery_fuel: 'bg-emerald-100 text-emerald-700',
  cold_chain: 'bg-cyan-100 text-cyan-800',
  store_supplies: 'bg-amber-100 text-amber-700',
});

/** @type {Record<string, ExpenseCategory[]>} */
const DOMAIN_OVERLAYS = Object.freeze({
  'milk-shop': [
    { value: 'supplier_milk', label: 'Supplier milk purchase', account_code: ACCOUNT_CODES.MISCELLANEOUS },
    { value: 'chilling', label: 'Chilling / ice', account_code: ACCOUNT_CODES.UTILITIES },
    { value: 'route_fuel', label: 'Route fuel', account_code: ACCOUNT_CODES.LOGISTICS },
    { value: 'packaging', label: 'Packaging (pouches)', account_code: ACCOUNT_CODES.OFFICE_SUPPLIES },
  ],
  'restaurant-cafe': [
    { value: 'kitchen_supplies', label: 'Kitchen supplies', account_code: ACCOUNT_CODES.OFFICE_SUPPLIES },
    { value: 'delivery_fuel', label: 'Delivery fuel', account_code: ACCOUNT_CODES.LOGISTICS },
    { value: 'packaging', label: 'Packaging', account_code: ACCOUNT_CODES.OFFICE_SUPPLIES },
  ],
  supermarket: [
    { value: 'cold_chain', label: 'Cold chain / perishable loss', account_code: ACCOUNT_CODES.UTILITIES },
    { value: 'store_supplies', label: 'Store supplies', account_code: ACCOUNT_CODES.OFFICE_SUPPLIES },
  ],
});

/** Grocery / FMCG aliases resolve to supermarket overlays. */
const OVERLAY_ALIASES = Object.freeze({
  grocery: 'supermarket',
  fmcg: 'supermarket',
  'cold-storage': 'supermarket',
});

/** Legacy form / filter strings → canonical value */
const LEGACY_CATEGORY_ALIASES = Object.freeze({
  utilities: 'utilities',
  rent: 'rent',
  salaries: 'salaries',
  salary: 'salaries',
  marketing: 'marketing',
  supplies: 'office',
  'office supplies': 'office',
  office: 'office',
  travel: 'travel',
  'repair & maintenance': 'repairs',
  'repairs & maintenance': 'repairs',
  repairs: 'repairs',
  maintenance: 'repairs',
  entertainment: 'miscellaneous',
  others: 'miscellaneous',
  other: 'miscellaneous',
  miscellaneous: 'miscellaneous',
  transport: 'logistics',
  logistics: 'logistics',
  taxes: 'miscellaneous',
  'rent & utilities': 'rent',
  'salaries & wages': 'salaries',
});

/**
 * @param {string} [domainKey]
 * @returns {string}
 */
function overlayKeyForDomain(domainKey) {
  const resolved = resolveDomainKey(domainKey);
  if (OVERLAY_ALIASES[resolved]) return OVERLAY_ALIASES[resolved];
  if (DOMAIN_OVERLAYS[resolved]) return resolved;
  return resolved;
}

/**
 * @param {ExpenseCategory} cat
 * @returns {ExpenseCategory}
 */
function withColor(cat) {
  if (cat.color) return cat;
  return { ...cat, color: DEFAULT_COLORS[cat.value] || DEFAULT_COLORS.miscellaneous };
}

/**
 * Canonical expense categories for a business vertical (base + optional overlays).
 * @param {string} [domainKey]
 * @returns {ExpenseCategory[]}
 */
export function getExpenseCategoriesForDomain(domainKey) {
  const overlayKey = overlayKeyForDomain(domainKey);
  const overlay = DOMAIN_OVERLAYS[overlayKey] || [];
  const seen = new Set();
  /** @type {ExpenseCategory[]} */
  const out = [];
  for (const cat of EXPENSE_CATEGORIES) {
    if (seen.has(cat.value)) continue;
    seen.add(cat.value);
    out.push(withColor(cat));
  }
  for (const cat of overlay) {
    if (seen.has(cat.value)) continue;
    seen.add(cat.value);
    out.push(withColor(cat));
  }
  return out;
}

/**
 * Normalize a stored or UI category string to a canonical value.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeExpenseCategory(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'miscellaneous';
  const lower = s.toLowerCase();
  if (LEGACY_CATEGORY_ALIASES[lower]) return LEGACY_CATEGORY_ALIASES[lower];
  const slug = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (LEGACY_CATEGORY_ALIASES[slug]) return LEGACY_CATEGORY_ALIASES[slug];
  const all = getExpenseCategoriesForDomain();
  if (all.some((c) => c.value === slug)) return slug;
  const byLabel = all.find((c) => c.label.toLowerCase() === lower);
  if (byLabel) return byLabel.value;
  return slug || 'miscellaneous';
}

/**
 * @param {string} value
 * @param {string} [domainKey]
 * @returns {ExpenseCategory | undefined}
 */
export function findExpenseCategory(value, domainKey) {
  const normalized = normalizeExpenseCategory(value);
  return getExpenseCategoriesForDomain(domainKey).find((c) => c.value === normalized);
}
