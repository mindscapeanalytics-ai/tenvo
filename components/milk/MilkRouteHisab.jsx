'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Loader2,
  RefreshCw,
  Save,
  FileText,
  Printer,
  Download,
  Bell,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { formatCurrency } from '@/lib/currency';
import notify from '@/lib/utils/appToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileTabHeader, MobileStatStrip } from '@/components/mobile/MobileTabHeader';
import { HUB_MOBILE_ROOT } from '@/lib/utils/mobileLayout';
import { navigateHubTab } from '@/lib/utils/hubTabNavigation';
import {
  getMilkHisabDayAction,
  saveMilkHisabDayAction,
  getMilkHisabPeriodSummaryAction,
  generateMilkHisabInvoicesAction,
  getMilkHisabBillPrintAction,
  sendMilkHisabReminderAction,
  sendMilkHisabBulkRemindersAction,
} from '@/lib/actions/standard/milkHisab';
import {
  toMilkHisabDateKey,
  toMilkHisabPeriodKey,
  toMilkHisabWeekKey,
  shortMilkHisabProductLabel,
  buildMilkHisabPeriodKpis,
} from '@/lib/storefront/milkShopHisab';
import { printMilkHisabThermalBill, printMilkHisabThermalBillFromRow } from '@/lib/print/milkHisabThermalBill';
import { MARKETING_STAT_VALUE } from '@/lib/utils/typography';

function todayKey() {
  return toMilkHisabDateKey(new Date());
}

function currentMonth() {
  return toMilkHisabPeriodKey(new Date());
}

function currentWeek() {
  return toMilkHisabWeekKey(new Date());
}

/**
 * Milk-shop Route Hisab: daily doorstep grid + week/month 58mm bills.
 */
export function MilkRouteHisab({ businessId, category }) {
  const { currency, business } = useBusiness();
  const handle = business?.handle || business?.domain || category;
  const [view, setView] = useState('daily');
  const [billKind, setBillKind] = useState('week');
  const [deliveryDate, setDeliveryDate] = useState(todayKey);
  const [weekPeriod, setWeekPeriod] = useState(currentWeek);
  const [monthPeriod, setMonthPeriod] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [remindingId, setRemindingId] = useState(null);
  const [bulkReminding, setBulkReminding] = useState(false);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [billRows, setBillRows] = useState([]);
  const [productColumns, setProductColumns] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');
  const [dayKpis, setDayKpis] = useState(null);
  const [billKpis, setBillKpis] = useState(null);
  const [filter, setFilter] = useState('');

  const billingPeriod = billKind === 'week' ? weekPeriod : monthPeriod;

  const loadDay = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await getMilkHisabDayAction({
        businessId,
        category,
        deliveryDate,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to load day sheet');
        setRows([]);
        setProducts([]);
        setDayKpis(null);
        return;
      }
      setProducts(res.products || []);
      setRows(res.rows || []);
      setDayKpis(res.kpis || null);
    } catch (e) {
      notify.error(e?.message || 'Failed to load day sheet');
    } finally {
      setLoading(false);
    }
  }, [businessId, category, deliveryDate]);

  const loadBills = useCallback(async () => {
    if (!businessId || !billingPeriod) return;
    setLoading(true);
    try {
      const res = await getMilkHisabPeriodSummaryAction({
        businessId,
        category,
        period: billingPeriod,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to load bill summary');
        setBillRows([]);
        setProductColumns([]);
        setPeriodLabel('');
        setBillKpis(null);
        return;
      }
      setBillRows(res.rows || []);
      setProductColumns(res.productColumns || []);
      setPeriodLabel(res.label || billingPeriod);
      setBillKpis(res.kpis || buildMilkHisabPeriodKpis(res.rows || []));
    } catch (e) {
      notify.error(e?.message || 'Failed to load bill summary');
    } finally {
      setLoading(false);
    }
  }, [businessId, category, billingPeriod]);

  useEffect(() => {
    if (view === 'daily') void loadDay();
    else void loadBills();
  }, [view, loadDay, loadBills]);

  const visibleRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter(
        (r) =>
          String(r.customerName || '').toLowerCase().includes(q) ||
          String(r.houseNo || '').toLowerCase().includes(q) ||
          String(r.routeLabel || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const houseCmp = String(a.houseNo || '').localeCompare(String(b.houseNo || ''), undefined, {
        numeric: true,
      });
      if (houseCmp !== 0) return houseCmp;
      return String(a.customerName || '').localeCompare(String(b.customerName || ''));
    });
  }, [rows, filter]);

  const visibleBillRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return billRows;
    return billRows.filter(
      (r) =>
        String(r.customerName || '').toLowerCase().includes(q) ||
        String(r.houseNo || '').toLowerCase().includes(q)
    );
  }, [billRows, filter]);

  const dayTotal = useMemo(() => {
    if (dayKpis?.dayTotal != null) return Number(dayKpis.dayTotal) || 0;
    let amount = 0;
    for (const row of rows) {
      for (const p of products) {
        const qty = Number(row.qtyByProduct?.[p.id]) || 0;
        amount += qty * (Number(p.price) || 0);
      }
    }
    return Math.round(amount * 100) / 100;
  }, [rows, products, dayKpis]);

  const liveBillKpis = useMemo(() => billKpis || buildMilkHisabPeriodKpis(billRows), [billKpis, billRows]);

  const dayStatItems = useMemo(() => {
    let deliveredLive = 0;
    let housesSetLive = 0;
    for (const row of rows) {
      if (Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0)) deliveredLive += 1;
      if (String(row.houseNo || '').trim()) housesSetLive += 1;
    }
    const onRoute = rows.length;
    const pending = Math.max(0, onRoute - deliveredLive);
    return [
      {
        label: 'On route',
        value: onRoute,
        hint: 'Customers today',
      },
      {
        label: 'Delivered',
        value: deliveredLive,
        valueTone: 'text-sky-700',
        hint: 'With qty entered',
      },
      {
        label: 'Pending',
        value: pending,
        valueTone: pending ? 'text-amber-700' : 'text-gray-900',
        hint: 'Still zero qty',
        alert: pending > 0 && deliveredLive > 0,
      },
      {
        label: 'Day total',
        value: formatCurrency(dayTotal, currency),
        valueTone: 'text-gray-900',
      },
      {
        label: 'Houses set',
        value: housesSetLive,
        hint: 'House no filled',
      },
    ];
  }, [rows, dayTotal, currency]);

  const billStatItems = useMemo(
    () => [
      {
        label: 'Customers',
        value: liveBillKpis.customers || 0,
        hint: periodLabel || 'This period',
      },
      {
        label: 'Period total',
        value: formatCurrency(liveBillKpis.totalAmount || 0, currency),
      },
      {
        label: 'Unbilled',
        value: formatCurrency(liveBillKpis.unbilledAmount || 0, currency),
        valueTone: liveBillKpis.unbilledCount ? 'text-amber-700' : 'text-gray-900',
        hint: `${liveBillKpis.unbilledCount || 0} to generate`,
        alert: (liveBillKpis.unbilledCount || 0) > 0,
      },
      {
        label: 'Unpaid',
        value: formatCurrency(liveBillKpis.unpaidAmount || 0, currency),
        valueTone: liveBillKpis.unpaidCount ? 'text-rose-700' : 'text-gray-900',
        hint: `${liveBillKpis.unpaidCount || 0} billed open`,
        alert: (liveBillKpis.unpaidCount || 0) > 0,
      },
      {
        label: 'Paid',
        value: formatCurrency(liveBillKpis.paidAmount || 0, currency),
        valueTone: 'text-emerald-700',
        hint: `${liveBillKpis.paidCount || 0} collected`,
      },
      {
        label: 'Stops',
        value: liveBillKpis.deliveryDays || 0,
        hint: 'Delivery days logged',
      },
    ],
    [liveBillKpis, currency, periodLabel]
  );

  const updateQty = (customerId, productId, value) => {
    const next = value === '' ? '' : value;
    setRows((prev) =>
      prev.map((r) => {
        if (r.customerId !== customerId) return r;
        return {
          ...r,
          qtyByProduct: {
            ...r.qtyByProduct,
            [productId]: next === '' ? '' : Number(next),
          },
        };
      })
    );
  };

  const updateRowField = (customerId, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.customerId === customerId ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveDay = async () => {
    setSaving(true);
    try {
      const payloadRows = rows.map((r) => {
        const qtyByProduct = {};
        for (const [pid, raw] of Object.entries(r.qtyByProduct || {})) {
          const n = Number(raw);
          if (Number.isFinite(n) && n > 0) qtyByProduct[pid] = n;
        }
        return {
          customerId: r.customerId,
          houseNo: r.houseNo,
          routeLabel: r.routeLabel,
          notes: r.notes,
          qtyByProduct,
        };
      });
      const res = await saveMilkHisabDayAction({
        businessId,
        category,
        deliveryDate,
        rows: payloadRows,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Save failed');
        return;
      }
      notify.compactSave('Day sheet saved');
      await loadDay();
    } catch (e) {
      notify.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const res = await generateMilkHisabInvoicesAction({
        businessId,
        category,
        period: billingPeriod,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Bill generation failed');
        return;
      }
      const created = res.created?.length || 0;
      const skipped = res.skipped?.length || 0;
      const kindLabel = billKind === 'week' ? 'weekly' : 'monthly';
      notify.compactSave(
        created
          ? `Created ${created} ${kindLabel} bill${created === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}`
          : skipped
            ? `No new bills (${skipped} skipped)`
            : 'No new bills'
      );
      await loadBills();
    } catch (e) {
      notify.error(e?.message || 'Bill generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintBill = async (row, mode = 'print') => {
    if (!row || !(Number(row.amount) > 0 || row.invoiceId)) {
      notify.error('No billable amount for this customer');
      return;
    }
    const printKey = `${row.invoiceId || row.customerId}:${mode}`;
    setPrintingId(printKey);
    try {
      const thermalBusiness = {
        ...(business || {}),
        business_name:
          business?.business_name || business?.name || business?.businessName || 'Milk shop',
        category: business?.category || category,
      };

      if (row.invoiceId) {
        const res = await getMilkHisabBillPrintAction({
          businessId,
          category,
          invoiceId: row.invoiceId,
        });
        if (!res?.success) {
          notify.error(res?.error || 'Could not load bill');
          return;
        }
        const ok = await printMilkHisabThermalBill(
          {
            business: thermalBusiness,
            invoice: res.invoice,
            items: res.items || [],
            houseNo: res.houseNo || row.houseNo || '',
            period: res.period || billingPeriod,
            periodLabel: res.periodLabel || periodLabel,
            category,
          },
          mode
        );
        if (!ok) {
          notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
          return;
        }
      } else {
        const ok = await printMilkHisabThermalBillFromRow(
          {
            business: thermalBusiness,
            row,
            productColumns,
            period: billingPeriod,
            periodLabel,
            category,
          },
          mode
        );
        if (!ok) {
          notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
          return;
        }
      }
      if (mode === 'pdf') {
        notify.compactSave('58mm bill PDF downloaded');
      } else {
        notify.compactSave('58mm bill sent to printer');
      }
    } catch (e) {
      console.error('handlePrintBill', e);
      notify.error(e?.message || 'Print failed');
    } finally {
      setPrintingId(null);
    }
  };

  const openWhatsApp = (url) => {
    if (!url || typeof window === 'undefined') return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRemindCustomer = async (row, channels = ['hub', 'email', 'whatsapp']) => {
    if (!row?.customerId || !(Number(row.amount) > 0)) {
      notify.error('No amount to remind for this customer');
      return;
    }
    setRemindingId(row.customerId);
    try {
      const res = await sendMilkHisabReminderAction({
        businessId,
        category,
        customerId: row.customerId,
        period: billingPeriod,
        amount: row.amount,
        invoiceId: row.invoiceId,
        invoiceNumber: row.invoiceNumber,
        houseNo: row.houseNo,
        channels,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Reminder failed');
        return;
      }
      if (res.whatsappUrl && channels.includes('whatsapp')) {
        openWhatsApp(res.whatsappUrl);
      }
      const parts = [];
      if (res.results?.hub?.ok) parts.push('hub alert');
      if (res.results?.email?.ok) parts.push('email');
      if (res.results?.whatsapp?.ok) parts.push('WhatsApp');
      notify.compactSave(parts.length ? `Reminder: ${parts.join(', ')}` : 'Reminder prepared');
      if (res.results?.email?.error && !res.results?.email?.ok) {
        notify.error(res.results.email.error);
      }
    } catch (e) {
      notify.error(e?.message || 'Reminder failed');
    } finally {
      setRemindingId(null);
    }
  };

  const handleBulkRemind = async () => {
    setBulkReminding(true);
    try {
      const res = await sendMilkHisabBulkRemindersAction({
        businessId,
        category,
        period: billingPeriod,
        channels: ['hub', 'email', 'whatsapp'],
      });
      if (!res?.success) {
        notify.error(res?.error || 'Bulk reminder failed');
        return;
      }
      const total = res.total || 0;
      const withWa = (res.outcomes || []).filter((o) => o.whatsappUrl).length;
      notify.compactSave(
        total
          ? `Reminded ${total} customer${total === 1 ? '' : 's'}${withWa ? ` (${withWa} WhatsApp)` : ''}`
          : 'No unpaid bills to remind'
      );
      // Open first WhatsApp link to kick off collection; rest stay as hub/email
      const firstWa = (res.outcomes || []).find((o) => o.whatsappUrl)?.whatsappUrl;
      if (firstWa) openWhatsApp(firstWa);
    } catch (e) {
      notify.error(e?.message || 'Bulk reminder failed');
    } finally {
      setBulkReminding(false);
    }
  };

  const openInvoices = () => {
    navigateHubTab({ domain: handle, tab: 'invoices' });
  };

  return (
    <div className={cn(HUB_MOBILE_ROOT, 'space-y-4')}>
      <div className="lg:hidden">
        <MobileTabHeader
          title="Route Hisab"
          subtitle="Daily sheet and 58mm week/month bills"
          icon={BookOpen}
        />
      </div>

      <div className="hidden lg:flex lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Route Hisab</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Log doorstep deliveries by day. Switch to Bills for week or month totals, 58mm thermal
            print, and unpaid reminders.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => (view === 'daily' ? loadDay() : loadBills())}
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'daily' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('daily')}
          >
            Daily
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'bills' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('bills')}
          >
            Bills
          </button>
        </div>

        {view === 'daily' ? (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value || todayKey())}
              className="h-9 w-[10.5rem]"
            />
          </label>
        ) : (
          <>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                type="button"
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  billKind === 'week' ? 'bg-sky-100 text-sky-800' : 'text-gray-600 hover:bg-gray-50'
                )}
                onClick={() => setBillKind('week')}
              >
                Weekly
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  billKind === 'month' ? 'bg-sky-100 text-sky-800' : 'text-gray-600 hover:bg-gray-50'
                )}
                onClick={() => setBillKind('month')}
              >
                Monthly
              </button>
            </div>
            {billKind === 'week' ? (
              <Input
                type="week"
                value={weekPeriod}
                onChange={(e) => setWeekPeriod(e.target.value || currentWeek())}
                className="h-9 w-[11rem]"
              />
            ) : (
              <Input
                type="month"
                value={monthPeriod}
                onChange={(e) => setMonthPeriod(e.target.value || currentMonth())}
                className="h-9 w-[10.5rem]"
              />
            )}
          </>
        )}

        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter house or customer"
          className="h-9 max-w-xs"
        />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {view === 'daily' ? (
            <Button type="button" size="sm" onClick={handleSaveDay} disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save day
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateInvoices}
                disabled={generating || loading || !(liveBillKpis.unbilledCount > 0)}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1.5" />
                )}
                Generate {billKind === 'week' ? 'weekly' : 'monthly'} bills
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBulkRemind}
                disabled={
                  bulkReminding ||
                  loading ||
                  !((liveBillKpis.unpaidCount || 0) + (liveBillKpis.unbilledCount || 0) > 0)
                }
              >
                {bulkReminding ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-1.5" />
                )}
                Remind unpaid
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={openInvoices}>
                Open invoices
              </Button>
            </>
          )}
        </div>
      </div>

      <MobileStatStrip items={view === 'daily' ? dayStatItems : billStatItems} layout="scroll" />
      <HisabKpiStrip items={view === 'daily' ? dayStatItems : billStatItems} />

      {view === 'bills' && periodLabel ? (
        <p className="text-xs text-gray-500">
          Billing period: <span className="font-semibold text-gray-700">{periodLabel}</span>
          {' · '}58mm thermal (POS printer)
          {' · '}Hub alerts, email, and WhatsApp reminders
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : view === 'daily' ? (
        <DailySheet
          products={products}
          rows={visibleRows}
          currency={currency}
          onQty={updateQty}
          onField={updateRowField}
        />
      ) : (
        <BillsSheet
          productColumns={productColumns}
          rows={visibleBillRows}
          currency={currency}
          printingId={printingId}
          remindingId={remindingId}
          onOpenInvoices={openInvoices}
          onPrint={(row) => handlePrintBill(row, 'print')}
          onPdf={(row) => handlePrintBill(row, 'pdf')}
          onRemind={(row) => handleRemindCustomer(row)}
          onRemindWhatsApp={(row) => handleRemindCustomer(row, ['hub', 'whatsapp'])}
          onRemindEmail={(row) => handleRemindCustomer(row, ['hub', 'email'])}
        />
      )}
    </div>
  );
}

function HisabKpiStrip({ items = [] }) {
  if (!items.length) return null;
  const cols =
    items.length <= 4
      ? 'lg:grid-cols-4'
      : items.length === 5
        ? 'lg:grid-cols-5'
        : 'lg:grid-cols-3 xl:grid-cols-6';
  return (
    <div className={cn('hidden lg:grid gap-2', cols)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-xl border bg-white px-3 py-2.5 shadow-sm min-w-0',
            item.alert ? 'border-amber-200' : 'border-gray-100'
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
          <p className={cn(MARKETING_STAT_VALUE, 'mt-0.5 text-base text-gray-900 truncate', item.valueTone)}>
            {item.value}
          </p>
          {item.hint ? <p className="mt-0.5 text-[11px] text-gray-400 truncate">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

function DailySheet({ products, rows, currency, onQty, onField }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-semibold text-gray-700">No route customers yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Add customers with House No and turn on Daily route in Customers.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <div
            key={row.customerId}
            className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{row.customerName}</p>
              <p className="text-xs text-gray-500">
                House {row.houseNo || '-'}
                {row.routeLabel ? ` · ${row.routeLabel}` : ''}
              </p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-500">
                House
                <Input
                  value={row.houseNo || ''}
                  onChange={(e) => onField(row.customerId, 'houseNo', e.target.value)}
                  className="mt-0.5 h-8"
                />
              </label>
              <label className="text-xs text-gray-500">
                Route
                <Input
                  value={row.routeLabel || ''}
                  onChange={(e) => onField(row.customerId, 'routeLabel', e.target.value)}
                  className="mt-0.5 h-8"
                />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {products.map((p) => (
                <label key={p.id} className="text-xs text-gray-500" title={`${p.name} (${p.unit || 'pcs'})`}>
                  {shortMilkHisabProductLabel(p.name, 28)}
                  <span className="font-normal text-gray-400"> ({p.unit || 'pcs'})</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={row.qtyByProduct?.[p.id] ?? ''}
                    onChange={(e) => onQty(row.customerId, p.id, e.target.value)}
                    className="mt-0.5 h-8 tabular-nums"
                  />
                  <span className="mt-0.5 block text-[10px] text-gray-400 tabular-nums">
                    {formatCurrency(Number(p.price) || 0, currency)}
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-2 block text-xs text-gray-500">
              Notes
              <Input
                value={row.notes || ''}
                onChange={(e) => onField(row.customerId, 'notes', e.target.value)}
                className="mt-0.5 h-8"
              />
            </label>
          </div>
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2.5 whitespace-nowrap">House</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Customer</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Route</th>
              {products.map((p) => (
                <th
                  key={p.id}
                  className="px-3 py-2.5 whitespace-nowrap max-w-[9rem]"
                  title={`${p.name} (${p.unit || 'pcs'})`}
                >
                  {shortMilkHisabProductLabel(p.name, 18)}
                  <span className="ml-1 font-normal normal-case text-gray-400">
                    ({p.unit || 'pcs'})
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 whitespace-nowrap">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.customerId} className="hover:bg-sky-50/40">
                <td className="px-2 py-1.5">
                  <Input
                    value={row.houseNo || ''}
                    onChange={(e) => onField(row.customerId, 'houseNo', e.target.value)}
                    className="h-8 w-28"
                  />
                </td>
                <td className="px-3 py-1.5 font-semibold text-gray-900 whitespace-nowrap">
                  {row.customerName}
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.routeLabel || ''}
                    onChange={(e) => onField(row.customerId, 'routeLabel', e.target.value)}
                    className="h-8 w-32"
                  />
                </td>
                {products.map((p) => (
                  <td key={p.id} className="px-2 py-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      value={row.qtyByProduct?.[p.id] ?? ''}
                      onChange={(e) => onQty(row.customerId, p.id, e.target.value)}
                      className="h-8 w-20 tabular-nums"
                    />
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <Input
                    value={row.notes || ''}
                    onChange={(e) => onField(row.customerId, 'notes', e.target.value)}
                    className="h-8 min-w-[8rem]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BillsSheet({
  productColumns,
  rows,
  currency,
  printingId,
  remindingId,
  onOpenInvoices,
  onPrint,
  onPdf,
  onRemind,
  onRemindWhatsApp,
  onRemindEmail,
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-semibold text-gray-700">No deliveries in this period</p>
        <p className="mt-1 text-sm text-gray-500">
          Save daily route sheets first, then generate weekly or monthly bills.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2.5">House</th>
            <th className="px-3 py-2.5">Customer</th>
            <th className="px-3 py-2.5">Days</th>
            {productColumns.map((p) => (
              <th
                key={p.id}
                className="px-3 py-2.5 whitespace-nowrap max-w-[8rem]"
                title={p.name}
              >
                {shortMilkHisabProductLabel(p.name, 16)}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right">Amount</th>
            <th className="px-3 py-2.5">Invoice</th>
            <th className="px-3 py-2.5">Payment</th>
            <th className="px-3 py-2.5">58mm bill</th>
            <th className="px-3 py-2.5">Remind</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => {
            const busy =
              printingId === `${row.invoiceId || row.customerId}:print` ||
              printingId === `${row.invoiceId || row.customerId}:pdf`;
            const remindBusy = remindingId === row.customerId;
            const canPrint = Boolean(row.invoiceId) || Number(row.amount) > 0;
            const canRemind = Number(row.amount) > 0;
            return (
              <tr key={row.customerId} className="hover:bg-sky-50/40">
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{row.houseNo || '-'}</td>
                <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                  {row.customerName}
                </td>
                <td className="px-3 py-2 tabular-nums text-gray-600">{row.stopCount || 0}</td>
                {productColumns.map((p) => (
                  <td key={p.id} className="px-3 py-2 tabular-nums text-gray-700">
                    {Number(row.qtyByProduct?.[p.id]) || 0}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-900">
                  {formatCurrency(Number(row.amount) || 0, currency)}
                </td>
                <td className="px-3 py-2">
                  {row.invoiceNumber ? (
                    <button
                      type="button"
                      className="text-sky-700 font-semibold hover:underline"
                      onClick={onOpenInvoices}
                    >
                      {row.invoiceNumber}
                    </button>
                  ) : (
                    <span className="text-gray-400">Not billed</span>
                  )}
                </td>
                <td className="px-3 py-2 capitalize text-gray-600">
                  {row.paymentStatus || (row.billed ? 'unpaid' : '-')}
                </td>
                <td className="px-3 py-2">
                  {canPrint ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={busy}
                        onClick={() => onPrint(row)}
                        title="Print 58mm thermal bill"
                      >
                        {printingId === `${row.invoiceId || row.customerId}:print` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Printer className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        disabled={busy}
                        onClick={() => onPdf(row)}
                        title="Download 58mm PDF"
                      >
                        {printingId === `${row.invoiceId || row.customerId}:pdf` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {canRemind ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={remindBusy}
                        onClick={() => onRemind(row)}
                        title="Remind via hub, email, and WhatsApp"
                      >
                        {remindBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Bell className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-emerald-700"
                        disabled={remindBusy}
                        onClick={() => onRemindWhatsApp(row)}
                        title="WhatsApp reminder (wa.me)"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        disabled={remindBusy}
                        onClick={() => onRemindEmail(row)}
                        title="Email reminder"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MilkRouteHisab;
