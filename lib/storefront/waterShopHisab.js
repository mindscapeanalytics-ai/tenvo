/**
 * Water-delivery Route Hisab helpers — daily rider sheet + week/month collection.
 * Isolated: only use when isWaterHisabRelevant(category).
 * Date/period math reuses milk helpers (calendar-local, ISO week) without sharing tables.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import {
  toMilkHisabDateKey,
  toMilkHisabPeriodKey,
  toMilkHisabWeekKey,
  parseMilkHisabBillingPeriod,
  milkHisabPeriodsOverlap,
  buildMilkHisabPeriodKpis,
  shortMilkHisabProductLabel,
  abbreviateMilkHisabColumn,
  buildMilkHisabDayBreakdownGrid,
  formatMilkHisabDayHeaderLine,
  isMilkHisabBillRemindable,
  buildMilkHisabBillLinesForReminder,
  resolveMilkHisabRowPaymentStatus,
} from '@/lib/storefront/milkShopHisab';
import { waterDeliveryCadenceCoversDate } from '@/lib/data/pakistanDeliveryAreas';

export const WATER_HISAB_PERIOD_PREFIX = '[water_hisab_period=';
export const WATER_HISAB_COLLECTION_NOTE = 'Water Route Hisab collection';

export const WATER_HISAB_DEFAULT_COLUMN_HINTS = [
  { id: '19l_refill', label: '19L Refill', match: /19\s*l.*refill|refill.*19\s*l/i, preferUnit: 'bottle' },
  { id: '19l_bottle', label: '19L Bottle', match: /19\s*l.*(bottle|dispenser|gallon|can|new)|(bottle|dispenser|gallon|can|new).*19\s*l/i, preferUnit: 'bottle' },
  { id: '19l_gen', label: '19L', match: /19\s*l\b/i, preferUnit: 'bottle' },
  { id: '12l', label: '12L', match: /12\s*l\b/i, preferUnit: 'bottle' },
  { id: '5l_refill', label: '5L Refill', match: /5\s*l.*refill|refill.*5\s*l/i, preferUnit: 'bottle' },
  { id: '5l_jug', label: '5L Jug', match: /5\s*l.*(jug|bottle|can|new)|(jug|bottle|can|new).*5\s*l/i, preferUnit: 'bottle' },
  { id: '5l_gen', label: '5L', match: /5\s*l\b/i, preferUnit: 'bottle' },
  { id: '1_5l_case', label: '1.5L Case', match: /1\.5\s*l.*(case|pack|12)|(case|pack|12).*1\.5\s*l/i, preferUnit: 'case' },
  { id: '1_5l_single', label: '1.5L Single', match: /1\.5\s*l|1500\s*ml/i, preferUnit: 'bottle' },
  { id: '600ml', label: '600ml', match: /600\s*ml|500\s*ml|pet/i, preferUnit: 'case' },
  { id: 'deposit', label: 'Deposit', match: /deposit|empty|security/i, preferUnit: 'pcs' },
  { id: 'stand', label: 'Stand', match: /stand|dispenser\s*unit|cooler/i, preferUnit: 'pcs' },
];

/**
 * @param {string | null | undefined} category
 */
export function isWaterDeliveryStore(category) {
  return resolveDomainKey(category) === 'water-delivery';
}

/**
 * @param {string | null | undefined} category
 */
export function isWaterHisabRelevant(category) {
  return isWaterDeliveryStore(category);
}

/**
 * True when either milk or water route sheet applies.
 * @param {string | null | undefined} category
 */
export function isRouteHisabRelevant(category) {
  const key = resolveDomainKey(category);
  return key === 'milk-shop' || key === 'water-delivery';
}

export const toWaterHisabDateKey = toMilkHisabDateKey;
export const toWaterHisabPeriodKey = toMilkHisabPeriodKey;
export const toWaterHisabWeekKey = toMilkHisabWeekKey;
export const parseWaterHisabBillingPeriod = parseMilkHisabBillingPeriod;
export const waterHisabPeriodsOverlap = milkHisabPeriodsOverlap;
export const buildWaterHisabPeriodKpis = buildMilkHisabPeriodKpis;
export const abbreviateWaterHisabColumn = abbreviateMilkHisabColumn;
export const buildWaterHisabDayBreakdownGrid = buildMilkHisabDayBreakdownGrid;
export const formatWaterHisabDayHeaderLine = formatMilkHisabDayHeaderLine;
export const isWaterHisabBillRemindable = isMilkHisabBillRemindable;
export const buildWaterHisabBillLinesForReminder = buildMilkHisabBillLinesForReminder;
export const resolveWaterHisabRowPaymentStatus = resolveMilkHisabRowPaymentStatus;

/**
 * Resolves a clean, short, distinct label for a water product.
 * @param {object|string} nameOrProduct
 * @param {number} [max=14]
 */
export function shortWaterHisabProductLabel(nameOrProduct, max = 14) {
  const product =
    nameOrProduct && typeof nameOrProduct === 'object'
      ? nameOrProduct
      : { name: String(nameOrProduct || '') };

  if (product.hisabShortLabel) {
    const s = String(product.hisabShortLabel).trim();
    if (s.length <= max) return s;
    return s.slice(0, max);
  }

  const hinted = resolveWaterHisabHintLabel(product);
  if (hinted) {
    if (hinted.length <= max) return hinted;
    return hinted.slice(0, max);
  }

  let raw = String(product.name || 'Item').trim();
  if (raw.length > max) {
    raw = raw
      .replace(/\b(tenvo|fresh|pure|mineral|water)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (!raw) raw = String(product.name || 'Item').trim();
  if (raw.length <= max) return raw;
  return raw.slice(0, max);
}

/**
 * @param {string | null | undefined} notes
 */
export function extractWaterHisabPeriodFromNotes(notes) {
  const m = String(notes || '').match(/\[water_hisab_period=([^\]]+)\]/);
  return m?.[1] || null;
}

/**
 * @param {string} period
 */
export function waterHisabPeriodMarker(period) {
  return `${WATER_HISAB_PERIOD_PREFIX}${period}]`;
}

/**
 * @param {string | null | undefined} notes
 * @param {string} period
 */
export function invoiceHasWaterHisabPeriod(notes, period) {
  if (!notes || !period) return false;
  return String(notes).includes(waterHisabPeriodMarker(period));
}

/**
 * @param {Array<object>} invoices
 * @param {string} customerId
 * @param {string} periodKey
 */
export function resolveWaterHisabInvoiceForPeriod(invoices = [], customerId, periodKey) {
  const forCustomer = (invoices || []).filter((inv) => String(inv.customer_id) === String(customerId));
  if (!forCustomer.length) return null;
  const exact = forCustomer.find((inv) => invoiceHasWaterHisabPeriod(inv.notes, periodKey));
  if (exact) return exact;
  for (const inv of forCustomer) {
    const marked = extractWaterHisabPeriodFromNotes(inv.notes);
    if (marked && waterHisabPeriodsOverlap(marked, periodKey)) return inv;
  }
  return null;
}

/**
 * @param {object[]} products
 * @param {object} [settings]
 */
export function resolveWaterHisabProducts(products = [], settings = {}) {
  const rawIds = settings?.waterHisab?.productIds || settings?.storefront?.waterDelivery?.hisabProductIds;
  const active = (products || []).filter(
    (p) => p && p.id && p.is_active !== false && p.is_deleted !== true && (p.name || p.sku)
  );

  const withShortLabel = (p, label) => ({
    ...p,
    id: String(p.id),
    hisabShortLabel: label || resolveWaterHisabHintLabel(p) || null,
  });

  let out = [];
  if (Array.isArray(rawIds) && rawIds.length) {
    const uniqueRawIds = Array.from(new Set(rawIds.map((id) => String(id))));
    const byId = new Map(active.map((p) => [String(p.id), p]));
    const picked = uniqueRawIds.map((id) => byId.get(id)).filter(Boolean);
    if (picked.length) out = picked.slice(0, 8).map((p) => withShortLabel(p));
  }

  if (!out.length) {
    const used = new Set();
    for (const hint of WATER_HISAB_DEFAULT_COLUMN_HINTS) {
      const match = active.find((p) => {
        if (used.has(String(p.id))) return false;
        const blob = `${p.name || ''} ${p.category || ''} ${p.category_name || ''}`;
        if (!hint.match.test(blob)) return false;
        if (hint.preferUnit && p.unit) {
          const u = String(p.unit).toLowerCase();
          const prefer = String(hint.preferUnit).toLowerCase();
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
  }

  // Ensure strict unique product IDs in out list
  const seenIds = new Set();
  const uniqueOut = [];
  for (const p of out) {
    if (!seenIds.has(String(p.id))) {
      seenIds.add(String(p.id));
      uniqueOut.push(p);
    }
  }

  // Deduplicate any identical labels across products
  const labelCounts = new Map();
  uniqueOut.forEach((p) => {
    const lbl = p.hisabShortLabel || shortWaterHisabProductLabel(p, 14);
    labelCounts.set(lbl, (labelCounts.get(lbl) || 0) + 1);
  });

  return uniqueOut.slice(0, 8).map((p, idx) => {
    const baseLabel = p.hisabShortLabel || shortWaterHisabProductLabel(p, 14);
    if (labelCounts.get(baseLabel) > 1) {
      const name = String(p.name || '').toLowerCase();
      let suffix = '';
      if (/refill/i.test(name)) suffix = 'Rfl';
      else if (/jug/i.test(name)) suffix = 'Jug';
      else if (/bottle|new|can|gallon/i.test(name)) suffix = 'Bot';
      else if (/case|box|pack/i.test(name)) suffix = 'Case';
      else if (p.unit) suffix = String(p.unit).slice(0, 3);
      else suffix = `#${idx + 1}`;

      const uniqueLabel = suffix ? `${baseLabel} (${suffix})` : baseLabel;
      return { ...p, hisabShortLabel: uniqueLabel };
    }
    return { ...p, hisabShortLabel: baseLabel };
  });
}

/**
 * @param {object} product
 */
export function resolveWaterHisabHintLabel(product = {}) {
  const blob = `${product.name || ''} ${product.category || ''} ${product.category_name || ''}`;
  for (const hint of WATER_HISAB_DEFAULT_COLUMN_HINTS) {
    if (hint.match.test(blob)) return hint.label;
  }
  return null;
}

/**
 * @param {object} customer
 */
export function readWaterCustomerPrefs(customer = {}) {
  const dd = customer.domain_data && typeof customer.domain_data === 'object' ? customer.domain_data : {};
  const house =
    dd.houseno || dd.house_no || dd.houseNo || dd.villa || customer.address || '';
  const route = dd.deliveryroute || dd.delivery_route || dd.rider || '';
  const dailyBottles = Number(dd.dailybottles ?? dd.daily_bottles ?? dd.dailymilkkg ?? 0);
  const activeRaw = dd.deliveryactive ?? dd.delivery_active;
  const deliveryActive =
    activeRaw === false || activeRaw === 'No' || activeRaw === 'no' || activeRaw === 0
      ? false
      : true;
  const deliveryDays = String(dd.deliverydays || dd.delivery_days || 'Daily').trim() || 'Daily';
  const productRate = Number(dd.productrate ?? dd.product_rate ?? dd.accountrate ?? dd.rate ?? 0);
  const bottleBalance = Number(dd.bottlebalance ?? dd.bottle_balance ?? dd.balbottle ?? 0);
  const dayOfFollow = Number(dd.dayoffollow ?? dd.day_of_follow ?? dd.followday ?? 0);
  return {
    houseNo: String(house || '').trim(),
    floorFlat: String(dd.floorflat || dd.floor_flat || dd.flat || '').trim(),
    proprietorName: String(dd.proprietorname || dd.proprietor || dd.contactperson || '').trim(),
    accountNo: String(dd.accountno || dd.account_no || dd.partyaccountno || '').trim(),
    townCode: String(dd.towncode || dd.town_code || '').trim(),
    routeLabel: String(route || '').trim(),
    city: String(dd.city || '').trim(),
    deliveryArea: String(dd.deliveryarea || dd.delivery_area || dd.area || '').trim(),
    postalCode: String(dd.postalcode || dd.postal_code || dd.areacode || dd.area_code || dd.zip || '').trim(),
    customerType: String(dd.customertype || dd.customer_type || 'Home & Flat').trim() || 'Home & Flat',
    deliveryDays,
    dayOfFollow: Number.isFinite(dayOfFollow) && dayOfFollow > 0 ? dayOfFollow : 0,
    dailyBottles: Number.isFinite(dailyBottles) && dailyBottles > 0 ? dailyBottles : 0,
    productRate: Number.isFinite(productRate) && productRate > 0 ? productRate : 0,
    bottleBalance: Number.isFinite(bottleBalance) ? bottleBalance : 0,
    bottleSizePref: String(dd.bottlesizepref || dd.preferredbottlesize || dd.bottlesize || '').trim(),
    emptyDeposit: Number(dd.emptydeposit ?? dd.empty_deposit ?? dd.depositamount ?? 0) || 0,
    openingBalanceHint: Number(dd.openingbalancehint ?? dd.opening_balance_hint ?? dd.prevmbal ?? 0) || 0,
    deliveryActive,
    preferredPayment: String(
      dd.preferredpayment ||
        dd.preferred_payment ||
        dd.preferredpaymentmethod ||
        dd.preferred_payment_method ||
        ''
    ).trim(),
    /** Alias for milk-shaped day sheet code that expects dailyMilkKg */
    dailyMilkKg: Number.isFinite(dailyBottles) && dailyBottles > 0 ? dailyBottles : 0,
  };
}

/**
 * Classic plant formula: BAL = previous + DEL − REC
 * @param {{ previous?: number, delivered?: number, received?: number }} args
 */
export function computeWaterBottleBalance({ previous = 0, delivered = 0, received = 0 } = {}) {
  const prev = Number(previous) || 0;
  const del = Number(delivered) || 0;
  const rec = Number(received) || 0;
  return Math.round((prev + del - rec) * 1000) / 1000;
}

/**
 * Sale amount using account rate when set (ZARA RATE field).
 * @param {{ qty?: number, unitPrice?: number, accountRate?: number, discount?: number }} args
 */
export function computeWaterSaleAmount({ qty = 0, unitPrice = 0, accountRate = 0, discount = 0 } = {}) {
  const q = Number(qty) || 0;
  const rate = (Number(accountRate) > 0 ? Number(accountRate) : Number(unitPrice)) || 0;
  const disc = Number(discount) || 0;
  return Math.max(0, Math.round((q * rate - disc) * 100) / 100);
}

/**
 * Whether this customer should appear on today's route sheet.
 * Day of follow (1–31) gates monthly/custom accounts like classic NEW.EXE.
 * @param {ReturnType<typeof readWaterCustomerPrefs>} prefs
 * @param {Date} [date]
 */
export function isWaterCustomerDueOnDate(prefs, date = new Date()) {
  if (!prefs?.deliveryActive) return false;
  if (!waterDeliveryCadenceCoversDate(prefs.deliveryDays, date)) return false;
  const follow = Number(prefs.dayOfFollow) || 0;
  if (follow > 0 && follow <= 31) {
    const cadence = String(prefs.deliveryDays || '').toLowerCase();
    // Enforce calendar-day follow only for custom / monthly-style cadences.
    if (/custom|month|follow|monthly/.test(cadence)) {
      const day = date.getDate();
      const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return day === Math.min(follow, last);
    }
  }
  return true;
}

/**
 * @param {object | null | undefined} domainData
 * @param {string} periodKey
 * @returns {'paid'|'unpaid'|null}
 */
export function readWaterHisabPeriodPayment(domainData, periodKey) {
  const key = String(periodKey || '').trim();
  if (!key) return null;
  const dd = domainData && typeof domainData === 'object' ? domainData : {};
  const water = dd.waterHisab && typeof dd.waterHisab === 'object' ? dd.waterHisab : {};
  const map =
    (water.periodPayments && typeof water.periodPayments === 'object' ? water.periodPayments : null) ||
    (water.period_payments && typeof water.period_payments === 'object' ? water.period_payments : null) ||
    {};
  const raw = map[key];
  const status = String(raw || '').toLowerCase();
  if (status === 'paid') return 'paid';
  if (status === 'unpaid') return 'unpaid';
  return null;
}

/**
 * @param {object | null | undefined} domainData
 * @param {string} periodKey
 * @param {'paid'|'unpaid'} status
 */
export function patchWaterHisabPeriodPayment(domainData, periodKey, status) {
  const key = String(periodKey || '').trim();
  const nextStatus = String(status || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid';
  const dd = domainData && typeof domainData === 'object' ? { ...domainData } : {};
  const water =
    dd.waterHisab && typeof dd.waterHisab === 'object' ? { ...dd.waterHisab } : {};
  const map =
    water.periodPayments && typeof water.periodPayments === 'object'
      ? { ...water.periodPayments }
      : {};
  if (key) map[key] = nextStatus;
  water.periodPayments = map;
  dd.waterHisab = water;
  return dd;
}

/**
 * Walk-in / counter customers without a house route.
 * @param {object} customer
 */
export function isWaterHisabWalkInCustomer(customer = {}) {
  const prefs = readWaterCustomerPrefs(customer);
  if (!prefs.deliveryActive) return true;
  const name = String(customer.name || '').toLowerCase();
  if (/walk[\s-]?in|counter|cash\s*sale/.test(name)) return true;
  return !prefs.houseNo && !prefs.routeLabel && !prefs.deliveryArea && prefs.dailyBottles <= 0;
}

/**
 * Rider shift load-out vs return reconciliation.
 * @param {{ loadedBottles?: number, returnedFull?: number, returnedEmpty?: number, cashCollected?: number, defaultUnitPrice?: number }} shift
 */
export function computeWaterRiderShiftReconciliation({
  loadedBottles = 0,
  returnedFull = 0,
  returnedEmpty = 0,
  cashCollected = 0,
  defaultUnitPrice = 150,
} = {}) {
  const loaded = Math.max(0, Number(loadedBottles) || 0);
  const fullRet = Math.max(0, Number(returnedFull) || 0);
  const emptyRet = Math.max(0, Number(returnedEmpty) || 0);
  const cash = Math.max(0, Number(cashCollected) || 0);
  const rate = Math.max(0, Number(defaultUnitPrice) || 0);

  const delivered = Math.max(0, loaded - fullRet);
  const expectedCash = Math.round(delivered * rate * 100) / 100;
  const cashShortage = Math.round((expectedCash - cash) * 100) / 100;
  const emptyShortage = Math.max(0, delivered - emptyRet);

  return {
    loadedBottles: loaded,
    returnedFull: fullRet,
    returnedEmpty: emptyRet,
    deliveredBottles: delivered,
    cashCollected: cash,
    expectedCash,
    cashShortage,
    emptyShortage,
    isBalanced: Math.abs(cashShortage) <= 1 && emptyShortage === 0,
  };
}

/**
 * Aggregates plant bottle assets, customer bottle balances, and float value.
 * @param {{ plantFull?: number, plantEmpty?: number, customerBalances?: number[], damagedCount?: number, bottleUnitCost?: number }} args
 */
export function resolveWaterBottleFloatSummary({
  plantFull = 100,
  plantEmpty = 50,
  customerBalances = [],
  damagedCount = 0,
  bottleUnitCost = 1200,
} = {}) {
  const fullAtPlant = Math.max(0, Number(plantFull) || 0);
  const emptyAtPlant = Math.max(0, Number(plantEmpty) || 0);
  const damaged = Math.max(0, Number(damagedCount) || 0);
  const unitCost = Math.max(0, Number(bottleUnitCost) || 1200);

  const withCustomers = (customerBalances || []).reduce((sum, bal) => sum + Math.max(0, Number(bal) || 0), 0);
  const totalFloatBottles = fullAtPlant + emptyAtPlant + withCustomers + damaged;
  const totalAssetValue = Math.round(totalFloatBottles * unitCost * 100) / 100;

  return {
    plantFull: fullAtPlant,
    plantEmpty: emptyAtPlant,
    withCustomers: Math.round(withCustomers * 1000) / 1000,
    damagedScrapped: damaged,
    totalFloatBottles: Math.round(totalFloatBottles * 1000) / 1000,
    bottleUnitCost: unitCost,
    totalAssetValue,
  };
}

/**
 * Identify customers with unreturned empty bottles holding idle inventory.
 * @param {Array<object>} customers
 * @param {number} [minBottleBal]
 */
export function findIdleBottleCustomers(customers = [], minBottleBal = 2) {
  const result = [];
  for (const c of customers || []) {
    const prefs = readWaterCustomerPrefs(c);
    if (prefs.bottleBalance >= minBottleBal) {
      result.push({
        id: String(c.id),
        name: c.name,
        phone: c.phone || null,
        houseNo: prefs.houseNo,
        routeLabel: prefs.routeLabel,
        bottleBalance: prefs.bottleBalance,
        accountNo: prefs.accountNo,
      });
    }
  }
  return result.sort((a, b) => b.bottleBalance - a.bottleBalance);
}

