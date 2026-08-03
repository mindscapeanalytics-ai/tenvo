'use server';

/**
 * Water-delivery Route Hisab server actions (daily sheet + week/month invoices).
 * Uses schema-generated water_delivery_stops and water_delivery_lines tables.
 */
import { prismaBase, pool } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { InvoiceService } from '@/lib/services/InvoiceService';
import { isWaterHisabRelevant } from '@/lib/storefront/waterShopHisab';
import {
  resolveWaterHisabProducts,
  readWaterCustomerPrefs,
  isWaterCustomerDueOnDate,
  toWaterHisabDateKey,
  waterHisabPeriodMarker,
  parseWaterHisabBillingPeriod,
  buildWaterHisabPeriodKpis,
  buildWaterHisabDayBreakdownGrid,
  buildWaterHisabBillLinesForReminder,
  isWaterHisabWalkInCustomer,
  isWaterHisabBillRemindable,
  computeWaterBottleBalance,
  computeWaterSaleAmount,
  WATER_HISAB_PERIOD_PREFIX,
  WATER_HISAB_COLLECTION_NOTE,
  resolveWaterHisabInvoiceForPeriod,
  readWaterHisabPeriodPayment,
  patchWaterHisabPeriodPayment,
  resolveWaterHisabRowPaymentStatus,
  computeWaterRiderShiftReconciliation,
  resolveWaterBottleFloatSummary,
  findIdleBottleCustomers,
} from '@/lib/storefront/waterShopHisab';
import { InvoicePaymentService } from '@/lib/services/InvoicePaymentService';
import {
  buildMilkHisabReminderMessage,
  buildMilkHisabWhatsAppUrl,
  resolveMilkHisabReminderChannels,
  postMilkHisabWhatsAppWebhook,
} from '@/lib/storefront/milkShopHisabReminders';
import {
  getCampaignIntegrationsFromSettings,
  resolveCampaignEmailConfig,
} from '@/lib/marketing/campaignIntegrations';
import { sendCampaignOutreachEmail } from '@/lib/email/campaignOutreach';
import { CampaignOutreachEmail } from '@/lib/email/templates/CampaignOutreachEmail';
import { createNotification, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '@/lib/notifications/notificationHelpers';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import React from 'react';

function assertWaterHisab(category) {
  if (!isWaterHisabRelevant(category)) {
    const err = new Error('Route Hisab is only available for water delivery businesses');
    err.code = 'WATER_HISAB_DOMAIN';
    throw err;
  }
}

/**
 * Load daily sheet: customers + product columns + existing stops.
 */
export async function getWaterHisabDayAction({ businessId, category, deliveryDate }) {
  try {
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.view' });
    void session;

    const dateKey = toWaterHisabDateKey(deliveryDate || new Date());
    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true, category: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const [customers, products, stops] = await Promise.all([
      prismaBase.customers.findMany({
        where: { business_id: businessId, is_deleted: false, is_active: true },
        orderBy: { name: 'asc' },
        take: 500,
      }),
      prismaBase.products.findMany({
        where: { business_id: businessId, is_deleted: false, is_active: true },
        orderBy: { name: 'asc' },
        take: 500,
      }),
      prismaBase.water_delivery_stops.findMany({
        where: {
          business_id: businessId,
          delivery_date: new Date(dateKey),
          is_deleted: false,
        },
        include: { lines: true },
      }),
    ]);

    const hisabProducts = resolveWaterHisabProducts(products, business.settings || {});
    const waterProductId = hisabProducts.find((p) =>
      /water|19\s*l|dispenser|bottle|mineral|pure\s*life|aquafina/i.test(`${p.name} ${p.category || ''}`)
    )?.id;

    const stopByCustomer = new Map(stops.map((s) => [String(s.customer_id), s]));
    const rows = customers
      .map((c) => {
        const prefs = readWaterCustomerPrefs(c);
        const cid = String(c.id);
        const hasStop = stopByCustomer.has(cid);
        // Keep route book focused: skip walk-ins and inactive unless they already have a stop today.
        if (!hasStop) {
          if (!prefs.deliveryActive) return null;
          if (isWaterHisabWalkInCustomer(c)) return null;
          if (!isWaterCustomerDueOnDate(prefs, new Date(`${dateKey}T12:00:00`))) return null;
        }
        const stop = stopByCustomer.get(cid);
        const qtyByProduct = {};
        const recByProduct = {};
        let dayAmount = 0;
        let delTotal = 0;
        let recTotal = 0;
        for (const p of hisabProducts) {
          const pid = String(p.id);
          const line = stop?.lines?.find((l) => String(l.product_id) === pid);
          let qty = 0;
          let rec = 0;
          if (line) {
            qty = Number(line.quantity) || 0;
            rec = Number(line.received_quantity) || 0;
          } else if (!stop && waterProductId && pid === String(waterProductId) && prefs.dailyBottles > 0) {
            qty = prefs.dailyBottles;
            rec = prefs.dailyBottles; // default REC = DEL for refill routes (empties come back)
          }
          qtyByProduct[pid] = qty;
          recByProduct[pid] = rec;
          delTotal += qty;
          recTotal += rec;
          const rate = prefs.productRate > 0 ? prefs.productRate : Number(p.price) || 0;
          dayAmount += qty * rate;
        }
        const discount = Number(stop?.special_discount) || 0;
        const cashCollected = Number(stop?.cash_collected) || 0;
        dayAmount = Math.max(0, Math.round((dayAmount - discount) * 100) / 100);
        const bottleBal = computeWaterBottleBalance({
          previous: prefs.bottleBalance,
          delivered: delTotal,
          received: recTotal,
        });
        return {
          customerId: cid,
          customerName: c.name,
          accountNo: stop?.account_no_snapshot || prefs.accountNo || '',
          townCode: stop?.town_code_snapshot || prefs.townCode || '',
          houseNo: stop?.house_no_snapshot || prefs.houseNo || '',
          floorFlat: prefs.floorFlat || '',
          routeLabel: stop?.route_label || prefs.routeLabel || '',
          city: prefs.city || '',
          deliveryArea: prefs.deliveryArea || '',
          customerType: prefs.customerType || '',
          deliveryDays: prefs.deliveryDays || 'Daily',
          productRate: prefs.productRate || 0,
          prevBottle: prefs.bottleBalance || 0,
          bottleBalance: bottleBal,
          cashCollected,
          specialDiscount: discount,
          notes: stop?.notes || '',
          stopId: stop?.id || null,
          qtyByProduct,
          recByProduct,
          dayAmount,
        };
      })
      .filter(Boolean);

    const delivered = rows.filter((r) =>
      Object.values(r.qtyByProduct || {}).some((q) => Number(q) > 0)
    ).length;
    const dayTotal = Math.round(rows.reduce((s, r) => s + (Number(r.dayAmount) || 0), 0) * 100) / 100;
    const cashTotal = Math.round(rows.reduce((s, r) => s + (Number(r.cashCollected) || 0), 0) * 100) / 100;
    const delBottles = rows.reduce(
      (s, r) => s + Object.values(r.qtyByProduct || {}).reduce((a, q) => a + (Number(q) || 0), 0),
      0
    );
    const recBottles = rows.reduce(
      (s, r) => s + Object.values(r.recByProduct || {}).reduce((a, q) => a + (Number(q) || 0), 0),
      0
    );

    return await actionSuccess(
      serializeDecimalsDeep({
        deliveryDate: dateKey,
        products: hisabProducts.map((p) => ({
          id: String(p.id),
          name: p.name,
          hisabShortLabel: p.hisabShortLabel || null,
          unit: p.unit || 'pcs',
          price: Number(p.price) || 0,
          category: p.category || '',
        })),
        rows,
        kpis: {
          onRoute: rows.length,
          delivered,
          pending: Math.max(0, rows.length - delivered),
          dayTotal,
          cashTotal,
          delBottles: Math.round(delBottles * 1000) / 1000,
          recBottles: Math.round(recBottles * 1000) / 1000,
          housesSet: rows.filter((r) => String(r.houseNo || '').trim()).length,
        },
      })
    );
  } catch (e) {
    console.error('getWaterHisabDayAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_DAY_FAILED', await getErrorMessage(e));
  }
}

/**
 * Save daily sheet rows (upsert stops + replace lines).
 * @param {{ businessId: string, category: string, deliveryDate: string, rows: Array }} params
 */
export async function saveWaterHisabDayAction(params) {
  try {
    const { businessId, category, deliveryDate, rows = [] } = params || {};
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.create_invoice' });
    void session;

    const dateKey = toWaterHisabDateKey(deliveryDate);
    const products = await prismaBase.products.findMany({
      where: { business_id: businessId, is_deleted: false },
      take: 500,
    });
    // Resolve lines against the full catalog so column-set drift never drops qty rows.
    const productMap = new Map(products.map((p) => [String(p.id), p]));

    await prismaBase.$transaction(async (tx) => {
      for (const row of rows) {
        const customerId = row.customerId;
        if (!customerId) continue;
        const customer = await tx.customers.findFirst({
          where: { id: customerId, business_id: businessId, is_deleted: false },
        });
        if (!customer) continue;
        const prefs = readWaterCustomerPrefs(customer);

        const qtyMap = row.qtyByProduct || {};
        const recMap = row.recByProduct || {};
        const lineCreates = [];
        let delTotal = 0;
        let recTotal = 0;
        for (const productId of new Set([...Object.keys(qtyMap), ...Object.keys(recMap)])) {
          const qty = Number(qtyMap[productId]) || 0;
          const rec = Number(recMap[productId]) || 0;
          if ((!Number.isFinite(qty) || qty <= 0) && (!Number.isFinite(rec) || rec <= 0)) continue;
          const pid = String(productId);
          const product = productMap.get(pid);
          if (!product) {
            console.warn('[waterHisab] skip line; product not found', pid);
            continue;
          }
          const rate =
            Number(row.productRate) > 0
              ? Number(row.productRate)
              : prefs.productRate > 0
                ? prefs.productRate
                : Number(product.price) || 0;
          delTotal += qty;
          recTotal += rec;
          lineCreates.push({
            business_id: businessId,
            product_id: String(product.id),
            product_name_snapshot: product.name,
            unit_snapshot: product.unit || 'pcs',
            quantity: qty,
            received_quantity: rec,
            unit_price_snapshot: rate,
          });
        }

        const cashCollected = Math.max(0, Number(row.cashCollected) || 0);
        const specialDiscount = Math.max(0, Number(row.specialDiscount) || 0);
        const hasActivity = lineCreates.length > 0 || cashCollected > 0;

        // Do not keep empty stops — they pollute week/month bills with Rs0 rows.
        if (!hasActivity) {
          const existing = await tx.water_delivery_stops.findFirst({
            where: {
              business_id: businessId,
              customer_id: customerId,
              delivery_date: new Date(dateKey),
              is_deleted: false,
            },
          });
          if (existing) {
            await tx.water_delivery_lines.deleteMany({
              where: { stop_id: existing.id, business_id: businessId },
            });
            await tx.water_delivery_stops.update({
              where: { id: existing.id },
              data: { is_deleted: true, deleted_at: new Date() },
            });
          }
          const nextHouse = String(row.houseNo || '').trim();
          const nextRoute = String(row.routeLabel || '').trim();
          if (nextHouse !== prefs.houseNo || nextRoute !== prefs.routeLabel) {
            const prevDd =
              customer.domain_data && typeof customer.domain_data === 'object' ? customer.domain_data : {};
            await tx.customers.update({
              where: { id: customerId },
              data: {
                domain_data: {
                  ...prevDd,
                  houseno: nextHouse || prevDd.houseno || null,
                  deliveryroute: nextRoute || prevDd.deliveryroute || null,
                },
              },
            });
          }
          continue;
        }

        const stop = await tx.water_delivery_stops.upsert({
          where: {
            water_business_id_delivery_date_customer_id: {
              business_id: businessId,
              delivery_date: new Date(dateKey),
              customer_id: customerId,
            },
          },
          create: {
            business_id: businessId,
            delivery_date: new Date(dateKey),
            customer_id: customerId,
            house_no_snapshot: row.houseNo || prefs.houseNo || null,
            customer_name_snapshot: customer.name,
            route_label: row.routeLabel || prefs.routeLabel || null,
            notes: row.notes || null,
            cash_collected: cashCollected,
            special_discount: specialDiscount,
            account_no_snapshot: row.accountNo || prefs.accountNo || null,
            town_code_snapshot: row.townCode || prefs.townCode || null,
            status: 'confirmed',
          },
          update: {
            house_no_snapshot: row.houseNo || prefs.houseNo || null,
            customer_name_snapshot: customer.name,
            route_label: row.routeLabel || prefs.routeLabel || null,
            notes: row.notes || null,
            cash_collected: cashCollected,
            special_discount: specialDiscount,
            account_no_snapshot: row.accountNo || prefs.accountNo || null,
            town_code_snapshot: row.townCode || prefs.townCode || null,
            status: 'confirmed',
            is_deleted: false,
            deleted_at: null,
          },
        });

        await tx.water_delivery_lines.deleteMany({ where: { stop_id: stop.id, business_id: businessId } });
        if (lineCreates.length) {
          await tx.water_delivery_lines.createMany({
            data: lineCreates.map((line) => ({ ...line, stop_id: stop.id })),
          });
        }

        // Keep customer route book + bottle BAL in sync (ZARA BAL.BOTTLE).
        const nextHouse = String(row.houseNo || '').trim();
        const nextRoute = String(row.routeLabel || '').trim();
        const nextBal = computeWaterBottleBalance({
          previous: prefs.bottleBalance,
          delivered: delTotal,
          received: recTotal,
        });
        const prevDd =
          customer.domain_data && typeof customer.domain_data === 'object' ? customer.domain_data : {};
        const nextRate = Number(row.productRate);
        await tx.customers.update({
          where: { id: customerId },
          data: {
            domain_data: {
              ...prevDd,
              houseno: nextHouse || prevDd.houseno || null,
              deliveryroute: nextRoute || prevDd.deliveryroute || null,
              floorflat: row.floorFlat ?? prevDd.floorflat ?? null,
              accountno: row.accountNo || prevDd.accountno || null,
              towncode: row.townCode || prevDd.towncode || null,
              bottlebalance: nextBal,
              ...(Number.isFinite(nextRate) && nextRate > 0 ? { productrate: nextRate } : {}),
            },
          },
        });
      }
    });

    return await actionSuccess({ deliveryDate: dateKey, saved: rows.length });
  } catch (e) {
    console.error('saveWaterHisabDayAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_SAVE_FAILED', await getErrorMessage(e));
  }
}

/**
 * Week or month summary per customer for collection.
 */
export async function getWaterHisabPeriodSummaryAction({ businessId, category, period }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;

    const stops = await prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        delivery_date: {
          gte: new Date(`${startIso}T00:00:00.000Z`),
          lte: new Date(`${endIso}T23:59:59.999Z`),
        },
      },
      include: { lines: true, customers: { select: { id: true, name: true, domain_data: true, address: true } } },
    });

    const invoices = await prismaBase.invoices.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        notes: { contains: WATER_HISAB_PERIOD_PREFIX },
      },
      select: {
        id: true,
        customer_id: true,
        invoice_number: true,
        grand_total: true,
        payment_status: true,
        status: true,
        notes: true,
        date: true,
        subtotal: true,
        tax_total: true,
        discount_total: true,
        payment_method: true,
      },
    });

    const byCustomer = new Map();
    for (const stop of stops) {
      const meaningfulLines = (stop.lines || []).filter((l) => Number(l.quantity) > 0);
      if (!meaningfulLines.length) continue;

      const cid = stop.customer_id;
      if (!byCustomer.has(cid)) {
        const prefs = readWaterCustomerPrefs(stop.customers || {});
        byCustomer.set(cid, {
          customerId: cid,
          customerName: stop.customer_name_snapshot || stop.customers?.name || 'Customer',
          houseNo: stop.house_no_snapshot || prefs.houseNo || '',
          accountNo: stop.account_no_snapshot || prefs.accountNo || '',
          townCode: stop.town_code_snapshot || prefs.townCode || '',
          floorFlat: prefs.floorFlat || '',
          bottleBalance: prefs.bottleBalance || 0,
          domainData: stop.customers?.domain_data || null,
          qtyByProduct: {},
          amount: 0,
          cashCollected: 0,
          stopCount: 0,
        });
      }
      const row = byCustomer.get(cid);
      row.stopCount += 1;
      row.cashCollected += Number(stop.cash_collected) || 0;
      if (!row.accountNo && stop.account_no_snapshot) row.accountNo = stop.account_no_snapshot;
      if (!row.townCode && stop.town_code_snapshot) row.townCode = stop.town_code_snapshot;
      for (const line of meaningfulLines) {
        const q = Number(line.quantity) || 0;
        const price = Number(line.unit_price_snapshot) || 0;
        const pid = String(line.product_id);
        row.qtyByProduct[pid] = (row.qtyByProduct[pid] || 0) + q;
        row.amount += q * price;
        if (!row.productMeta) row.productMeta = {};
        row.productMeta[pid] = {
          name: line.product_name_snapshot,
          unit: line.unit_snapshot,
          unitPrice: price,
        };
      }
    }

    const rows = [...byCustomer.values()]
      .map((r) => {
        const inv = resolveWaterHisabInvoiceForPeriod(invoices, r.customerId, periodKey);
        const hisabPaymentStatus = readWaterHisabPeriodPayment(r.domainData, periodKey);
        const billed = Boolean(inv);
        const paymentStatus = resolveWaterHisabRowPaymentStatus({
          invoicePaymentStatus: inv?.payment_status || null,
          hisabPaymentStatus,
          billed,
        });
        return {
          customerId: r.customerId,
          customerName: r.customerName,
          houseNo: r.houseNo,
          accountNo: r.accountNo || '',
          townCode: r.townCode || '',
          floorFlat: r.floorFlat || '',
          bottleBalance: r.bottleBalance || 0,
          cashCollected: Math.round((r.cashCollected || 0) * 100) / 100,
          qtyByProduct: r.qtyByProduct,
          productMeta: r.productMeta || {},
          amount: Math.round(r.amount * 100) / 100,
          stopCount: r.stopCount,
          invoiceId: inv?.id || null,
          invoiceNumber: inv?.invoice_number || null,
          paymentStatus,
          hisabPaymentStatus,
          billed,
          billedPeriod: inv ? (String(inv.notes || '').match(/\[water_hisab_period=([^\]]+)\]/)?.[1] || periodKey) : null,
        };
      })
      .filter((r) => r.amount > 0 || r.billed);

    rows.sort((a, b) => {
      const houseCmp = String(a.houseNo || '').localeCompare(String(b.houseNo || ''), undefined, {
        numeric: true,
      });
      if (houseCmp !== 0) return houseCmp;
      return String(a.customerName).localeCompare(String(b.customerName));
    });

    const productIds = new Set();
    for (const r of rows) {
      Object.keys(r.qtyByProduct || {}).forEach((id) => productIds.add(id));
    }
    const productCols = [...productIds].map((id) => {
      const meta = rows.find((r) => r.productMeta?.[id])?.productMeta?.[id];
      return { id, name: meta?.name || 'Item', unit: meta?.unit || '' };
    });

    const kpis = buildWaterHisabPeriodKpis(rows);

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        startIso,
        endIso,
        productColumns: productCols,
        rows,
        kpis,
      })
    );
  } catch (e) {
    console.error('getWaterHisabPeriodSummaryAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_PERIOD_FAILED', await getErrorMessage(e));
  }
}

/** @deprecated Prefer getWaterHisabPeriodSummaryAction (week + month). */
export async function getWaterHisabMonthSummaryAction(params) {
  return getWaterHisabPeriodSummaryAction(params);
}

/**
 * Generate one unpaid invoice per customer for the week or month (skip already billed).
 * Partial success: one customer failure does not abort the rest.
 */
export async function generateWaterHisabInvoicesAction({ businessId, category, period, customerIds = null }) {
  try {
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.create_invoice' });
    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;
    const marker = waterHisabPeriodMarker(periodKey);

    const summary = await getWaterHisabPeriodSummaryAction({ businessId, category, period: periodKey });
    if (!summary.success) return summary;
    let targets = summary.rows || [];
    if (Array.isArray(customerIds) && customerIds.length) {
      const allow = new Set(customerIds.map(String));
      targets = targets.filter((r) => allow.has(String(r.customerId)));
    }
    targets = targets.filter((r) => !r.billed && r.amount > 0);

    const created = [];
    const skipped = [];
    const failed = [];
    const collectionTerms =
      kind === 'week' ? 'Weekly water delivery collection' : 'Monthly water delivery collection';

    for (const row of targets) {
      try {
        const existingInvoices = await prismaBase.invoices.findMany({
          where: {
            business_id: businessId,
            customer_id: row.customerId,
            is_deleted: false,
            notes: { contains: WATER_HISAB_PERIOD_PREFIX },
          },
          select: {
            id: true,
            customer_id: true,
            invoice_number: true,
            notes: true,
            payment_status: true,
          },
        });
        const existing = resolveWaterHisabInvoiceForPeriod(existingInvoices, row.customerId, periodKey);
        if (existing) {
          skipped.push({
            customerId: row.customerId,
            reason: 'already_billed',
            invoiceId: existing.id,
            invoiceNumber: existing.invoice_number,
          });
          continue;
        }

        const lines = await prismaBase.water_delivery_lines.findMany({
          where: {
            business_id: businessId,
            stop: {
              customer_id: row.customerId,
              delivery_date: {
                gte: new Date(`${startIso}T00:00:00.000Z`),
                lte: new Date(`${endIso}T23:59:59.999Z`),
              },
              is_deleted: false,
            },
          },
        });
        const agg = new Map();
        for (const line of lines) {
          const pid = String(line.product_id);
          const cur = agg.get(pid) || {
            qty: 0,
            amount: 0,
            name: line.product_name_snapshot,
            unit: line.unit_snapshot,
          };
          const q = Number(line.quantity) || 0;
          cur.qty += q;
          cur.amount += q * (Number(line.unit_price_snapshot) || 0);
          cur.name = line.product_name_snapshot || cur.name;
          cur.unit = line.unit_snapshot || cur.unit;
          agg.set(pid, cur);
        }

        const invoiceItems = [...agg.entries()]
          .filter(([, v]) => v.qty > 0)
          .map(([productId, v]) => {
            const unitPrice = v.qty > 0 ? Math.round((v.amount / v.qty) * 100) / 100 : 0;
            return {
              product_id: productId,
              name: v.name || 'Item',
              description: `${v.name || 'Item'} (${periodKey} route hisab)`,
              quantity: v.qty,
              unit_price: unitPrice,
              discount_amount: 0,
              tax_percent: 0,
              tax_amount: 0,
              total_amount: Math.round(v.qty * unitPrice * 100) / 100,
              metadata: { unit: v.unit || 'bottle' },
            };
          });

        if (!invoiceItems.length) {
          skipped.push({ customerId: row.customerId, reason: 'no_lines' });
          continue;
        }

        const subtotal = invoiceItems.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
        const grand = Math.round(subtotal * 100) / 100;

        const invoice = await InvoiceService.createInvoice(
          {
            business_id: businessId,
            customer_id: row.customerId,
            date: new Date(`${endIso}T12:00:00`),
            due_date: new Date(`${endIso}T12:00:00`),
            status: 'sent',
            payment_status: 'unpaid',
            payment_method: 'credit',
            subtotal: grand,
            tax_total: 0,
            total_tax: 0,
            discount_total: 0,
            grand_total: grand,
            notes: `Water route hisab ${label}. House ${row.houseNo || '-'}. ${marker}`,
            terms: collectionTerms,
            tax_details: { invoice_type: 'retail' },
            skip_inventory: true,
            skip_credit_check: true,
            items: invoiceItems,
          },
          session.user.id
        );

        // Carry manual hisab Paid onto the new invoice so status stays in sync.
        let appliedHisabPaid = false;
        if (String(row.paymentStatus || '').toLowerCase() === 'paid') {
          try {
            await InvoicePaymentService.recordPayment({
              businessId,
              invoiceId: invoice.id,
              amount: Math.round(Number(invoice.grand_total || grand) * 100) / 100,
              paymentMethod: 'cash',
              notes: WATER_HISAB_COLLECTION_NOTE,
              userId: session.user.id,
            });
            appliedHisabPaid = true;
          } catch (payErr) {
            console.error('generateWaterHisabInvoicesAction apply hisab paid', row.customerId, payErr);
          }
        }

        created.push({
          customerId: row.customerId,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          grandTotal: Number(invoice.grand_total),
          paymentStatus: appliedHisabPaid ? 'paid' : 'unpaid',
          hisabPaidPending: String(row.paymentStatus || '').toLowerCase() === 'paid' && !appliedHisabPaid,
        });
      } catch (err) {
        console.error('generateWaterHisabInvoicesAction customer', row.customerId, err);
        failed.push({
          customerId: row.customerId,
          customerName: row.customerName,
          reason: err?.message || 'Invoice create failed',
          code: err?.code || null,
        });
      }
    }

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        created,
        skipped,
        failed,
        success: failed.length === 0 || created.length > 0,
      })
    );
  } catch (e) {
    console.error('generateWaterHisabInvoicesAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_INVOICE_FAILED', await getErrorMessage(e));
  }
}

/**
 * Load one customer's stops for a week/month and build the day Y/N grid
 * used by the PK-style 58mm monthly sheet.
 */
export async function getWaterHisabCustomerDayBreakdownAction({
  businessId,
  category,
  customerId,
  period,
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!customerId) return await actionFailure('INVALID', 'Customer required');
    if (!period) return await actionFailure('INVALID', 'Period required');

    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;

    const stops = await prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        customer_id: customerId,
        is_deleted: false,
        delivery_date: {
          gte: new Date(`${startIso}T00:00:00.000Z`),
          lte: new Date(`${endIso}T23:59:59.999Z`),
        },
      },
      include: { lines: true, customers: { select: { id: true, name: true, domain_data: true, address: true } } },
      orderBy: { delivery_date: 'asc' },
    });

    /** @type {Map<string, { id: string, name: string, unit: string, unitPrice: number }>} */
    const colMap = new Map();
    let amount = 0;
    let houseNo = '';
    let customerName = 'Customer';

    for (const stop of stops) {
      if (!houseNo) {
        const prefs = readWaterCustomerPrefs(stop.customers || {});
        houseNo = stop.house_no_snapshot || prefs.houseNo || '';
      }
      if (customerName === 'Customer') {
        customerName = stop.customer_name_snapshot || stop.customers?.name || 'Customer';
      }
      for (const line of stop.lines || []) {
        const q = Number(line.quantity) || 0;
        if (q <= 0) continue;
        const pid = String(line.product_id);
        const price = Number(line.unit_price_snapshot) || 0;
        amount += q * price;
        if (!colMap.has(pid)) {
          colMap.set(pid, {
            id: pid,
            name: line.product_name_snapshot || 'Item',
            unit: line.unit_snapshot || '',
            unitPrice: price,
          });
        }
      }
    }

    const columns = [...colMap.values()];
    const breakdown = buildWaterHisabDayBreakdownGrid({
      stops,
      columns,
      startIso,
      endIso,
    });

    const invoices = await prismaBase.invoices.findMany({
      where: {
        business_id: businessId,
        customer_id: customerId,
        is_deleted: false,
        notes: { contains: WATER_HISAB_PERIOD_PREFIX },
      },
      select: {
        id: true,
        customer_id: true,
        invoice_number: true,
        payment_status: true,
        notes: true,
        grand_total: true,
      },
    });
    const inv = resolveWaterHisabInvoiceForPeriod(invoices, customerId, periodKey);

    const productMeta = {};
    for (const col of columns) {
      productMeta[col.id] = {
        name: col.name,
        unit: col.unit,
        unitPrice: col.unitPrice,
      };
    }

    const customerRow = stops[0]?.customers || null;
    const prefs = readWaterCustomerPrefs(customerRow || {});
    let cashCollected = 0;
    let specialDiscount = 0;
    let delTotal = 0;
    let recTotal = 0;
    let accountNo = prefs.accountNo || '';
    let townCode = prefs.townCode || '';
    let floorFlat = prefs.floorFlat || '';
    for (const stop of stops) {
      cashCollected += Number(stop.cash_collected) || 0;
      specialDiscount += Number(stop.special_discount) || 0;
      if (!accountNo && stop.account_no_snapshot) accountNo = stop.account_no_snapshot;
      if (!townCode && stop.town_code_snapshot) townCode = stop.town_code_snapshot;
      for (const line of stop.lines || []) {
        delTotal += Number(line.quantity) || 0;
        recTotal += Number(line.received_quantity) || 0;
      }
    }

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        startIso,
        endIso,
        customerId,
        customerName,
        houseNo,
        floorFlat,
        accountNo,
        townCode,
        cashCollected: Math.round(cashCollected * 100) / 100,
        specialDiscount: Math.round(specialDiscount * 100) / 100,
        delTotal: Math.round(delTotal * 1000) / 1000,
        recTotal: Math.round(recTotal * 1000) / 1000,
        bottleBalance: prefs.bottleBalance,
        amount: Math.round(amount * 100) / 100,
        invoiceId: inv?.id || null,
        invoiceNumber: inv?.invoice_number || null,
        paymentStatus: inv?.payment_status || null,
        productMeta,
        breakdown,
      })
    );
  } catch (e) {
    console.error('getWaterHisabCustomerDayBreakdownAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_DAY_SHEET_FAILED', await getErrorMessage(e));
  }
}

/**
 * Bulk week/month day sheets for all customers with deliveries in the period (58mm print/PDF).
 */
export async function getWaterHisabBulkDayBreakdownAction({ businessId, category, period }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!period) return await actionFailure('INVALID', 'Period required');

    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;

    const stops = await prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        delivery_date: {
          gte: new Date(`${startIso}T00:00:00.000Z`),
          lte: new Date(`${endIso}T23:59:59.999Z`),
        },
      },
      include: {
        lines: true,
        customers: { select: { id: true, name: true, domain_data: true, address: true } },
      },
      orderBy: [{ delivery_date: 'asc' }],
    });

    const invoices = await prismaBase.invoices.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        notes: { contains: WATER_HISAB_PERIOD_PREFIX },
      },
      select: {
        id: true,
        customer_id: true,
        invoice_number: true,
        payment_status: true,
        notes: true,
        grand_total: true,
      },
    });

    /** @type {Map<string, typeof stops>} */
    const byCustomer = new Map();
    for (const stop of stops) {
      const cid = String(stop.customer_id);
      if (!byCustomer.has(cid)) byCustomer.set(cid, []);
      byCustomer.get(cid).push(stop);
    }

    const sheets = [];
    for (const [cid, custStops] of byCustomer) {
      /** @type {Map<string, { id: string, name: string, unit: string, unitPrice: number }>} */
      const colMap = new Map();
      let amount = 0;
      let cashCollected = 0;
      let specialDiscount = 0;
      let delTotal = 0;
      let recTotal = 0;
      let houseNo = '';
      let customerName = 'Customer';
      const prefs = readWaterCustomerPrefs(custStops[0]?.customers || {});
      let accountNo = prefs.accountNo || '';
      let townCode = prefs.townCode || '';
      let floorFlat = prefs.floorFlat || '';

      for (const stop of custStops) {
        if (!houseNo) {
          houseNo = stop.house_no_snapshot || prefs.houseNo || '';
        }
        if (customerName === 'Customer') {
          customerName = stop.customer_name_snapshot || stop.customers?.name || 'Customer';
        }
        if (!accountNo && stop.account_no_snapshot) accountNo = stop.account_no_snapshot;
        if (!townCode && stop.town_code_snapshot) townCode = stop.town_code_snapshot;
        cashCollected += Number(stop.cash_collected) || 0;
        specialDiscount += Number(stop.special_discount) || 0;
        for (const line of stop.lines || []) {
          const q = Number(line.quantity) || 0;
          const rec = Number(line.received_quantity) || 0;
          delTotal += q;
          recTotal += rec;
          if (q <= 0) continue;
          const pid = String(line.product_id);
          const price = Number(line.unit_price_snapshot) || 0;
          amount += q * price;
          if (!colMap.has(pid)) {
            colMap.set(pid, {
              id: pid,
              name: line.product_name_snapshot || 'Item',
              unit: line.unit_snapshot || '',
              unitPrice: price,
            });
          }
        }
      }

      amount = Math.round(amount * 100) / 100;
      if (!(amount > 0)) continue;

      const columns = [...colMap.values()];
      const breakdown = buildWaterHisabDayBreakdownGrid({
        stops: custStops,
        columns,
        startIso,
        endIso,
      });
      const inv = resolveWaterHisabInvoiceForPeriod(invoices, cid, periodKey);
      const productMeta = {};
      for (const col of columns) {
        productMeta[col.id] = {
          name: col.name,
          unit: col.unit,
          unitPrice: col.unitPrice,
        };
      }

      sheets.push({
        customerId: cid,
        customerName,
        houseNo,
        floorFlat,
        accountNo,
        townCode,
        cashCollected: Math.round(cashCollected * 100) / 100,
        specialDiscount: Math.round(specialDiscount * 100) / 100,
        delTotal: Math.round(delTotal * 1000) / 1000,
        recTotal: Math.round(recTotal * 1000) / 1000,
        bottleBalance: prefs.bottleBalance,
        amount,
        invoiceId: inv?.id || null,
        invoiceNumber: inv?.invoice_number || null,
        paymentStatus: inv?.payment_status || null,
        productMeta,
        breakdown,
      });
    }

    sheets.sort((a, b) => {
      const h = String(a.houseNo || '').localeCompare(String(b.houseNo || ''), undefined, {
        numeric: true,
      });
      if (h !== 0) return h;
      return String(a.customerName).localeCompare(String(b.customerName));
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        startIso,
        endIso,
        sheets,
        count: sheets.length,
      })
    );
  } catch (e) {
    console.error('getWaterHisabBulkDayBreakdownAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_BULK_SHEET_FAILED', await getErrorMessage(e));
  }
}

/**
 * Load invoice + lines for 58mm thermal hisab bill print.
 */
export async function getWaterHisabBillPrintAction({ businessId, category, invoiceId }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!invoiceId) return await actionFailure('INVALID', 'Invoice required');

    let invoice;
    try {
      invoice = await InvoiceService.getInvoiceWithItems(invoiceId, businessId);
    } catch (err) {
      return await actionFailure(err?.code || 'NOT_FOUND', err?.message || 'Invoice not found');
    }
    if (!invoice || invoice.is_deleted) {
      return await actionFailure('NOT_FOUND', 'Invoice not found');
    }

    const notes = String(invoice.notes || '');
    const markerMatch = notes.match(/\[water_hisab_period=([^\]]+)\]/);
    const period = markerMatch?.[1] || '';
    let periodLabel = period;
    let kind = 'month';
    if (period) {
      try {
        const parsed = parseWaterHisabBillingPeriod(period);
        periodLabel = parsed.label;
        kind = parsed.kind;
      } catch {
        /* keep raw */
      }
    }

    const houseMatch = notes.match(/House\s+([^.[\]]+)/i);
    const houseNo = (houseMatch?.[1] || '').trim().replace(/^-+\s*$/, '') || '';

    return await actionSuccess(
      serializeDecimalsDeep({
        invoice,
        items: invoice.items || [],
        houseNo: houseNo === '-' ? '' : houseNo,
        period,
        periodLabel,
        kind,
      })
    );
  } catch (e) {
    console.error('getWaterHisabBillPrintAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_PRINT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Preview reminder channels + prefilled WhatsApp / email copy for one customer.
 */
export async function prepareWaterHisabReminderAction({
  businessId,
  category,
  customerId,
  period,
  amount,
  invoiceId = null,
  invoiceNumber = null,
  houseNo = '',
  billLines = null,
  qtyByProduct = null,
  productMeta = null,
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!customerId) return await actionFailure('INVALID', 'Customer required');

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: {
        id: true,
        business_name: true,
        domain: true,
        country: true,
        currency: true,
        settings: true,
        category: true,
        address: true,
        phone: true,
        ntn: true,
      },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const customer = await prismaBase.customers.findFirst({
      where: { id: customerId, business_id: businessId, is_deleted: false },
    });
    if (!customer) return await actionFailure('NOT_FOUND', 'Customer not found');

    const prefs = readWaterCustomerPrefs(customer);
    let periodLabel = String(period || '');
    let periodKey = String(period || '');
    try {
      if (period) {
        const bounds = parseWaterHisabBillingPeriod(period);
        periodLabel = bounds.label;
        periodKey = bounds.period;
      }
    } catch {
      /* keep raw */
    }

    const hisabPaid = readWaterHisabPeriodPayment(customer.domain_data, periodKey) === 'paid';
    if (hisabPaid) {
      return await actionFailure('WATER_HISAB_ALREADY_PAID', 'Already paid. No reminder needed.');
    }

    if (invoiceId) {
      const invPay = await prismaBase.invoices.findFirst({
        where: { id: invoiceId, business_id: businessId, is_deleted: false },
        select: { payment_status: true },
      });
      if (String(invPay?.payment_status || '').toLowerCase() === 'paid') {
        return await actionFailure('WATER_HISAB_ALREADY_PAID', 'Already paid. No reminder needed.');
      }
    }

    const resolvedLines = Array.isArray(billLines)
      ? billLines
      : buildWaterHisabBillLinesForReminder({
          qtyByProduct: qtyByProduct || {},
          productMeta: productMeta || {},
        });

    const pack = getBusinessRegionalPack(business);
    const message = buildMilkHisabReminderMessage({
      businessName: business.business_name,
      customerName: customer.name,
      houseNo: houseNo || prefs.houseNo,
      amount,
      periodLabel,
      invoiceNumber,
      currency: pack.currency,
      billLines: resolvedLines,
    });

    const channels = resolveMilkHisabReminderChannels({
      settings: business.settings,
      customer,
      country: business.country,
      hasInvoice: Boolean(invoiceId),
    });

    const whatsappUrl = channels.whatsapp.available
      ? buildMilkHisabWhatsAppUrl(customer.phone, business.country, message)
      : null;

    return await actionSuccess({
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email || null,
      phone: customer.phone || null,
      message,
      periodLabel,
      billLines: resolvedLines,
      channels,
      whatsappUrl,
      emailConfigured: resolveCampaignEmailConfig(business.settings).configured,
    });
  } catch (e) {
    console.error('prepareWaterHisabReminderAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_REMIND_PREVIEW_FAILED', await getErrorMessage(e));
  }
}

/**
 * Send collection reminder via hub alert, email, and/or WhatsApp (wa.me + optional webhook).
 * @param {{ channels?: Array<'hub'|'email'|'whatsapp'> }} params
 */
export async function sendWaterHisabReminderAction(params) {
  try {
    const {
      businessId,
      category,
      customerId,
      period,
      amount,
      invoiceId = null,
      invoiceNumber = null,
      houseNo = '',
      billLines = null,
      qtyByProduct = null,
      productMeta = null,
      channels: requestedChannels = ['hub', 'email', 'whatsapp'],
    } = params || {};

    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.view' });

    if (invoiceId) {
      const invPay = await prismaBase.invoices.findFirst({
        where: { id: invoiceId, business_id: businessId, is_deleted: false },
        select: { payment_status: true },
      });
      if (String(invPay?.payment_status || '').toLowerCase() === 'paid') {
        return await actionFailure('WATER_HISAB_ALREADY_PAID', 'Already paid. No reminder needed.');
      }
    }

    const preview = await prepareWaterHisabReminderAction({
      businessId,
      category,
      customerId,
      period,
      amount,
      invoiceId,
      invoiceNumber,
      houseNo,
      billLines,
      qtyByProduct,
      productMeta,
    });
    if (!preview.success) return preview;

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: {
        id: true,
        business_name: true,
        domain: true,
        country: true,
        currency: true,
        settings: true,
        category: true,
        address: true,
        phone: true,
        ntn: true,
      },
    });
    const customer = await prismaBase.customers.findFirst({
      where: { id: customerId, business_id: businessId, is_deleted: false },
    });

    const want = new Set(
      (Array.isArray(requestedChannels) ? requestedChannels : ['hub', 'email', 'whatsapp']).map(String)
    );
    const results = {
      hub: { attempted: false, ok: false },
      email: { attempted: false, ok: false },
      whatsapp: { attempted: false, ok: false, url: preview.whatsappUrl || null },
    };

    const handle = business?.domain || 'hub';
    const actionUrl = `/business/${handle}?tab=route-hisab`;

    if (want.has('hub')) {
      results.hub.attempted = true;
      try {
        await createNotification({
          businessId,
          userId: null,
          type: NOTIFICATION_TYPES.INVOICE,
          title: 'Water collection reminder',
          message: preview.message,
          actionUrl,
          metadata: {
            source: 'water_hisab_reminder',
            customerId,
            invoiceId,
            period,
            amount: Number(amount) || 0,
            sentBy: session?.user?.id || null,
          },
          priority: NOTIFICATION_PRIORITY.MEDIUM,
        });
        results.hub.ok = true;
      } catch (err) {
        results.hub.error = err?.message || 'Hub notify failed';
      }
    }

    if (want.has('email') && preview.channels?.email?.available) {
      results.email.attempted = true;
      try {
        const emailConfig = resolveCampaignEmailConfig(business?.settings);
        const sendRes = await sendCampaignOutreachEmail({
          apiKey: emailConfig.apiKey,
          from: emailConfig.from,
          to: preview.email,
          subject: invoiceNumber
            ? `Water delivery bill ${invoiceNumber} · ${preview.periodLabel}`
            : `Water delivery bill reminder · ${preview.periodLabel}`,
          replyTo: emailConfig.replyTo,
          react: React.createElement(CampaignOutreachEmail, {
            businessName: business?.business_name || 'Water supply',
            campaignName: 'Route Hisab reminder',
            body: preview.message,
            customerName: customer?.name || preview.customerName,
          }),
        });
        if (sendRes.skipped) {
          results.email.ok = false;
          results.email.error = sendRes.error || 'Email provider not configured';
        } else if (!sendRes.success) {
          results.email.ok = false;
          results.email.error = sendRes.error || 'Email failed';
        } else {
          results.email.ok = true;
          results.email.mode = 'resend';
        }
      } catch (err) {
        results.email.ok = false;
        results.email.error = err?.message || 'Email failed';
      }
    } else if (want.has('email')) {
      results.email.attempted = true;
      results.email.ok = false;
      results.email.error = preview.channels?.email?.hint || 'Email unavailable';
    }

    if (want.has('whatsapp')) {
      results.whatsapp.attempted = true;
      results.whatsapp.url = preview.whatsappUrl;
      if (!preview.whatsappUrl) {
        results.whatsapp.ok = false;
        results.whatsapp.error = preview.channels?.whatsapp?.hint || 'No phone';
      } else {
        results.whatsapp.ok = true;
        results.whatsapp.mode = 'wa.me';

        const integrations = getCampaignIntegrationsFromSettings(business?.settings);
        const wa = integrations.whatsapp && typeof integrations.whatsapp === 'object' ? integrations.whatsapp : {};
        if (wa.mode === 'webhook' && wa.webhook_url) {
          const hook = await postMilkHisabWhatsAppWebhook({
            webhookUrl: wa.webhook_url,
            apiToken: wa.api_token,
            payload: {
              type: 'water_hisab_reminder',
              businessId,
              customerId,
              customerName: preview.customerName,
              phone: preview.phone,
              message: preview.message,
              whatsappUrl: preview.whatsappUrl,
              period,
              amount: Number(amount) || 0,
              invoiceId,
              invoiceNumber,
            },
          });
          results.whatsapp.webhook = hook;
        }
      }
    }

    return await actionSuccess({
      customerId,
      message: preview.message,
      results,
      whatsappUrl: results.whatsapp.url,
    });
  } catch (e) {
    console.error('sendWaterHisabReminderAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_REMIND_FAILED', await getErrorMessage(e));
  }
}

/**
 * Remind all unpaid billed customers in a period (hub + email + WhatsApp links).
 */
export async function sendWaterHisabBulkRemindersAction({
  businessId,
  category,
  period,
  channels = ['hub', 'email', 'whatsapp'],
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });

    const summary = await getWaterHisabPeriodSummaryAction({ businessId, category, period });
    if (!summary.success) return summary;

    const targets = (summary.rows || []).filter((r) => isWaterHisabBillRemindable(r));

    const outcomes = [];
    for (const row of targets) {
      const res = await sendWaterHisabReminderAction({
        businessId,
        category,
        customerId: row.customerId,
        period,
        amount: row.amount,
        invoiceId: row.invoiceId,
        invoiceNumber: row.invoiceNumber,
        houseNo: row.houseNo,
        qtyByProduct: row.qtyByProduct,
        productMeta: row.productMeta,
        channels,
      });
      outcomes.push({
        customerId: row.customerId,
        customerName: row.customerName,
        success: Boolean(res.success),
        whatsappUrl: res.whatsappUrl || null,
        results: res.results || null,
        error: res.error || null,
      });
    }

    return await actionSuccess({
      period,
      label: summary.label,
      total: targets.length,
      outcomes,
    });
  } catch (e) {
    console.error('sendWaterHisabBulkRemindersAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_BULK_REMIND_FAILED', await getErrorMessage(e));
  }
}

async function refreshInvoicePaymentStatusFromBalance(businessId, invoiceId, client) {
  const balRes = await client.query('SELECT calculate_invoice_balance($1) as balance', [invoiceId]);
  const balance = Number(balRes.rows[0]?.balance || 0);
  const invRes = await client.query(
    `SELECT grand_total FROM invoices WHERE id = $1 AND business_id = $2 AND (is_deleted = false OR is_deleted IS NULL)`,
    [invoiceId, businessId]
  );
  const grand = Number(invRes.rows[0]?.grand_total || 0);
  const paidSoFar = Math.max(0, grand - balance);
  let paymentStatus = 'unpaid';
  if (balance <= 0.009) paymentStatus = 'paid';
  else if (paidSoFar > 0.009) paymentStatus = 'partial';

  await client.query(
    `UPDATE invoices
     SET payment_status = $1,
         status = CASE WHEN $2 THEN 'paid' WHEN status = 'paid' AND NOT $2 THEN 'sent' ELSE status END,
         updated_at = NOW()
     WHERE id = $3 AND business_id = $4`,
    [paymentStatus, paymentStatus === 'paid', invoiceId, businessId]
  );
  return { paymentStatus, balance };
}

/**
 * Compact Bills toggle: mark Route Hisab Paid/Unpaid.
 * Always writes customer domain_data period flag (hisab is separate from invoices).
 * When an invoice exists, also records/voids Route Hisab cash receipts on that invoice.
 */
export async function setWaterHisabBillPaymentStatusAction({
  businessId,
  category,
  invoiceId = null,
  customerId = null,
  period = null,
  paymentStatus,
}) {
  try {
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.record_payment' });
    const userId = session?.user?.id;
    const next = String(paymentStatus || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid';

    let periodKey = null;
    if (period) {
      try {
        periodKey = parseWaterHisabBillingPeriod(period).period;
      } catch {
        return await actionFailure('INVALID_PERIOD', 'Invalid billing period');
      }
    }

    let resolvedInvoiceId = invoiceId || null;
    let resolvedCustomerId = customerId || null;
    let invoiceNumber = null;

    if (resolvedInvoiceId) {
      const invoice = await prismaBase.invoices.findFirst({
        where: { id: resolvedInvoiceId, business_id: businessId, is_deleted: false },
        select: {
          id: true,
          invoice_number: true,
          grand_total: true,
          payment_status: true,
          customer_id: true,
          notes: true,
        },
      });
      if (!invoice) return await actionFailure('NOT_FOUND', 'Invoice not found');
      resolvedCustomerId = resolvedCustomerId || invoice.customer_id;
      invoiceNumber = invoice.invoice_number;
      if (!periodKey) {
        periodKey = String(invoice.notes || '').match(/\[water_hisab_period=([^\]]+)\]/)?.[1] || null;
      }
    }

    if (!resolvedCustomerId) {
      return await actionFailure('INVALID', 'Customer required');
    }
    if (!periodKey) {
      return await actionFailure('INVALID_PERIOD', 'Billing period required to mark paid/unpaid');
    }

    const customer = await prismaBase.customers.findFirst({
      where: { id: resolvedCustomerId, business_id: businessId, is_deleted: false },
      select: { id: true, domain_data: true },
    });
    if (!customer) return await actionFailure('NOT_FOUND', 'Customer not found');

    const nextDomain = patchWaterHisabPeriodPayment(customer.domain_data, periodKey, next);
    await prismaBase.customers.update({
      where: { id: customer.id },
      data: { domain_data: nextDomain },
    });

    // No invoice yet — hisab-only status is enough.
    if (!resolvedInvoiceId) {
      return await actionSuccess({
        customerId: resolvedCustomerId,
        period: periodKey,
        paymentStatus: next,
        invoiceId: null,
        invoiceNumber: null,
        hisabOnly: true,
      });
    }

    if (next === 'paid') {
      const summary = await InvoicePaymentService.getPaymentSummary(businessId, resolvedInvoiceId);
      const balance = Number(summary?.balance ?? 0) || 0;
      if (balance <= 0.009) {
        return await actionSuccess({
          customerId: resolvedCustomerId,
          period: periodKey,
          invoiceId: resolvedInvoiceId,
          paymentStatus: 'paid',
          invoiceNumber,
          alreadyPaid: true,
        });
      }

      const result = await InvoicePaymentService.recordPayment({
        businessId,
        invoiceId: resolvedInvoiceId,
        amount: Math.round(balance * 100) / 100,
        paymentMethod: 'cash',
        notes: WATER_HISAB_COLLECTION_NOTE,
        userId,
      });

      return await actionSuccess(
        serializeDecimalsDeep({
          customerId: resolvedCustomerId,
          period: periodKey,
          invoiceId: resolvedInvoiceId,
          paymentStatus: result?.invoice?.payment_status || 'paid',
          invoiceNumber,
          paymentId: result?.payment?.id || null,
        })
      );
    }

    const payments = await InvoicePaymentService.getPaymentsForInvoice(businessId, resolvedInvoiceId);
    const routePayments = (payments || []).filter((p) =>
      String(p.notes || '').includes(WATER_HISAB_COLLECTION_NOTE)
    );

    if (!routePayments.length) {
      const inv = await prismaBase.invoices.findFirst({
        where: { id: resolvedInvoiceId, business_id: businessId, is_deleted: false },
        select: { payment_status: true },
      });
      const status = String(inv?.payment_status || '').toLowerCase();
      if (status === 'paid' || status === 'partial') {
        return await actionFailure(
          'WATER_HISAB_PAYMENT_OPEN_INVOICES',
          'This invoice has other receipts. Open invoices to reverse payment.'
        );
      }
      return await actionSuccess({
        customerId: resolvedCustomerId,
        period: periodKey,
        invoiceId: resolvedInvoiceId,
        paymentStatus: 'unpaid',
        invoiceNumber,
        alreadyUnpaid: true,
      });
    }

    for (const payment of routePayments) {
      await InvoicePaymentService.voidPayment(
        businessId,
        payment.id,
        userId,
        'Route Hisab unpaid toggle'
      );
    }

    const client = await pool.connect();
    try {
      const refreshed = await refreshInvoicePaymentStatusFromBalance(
        businessId,
        resolvedInvoiceId,
        client
      );
      if (refreshed.paymentStatus === 'paid' || refreshed.paymentStatus === 'partial') {
        return await actionFailure(
          'WATER_HISAB_PAYMENT_OPEN_INVOICES',
          'Other receipts still cover this bill. Open invoices to reverse payment.'
        );
      }
      return await actionSuccess({
        customerId: resolvedCustomerId,
        period: periodKey,
        invoiceId: resolvedInvoiceId,
        paymentStatus: refreshed.paymentStatus,
        invoiceNumber,
        voidedCount: routePayments.length,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('setWaterHisabBillPaymentStatusAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_PAYMENT_STATUS_FAILED', await getErrorMessage(e));
  }
}

/**
 * Load daily rider shift dispatch & load-out reconciliation records.
 */
export async function getWaterRiderShiftsAction({ businessId, category, deliveryDate }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    const dateKey = toWaterHisabDateKey(deliveryDate || new Date());

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? business.settings : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? settings.waterDelivery : {};
    const shiftsMap = waterDelivery.riderShifts && typeof waterDelivery.riderShifts === 'object' ? waterDelivery.riderShifts : {};
    const rawShifts = Array.isArray(shiftsMap[dateKey]) ? shiftsMap[dateKey] : [];

    const shifts = rawShifts.map((s) => {
      const recon = computeWaterRiderShiftReconciliation(s);
      return {
        id: s.id || `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        riderId: s.riderId || null,
        riderName: s.riderName || 'Rider',
        routeLabel: s.routeLabel || 'General Route',
        vehicleNo: s.vehicleNo || '',
        loadedBottles: recon.loadedBottles,
        returnedFull: recon.returnedFull,
        returnedEmpty: recon.returnedEmpty,
        deliveredBottles: recon.deliveredBottles,
        cashCollected: recon.cashCollected,
        expectedCash: recon.expectedCash,
        cashShortage: recon.cashShortage,
        emptyShortage: recon.emptyShortage,
        isBalanced: recon.isBalanced,
        status: s.status || 'closed',
        notes: s.notes || '',
      };
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        deliveryDate: dateKey,
        shifts,
        summary: {
          totalShifts: shifts.length,
          totalLoaded: shifts.reduce((acc, s) => acc + s.loadedBottles, 0),
          totalDelivered: shifts.reduce((acc, s) => acc + s.deliveredBottles, 0),
          totalCash: shifts.reduce((acc, s) => acc + s.cashCollected, 0),
          totalShortage: shifts.reduce((acc, s) => acc + s.cashShortage, 0),
        },
      })
    );
  } catch (e) {
    console.error('getWaterRiderShiftsAction', e);
    return await actionFailure(e?.code || 'WATER_RIDER_SHIFTS_FAILED', await getErrorMessage(e));
  }
}

/**
 * Save rider shift load-out & return record for a date.
 */
export async function saveWaterRiderShiftAction({ businessId, category, deliveryDate, shiftData }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.create_invoice' });
    const dateKey = toWaterHisabDateKey(deliveryDate || new Date());

    if (!shiftData || !shiftData.riderName) {
      return await actionFailure('INVALID', 'Rider name required');
    }

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? { ...business.settings } : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? { ...settings.waterDelivery } : {};
    const shiftsMap = waterDelivery.riderShifts && typeof waterDelivery.riderShifts === 'object' ? { ...waterDelivery.riderShifts } : {};
    const currentList = Array.isArray(shiftsMap[dateKey]) ? [...shiftsMap[dateKey]] : [];

    const recon = computeWaterRiderShiftReconciliation(shiftData);
    const shiftId = shiftData.id || `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newRecord = {
      id: shiftId,
      riderId: shiftData.riderId || null,
      riderName: String(shiftData.riderName).trim(),
      routeLabel: String(shiftData.routeLabel || '').trim(),
      vehicleNo: String(shiftData.vehicleNo || '').trim(),
      loadedBottles: recon.loadedBottles,
      returnedFull: recon.returnedFull,
      returnedEmpty: recon.returnedEmpty,
      cashCollected: recon.cashCollected,
      defaultUnitPrice: Number(shiftData.defaultUnitPrice) || 150,
      notes: String(shiftData.notes || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = currentList.findIndex((s) => s.id === shiftId);
    if (existingIdx >= 0) {
      currentList[existingIdx] = newRecord;
    } else {
      currentList.push(newRecord);
    }

    shiftsMap[dateKey] = currentList;
    waterDelivery.riderShifts = shiftsMap;
    settings.waterDelivery = waterDelivery;

    await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings },
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        deliveryDate: dateKey,
        shift: newRecord,
        reconciliation: recon,
      })
    );
  } catch (e) {
    console.error('saveWaterRiderShiftAction', e);
    return await actionFailure(e?.code || 'SAVE_RIDER_SHIFT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Plant Bottle Float & Asset Control Intelligence (plant full/empty + customer balances + idle bottle warnings).
 */
export async function getWaterBottleFloatIntelligenceAction({ businessId, category }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? business.settings : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? settings.waterDelivery : {};
    const bottleSettings = waterDelivery.bottleAsset && typeof waterDelivery.bottleAsset === 'object' ? waterDelivery.bottleAsset : {};

    const customers = await prismaBase.customers.findMany({
      where: { business_id: businessId, is_deleted: false, is_active: true },
      select: { id: true, name: true, phone: true, domain_data: true },
      take: 500,
    });

    const customerBalances = customers.map((c) => {
      const prefs = readWaterCustomerPrefs(c);
      return prefs.bottleBalance;
    });

    const summary = resolveWaterBottleFloatSummary({
      plantFull: Number(bottleSettings.plantFull) || 120,
      plantEmpty: Number(bottleSettings.plantEmpty) || 40,
      customerBalances,
      damagedCount: Number(bottleSettings.damagedScrapped) || 5,
      bottleUnitCost: Number(bottleSettings.bottleUnitCost) || 1200,
    });

    const idleCustomers = findIdleBottleCustomers(customers, 2);

    return await actionSuccess(
      serializeDecimalsDeep({
        summary,
        idleCustomers,
        totalCustomers: customers.length,
      })
    );
  } catch (e) {
    console.error('getWaterBottleFloatIntelligenceAction', e);
    return await actionFailure(e?.code || 'WATER_BOTTLE_FLOAT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Save plant bottle asset counts (Plant full, empty, unit cost, damaged).
 */
export async function saveWaterBottleFloatSettingsAction({
  businessId,
  category,
  plantFull,
  plantEmpty,
  bottleUnitCost,
  damagedScrapped,
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.create_invoice' });

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? { ...business.settings } : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? { ...settings.waterDelivery } : {};

    waterDelivery.bottleAsset = {
      plantFull: Math.max(0, Number(plantFull) || 0),
      plantEmpty: Math.max(0, Number(plantEmpty) || 0),
      bottleUnitCost: Math.max(0, Number(bottleUnitCost) || 1200),
      damagedScrapped: Math.max(0, Number(damagedScrapped) || 0),
      updatedAt: new Date().toISOString(),
    };

    settings.waterDelivery = waterDelivery;

    await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings },
    });

    return await actionSuccess({
      saved: true,
      bottleAsset: waterDelivery.bottleAsset,
    });
  } catch (e) {
    console.error('saveWaterBottleFloatSettingsAction', e);
    return await actionFailure(e?.code || 'SAVE_BOTTLE_FLOAT_FAILED', await getErrorMessage(e));
  }
}

