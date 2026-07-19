/**
 * Operational analytics / custom report PDFs (jsPDF + autotable).
 * Reuses finance statement chrome for a professional document look.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  buildFinancePdfMeta,
  drawFinancePdfHeader,
  drawFinancePdfFooter,
  resolveFinancePdfBrand,
} from '@/lib/pdf/financeStatementPdf';

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
 * Single professional PDF: period KPIs, expenses, inventory mix, top products.
 * @param {object} opts
 * @param {object} [opts.business]
 * @param {string} [opts.currency]
 * @param {string} [opts.locale]
 * @param {string} [opts.reportName]
 * @param {string} [opts.periodLabel]
 * @param {object} [opts.snapshot]
 */
export function generateAnalyticsReportPDF(opts = {}) {
  const {
    business = {},
    currency = '',
    locale,
    reportName = 'Business Report',
    periodLabel = '',
    snapshot = {},
  } = opts;

  const meta = buildFinancePdfMeta(business, {
    currency,
    locale,
    periodLabel,
    title: reportName,
    footnote: 'Operational analytics. Formal P&L / Balance Sheet: Finance → Statements.',
  });

  const doc = new jsPDF();
  const brand = resolveFinancePdfBrand(meta);
  let y = drawFinancePdfHeader(doc, meta);

  const kpi = snapshot.kpi || {};
  const growthDetail = kpi.growthDetail || {};

  const summaryRows = [
    ['Revenue (invoices + POS + storefront)', formatPdfNumber(growthDetail.periodRevenue || 0, locale)],
    ['Prior period revenue', formatPdfNumber(growthDetail.priorPeriodRevenue || 0, locale)],
    ['Orders (period)', String(Number(growthDetail.periodOrders) || 0)],
    ['Growth', String(kpi.growth?.value || '-')],
    ['Customer retention', String(kpi.retention || '-')],
    ['Inventory asset (at cost)', formatPdfNumber(kpi.inventoryAsset || 0, locale)],
    ['Trailing revenue (trend chart)', formatPdfNumber(snapshot.trailingRevenue || 0, locale)],
    ['Trailing profit (at cost)', formatPdfNumber(snapshot.trailingProfit || 0, locale)],
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...brand);
  doc.text('Period summary', 14, y);
  y += 2;

  doc.autoTable({
    startY: y,
    head: [['Metric', currency ? `Amount (${currency})` : 'Value']],
    body: summaryRows,
    theme: 'striped',
    tableWidth: 182,
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: 'right' } },
  });
  y = (doc.lastAutoTable?.finalY || y) + 10;

  const expenses = Array.isArray(snapshot.expenseBreakdown) ? snapshot.expenseBreakdown : [];
  if (expenses.length) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text('Expense breakdown (GL)', 14, y);
    y += 2;
    doc.autoTable({
      startY: y,
      head: [['Category', 'Amount']],
      body: expenses.map((e) => [e.name || 'Expense', formatPdfNumber(e.value || 0, locale)]),
      theme: 'striped',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 1: { halign: 'right' } },
    });
    y = (doc.lastAutoTable?.finalY || y) + 10;
  }

  const categories = Array.isArray(snapshot.categoryData) ? snapshot.categoryData : [];
  if (categories.length) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text('Inventory by category (at cost)', 14, y);
    y += 2;
    doc.autoTable({
      startY: y,
      head: [['Category', 'SKUs', 'Value at cost']],
      body: categories.map((c) => [
        c.name || 'Uncategorized',
        String(Number(c.value) || 0),
        formatPdfNumber(c.assetValue || 0, locale),
      ]),
      theme: 'striped',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
    y = (doc.lastAutoTable?.finalY || y) + 10;
  }

  const topProducts = Array.isArray(snapshot.topProducts) ? snapshot.topProducts : [];
  if (topProducts.length) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text('Top products by revenue', 14, y);
    y += 2;
    doc.autoTable({
      startY: y,
      head: [['#', 'Product', 'Category', 'Units', 'Revenue']],
      body: topProducts.map((p, i) => [
        String(i + 1),
        p.name || '-',
        p.category || '-',
        String(Number(p.volume) || 0),
        formatPdfNumber(p.value || 0, locale),
      ]),
      theme: 'striped',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 10 }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });
  }

  const trend = Array.isArray(snapshot.salesTrend) ? snapshot.salesTrend : [];
  if (trend.length) {
    doc.addPage();
    y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text('Monthly sales trend', 14, y);
    y += 2;
    doc.autoTable({
      startY: y,
      head: [['Month', 'Revenue', 'Orders', 'Profit (at cost)']],
      body: trend.map((m) => [
        m.date || m.month || '-',
        formatPdfNumber(m.revenue || m.sales || 0, locale),
        String(Number(m.orderCount || m.count) || 0),
        formatPdfNumber(m.profit || 0, locale),
      ]),
      theme: 'striped',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
  }

  drawFinancePdfFooter(doc, meta);
  doc.save(`${String(reportName).replace(/\s+/g, '-')}.pdf`);
  return doc;
}
