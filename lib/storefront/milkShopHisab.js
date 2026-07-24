/**
 * Milk-shop Route Hisab helpers — daily doorstep log + week/month collection.
 * Isolated: only use when isMilkHisabRelevant(category).
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { isMilkShopStore } from '@/lib/storefront/milkShopStorefront';

export const MILK_HISAB_PERIOD_PREFIX = '[milk_hisab_period=';

export const MILK_HISAB_DEFAULT_COLUMN_HINTS = [
  { id: 'milk', label: 'Milk', match: /fresh milk|^milk$/i, preferUnit: 'kg' },
  { id: 'eggs', label: 'Eggs', match: /egg/i, preferUnit: 'dozen' },
  { id: 'bread', label: 'Bread', match: /bread|bakery/i, preferUnit: 'pcs' },
  { id: 'butter', label: 'Butter', match: /butter|makkhan|cream/i, preferUnit: 'kg' },
];

/**
 * @param {string | null | undefined} category
 */
export function isMilkHisabRelevant(category) {
  return isMilkShopStore(category) || resolveDomainKey(category) === 'milk-shop';
}

/**
 * @param {string | Date} dateLike
 * @returns {string} YYYY-MM-DD
 */
export function toMilkHisabDateKey(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(String(dateLike));
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/**
 * @param {string | Date} dateLike
 * @returns {string} YYYY-MM
 */
export function toMilkHisabPeriodKey(dateLike) {
  return toMilkHisabDateKey(dateLike).slice(0, 7);
}

/**
 * ISO week key for <input type="week"> and billing markers.
 * @param {string | Date} dateLike
 * @returns {string} YYYY-Www
 */
export function toMilkHisabWeekKey(dateLike) {
  const d = dateLike instanceof Date ? new Date(dateLike) : new Date(String(dateLike));
  if (Number.isNaN(d.getTime())) {
    return toMilkHisabWeekKey(new Date());
  }
  // ISO: Thursday determines year; week starts Monday
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  const year = utc.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * @param {number} year
 * @param {number} week 1-53
 */
function isoWeekBoundsUtc(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    startIso: monday.toISOString().slice(0, 10),
    endIso: sunday.toISOString().slice(0, 10),
  };
}

/**
 * Parse billing period: month `YYYY-MM` or ISO week `YYYY-Www`.
 * @param {string} period
 * @returns {{ period: string, kind: 'week'|'month', startIso: string, endIso: string, label: string }}
 */
export function parseMilkHisabBillingPeriod(period) {
  const raw = String(period || '').trim();
  const weekMatch = raw.match(/^(\d{4})-W(\d{1,2})$/i);
  if (weekMatch) {
    const year = Number(weekMatch[1]);
    const week = Number(weekMatch[2]);
    if (!year || !week || week < 1 || week > 53) {
      const err = new Error('Invalid week');
      err.code = 'INVALID_PERIOD';
      throw err;
    }
    const key = `${year}-W${String(week).padStart(2, '0')}`;
    const { startIso, endIso } = isoWeekBoundsUtc(year, week);
    return {
      period: key,
      kind: 'week',
      startIso,
      endIso,
      label: `Week ${week} (${startIso} to ${endIso})`,
    };
  }

  const monthKey = raw.slice(0, 7);
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) {
    const err = new Error('Invalid month');
    err.code = 'INVALID_PERIOD';
    throw err;
  }
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const key = `${y}-${String(m).padStart(2, '0')}`;
  return {
    period: key,
    kind: 'month',
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
    label: start.toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

/**
 * @param {string} period YYYY-MM or YYYY-Www
 */
export function milkHisabPeriodMarker(period) {
  return `${MILK_HISAB_PERIOD_PREFIX}${period}]`;
}

/**
 * @param {string | null | undefined} notes
 * @param {string} period
 */
export function invoiceHasMilkHisabPeriod(notes, period) {
  if (!notes || !period) return false;
  return String(notes).includes(milkHisabPeriodMarker(period));
}

/**
 * Pick up to 8 inventory products as hisab columns.
 * Owner override: settings.milkHisab.productIds (UUID array).
 * @param {object[]} products
 * @param {object} [settings]
 */
export function resolveMilkHisabProducts(products = [], settings = {}) {
  const rawIds = settings?.milkHisab?.productIds || settings?.storefront?.milkShop?.hisabProductIds;
  const active = (products || []).filter(
    (p) => p && p.id && p.is_active !== false && p.is_deleted !== true && (p.name || p.sku)
  );

  if (Array.isArray(rawIds) && rawIds.length) {
    const byId = new Map(active.map((p) => [String(p.id), p]));
    const picked = rawIds.map((id) => byId.get(String(id))).filter(Boolean);
    if (picked.length) return picked.slice(0, 8);
  }

  const used = new Set();
  const out = [];
  for (const hint of MILK_HISAB_DEFAULT_COLUMN_HINTS) {
    const match = active.find((p) => {
      if (used.has(p.id)) return false;
      const blob = `${p.name || ''} ${p.category || ''} ${p.category_name || ''}`;
      return hint.match.test(blob);
    });
    if (match) {
      used.add(match.id);
      out.push(match);
    }
  }

  for (const p of active) {
    if (out.length >= 8) break;
    if (used.has(p.id)) continue;
    used.add(p.id);
    out.push(p);
  }

  return out.slice(0, 8);
}

/**
 * Read milk customer prefs from domain_data.
 * @param {object} customer
 */
export function readMilkCustomerPrefs(customer = {}) {
  const dd = customer.domain_data && typeof customer.domain_data === 'object' ? customer.domain_data : {};
  const house =
    dd.houseno || dd.house_no || dd.houseNo || customer.address || '';
  const route = dd.deliveryroute || dd.delivery_route || '';
  const dailyKg = Number(dd.dailymilkkg ?? dd.daily_milk_kg ?? 0);
  const activeRaw = dd.deliveryactive ?? dd.delivery_active;
  const deliveryActive =
    activeRaw === false || activeRaw === 'No' || activeRaw === 'no' || activeRaw === 0
      ? false
      : true;
  return {
    houseNo: String(house || '').trim(),
    routeLabel: String(route || '').trim(),
    dailyMilkKg: Number.isFinite(dailyKg) && dailyKg > 0 ? dailyKg : 0,
    deliveryActive,
    preferredPayment: String(dd.preferredpayment || dd.preferred_payment || '').trim(),
  };
}

/**
 * Build collection KPIs from period bill rows.
 * @param {Array<object>} rows
 */
export function buildMilkHisabPeriodKpis(rows = []) {
  let totalAmount = 0;
  let billedAmount = 0;
  let unbilledAmount = 0;
  let unpaidAmount = 0;
  let paidAmount = 0;
  let billedCount = 0;
  let unbilledCount = 0;
  let unpaidCount = 0;
  let paidCount = 0;
  let deliveryDays = 0;

  for (const r of rows) {
    const amount = Math.round((Number(r.amount) || 0) * 100) / 100;
    if (amount <= 0 && !r.billed) continue;
    totalAmount += amount;
    deliveryDays += Number(r.stopCount) || 0;
    if (r.billed) {
      billedCount += 1;
      billedAmount += amount;
      const status = String(r.paymentStatus || '').toLowerCase();
      if (status === 'paid') {
        paidCount += 1;
        paidAmount += amount;
      } else {
        unpaidCount += 1;
        unpaidAmount += amount;
      }
    } else {
      unbilledCount += 1;
      unbilledAmount += amount;
    }
  }

  const billable = rows.filter((r) => (Number(r.amount) || 0) > 0 || r.billed);
  return {
    customers: billable.length,
    deliveryDays,
    totalAmount: Math.round(totalAmount * 100) / 100,
    billedCount,
    unbilledCount,
    unpaidCount,
    paidCount,
    billedAmount: Math.round(billedAmount * 100) / 100,
    unbilledAmount: Math.round(unbilledAmount * 100) / 100,
    unpaidAmount: Math.round(unpaidAmount * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
  };
}

/**
 * Compact product column label for dense grids.
 * @param {string} name
 * @param {number} [max=22]
 */
export function shortMilkHisabProductLabel(name, max = 22) {
  const raw = String(name || 'Item').trim();
  if (raw.length <= max) return raw;
  return `${raw.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/**
 * @param {string | null | undefined} name
 */
export function isMilkHisabWalkInCustomer(name) {
  return /walk[\s-]?in/i.test(String(name || ''));
}
