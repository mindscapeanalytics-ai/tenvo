'use client';

/**
 * Milk Route Hisab 58mm thermal bill — same printer path as POS.
 */
import { dispatchThermalReceipt } from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import { parseMilkHisabBillingPeriod } from '@/lib/storefront/milkShopHisab';

/**
 * Build thermal receipt options from a hisab invoice payload.
 * @param {{
 *   business: object,
 *   invoice: object,
 *   items?: object[],
 *   houseNo?: string,
 *   period?: string,
 *   periodLabel?: string,
 *   category?: string,
 * }} args
 */
export function buildMilkHisabThermalOpts({
  business,
  invoice,
  items = [],
  houseNo = '',
  period = '',
  periodLabel = '',
  category = 'milk-shop',
}) {
  const pack = getBusinessRegionalPack(business);
  let kind = 'month';
  let label = periodLabel;
  if (period && !label) {
    try {
      const parsed = parseMilkHisabBillingPeriod(period);
      kind = parsed.kind;
      label = parsed.label;
    } catch {
      label = period;
    }
  } else if (period) {
    try {
      kind = parseMilkHisabBillingPeriod(period).kind;
    } catch {
      kind = /W\d/i.test(period) ? 'week' : 'month';
    }
  }

  const documentLabel = kind === 'week' ? 'Weekly Hisab Bill' : 'Monthly Hisab Bill';
  const customerBase = invoice.customer_name || invoice.customerName || 'Customer';
  const customerName = houseNo
    ? `${customerBase} · House ${houseNo}`
    : customerBase;

  const lineItems = (items || []).map((item) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    const lineTotal = Number(
      item.total_amount ?? item.lineTotal ?? Math.round(qty * unitPrice * 100) / 100
    );
    const unit = item.product_unit || item.unit || '';
    const name = item.name || item.product_name || 'Item';
    return {
      name: unit ? `${name} (${unit})` : name,
      sku: item.sku || item.product_sku || null,
      quantity: qty,
      unitPrice,
      lineTotal,
    };
  });

  if (!lineItems.length) {
    const total = Number(invoice.grand_total || invoice.amount || 0);
    lineItems.push({
      name: label ? `Route hisab ${label}` : 'Route hisab',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }

  return {
    business,
    documentLabel,
    category: business?.category || category,
    currencyCode: pack.currency,
    paperSize: '58mm',
    sale: {
      invoice_number: invoice.invoice_number,
      date: invoice.date || invoice.created_at || invoice.due_date,
      customerName,
      paymentMethod: invoice.payment_status === 'paid' ? (invoice.payment_method || 'cash') : 'credit',
      subtotal: invoice.subtotal ?? invoice.grand_total,
      taxAmount: Number(invoice.tax_total ?? invoice.total_tax ?? 0),
      discountAmount: Number(invoice.discount_total ?? 0),
      total: invoice.grand_total || invoice.amount,
    },
    lineItems,
  };
}

/**
 * @param {object} args — same as buildMilkHisabThermalOpts
 * @param {'print'|'pdf'} [mode='print']
 */
export async function printMilkHisabThermalBill(args, mode = 'print') {
  const opts = buildMilkHisabThermalOpts(args);
  return dispatchThermalReceipt(opts, mode);
}
