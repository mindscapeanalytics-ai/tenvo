/**
 * Standard-format finance statement PDFs (jsPDF + autotable).
 * Shared header/footer for P&L, Balance Sheet, Trial Balance, Cash Flow, Day Book, GL, aging, GST.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BRAND = [139, 21, 56];

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
 */

/**
 * Draw shared header; returns Y after header.
 * @param {import('jspdf').jsPDF} doc
 * @param {FinancePdfMeta} meta
 */
export function drawFinancePdfHeader(doc, meta = {}) {
  const {
    businessName = 'Business',
    title = 'Financial Report',
    subtitle = '',
    periodLabel = '',
    currency = '',
    generatedAt = new Date().toISOString(),
  } = meta;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...BRAND);
  doc.text(String(businessName).slice(0, 60), 14, 16);

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let y = 32;
  if (subtitle) {
    doc.text(subtitle, 14, y);
    y += 5;
  }
  if (periodLabel) {
    doc.text(periodLabel, 14, y);
    y += 5;
  }
  const metaLine = [
    currency ? `Currency: ${currency}` : null,
    `Generated: ${new Date(generatedAt).toLocaleString()}`,
  ]
    .filter(Boolean)
    .join('  |  ');
  if (metaLine) {
    doc.text(metaLine, 14, y);
    y += 6;
  }
  doc.setDrawColor(...BRAND);
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
  const startY = drawFinancePdfHeader(doc, meta);

  const tableData = (rows || []).map((row) =>
    columns.map((col) => {
      const v = row[col.key];
      if (v == null) return '';
      return typeof v === 'number' ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v);
    })
  );

  doc.autoTable({
    startY,
    head: [columns.map((c) => c.label)],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
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
  let y = drawFinancePdfHeader(doc, meta);

  for (const section of sections || []) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(section.heading, 14, y);
    y += 4;

    const body = (section.rows || []).map((r) => [
      r.label,
      typeof r.amount === 'number'
        ? Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(r.amount ?? ''),
    ]);
    if (section.totalLabel != null) {
      body.push([
        section.totalLabel,
        typeof section.totalAmount === 'number'
          ? Number(section.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : String(section.totalAmount ?? ''),
      ]);
    }

    doc.autoTable({
      startY: y,
      head: [['Description', meta.currency ? `Amount (${meta.currency})` : 'Amount']],
      body,
      theme: 'plain',
      headStyles: { fillColor: [245, 245, 245], textColor: 40, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'normal' } },
      didParseCell(data) {
        if (section.totalLabel && data.section === 'body' && data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
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
      title,
      periodLabel: meta.periodLabel,
      currency: meta.currency,
      generatedAt: meta.generatedAt || new Date().toISOString(),
      footnote: meta.footnote,
      balanced: meta.balanced,
    },
    columns,
    data,
    { filename: meta.filename || `${title.replace(/\s+/g, '-')}.pdf`, save: false }
  );
}
