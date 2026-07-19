/**
 * PDF-safe invoice formatting (ASCII-only — jsPDF Helvetica cannot render ₨, ₹, Arabic symbols).
 */

import { getRegionalStandards } from '@/lib/utils/regionalHelpers';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import { getDomainConfig } from '@/lib/config/domains';

const PAGE_MARGIN = 14;
const CONTENT_WIDTH = 182; // A4 210 - 2*14
/** Default accent when tenant has not set Store Settings brand color */
const WINE = [139, 21, 56];

const PROVINCE_LABELS = {
  punjab: 'Punjab',
  sindh: 'Sindh',
  kp: 'Khyber Pakhtunkhwa',
  kpk: 'Khyber Pakhtunkhwa',
  balochistan: 'Balochistan',
  islamabad: 'Islamabad',
};

const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  bank: 'Bank Transfer',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  payfast: 'Card (PayFast)',
  card: 'Card',
  credit: 'Credit',
  cheque: 'Cheque',
  check: 'Cheque',
};

/** @param {number} amount */
export function formatPdfAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Parse #RGB / #RRGGBB to jsPDF RGB tuple.
 * @param {string|null|undefined} hex
 * @param {[number, number, number]} [fallback]
 * @returns {[number, number, number]}
 */
export function parseHexColorToRgb(hex, fallback = WINE) {
  if (!hex || typeof hex !== 'string') return fallback;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * Resolve invoice accent from tenant Store Settings brand color.
 * @param {object} [business]
 * @param {object} [settingsParsed]
 * @returns {[number, number, number]}
 */
export function resolveInvoiceBrandColor(business = {}, settingsParsed = {}) {
  const settings =
    settingsParsed && typeof settingsParsed === 'object' && Object.keys(settingsParsed).length
      ? settingsParsed
      : business?.settingsParsed && typeof business.settingsParsed === 'object'
        ? business.settingsParsed
        : business?.settings && typeof business.settings === 'object'
          ? business.settings
          : {};

  const hex =
    settings?.brand?.primaryColor ||
    settings?.storefront?.brand?.primaryColor ||
    business?.brandColor ||
    business?.brand_color ||
    null;

  return parseHexColorToRgb(hex, WINE);
}

/**
 * Human-readable payment method for PDF (no emoji — Helvetica cannot render them).
 * @param {string|null|undefined} method
 */
export function formatPdfPaymentMethod(method) {
  if (method == null || method === '') return null;
  const id = String(method).trim().toLowerCase().replace(/\s+/g, '_');
  if (PAYMENT_METHOD_LABELS[id]) return PAYMENT_METHOD_LABELS[id];
  return String(method)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * @param {string|null|undefined} province
 */
export function formatPdfProvinceLabel(province) {
  if (!province) return '';
  const key = String(province).trim().toLowerCase();
  if (PROVINCE_LABELS[key]) return PROVINCE_LABELS[key];
  return String(province)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * ASCII-safe money string for PDF output.
 * @param {number} amount
 * @param {string} [currencyCode]
 */
export function formatPdfMoney(amount, currencyCode = 'PKR') {
  const code = String(currencyCode || 'PKR').toUpperCase();
  const formatted = formatPdfAmount(amount);

  switch (code) {
    case 'PKR':
      return `Rs. ${formatted}`;
    case 'INR':
      return `INR ${formatted}`;
    case 'USD':
    case 'CAD':
    case 'AUD':
      return `$${formatted}`;
    case 'EUR':
      return `EUR ${formatted}`;
    case 'GBP':
      return `GBP ${formatted}`;
    case 'AED':
      return `AED ${formatted}`;
    case 'SAR':
      return `SAR ${formatted}`;
    case 'CNY':
      return `CNY ${formatted}`;
    default:
      return `${code} ${formatted}`;
  }
}

/**
 * @param {object} business
 * @param {object} [settingsParsed]
 */
export function resolveBusinessRegistrationLines(business = {}, settingsParsed = {}) {
  const lines = [];
  const tax = settingsParsed?.tax || settingsParsed?.compliance || {};
  const pack = getBusinessRegionalPack({
    ...business,
    settings: {
      ...(business?.settings && typeof business.settings === 'object' ? business.settings : {}),
      ...settingsParsed,
    },
  });
  const standards = getRegionalStandards(pack.countryIso);

  const ntn = business.ntn || tax.ntn || settingsParsed?.ntn;
  const srn = business.srn || tax.srn || settingsParsed?.srn;
  const trn = tax.trn || tax.vat_number || business.trn;
  const gstin = tax.gstin || tax.gst;

  if (pack.countryIso === 'PK') {
    if (ntn) lines.push(`NTN: ${ntn}`);
    if (srn) lines.push(`SRN: ${srn}`);
  } else if (standards.countryCode === 'AE' && trn) {
    lines.push(`TRN: ${trn}`);
  } else if (gstin) {
    lines.push(`GSTIN: ${gstin}`);
  } else if (trn) {
    lines.push(`${standards.taxIdLabel}: ${trn}`);
  } else if (ntn) {
    lines.push(`${standards.taxIdLabel}: ${ntn}`);
  }

  return lines;
}

/**
 * @param {object} business
 */
export function formatBusinessAddressBlock(business = {}) {
  const parts = [];
  if (business.address) parts.push(String(business.address).trim());

  const cityLine = [business.city, business.state, business.postal_code || business.postalCode]
    .filter(Boolean)
    .join(', ');
  if (cityLine) parts.push(cityLine);

  if (business.country) parts.push(String(business.country).trim());

  return parts;
}

/**
 * Document title for PDF header. Default style is retail/sales across domains.
 * @param {object} params
 */
export function resolveInvoiceDocumentTitle({ category, invoiceType, standards, isPakistaniDomain }) {
  const domainLabel = getDomainConfig(category)?.label_overrides?.invoice;
  const type = String(invoiceType || 'retail').toLowerCase();

  if (type === 'export') return 'EXPORT INVOICE';

  // Retail / sales is the platform default for day-to-day invoicing
  if (type === 'retail' || type === 'sales' || type === 'sale') {
    return domainLabel ? String(domainLabel).toUpperCase() : 'SALES INVOICE';
  }

  // Explicit tax / VAT / FBR documents
  if (type === 'tax' || type === 'vat' || type === 'fbr' || type === 'gst') {
    if (isPakistaniDomain || standards?.countryCode === 'PK') return 'TAX INVOICE';
    const taxLabel = standards?.taxLabel || 'Tax';
    return `${String(taxLabel).toUpperCase()} INVOICE`;
  }

  if (domainLabel) return String(domainLabel).toUpperCase();
  return 'SALES INVOICE';
}

/**
 * Normalize totals from builder or DB shape.
 * @param {object} totals
 * @param {object} [invoice]
 */
export function normalizePdfTotals(totals = {}, invoice = {}) {
  const pakistaniTax = invoice.pakistaniTax || {};
  const taxDetails = totals.taxDetails || invoice.tax_details || {};

  const subtotal = Number(
    totals.subtotal ?? totals.rawSubtotal ?? invoice.subtotal ?? 0
  );
  const totalTax = Number(
    totals.totalTax ?? totals.tax_total ?? totals.total_tax ?? invoice.tax_total ?? invoice.total_tax ?? pakistaniTax.totalTax ?? 0
  );
  const discount = Number(
    totals.discount ?? totals.discount_total ?? invoice.discount_total ?? 0
  );
  const seasonalDiscount = Number(totals.seasonalDiscount ?? 0);
  const roundOff = Number(totals.roundOff ?? invoice.roundOff ?? 0);
  const total = Number(
    totals.total ?? totals.grand_total ?? invoice.grand_total ?? invoice.amount ?? subtotal + totalTax - discount
  );

  const federalSalesTax = Number(
    totals.federalSalesTax ?? pakistaniTax.federalSalesTax ?? taxDetails.federalSalesTax ?? taxDetails.fst ?? 0
  );
  const provincialSalesTax = Number(
    totals.provincialSalesTax ?? pakistaniTax.provincialSalesTax ?? taxDetails.provincialSalesTax ?? taxDetails.pst ?? 0
  );

  /** @type {{ label: string, amount: number }[]} */
  const taxLines = [];

  if (taxDetails && typeof taxDetails === 'object' && !Array.isArray(taxDetails)) {
    for (const [label, detail] of Object.entries(taxDetails)) {
      const amt = Number(detail?.amount ?? detail?.tax ?? detail ?? 0);
      if (amt > 0) taxLines.push({ label: String(label), amount: amt });
    }
  }

  if (!taxLines.length && totalTax > 0) {
    if (federalSalesTax > 0) taxLines.push({ label: 'Federal Sales Tax', amount: federalSalesTax });
    if (provincialSalesTax > 0) taxLines.push({ label: 'Provincial Sales Tax', amount: provincialSalesTax });
    if (!federalSalesTax && !provincialSalesTax) {
      const packLabel = invoice?.standards?.taxLabel || invoice?.taxLabel || totals?.taxLabel || 'Tax';
      taxLines.push({ label: packLabel, amount: totalTax });
    }
  }

  return {
    subtotal,
    discount,
    seasonalDiscount,
    roundOff,
    total,
    totalTax,
    taxLines,
  };
}

/**
 * @param {object} item
 */
export function normalizePdfLineItem(item) {
  const qty = Number(item.quantity ?? 0);
  const rate = Number(item.rate ?? item.unit_price ?? item.price ?? 0);
  const amount = Number(item.amount ?? item.total_amount ?? qty * rate);
  return {
    name: item.name || item.product_name || item.description || 'Item',
    description: item.description || '',
    quantity: qty,
    unit: item.unit || item.metadata?.unit || 'pcs',
    rate,
    amount,
    taxPercent: Number(item.taxPercent ?? item.tax_percent ?? 0),
    discount: Number(item.discount ?? 0),
  };
}

export { PAGE_MARGIN, CONTENT_WIDTH, WINE, PROVINCE_LABELS, PAYMENT_METHOD_LABELS };
