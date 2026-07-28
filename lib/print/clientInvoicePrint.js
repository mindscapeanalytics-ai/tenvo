'use client';

import { downloadInvoicePDF } from '@/lib/pdf';
import { normalizeInvoiceForDocument, isPakistaniBusiness } from '@/lib/utils/invoiceDocument';
import { dispatchThermalReceipt } from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import { getDomainConfig } from '@/lib/config/domains';
import { resolvePosSettings } from '@/lib/config/posSettings';

function resolveInvoiceLineItems(invoice) {
  const rawItems = invoice?.items || [];
  const lineItems = rawItems.map((item) => ({
    name: item.name || item.product_name || item.description || 'Item',
    sku: item.sku,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unit_price ?? item.rate ?? item.unitPrice ?? 0),
    lineTotal: Number(
      item.total_amount ?? item.amount ?? item.lineTotal ?? 0
    ) || Math.round(Number(item.unit_price ?? item.rate ?? item.unitPrice ?? 0) * Number(item.quantity || 1) * 100) / 100,
  }));

  if (!lineItems.length) {
    const total = Number(invoice?.grand_total ?? invoice?.amount ?? invoice?.total ?? 0);
    lineItems.push({
      name: invoice?.invoice_number || invoice?.invoiceNumber || 'Sale',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }

  return lineItems;
}

/**
 * Build thermal receipt opts from a DB row or invoice builder draft.
 */
export function buildInvoiceThermalReceiptOpts(invoice, business, category = 'retail-shop') {
  const domainConfig = getDomainConfig(category);
  const documentLabel = domainConfig?.label_overrides?.invoice || 'Receipt';
  const currencyCode = getBusinessRegionalPack(business).currency;
  const posSettings = resolvePosSettings(business);
  const taxAmount = Number(
    invoice?.tax_total ?? invoice?.total_tax ?? invoice?.taxAmount ?? 0
  );

  return {
    business,
    documentLabel,
    category,
    currencyCode,
    paperSize: posSettings.paperSize === '80mm' ? '80mm' : '58mm',
    sale: {
      invoice_number: invoice?.invoice_number || invoice?.invoiceNumber,
      date: invoice?.date || invoice?.created_at || new Date().toISOString(),
      customerName:
        invoice?.customer_name
        || invoice?.customer?.name
        || invoice?.customerName
        || null,
      paymentMethod: invoice?.payment_method || invoice?.paymentMethod || 'cash',
      subtotal: invoice?.subtotal ?? invoice?.subtotal_amount,
      taxAmount,
      discountAmount: invoice?.discount_total ?? invoice?.discountAmount,
      total: invoice?.grand_total ?? invoice?.amount ?? invoice?.total,
    },
    lineItems: resolveInvoiceLineItems(invoice),
  };
}

/**
 * Client helpers for invoice list / dashboard print actions.
 */
export function printInvoicePdfFromRow(invoice, business, category = 'retail-shop') {
  const businessWithCategory = {
    ...business,
    category: business?.category || category,
  };
  const normalized = normalizeInvoiceForDocument(
    { ...invoice, category: invoice.category || category },
    invoice.items || [],
    businessWithCategory
  );
  downloadInvoicePDF(
    normalized,
    normalized.totals,
    { ...normalized.business, category: businessWithCategory.category, settings: business?.settings },
    isPakistaniBusiness(business)
  );
}

/** Print exact-size 58mm/80mm thermal receipt (POS paper settings). */
export function printInvoiceThermalFromRow(invoice, business, category = 'retail-shop') {
  return dispatchThermalReceipt(
    buildInvoiceThermalReceiptOpts(invoice, business, category),
    'print'
  );
}
