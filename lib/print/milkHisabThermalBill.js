'use client';

/**
 * Milk Route Hisab 58mm thermal bill — same printer path as POS.
 */
import { dispatchThermalReceipt } from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import { parseMilkHisabBillingPeriod } from '@/lib/storefront/milkShopHisab';

function resolvePeriodMeta(period = '', periodLabel = '') {
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
  return { kind, label };
}

/**
 * Build thermal receipt options from a hisab invoice payload.
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
  const { kind, label } = resolvePeriodMeta(period, periodLabel);

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
      invoice_number: invoice.invoice_number || invoice.invoiceNumber || 'DRAFT',
      date: invoice.date || invoice.created_at || invoice.due_date || new Date(),
      customerName,
      paymentMethod: invoice.payment_status === 'paid' ? (invoice.payment_method || 'cash') : 'credit',
      subtotal: invoice.subtotal ?? invoice.grand_total ?? invoice.amount,
      taxAmount: Number(invoice.tax_total ?? invoice.total_tax ?? 0),
      discountAmount: Number(invoice.discount_total ?? 0),
      total: invoice.grand_total || invoice.amount,
      isDraft: Boolean(invoice.isDraft),
    },
    lineItems,
  };
}

/**
 * Build 58mm bill from a Bills-table customer row (works before invoice exists).
 */
export function buildMilkHisabThermalOptsFromRow({
  business,
  row,
  productColumns = [],
  period = '',
  periodLabel = '',
  category = 'milk-shop',
}) {
  const { kind, label } = resolvePeriodMeta(period, periodLabel);
  const qtyByProduct = row?.qtyByProduct || {};
  const meta = row?.productMeta || {};
  const total = Math.round((Number(row?.amount) || 0) * 100) / 100;

  const rawLines = [];
  const seen = new Set();

  for (const col of productColumns) {
    const qty = Number(qtyByProduct[col.id]) || 0;
    if (qty <= 0) continue;
    seen.add(String(col.id));
    const unitMeta = meta[col.id] || {};
    const unit = unitMeta.unit || col.unit || '';
    const name = unitMeta.name || col.name || 'Item';
    rawLines.push({ name: unit ? `${name} (${unit})` : name, quantity: qty });
  }

  for (const [productId, rawQty] of Object.entries(qtyByProduct)) {
    if (seen.has(String(productId))) continue;
    const qty = Number(rawQty) || 0;
    if (qty <= 0) continue;
    const unitMeta = meta[productId] || {};
    const unit = unitMeta.unit || '';
    const name = unitMeta.name || 'Item';
    rawLines.push({ name: unit ? `${name} (${unit})` : name, quantity: qty });
  }

  const qtySum = rawLines.reduce((s, r) => s + (Number(r.quantity) || 0), 0) || 1;
  let allocated = 0;
  const itemsForReceipt = rawLines.length
    ? rawLines.map((item, idx) => {
        const qty = Number(item.quantity) || 1;
        let lineTotal;
        if (idx === rawLines.length - 1) {
          lineTotal = Math.round((total - allocated) * 100) / 100;
        } else {
          lineTotal = Math.round((qty / qtySum) * total * 100) / 100;
          allocated += lineTotal;
        }
        return {
          name: item.name,
          quantity: qty,
          unit_price: qty ? Math.round((lineTotal / qty) * 100) / 100 : lineTotal,
          total_amount: lineTotal,
        };
      })
    : [
        {
          name: label ? `Route hisab ${label}` : 'Route hisab',
          quantity: 1,
          unit_price: total,
          total_amount: total,
        },
      ];

  return buildMilkHisabThermalOpts({
    business,
    invoice: {
      invoice_number: row?.invoiceNumber || (kind === 'week' ? 'WEEKLY-DRAFT' : 'MONTHLY-DRAFT'),
      customer_name: row?.customerName || 'Customer',
      grand_total: total,
      subtotal: total,
      payment_status: row?.paymentStatus || 'unpaid',
      payment_method: 'credit',
      date: new Date(),
      isDraft: !row?.invoiceId,
    },
    items: itemsForReceipt,
    houseNo: row?.houseNo || '',
    period,
    periodLabel: label,
    category,
  });
}

export async function printMilkHisabThermalBill(args, mode = 'print') {
  const opts = buildMilkHisabThermalOpts(args);
  return dispatchThermalReceipt(opts, mode);
}

/** Print/PDF from Bills table row (invoice optional). */
export async function printMilkHisabThermalBillFromRow(args, mode = 'print') {
  const opts = buildMilkHisabThermalOptsFromRow(args);
  return dispatchThermalReceipt(opts, mode);
}
