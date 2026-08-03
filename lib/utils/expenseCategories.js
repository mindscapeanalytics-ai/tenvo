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
  supplier_water: 'bg-cyan-100 text-cyan-800',
  bottle_deposit_float: 'bg-sky-100 text-sky-700',
  empty_purchase_mt: 'bg-indigo-100 text-indigo-800',
  plant_utilities: 'bg-teal-100 text-teal-800',
  rider_commission: 'bg-violet-100 text-violet-700',
  vehicle_maintenance: 'bg-orange-100 text-orange-800',
  filter_replacement: 'bg-lime-100 text-lime-800',
  bottle_loss: 'bg-rose-100 text-rose-700',
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
  'water-delivery': [
    { value: 'supplier_water', label: 'Plant / bulk water purchase', account_code: ACCOUNT_CODES.MISCELLANEOUS },
    { value: 'bottle_deposit_float', label: 'Empty bottle deposit float', account_code: ACCOUNT_CODES.MISCELLANEOUS },
    { value: 'empty_purchase_mt', label: 'Empty purchase (MT / other co)', account_code: ACCOUNT_CODES.MISCELLANEOUS },
    { value: 'route_fuel', label: 'Rider / route fuel', account_code: ACCOUNT_CODES.LOGISTICS },
    { value: 'plant_utilities', label: 'Plant RO / electricity', account_code: ACCOUNT_CODES.UTILITIES },
    { value: 'packaging', label: 'Caps, seals, labels', account_code: ACCOUNT_CODES.OFFICE_SUPPLIES },
    { value: 'rider_commission', label: 'Rider commission / salary', account_code: ACCOUNT_CODES.SALARIES },
    { value: 'vehicle_maintenance', label: 'Vehicle / bike maintenance', account_code: ACCOUNT_CODES.REPAIRS },
    { value: 'filter_replacement', label: 'RO filter / membrane replacement', account_code: ACCOUNT_CODES.REPAIRS },
    { value: 'bottle_loss', label: 'Bottle loss / breakage', account_code: ACCOUNT_CODES.MISCELLANEOUS },
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
  water: 'water-delivery',
  'water-shop': 'water-delivery',
  'water-supply': 'water-delivery',
  'bottled-water': 'water-delivery',
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
  const fromDomain = getExpenseCategoriesForDomain(domainKey).find(
    (c) => c.value === normalized
  );
  if (fromDomain) return fromDomain;
  // Server may resolve without a domain key — still honor overlay account codes.
  for (const overlay of Object.values(DOMAIN_OVERLAYS)) {
    const hit = overlay.find((c) => c.value === normalized);
    if (hit) return withColor(hit);
  }
  return undefined;
}

/** Shopkeeper-friendly English labels (DB value unchanged). */
const SHOP_LABELS = Object.freeze({
  rent: 'Shop rent',
  utilities: 'Electricity, gas, water',
  salaries: 'Staff wages',
  marketing: 'Ads / marketing',
  logistics: 'Transport / delivery',
  office: 'Shop supplies',
  insurance: 'Insurance',
  repairs: 'Repairs',
  professional: 'Lawyer / accountant fees',
  travel: 'Travel',
  communication: 'Phone / internet',
  bank_charges: 'Bank charges',
  depreciation: 'Depreciation',
  miscellaneous: 'Other',
  supplier_milk: 'Buy milk from supplier',
  chilling: 'Ice / chilling',
  route_fuel: 'Route fuel',
  packaging: 'Packaging',
  supplier_water: 'Buy from plant / bulk',
  bottle_deposit_float: 'Empty bottle deposits',
  empty_purchase_mt: 'Buy empties (MT)',
  plant_utilities: 'Plant RO / electricity',
  kitchen_supplies: 'Kitchen supplies',
  delivery_fuel: 'Delivery fuel',
  cold_chain: 'Cold storage loss',
  store_supplies: 'Store supplies',
});

/**
 * Display label for UI (shop-friendly EN; caller may overlay Urdu via translations).
 * @param {{ value: string, label?: string } | null | undefined} cat
 * @returns {string}
 */
export function getExpenseCategoryShopLabel(cat) {
  if (!cat) return 'Other';
  return SHOP_LABELS[cat.value] || cat.label || cat.value;
}

/**
 * Translation key for category display (expense_cat_rent, …).
 * @param {string} value
 * @returns {string}
 */
export function expenseCategoryTranslationKey(value) {
  const slug = normalizeExpenseCategory(value);
  return `expense_cat_${slug}`;
}
