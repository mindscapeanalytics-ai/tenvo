'use client';

import { downloadInvoicePDF } from '@/lib/pdf';
import { normalizeInvoiceForDocument, isPakistaniBusiness } from '@/lib/utils/invoiceDocument';
import { dispatchThermalReceipt } from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import { getDomainConfig } from '@/lib/config/domains';

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

export function printInvoiceThermalFromRow(invoice, business, category = 'retail-shop') {
  const domainConfig = getDomainConfig(category);
  const documentLabel = domainConfig?.label_overrides?.invoice || 'Receipt';
  const currencyCode = getBusinessRegionalPack(business).currency;
  const taxAmount = Number(invoice.tax_total ?? invoice.total_tax ?? 0);

  const lineItems = (invoice.items || []).map((item) => ({
    name: item.name || item.product_name,
    sku: item.sku,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unit_price || item.rate || 0),
    lineTotal: Number(item.total_amount || item.amount || 0),
  }));

  if (!lineItems.length) {
    lineItems.push({
      name: invoice.invoice_number || 'Sale',
      quantity: 1,
      unitPrice: Number(invoice.grand_total || invoice.amount || 0),
      lineTotal: Number(invoice.grand_total || invoice.amount || 0),
    });
  }

  return dispatchThermalReceipt({
    business,
    documentLabel,
    category,
    currencyCode,
    sale: {
      invoice_number: invoice.invoice_number,
      date: invoice.date || invoice.created_at,
      customerName: invoice.customer_name,
      paymentMethod: invoice.payment_method || 'cash',
      subtotal: invoice.subtotal,
      taxAmount,
      discountAmount: invoice.discount_total,
      total: invoice.grand_total || invoice.amount,
    },
    lineItems,
  }, 'print');
}
