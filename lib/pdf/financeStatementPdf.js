/**
 * Standard-format finance statement PDFs (jsPDF + autotable).
 * Shared header/footer for P&L, Balance Sheet, Trial Balance, Cash Flow, Day Book, GL, aging, GST.
 * Brand accent follows Store Settings (same resolver as invoice PDFs).
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  WINE,
  resolveInvoiceBrandColor,
  resolveBusinessRegistrationLines,
  formatBusinessAddressBlock,
} from '@/lib/pdf/invoiceFormat';

/**
 * @typedef {Object} FinancePdfMeta
 * @property {string} [businessName]
 * @property {string} [title]
 * @property {string} [subtitle]
 * @property {string} [periodLabel]
 * @property {string} [currency]
 * @property {string} [locale]
 * @property {string} [generatedAt]
 * @property {string} [footnote]
 * @property {boolean} [balanced]
 * @property {[number, number, number]} [brandRgb]
 * @property {object} [business] - hub business (settings.brand.primaryColor)
 */

/**
 * Resolve accent RGB for finance PDFs (tenant brand → wine fallback).
 * @param {FinancePdfMeta} meta
 * @returns {[number, number, number]}
 */
export function resolveFinancePdfBrand(meta = {}) {
  if (Array.isArray(meta.brandRgb) && meta.brandRgb.length === 3) {
    return /** @type {[number, number, number]} */ (meta.brandRgb);
  }
  const business = meta.business || {};
  const settings =
    business.settingsParsed ||
    (business.settings && typeof business.settings === 'object' ? business.settings : {});
  return resolveInvoiceBrandColor(business, settings);
}

/**
 * Build shared meta from hub business + regional pack.
 * @param {object} [business]
 * @param {object} [opts]
 * @param {string} [opts.currency]
 * @param {string} [opts.locale]
 * @param {string} [opts.periodLabel]
 * @param {string} [opts.title]
 * @param {string} [opts.footnote]
 * @param {boolean} [opts.balanced]
 * @param {string} [opts.taxIdLabel]
 */
export function buildFinancePdfMeta(business = {}, opts = {}) {
  const settings =
    business?.settings && typeof business.settings === 'object' ? business.settings : {};
  const brandRgb = resolveInvoiceBrandColor(business, settings);
  const taxIdLabel = opts.taxIdLabel || 'Tax ID';
  const taxIds = settings?.tax || settings?.compliance || {};
  const ntn = business?.ntn || taxIds.ntn || settings?.ntn;
  const addressLines = formatBusinessAddressBlock(business);
  const regLines = resolveBusinessRegistrationLines(business, settings);

  const subtitleParts = [];
  if (ntn) subtitleParts.push(`${taxIdLabel}: ${ntn}`);
  for (const line of regLines) {
    if (!ntn || !String(line).includes(String(ntn))) subtitleParts.push(line);
  }
  if (addressLines.length) subtitleParts.push(addressLines.join(', '));

  return {
    businessName: business?.business_name || business?.name || 'Business',
    business,
    brandRgb,
    currency: opts.currency || business?.currency || '',
    locale: opts.locale || undefined,
    subtitle: opts.subtitle != null ? opts.subtitle : subtitleParts.join('  ·  '),
    periodLabel: opts.periodLabel || '',
    title: opts.title || 'Financial Report',
    generatedAt: opts.generatedAt || new Date().toISOString(),
    footnote: opts.footnote || 'Confidential',
    balanced: opts.balanced,
  };
}

/**
 * @param {number} value
 * @param {string} [locale]
 */
function formatPdfNumber(value, locale) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  try {
    return n.toLocaleString(locale || undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

/**
 * Draw shared header; returns Y after header.
 * @param {import('jspdf').jsPDF} doc
 * @param {FinancePdfMeta} meta
 */
export function drawFinancePdfHeader(doc, meta = {}) {
  const brand = resolveFinancePdfBrand(meta);
  const {
    businessName = 'Business',
    title = 'Financial Report',
    subtitle = '',
    periodLabel = '',
    currency = '',
    locale,
    generatedAt = new Date().toISOString(),
  } = meta;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...brand);
  doc.text(String(businessName).slice(0, 60), 14, 16);

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let y = 32;
  if (subtitle) {
    const lines = doc.splitTextToSize(String(subtitle), 182);
    doc.text(lines, 14, y);
    y += lines.length * 4.5;
  }
  if (periodLabel) {
    doc.text(periodLabel, 14, y);
    y += 5;
  }
  let generatedLabel = '';
  try {
    generatedLabel = new Date(generatedAt).toLocaleString(locale || undefined);
  } catch {
    generatedLabel = new Date(generatedAt).toLocaleString();
  }
  const metaLine = [currency ? `Currency: ${currency}` : null, `Generated: ${generatedLabel}`]
    .filter(Boolean)
    .join('  |  ');
  if (metaLine) {
    doc.text(metaLine, 14, y);
    y += 6;
  }
  doc.setDrawColor(...brand);
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
  return y + 6;
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {FinancePdfMeta} meta
 */
export function drawFinancePdfFooter(doc, meta = {}) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const balanceNote =
      meta.balanced === true
        ? 'Books balanced'
        : meta.balanced === false
          ? 'Warning: imbalance detected'
          : '';
    const left = [meta.footnote || 'Confidential', balanceNote].filter(Boolean).join('  ·  ');
    doc.text(left, 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
  }
}

/**
 * Generic tabular finance PDF.
 * @param {FinancePdfMeta} meta
 * @param {Array<{label: string, key: string}>} columns
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ filename?: string, save?: boolean }} [opts]
 */
export function generateFinanceStatementPDF(meta, columns, rows, opts = {}) {
  const doc = new jsPDF();
  const brand = resolveFinancePdfBrand(meta);
  const locale = meta.locale;
  const startY = drawFinancePdfHeader(doc, meta);

  const tableData = (rows || []).map((row) =>
    columns.map((col) => {
      const v = row[col.key];
      if (v == null || v === '') return '';
      return typeof v === 'number' ? formatPdfNumber(v, locale) : String(v);
    })
  );

  doc.autoTable({
    startY,
    head: [columns.map((c) => c.label)],
    body: tableData,
    theme: 'striped',
    tableWidth: 182,
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [252, 248, 249] },
  });

  drawFinancePdfFooter(doc, meta);

  if (opts.save !== false) {
    const filename = opts.filename || `${(meta.title || 'report').replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
  }
  return doc;
}

/**
 * Multi-section statement (P&L / BS style).
 * @param {FinancePdfMeta} meta
 * @param {Array<{ heading: string, rows: Array<{label: string, amount: number|string}>, totalLabel?: string, totalAmount?: number }>} sections
 * @param {{ filename?: string }} [opts]
 */
export function generateSectionedFinancePDF(meta, sections, opts = {}) {
  const doc = new jsPDF();
  const brand = resolveFinancePdfBrand(meta);
  const locale = meta.locale;
  let y = drawFinancePdfHeader(doc, meta);

  for (const section of sections || []) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text(section.heading, 14, y);
    y += 4;

    const body = (section.rows || []).map((r) => [
      r.label,
      typeof r.amount === 'number' ? formatPdfNumber(r.amount, locale) : String(r.amount ?? ''),
    ]);
    if (section.totalLabel != null) {
      body.push([
        section.totalLabel,
        typeof section.totalAmount === 'number'
          ? formatPdfNumber(section.totalAmount, locale)
          : String(section.totalAmount ?? ''),
      ]);
    }

    doc.autoTable({
      startY: y,
      head: [['Description', meta.currency ? `Amount (${meta.currency})` : 'Amount']],
      body,
      theme: 'plain',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [245, 245, 245], textColor: 40, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'normal' } },
      didParseCell(data) {
        if (section.totalLabel && data.section === 'body' && data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = brand;
        }
      },
    });
    y = (doc.lastAutoTable?.finalY || y) + 10;
  }

  drawFinancePdfFooter(doc, meta);
  doc.save(opts.filename || `${(meta.title || 'statement').replace(/\s+/g, '-')}.pdf`);
  return doc;
}

/**
 * Back-compat wrapper used by aging / GST — richer header than legacy generateReportPDF.
 * Does not auto-download; callers call `doc.save(...)`.
 */
export function generateReportPDFWithChrome(title, data, columns, meta = {}) {
  return generateFinanceStatementPDF(
    {
      businessName: meta.businessName || 'Business',
      business: meta.business,
      brandRgb: meta.brandRgb,
      title,
      subtitle: meta.subtitle,
      periodLabel: meta.periodLabel,
      currency: meta.currency,
      locale: meta.locale,
      generatedAt: meta.generatedAt || new Date().toISOString(),
      footnote: meta.footnote,
      balanced: meta.balanced,
    },
    columns,
    data,
    { filename: meta.filename || `${String(title).replace(/\s+/g, '-')}.pdf`, save: false }
  );
}

export { WINE as FINANCE_PDF_FALLBACK_BRAND };
