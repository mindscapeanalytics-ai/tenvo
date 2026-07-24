'use server';

/**
 * Milk-shop Route Hisab server actions (daily sheet + week/month invoices).
 */
import { prismaBase } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { InvoiceService } from '@/lib/services/InvoiceService';
import { isMilkHisabRelevant } from '@/lib/storefront/milkShopHisab';
import {
  resolveMilkHisabProducts,
  readMilkCustomerPrefs,
  toMilkHisabDateKey,
  milkHisabPeriodMarker,
  parseMilkHisabBillingPeriod,
} from '@/lib/storefront/milkShopHisab';
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

function assertMilkHisab(category) {
  if (!isMilkHisabRelevant(category)) {
    const err = new Error('Route Hisab is only available for milk shops');
    err.code = 'MILK_HISAB_DOMAIN';
    throw err;
  }
}

/**
 * Load daily sheet: customers + product columns + existing stops.
 */
export async function getMilkHisabDayAction({ businessId, category, deliveryDate }) {
  try {
    assertMilkHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.view' });
    void session;

    const dateKey = toMilkHisabDateKey(deliveryDate || new Date());
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
      prismaBase.milk_delivery_stops.findMany({
        where: {
          business_id: businessId,
          delivery_date: new Date(dateKey),
          is_deleted: false,
        },
        include: { lines: true },
      }),
    ]);

    const hisabProducts = resolveMilkHisabProducts(products, business.settings || {});
    const milkProductId = hisabProducts.find((p) => /milk/i.test(`${p.name} ${p.category || ''}`))?.id;

    const stopByCustomer = new Map(stops.map((s) => [s.customer_id, s]));
    const rows = customers
      .map((c) => {
        const prefs = readMilkCustomerPrefs(c);
        if (!prefs.deliveryActive && !stopByCustomer.has(c.id)) return null;
        const stop = stopByCustomer.get(c.id);
        const qtyByProduct = {};
        for (const p of hisabProducts) {
          const line = stop?.lines?.find((l) => l.product_id === p.id);
          if (line) {
            qtyByProduct[p.id] = Number(line.quantity) || 0;
          } else if (!stop && milkProductId && p.id === milkProductId && prefs.dailyMilkKg > 0) {
            qtyByProduct[p.id] = prefs.dailyMilkKg;
          } else {
            qtyByProduct[p.id] = 0;
          }
        }
        return {
          customerId: c.id,
          customerName: c.name,
          houseNo: stop?.house_no_snapshot || prefs.houseNo || '',
          routeLabel: stop?.route_label || prefs.routeLabel || '',
          notes: stop?.notes || '',
          stopId: stop?.id || null,
          qtyByProduct,
        };
      })
      .filter(Boolean);

    return await actionSuccess(
      serializeDecimalsDeep({
        deliveryDate: dateKey,
        products: hisabProducts.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit || 'pcs',
          price: Number(p.price) || 0,
          category: p.category || '',
        })),
        rows,
      })
    );
  } catch (e) {
    console.error('getMilkHisabDayAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_DAY_FAILED', await getErrorMessage(e));
  }
}

/**
 * Save daily sheet rows (upsert stops + replace lines).
 * @param {{ businessId: string, category: string, deliveryDate: string, rows: Array }} params
 */
export async function saveMilkHisabDayAction(params) {
  try {
    const { businessId, category, deliveryDate, rows = [] } = params || {};
    assertMilkHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.create_invoice' });
    void session;

    const dateKey = toMilkHisabDateKey(deliveryDate);
    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { settings: true },
    });
    const products = await prismaBase.products.findMany({
      where: { business_id: businessId, is_deleted: false },
      take: 500,
    });
    const hisabProducts = resolveMilkHisabProducts(products, business?.settings || {});
    const productMap = new Map(hisabProducts.map((p) => [p.id, p]));

    await prismaBase.$transaction(async (tx) => {
      for (const row of rows) {
        const customerId = row.customerId;
        if (!customerId) continue;
        const customer = await tx.customers.findFirst({
          where: { id: customerId, business_id: businessId, is_deleted: false },
        });
        if (!customer) continue;
        const prefs = readMilkCustomerPrefs(customer);

        const stop = await tx.milk_delivery_stops.upsert({
          where: {
            business_id_delivery_date_customer_id: {
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
            status: 'confirmed',
          },
          update: {
            house_no_snapshot: row.houseNo || prefs.houseNo || null,
            customer_name_snapshot: customer.name,
            route_label: row.routeLabel || prefs.routeLabel || null,
            notes: row.notes || null,
            status: 'confirmed',
            is_deleted: false,
            deleted_at: null,
          },
        });

        await tx.milk_delivery_lines.deleteMany({ where: { stop_id: stop.id, business_id: businessId } });

        const qtyMap = row.qtyByProduct || {};
        const lineCreates = [];
        for (const [productId, rawQty] of Object.entries(qtyMap)) {
          const qty = Number(rawQty);
          if (!Number.isFinite(qty) || qty <= 0) continue;
          const product = productMap.get(productId);
          if (!product) continue;
          lineCreates.push({
            business_id: businessId,
            stop_id: stop.id,
            product_id: product.id,
            product_name_snapshot: product.name,
            unit_snapshot: product.unit || 'pcs',
            quantity: qty,
            unit_price_snapshot: Number(product.price) || 0,
          });
        }
        if (lineCreates.length) {
          await tx.milk_delivery_lines.createMany({ data: lineCreates });
        }
      }
    });

    return await actionSuccess({ deliveryDate: dateKey, saved: rows.length });
  } catch (e) {
    console.error('saveMilkHisabDayAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_SAVE_FAILED', await getErrorMessage(e));
  }
}

/**
 * Week or month summary per customer for collection.
 */
export async function getMilkHisabPeriodSummaryAction({ businessId, category, period }) {
  try {
    assertMilkHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    const bounds = parseMilkHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;
    const marker = milkHisabPeriodMarker(periodKey);

    const stops = await prismaBase.milk_delivery_stops.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        delivery_date: {
          gte: new Date(startIso),
          lte: new Date(endIso),
        },
      },
      include: { lines: true, customers: { select: { id: true, name: true, domain_data: true, address: true } } },
    });

    const invoices = await prismaBase.invoices.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        notes: { contains: marker },
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
      const cid = stop.customer_id;
      if (!byCustomer.has(cid)) {
        const prefs = readMilkCustomerPrefs(stop.customers || {});
        byCustomer.set(cid, {
          customerId: cid,
          customerName: stop.customer_name_snapshot || stop.customers?.name || 'Customer',
          houseNo: stop.house_no_snapshot || prefs.houseNo || '',
          qtyByProduct: {},
          amount: 0,
          stopCount: 0,
        });
      }
      const row = byCustomer.get(cid);
      row.stopCount += 1;
      for (const line of stop.lines || []) {
        const q = Number(line.quantity) || 0;
        const price = Number(line.unit_price_snapshot) || 0;
        row.qtyByProduct[line.product_id] = (row.qtyByProduct[line.product_id] || 0) + q;
        row.amount += q * price;
        if (!row.productMeta) row.productMeta = {};
        row.productMeta[line.product_id] = {
          name: line.product_name_snapshot,
          unit: line.unit_snapshot,
        };
      }
    }

    const invoiceByCustomer = new Map();
    for (const inv of invoices) {
      if (inv.customer_id) invoiceByCustomer.set(inv.customer_id, inv);
    }

    const rows = [...byCustomer.values()].map((r) => {
      const inv = invoiceByCustomer.get(r.customerId);
      return {
        customerId: r.customerId,
        customerName: r.customerName,
        houseNo: r.houseNo,
        qtyByProduct: r.qtyByProduct,
        productMeta: r.productMeta || {},
        amount: Math.round(r.amount * 100) / 100,
        stopCount: r.stopCount,
        invoiceId: inv?.id || null,
        invoiceNumber: inv?.invoice_number || null,
        paymentStatus: inv?.payment_status || null,
        billed: Boolean(inv),
      };
    });

    rows.sort((a, b) => String(a.customerName).localeCompare(String(b.customerName)));

    const productIds = new Set();
    for (const r of rows) {
      Object.keys(r.qtyByProduct || {}).forEach((id) => productIds.add(id));
    }
    const productCols = [...productIds].map((id) => {
      const meta = rows.find((r) => r.productMeta?.[id])?.productMeta?.[id];
      return { id, name: meta?.name || 'Item', unit: meta?.unit || '' };
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        startIso,
        endIso,
        productColumns: productCols,
        rows,
      })
    );
  } catch (e) {
    console.error('getMilkHisabPeriodSummaryAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_PERIOD_FAILED', await getErrorMessage(e));
  }
}

/** @deprecated Prefer getMilkHisabPeriodSummaryAction (week + month). */
export async function getMilkHisabMonthSummaryAction(params) {
  return getMilkHisabPeriodSummaryAction(params);
}

/**
 * Generate one unpaid invoice per customer for the week or month (skip already billed).
 */
export async function generateMilkHisabInvoicesAction({ businessId, category, period, customerIds = null }) {
  try {
    assertMilkHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.create_invoice' });
    const bounds = parseMilkHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;
    const marker = milkHisabPeriodMarker(periodKey);

    const summary = await getMilkHisabPeriodSummaryAction({ businessId, category, period: periodKey });
    if (!summary.success) return summary;
    let targets = summary.rows || [];
    if (Array.isArray(customerIds) && customerIds.length) {
      const allow = new Set(customerIds.map(String));
      targets = targets.filter((r) => allow.has(String(r.customerId)));
    }
    targets = targets.filter((r) => !r.billed && r.amount > 0);

    const created = [];
    const skipped = [];
    const collectionTerms =
      kind === 'week' ? 'Weekly milk delivery collection' : 'Monthly milk delivery collection';

    for (const row of targets) {
      const existing = await prismaBase.invoices.findFirst({
        where: {
          business_id: businessId,
          customer_id: row.customerId,
          is_deleted: false,
          notes: { contains: marker },
        },
      });
      if (existing) {
        skipped.push({ customerId: row.customerId, reason: 'already_billed' });
        continue;
      }

      const lines = await prismaBase.milk_delivery_lines.findMany({
        where: {
          business_id: businessId,
          stop: {
            customer_id: row.customerId,
            delivery_date: { gte: new Date(startIso), lte: new Date(endIso) },
            is_deleted: false,
          },
        },
      });
      const agg = new Map();
      for (const line of lines) {
        const cur = agg.get(line.product_id) || {
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
        agg.set(line.product_id, cur);
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
          date: new Date(endIso),
          due_date: new Date(endIso),
          status: 'sent',
          payment_status: 'unpaid',
          payment_method: 'credit',
          subtotal: grand,
          tax_total: 0,
          total_tax: 0,
          discount_total: 0,
          grand_total: grand,
          notes: `Milk route hisab ${label}. House ${row.houseNo || '-'}. ${marker}`,
          terms: collectionTerms,
          skip_inventory: true,
          items: invoiceItems,
        },
        session.user.id
      );

      created.push({
        customerId: row.customerId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        grandTotal: Number(invoice.grand_total),
      });
    }

    return await actionSuccess(
      serializeDecimalsDeep({ period: periodKey, kind, label, created, skipped })
    );
  } catch (e) {
    console.error('generateMilkHisabInvoicesAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_INVOICE_FAILED', await getErrorMessage(e));
  }
}

/**
 * Load invoice + lines for 58mm thermal hisab bill print.
 */
export async function getMilkHisabBillPrintAction({ businessId, category, invoiceId }) {
  try {
    assertMilkHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!invoiceId) return await actionFailure('INVALID', 'Invoice required');

    const invoice = await InvoiceService.getInvoiceWithItems(invoiceId, businessId);
    if (!invoice) return await actionFailure('NOT_FOUND', 'Invoice not found');

    const notes = String(invoice.notes || '');
    const markerMatch = notes.match(/\[milk_hisab_period=([^\]]+)\]/);
    const period = markerMatch?.[1] || '';
    let periodLabel = period;
    let kind = 'month';
    if (period) {
      try {
        const parsed = parseMilkHisabBillingPeriod(period);
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
    console.error('getMilkHisabBillPrintAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_PRINT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Preview reminder channels + prefilled WhatsApp / email copy for one customer.
 */
export async function prepareMilkHisabReminderAction({
  businessId,
  category,
  customerId,
  period,
  amount,
  invoiceId = null,
  invoiceNumber = null,
  houseNo = '',
}) {
  try {
    assertMilkHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!customerId) return await actionFailure('INVALID', 'Customer required');

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: {
        id: true,
        business_name: true,
        name: true,
        handle: true,
        domain: true,
        country: true,
        currency: true,
        settings: true,
      },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const customer = await prismaBase.customers.findFirst({
      where: { id: customerId, business_id: businessId, is_deleted: false },
    });
    if (!customer) return await actionFailure('NOT_FOUND', 'Customer not found');

    const prefs = readMilkCustomerPrefs(customer);
    let periodLabel = String(period || '');
    try {
      if (period) periodLabel = parseMilkHisabBillingPeriod(period).label;
    } catch {
      /* keep raw */
    }

    const pack = getBusinessRegionalPack(business);
    const message = buildMilkHisabReminderMessage({
      businessName: business.business_name || business.name,
      customerName: customer.name,
      houseNo: houseNo || prefs.houseNo,
      amount,
      periodLabel,
      invoiceNumber,
      currency: pack.currency,
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
      channels,
      whatsappUrl,
      emailConfigured: resolveCampaignEmailConfig(business.settings).configured,
    });
  } catch (e) {
    console.error('prepareMilkHisabReminderAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_REMIND_PREVIEW_FAILED', await getErrorMessage(e));
  }
}

/**
 * Send collection reminder via hub alert, email, and/or WhatsApp (wa.me + optional webhook).
 * @param {{ channels?: Array<'hub'|'email'|'whatsapp'> }} params
 */
export async function sendMilkHisabReminderAction(params) {
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
      channels: requestedChannels = ['hub', 'email', 'whatsapp'],
    } = params || {};

    assertMilkHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.view' });

    const preview = await prepareMilkHisabReminderAction({
      businessId,
      category,
      customerId,
      period,
      amount,
      invoiceId,
      invoiceNumber,
      houseNo,
    });
    if (!preview.success) return preview;

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: {
        id: true,
        business_name: true,
        name: true,
        handle: true,
        domain: true,
        country: true,
        settings: true,
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

    const handle = business?.handle || business?.domain || 'hub';
    const actionUrl = `/business/${handle}?tab=route-hisab`;

    if (want.has('hub')) {
      results.hub.attempted = true;
      try {
        await createNotification({
          businessId,
          userId: null,
          type: NOTIFICATION_TYPES.INVOICE,
          title: 'Milk collection reminder',
          message: preview.message,
          actionUrl,
          metadata: {
            source: 'milk_hisab_reminder',
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
            ? `Milk delivery bill ${invoiceNumber} · ${preview.periodLabel}`
            : `Milk delivery bill reminder · ${preview.periodLabel}`,
          replyTo: emailConfig.replyTo,
          react: React.createElement(CampaignOutreachEmail, {
            businessName: business?.business_name || business?.name || 'Milk shop',
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
              type: 'milk_hisab_reminder',
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
    console.error('sendMilkHisabReminderAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_REMIND_FAILED', await getErrorMessage(e));
  }
}

/**
 * Remind all unpaid billed customers in a period (hub + email + WhatsApp links).
 */
export async function sendMilkHisabBulkRemindersAction({
  businessId,
  category,
  period,
  channels = ['hub', 'email', 'whatsapp'],
}) {
  try {
    assertMilkHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });

    const summary = await getMilkHisabPeriodSummaryAction({ businessId, category, period });
    if (!summary.success) return summary;

    const targets = (summary.rows || []).filter(
      (r) => Number(r.amount) > 0 && (!r.billed || r.paymentStatus !== 'paid')
    );

    const outcomes = [];
    for (const row of targets) {
      const res = await sendMilkHisabReminderAction({
        businessId,
        category,
        customerId: row.customerId,
        period,
        amount: row.amount,
        invoiceId: row.invoiceId,
        invoiceNumber: row.invoiceNumber,
        houseNo: row.houseNo,
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
    console.error('sendMilkHisabBulkRemindersAction', e);
    return await actionFailure(e?.code || 'MILK_HISAB_BULK_REMIND_FAILED', await getErrorMessage(e));
  }
}
