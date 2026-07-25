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
    draftWeekly: ur ? 'ہفتہ وار-مسودہ' : 'WEEKLY-DRAFT',
    draftMonthly: ur ? 'ماہانہ-مسودہ' : 'MONTHLY-DRAFT',
    shopFallback: ur ? 'دودھ کی دکان' : 'Milk shop',
  };
}

/**
 * Localize a human period label when possible (keep ISO dates).
 * @param {string} label
 * @param {MilkHisabBillLocale} locale
 * @param {'week' | 'month'} kind
 */
export function localizeMilkHisabPeriodLabel(label, locale, kind = 'month') {
  if (locale !== 'ur') return label || '';
  const raw = String(label || '');
  if (kind === 'week') {
    const m = raw.match(/Week\s+(\d+)/i);
    if (m) {
      const range = raw.match(/\(([^)]+)\)/);
      return range ? `ہفتہ ${m[1]} (${range[1]})` : `ہفتہ ${m[1]}`;
    }
  }
  // "July 2026" style from month parser
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
    if (urMonth) return `${urMonth} ${monthEn[2]}`;
  }
  return raw;
}
