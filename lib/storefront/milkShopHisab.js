/**
 * Milk-shop Route Hisab helpers — daily doorstep log + week/month collection.
 * Isolated: only use when isMilkHisabRelevant(category).
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { isMilkShopStore } from '@/lib/storefront/milkShopStorefront';

export const MILK_HISAB_PERIOD_PREFIX = '[milk_hisab_period=';

export const MILK_HISAB_DEFAULT_COLUMN_HINTS = [
  { id: 'milk', label: 'Milk', match: /fresh milk|(^|\s)milk(\s|$)|doodh|olper|anhaar|nurpur|haleeb/i, preferUnit: 'kg' },
  { id: 'eggs', label: 'Eggs', match: /egg/i, preferUnit: 'dozen' },
  { id: 'bread', label: 'Bread', match: /bread|bakery|parlor/i, preferUnit: 'pcs' },
  { id: 'butter', label: 'Butter', match: /butter|makkhan/i, preferUnit: 'kg' },
  { id: 'cream', label: 'Cream', match: /cream|malai/i, preferUnit: 'kg' },
  { id: 'dahi', label: 'Dahi', match: /dahi|yogurt|yoghurt/i, preferUnit: 'kg' },
  { id: 'lassi', label: 'Lassi', match: /lassi/i, preferUnit: 'pcs' },
  { id: 'paneer', label: 'Paneer', match: /paneer|khoya|barfi|kulfi/i, preferUnit: 'kg' },
];

/**
 * @param {string | null | undefined} category
 */
export function isMilkHisabRelevant(category) {
  return isMilkShopStore(category) || resolveDomainKey(category) === 'milk-shop';
}

/**
 * Local calendar YYYY-MM-DD (not UTC) so Pakistan evening/morning days stay correct.
 * @param {Date} d
 */
function toLocalDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {string | Date} dateLike
 * @returns {string} YYYY-MM-DD
 */
export function toMilkHisabDateKey(dateLike) {
  if (typeof dateLike === 'string') {
    const trimmed = dateLike.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // date inputs sometimes send YYYY-MM-DDTHH:mm — keep calendar day from string when present
    const head = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head) && (trimmed.length === 10 || trimmed[10] === 'T')) {
      return head;
    }
  }
  const d = dateLike instanceof Date ? dateLike : new Date(String(dateLike));
  if (Number.isNaN(d.getTime())) {
    return toLocalDateKey(new Date());
  }
  return toLocalDateKey(d);
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
 * Uses local calendar components so PK “today” matches the week picker.
 * @param {string | Date} dateLike
 * @returns {string} YYYY-Www
 */
export function toMilkHisabWeekKey(dateLike) {
  let y;
  let m;
  let day;
  if (typeof dateLike === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateLike.trim())) {
    const [yy, mm, dd] = dateLike.trim().slice(0, 10).split('-').map(Number);
    y = yy;
    m = mm - 1;
    day = dd;
  } else {
    const d = dateLike instanceof Date ? dateLike : new Date(String(dateLike));
    if (Number.isNaN(d.getTime())) {
      return toMilkHisabWeekKey(new Date());
    }
    y = d.getFullYear();
    m = d.getMonth();
    day = d.getDate();
  }
  // ISO: Thursday determines year; week starts Monday (UTC date math on calendar parts)
  const utc = new Date(Date.UTC(y, m, day));
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
 * @param {string | null | undefined} notes
 * @returns {string | null} period key from marker
 */
export function extractMilkHisabPeriodFromNotes(notes) {
  const m = String(notes || '').match(/\[milk_hisab_period=([^\]]+)\]/);
  return m?.[1] || null;
}

/**
 * True when two billing periods share any calendar day.
 * @param {string} periodA
 * @param {string} periodB
 */
export function milkHisabPeriodsOverlap(periodA, periodB) {
  if (!periodA || !periodB) return false;
  if (periodA === periodB) return true;
  try {
    const a = parseMilkHisabBillingPeriod(periodA);
    const b = parseMilkHisabBillingPeriod(periodB);
    return a.startIso <= b.endIso && b.startIso <= a.endIso;
  } catch {
    return false;
  }
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
 * Pick best invoice for a customer in a billing period (exact marker, else overlapping hisab bill).
 * @param {Array<object>} invoices
 * @param {string} customerId
 * @param {string} periodKey
 */
export function resolveMilkHisabInvoiceForPeriod(invoices = [], customerId, periodKey) {
  const forCustomer = (invoices || []).filter((inv) => String(inv.customer_id) === String(customerId));
  if (!forCustomer.length) return null;
  const exact = forCustomer.find((inv) => invoiceHasMilkHisabPeriod(inv.notes, periodKey));
  if (exact) return exact;
  for (const inv of forCustomer) {
    const marked = extractMilkHisabPeriodFromNotes(inv.notes);
    if (marked && milkHisabPeriodsOverlap(marked, periodKey)) return inv;
  }
  return null;
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

  const withShortLabel = (p, label) => ({
    ...p,
    id: String(p.id),
    hisabShortLabel: label || resolveMilkHisabHintLabel(p) || null,
  });

  if (Array.isArray(rawIds) && rawIds.length) {
    const byId = new Map(active.map((p) => [String(p.id), p]));
    const picked = rawIds.map((id) => byId.get(String(id))).filter(Boolean);
    if (picked.length) return picked.slice(0, 8).map((p) => withShortLabel(p));
  }

  const used = new Set();
  const out = [];
  for (const hint of MILK_HISAB_DEFAULT_COLUMN_HINTS) {
    const match = active.find((p) => {
      if (used.has(String(p.id))) return false;
      const blob = `${p.name || ''} ${p.category || ''} ${p.category_name || ''}`;
      if (!hint.match.test(blob)) return false;
      if (hint.preferUnit && p.unit) {
        const u = String(p.unit).toLowerCase();
        const prefer = String(hint.preferUnit).toLowerCase();
        // Soft prefer — still accept if unit differs (pack UHT milk, etc.)
        if (u === prefer) return true;
        return !active.some(
          (other) =>
            !used.has(String(other.id)) &&
            hint.match.test(`${other.name || ''} ${other.category || ''}`) &&
            String(other.unit || '').toLowerCase() === prefer
        );
      }
      return true;
    });
    if (match) {
      used.add(String(match.id));
      out.push(withShortLabel(match, hint.label));
    }
  }

  for (const p of active) {
    if (out.length >= 8) break;
    if (used.has(String(p.id))) continue;
    used.add(String(p.id));
    out.push(withShortLabel(p));
  }

  return out.slice(0, 8);
}

/**
 * @param {object} product
 * @returns {string | null}
 */
export function resolveMilkHisabHintLabel(product = {}) {
  const blob = `${product.name || ''} ${product.category || ''} ${product.category_name || ''}`;
  for (const hint of MILK_HISAB_DEFAULT_COLUMN_HINTS) {
    if (hint.match.test(blob)) return hint.label;
  }
  return null;
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
    preferredPayment: String(
      dd.preferredpayment ||
        dd.preferred_payment ||
        dd.preferredpaymentmethod ||
        dd.preferred_payment_method ||
        ''
    ).trim(),
  };
}

/** Notes marker for Route Hisab quick-collect receipts (voidable from Bills). */
export const MILK_HISAB_COLLECTION_NOTE = 'Route Hisab collection';

/**
 * Manual period Paid/Unpaid on customer domain_data (independent of invoices).
 * Path: domain_data.milkHisab.periodPayments[periodKey] = 'paid' | 'unpaid'
 * @param {object | null | undefined} domainData
 * @param {string} periodKey
 * @returns {'paid'|'unpaid'|null}
 */
export function readMilkHisabPeriodPayment(domainData, periodKey) {
  const key = String(periodKey || '').trim();
  if (!key) return null;
  const dd = domainData && typeof domainData === 'object' ? domainData : {};
  const milk = dd.milkHisab && typeof dd.milkHisab === 'object' ? dd.milkHisab : {};
  const map =
    (milk.periodPayments && typeof milk.periodPayments === 'object' ? milk.periodPayments : null) ||
    (milk.period_payments && typeof milk.period_payments === 'object' ? milk.period_payments : null) ||
    {};
  const raw = map[key];
  const status = String(raw || '').toLowerCase();
  if (status === 'paid') return 'paid';
  if (status === 'unpaid') return 'unpaid';
  return null;
}

/**
 * Merge a period payment flag into customer domain_data (immutable).
 * @param {object | null | undefined} domainData
 * @param {string} periodKey
 * @param {'paid'|'unpaid'} status
 */
export function patchMilkHisabPeriodPayment(domainData, periodKey, status) {
  const key = String(periodKey || '').trim();
  const nextStatus = String(status || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid';
  const dd = domainData && typeof domainData === 'object' ? { ...domainData } : {};
  const milk =
    dd.milkHisab && typeof dd.milkHisab === 'object' ? { ...dd.milkHisab } : {};
  const map =
    milk.periodPayments && typeof milk.periodPayments === 'object'
      ? { ...milk.periodPayments }
      : {};
  if (key) map[key] = nextStatus;
  milk.periodPayments = map;
  dd.milkHisab = milk;
  return dd;
}

/**
 * Resolve display payment: invoice status wins when billed; else manual hisab flag.
 * @param {{ invoicePaymentStatus?: string | null, hisabPaymentStatus?: string | null, billed?: boolean }} args
 * @returns {'paid'|'unpaid'}
 */
export function resolveMilkHisabRowPaymentStatus(args = {}) {
  const inv = String(args.invoicePaymentStatus || '').toLowerCase();
  if (args.billed) {
    return inv === 'paid' ? 'paid' : 'unpaid';
  }
  if (String(args.hisabPaymentStatus || '').toLowerCase() === 'paid') return 'paid';
  return 'unpaid';
}

/**
 * True when a bill row should get collection reminders (WhatsApp / hub / email).
 * @param {{ amount?: number, paymentStatus?: string | null, billed?: boolean }} row
 */
export function isMilkHisabBillRemindable(row) {
  if ((Number(row?.amount) || 0) <= 0) return false;
  return String(row?.paymentStatus || '').toLowerCase() !== 'paid';
}

/**
 * Compact bill lines for reminder copy (WhatsApp / email cannot attach the 58mm PDF via wa.me).
 * @param {{ qtyByProduct?: Record<string, number>, productMeta?: Record<string, { name?: string, unit?: string }> }} row
 * @param {number} [maxLines=6]
 */
export function buildMilkHisabBillLinesForReminder(row = {}, maxLines = 6) {
  const qtyByProduct = row.qtyByProduct || {};
  const productMeta = row.productMeta || {};
  const lines = [];
  for (const [pid, rawQty] of Object.entries(qtyByProduct)) {
    const qty = Number(rawQty) || 0;
    if (qty <= 0) continue;
    const meta = productMeta[pid] || productMeta[String(pid)] || {};
    const name = shortMilkHisabProductLabel(
      { name: meta.name || 'Item', hisabShortLabel: meta.hisabShortLabel },
      18
    );
    lines.push({
      productId: pid,
      name,
      qty,
      unit: meta.unit ? String(meta.unit) : '',
    });
    if (lines.length >= maxLines) break;
  }
  return lines;
}

/**
 * Build collection KPIs from period bill rows.
 * Unpaid/Paid follow manual hisab (or invoice) status; Unbilled stays invoice-generate only.
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
    } else {
      unbilledCount += 1;
      unbilledAmount += amount;
    }
    const status = String(r.paymentStatus || '').toLowerCase();
    if (status === 'paid') {
      paidCount += 1;
      paidAmount += amount;
    } else if (amount > 0) {
      unpaidCount += 1;
      unpaidAmount += amount;
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
 * Compact product column label for dense grids (prefer dairy short names).
 * @param {string | { name?: string, hisabShortLabel?: string, category?: string, unit?: string }} nameOrProduct
 * @param {number} [max=14]
 */
export function shortMilkHisabProductLabel(nameOrProduct, max = 14) {
  const product =
    nameOrProduct && typeof nameOrProduct === 'object'
      ? nameOrProduct
      : { name: nameOrProduct };
  const hinted =
    product.hisabShortLabel ||
    resolveMilkHisabHintLabel(product) ||
    null;
  const raw = String(hinted || product.name || 'Item').trim();
  if (raw.length <= max) return raw;
  // Prefer last meaningful token(s): "ANHAAR FARM FRESH MILK" → "MILK"
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const tail = words.slice(-2).join(' ');
    if (tail.length <= max) return tail;
    const last = words[words.length - 1];
    if (last.length <= max) return last;
  }
  return `${raw.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/**
 * Compact 3-letter header for 58mm day grid (Milk → Mlk, Eggs → Egg).
 * @param {string} label
 */
export function abbreviateMilkHisabColumn(label) {
  const raw = String(label || 'Itm').trim();
  if (raw.length <= 3) return raw.padEnd(3, ' ');
  const letters = raw.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 3) return letters.slice(0, 3);
  return raw.slice(0, 3);
}

/**
 * Build PK-style day × product Y/N grid for a billing period.
 * @param {{
 *   stops?: Array<{ delivery_date?: Date|string, lines?: Array<{ product_id: string, quantity: unknown }> }>,
 *   columns?: Array<{ id: string, name?: string, hisabShortLabel?: string, unit?: string }>,
 *   startIso: string,
 *   endIso: string,
 * }} args
 */
export function buildMilkHisabDayBreakdownGrid({
  stops = [],
  columns = [],
  startIso,
  endIso,
}) {
  const cols = (columns || [])
    .map((c) => ({
      id: String(c.id),
      shortLabel: shortMilkHisabProductLabel(c, 8),
      abbrev: abbreviateMilkHisabColumn(shortMilkHisabProductLabel(c, 8)),
      unit: c.unit || '',
      name: c.name || c.hisabShortLabel || 'Item',
    }))
    .filter((c) => c.id);

  /** @type {Map<string, Map<string, number>>} */
  const byDate = new Map();
  for (const stop of stops || []) {
    const dateKey = toMilkHisabDateKey(stop.delivery_date || stop.deliveryDate);
    if (!dateKey) continue;
    if (startIso && dateKey < startIso) continue;
    if (endIso && dateKey > endIso) continue;
    if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
    const dayMap = byDate.get(dateKey);
    for (const line of stop.lines || []) {
      const pid = String(line.product_id);
      const q = Number(line.quantity) || 0;
      if (q <= 0) continue;
      dayMap.set(pid, (dayMap.get(pid) || 0) + q);
    }
  }

  const dateKeys = [...byDate.keys()].sort();
  // Fill calendar span so missing days show N (keeper expectation for monthly sheet)
  const allDates = [];
  if (startIso && endIso) {
    const cursor = new Date(`${startIso}T12:00:00`);
    const end = new Date(`${endIso}T12:00:00`);
    while (cursor <= end) {
      allDates.push(toMilkHisabDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    allDates.push(...dateKeys);
  }

  // Prefer only days with activity + thin empty stretch; for month print include all days in range
  const days = allDates.map((dateKey) => {
    const dayMap = byDate.get(dateKey) || new Map();
    const dayNum = Number(dateKey.slice(-2)) || 0;
    /** @type {Record<string, 'Y'|'N'>} */
    const marks = {};
    /** @type {Record<string, number>} */
    const qtys = {};
    let any = false;
    for (const col of cols) {
      const q = Number(dayMap.get(col.id)) || 0;
      marks[col.id] = q > 0 ? 'Y' : 'N';
      qtys[col.id] = q;
      if (q > 0) any = true;
    }
    return { dateKey, dayNum, marks, qtys, hasDelivery: any };
  });

  const totalsByProduct = cols.map((col) => {
    let qty = 0;
    for (const day of days) qty += Number(day.qtys[col.id]) || 0;
    return { ...col, qty: Math.round(qty * 1000) / 1000 };
  });

  return {
    columns: cols,
    days,
    activeDays: days.filter((d) => d.hasDelivery).length,
    totalsByProduct,
  };
}

/**
 * One compact text line for a day (58mm): "01 Mlk Y Egg Y Brd N"
 * Matches PK doodh-shop monthly sheets (day + product + Y/N).
 * @param {{ dayNum: number, marks: Record<string,'Y'|'N'> }} day
 * @param {Array<{ id: string, abbrev: string }>} columns
 */
export function formatMilkHisabDayLine(day, columns = []) {
  const n = String(day.dayNum || 0).padStart(2, '0');
  const cells = (columns || []).map((col) => {
    const mark = day.marks?.[col.id] === 'Y' ? 'Y' : 'N';
    const tag = String(col.abbrev || 'Itm').trim().padEnd(3, ' ').slice(0, 3);
    return `${tag} ${mark}`;
  });
  return `${n} ${cells.join(' ')}`.trim();
}

/**
 * @param {string | null | undefined} name
 */
export function isMilkHisabWalkInCustomer(name) {
  return /walk[\s-]?in/i.test(String(name || ''));
}
