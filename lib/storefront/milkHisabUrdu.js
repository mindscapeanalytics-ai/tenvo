/**
 * Urdu (PK) copy + dairy product labels for milk Route Hisab 58mm day sheets.
 * Day grid stays Latin abbrevs + Y/N for thermal alignment; chrome/totals use Urdu.
 */

/** @typedef {'en' | 'ur'} MilkHisabBillLocale */

export const MILK_HISAB_BILL_LOCALES = Object.freeze(['en', 'ur']);

/**
 * @param {unknown} value
 * @returns {MilkHisabBillLocale}
 */
export function normalizeMilkHisabBillLocale(value) {
  return String(value || '').toLowerCase() === 'ur' ? 'ur' : 'en';
}

const URDU_UNIT = Object.freeze({
  kg: 'کلو',
  pcs: 'عدد',
  dozen: 'درجن',
  pack: 'پیک',
  liter: 'لیٹر',
  litre: 'لیٹر',
  l: 'لیٹر',
  g: 'گرام',
  ml: 'ملی',
});

/** Hint-id / English token → short Urdu product name for totals. */
const URDU_PRODUCT_BY_HINT = Object.freeze({
  milk: 'دودھ',
  eggs: 'انڈے',
  bread: 'روٹی',
  butter: 'مکھن',
  cream: 'ملائی',
  dahi: 'دہی',
  lassi: 'لسی',
  paneer: 'پنیر',
});

const URDU_PRODUCT_MATCHERS = [
  { match: /fresh milk|(^|\s)milk(\s|$)|doodh|دودھ|olper|anhaar|nurpur|haleeb/i, urdu: 'دودھ' },
  { match: /egg|انڈ/i, urdu: 'انڈے' },
  { match: /bread|bakery|parlor|روٹی|نان/i, urdu: 'روٹی' },
  { match: /butter|makkhan|مکھن/i, urdu: 'مکھن' },
  { match: /cream|malai|ملائی/i, urdu: 'ملائی' },
  { match: /dahi|yogurt|yoghurt|دہی/i, urdu: 'دہی' },
  { match: /lassi|لسی/i, urdu: 'لسی' },
  { match: /paneer|khoya|barfi|kulfi|پنیر/i, urdu: 'پنیر' },
];

/** Preferred print column order for PK doodh-shop day grids. */
const PRINT_PRODUCT_ORDER = Object.freeze([
  'milk',
  'dahi',
  'lassi',
  'eggs',
  'bread',
  'butter',
  'cream',
  'paneer',
]);

/**
 * @param {string | null | undefined} iso YYYY-MM-DD
 */
export function formatMilkHisabPkDate(iso) {
  const raw = String(iso || '').trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return raw;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * @param {string | null | undefined} unit
 */
export function milkHisabUrduUnit(unit) {
  const key = String(unit || '')
    .trim()
    .toLowerCase();
  if (!key) return '';
  return URDU_UNIT[key] || unit;
}

/**
 * Map inventory / short label to a compact Urdu product name.
 * @param {{ name?: string, hisabShortLabel?: string, shortLabel?: string, id?: string } | string | null | undefined} product
 */
export function milkHisabUrduProductLabel(product) {
  if (product == null) return 'آئٹم';
  if (typeof product === 'string') {
    return resolveUrduFromText(product);
  }
  const hintId = String(product.id || '').toLowerCase();
  if (URDU_PRODUCT_BY_HINT[hintId]) return URDU_PRODUCT_BY_HINT[hintId];
  const text = [product.hisabShortLabel, product.shortLabel, product.name]
    .filter(Boolean)
    .join(' ');
  return resolveUrduFromText(text) || 'آئٹم';
}

function resolveUrduFromText(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  for (const [hint, urdu] of Object.entries(URDU_PRODUCT_BY_HINT)) {
    if (lower === hint || lower.includes(hint)) return urdu;
  }
  for (const row of URDU_PRODUCT_MATCHERS) {
    if (row.match.test(raw)) return row.urdu;
  }
  return raw;
}

function productOrderKey(product) {
  const text = [
    product?.hisabShortLabel,
    product?.shortLabel,
    product?.name,
    product?.label,
    product?.abbrev,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  for (let i = 0; i < PRINT_PRODUCT_ORDER.length; i += 1) {
    const key = PRINT_PRODUCT_ORDER[i];
    if (text.includes(key) || text.includes(URDU_PRODUCT_BY_HINT[key] || '')) return i;
    if (key === 'milk' && /doodh|دودھ/.test(text)) return i;
    if (key === 'eggs' && /egg|انڈ/.test(text)) return i;
    if (key === 'bread' && /bread|روٹی/.test(text)) return i;
    if (key === 'butter' && /butter|مکھن/.test(text)) return i;
    if (key === 'cream' && /cream|ملائی/.test(text)) return i;
  }
  return 100;
}

/**
 * Stable milk-shop column order for readable day sheets.
 * @param {Array<object>} columns
 */
export function sortMilkHisabPrintColumns(columns = []) {
  return [...(columns || [])].sort((a, b) => {
    const oa = productOrderKey(a);
    const ob = productOrderKey(b);
    if (oa !== ob) return oa - ob;
    return String(a.shortLabel || a.name || '').localeCompare(String(b.shortLabel || b.name || ''));
  });
}

/**
 * Readable totals line: "دودھ · 7 کلو" (numbers stay LTR-friendly).
 * @param {{ label: string, qty: number, unit?: string }} total
 * @param {MilkHisabBillLocale} locale
 */
export function formatMilkHisabTotalLine(total, locale = 'en') {
  const label = String(total?.label || 'Item').trim();
  const qty = Number(total?.qty);
  const qtyText = Number.isFinite(qty) ? String(qty) : '';
  const unit = String(total?.unit || '').trim();
  const qtyUnit = [qtyText, unit].filter(Boolean).join(' ');
  if (locale === 'ur') {
    return [label, qtyUnit].filter(Boolean).join(' · ');
  }
  return [label, qtyUnit].filter(Boolean).join(' ');
}

/**
 * Static chrome strings for day-sheet bills.
 * @param {MilkHisabBillLocale} locale
 * @param {'week' | 'month'} kind
 */
export function getMilkHisabDaySheetCopy(locale, kind = 'month') {
  const ur = locale === 'ur';
  return {
    documentLabel: ur
      ? kind === 'week'
        ? 'ہفتہ وار یومیہ بل'
        : 'ماہانہ یومیہ بل'
      : kind === 'week'
        ? 'Weekly Day Sheet'
        : 'Monthly Day Sheet',
    housePrefix: ur ? 'مکان' : 'H',
    daysWord: ur ? 'دن' : 'days',
    cash: ur ? 'نقد' : 'CASH',
    credit: ur ? 'ادھار' : 'CREDIT',
    total: ur ? 'کل رقم' : 'TOTAL',
    thanks: ur ? 'شکریہ' : 'Shukriya · Thank you',
    legend: ur ? 'Y = ملا · N = نہیں ملا' : 'Y = delivered · N = not delivered',
    customerFallback: ur ? 'گاہک' : 'Customer',
    draftWeekly: ur ? 'مسودہ' : 'DRAFT',
    draftMonthly: ur ? 'مسودہ' : 'DRAFT',
    shopFallback: ur ? 'دودھ کی دکان' : 'Milk shop',
    daySection: ur ? 'روزانہ تفصیل (Y/N)' : 'Day delivery (Y/N)',
    totalSection: ur ? 'کل تعداد اور رقم' : 'Totals',
    paidDays: ur ? 'فعال دن' : 'active days',
  };
}

/**
 * Split period into title + date range so RTL does not scramble ISO dates.
 * @param {string} label
 * @param {MilkHisabBillLocale} locale
 * @param {'week' | 'month'} kind
 * @param {{ startIso?: string, endIso?: string }} [bounds]
 * @returns {{ title: string, range: string }}
 */
export function localizeMilkHisabPeriodParts(label, locale, kind = 'month', bounds = {}) {
  const raw = String(label || '').trim();
  const startIso = bounds.startIso || '';
  const endIso = bounds.endIso || '';

  if (locale !== 'ur') {
    if (kind === 'week') {
      const m = raw.match(/Week\s+(\d+)/i);
      const title = m ? `Week ${m[1]}` : raw || 'Week';
      const range =
        startIso && endIso
          ? `${startIso} to ${endIso}`
          : (raw.match(/\(([^)]+)\)/)?.[1] || '').trim();
      return { title, range };
    }
    return { title: raw || 'Month', range: '' };
  }

  if (kind === 'week') {
    const m = raw.match(/Week\s+(\d+)/i);
    const weekNum = m?.[1] || '';
    const title = weekNum ? `ہفتہ ${weekNum}` : 'ہفتہ وار';
    let range = '';
    if (startIso && endIso) {
      range = `${formatMilkHisabPkDate(startIso)} تا ${formatMilkHisabPkDate(endIso)}`;
    } else {
      const rm = raw.match(/\((\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\)/i);
      if (rm) range = `${formatMilkHisabPkDate(rm[1])} تا ${formatMilkHisabPkDate(rm[2])}`;
    }
    return { title, range };
  }

  const monthEn = raw.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i
  );
  if (monthEn) {
    const months = {
      january: 'جنوری',
      february: 'فروری',
      march: 'مارچ',
      april: 'اپریل',
      may: 'مئی',
      june: 'جون',
      july: 'جولائی',
      august: 'اگست',
      september: 'ستمبر',
      october: 'اکتوبر',
      november: 'نومبر',
      december: 'دسمبر',
    };
    const urMonth = months[monthEn[1].toLowerCase()];
    if (urMonth) return { title: `${urMonth} ${monthEn[2]}`, range: '' };
  }
  return { title: raw, range: '' };
}

/**
 * Localize a human period label when possible (single-line fallback).
 * @param {string} label
 * @param {MilkHisabBillLocale} locale
 * @param {'week' | 'month'} kind
 * @param {{ startIso?: string, endIso?: string }} [bounds]
 */
export function localizeMilkHisabPeriodLabel(label, locale, kind = 'month', bounds = {}) {
  const parts = localizeMilkHisabPeriodParts(label, locale, kind, bounds);
  return [parts.title, parts.range].filter(Boolean).join(' · ');
}
