import {

  normalizeInvoiceForDocument,

  normalizeBuilderInvoiceForDocument,

  isPakistaniBusiness,

} from '@/lib/utils/invoiceDocument';

import { buildInvoicePDFDoc, invoicePDFToBuffer } from '@/lib/pdf/invoicePdfCore';
import { generateReportPDFWithChrome } from '@/lib/pdf/financeStatementPdf';



/**

 * Build normalized payload from legacy builder shape or DB row.

 */

function resolveDocument(invoice, totals, business, isPakistaniDomain) {

  const isBuilderShape =

    invoice?.invoiceNumber != null ||

    invoice?.customer?.name != null ||

    (invoice?.items?.length && (invoice.items[0].rate != null || invoice.items[0].amount != null));



  let doc;

  if (isBuilderShape && !invoice?.invoice_number) {

    doc = normalizeBuilderInvoiceForDocument(invoice, totals || {}, business || {});

  } else {

    doc = normalizeInvoiceForDocument(invoice, invoice.items || [], business || {});

    if (totals && Object.keys(totals).length > 0) {

      doc.totals = { ...doc.totals, ...totals };

    }

  }



  doc._isPk =

    isPakistaniDomain ??

    isPakistaniBusiness(business || doc.business);



  return doc;

}



/**

 * Server-safe: returns PDF Buffer.

 */

export function generateInvoicePDFBuffer(invoice, totals = {}, business = {}, isPakistaniDomain) {

  const doc = resolveDocument(invoice, totals, business, isPakistaniDomain);

  const isPk = doc._isPk ?? isPakistaniBusiness(business);

  const pdf = buildInvoicePDFDoc(doc, isPk);

  return invoicePDFToBuffer(pdf);

}



/**

 * Client: trigger browser download.

 */

export function downloadInvoicePDF(invoice, totals, business = {}, isPakistaniDomain = true) {

  const doc = resolveDocument(invoice, totals, business, isPakistaniDomain);

  const isPk = doc._isPk ?? isPakistaniDomain;

  const pdf = buildInvoicePDFDoc(doc, isPk);

  pdf.save(`Invoice-${doc.invoiceNumber || 'draft'}.pdf`);

  return pdf;

}



/** @deprecated Use downloadInvoicePDF — kept for existing imports */

export function generateInvoicePDF(invoice, totals, business = {}, isPakistaniDomain = true) {

  return downloadInvoicePDF(invoice, totals, business, isPakistaniDomain);

}



/**
 * Generate PDF Report (standard finance chrome)
 */
export function generateReportPDF(title, data, columns, meta = {}) {
  return generateReportPDFWithChrome(title, data, columns, {
    businessName: meta.businessName,
    business: meta.business,
    brandRgb: meta.brandRgb,
    subtitle: meta.subtitle,
    periodLabel: meta.periodLabel,
    currency: meta.currency,
    locale: meta.locale,
    filename: meta.filename,
    footnote: meta.footnote,
    balanced: meta.balanced,
    generatedAt: meta.generatedAt,
  });
}

export function exportToCSV(data, filename = 'export') {

  const headers = Object.keys(data[0] || {});

  const csvContent = [

    headers.join(','),

    ...data.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(',')),

  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);

  link.download = `${filename}.csv`;

  link.click();

}



export async function exportToExcel(data, filename = 'export') {

  if (typeof window === 'undefined') {

    console.warn('Excel export is only available in the browser');

    return;

  }

  const XLSX = await import('xlsx');

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  XLSX.writeFile(workbook, `${filename}.xlsx`);

}

