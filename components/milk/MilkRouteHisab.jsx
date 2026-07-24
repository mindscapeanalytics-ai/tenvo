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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { formatCurrency } from '@/lib/currency';
import notify from '@/lib/utils/appToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileTabHeader } from '@/components/mobile/MobileTabHeader';
import { HUB_MOBILE_ROOT } from '@/lib/utils/mobileLayout';
import { navigateHubTab } from '@/lib/utils/hubTabNavigation';
import {
  getMilkHisabDayAction,
  saveMilkHisabDayAction,
  getMilkHisabPeriodSummaryAction,
  generateMilkHisabInvoicesAction,
  getMilkHisabBillPrintAction,
} from '@/lib/actions/standard/milkHisab';
import {
  toMilkHisabDateKey,
  toMilkHisabPeriodKey,
  toMilkHisabWeekKey,
} from '@/lib/storefront/milkShopHisab';
import { printMilkHisabThermalBill } from '@/lib/print/milkHisabThermalBill';

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
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [billRows, setBillRows] = useState([]);
  const [productColumns, setProductColumns] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');
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
        return;
      }
      setProducts(res.products || []);
      setRows(res.rows || []);
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
        return;
      }
      setBillRows(res.rows || []);
      setProductColumns(res.productColumns || []);
      setPeriodLabel(res.label || billingPeriod);
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
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.customerName || '').toLowerCase().includes(q) ||
        String(r.houseNo || '').toLowerCase().includes(q) ||
        String(r.routeLabel || '').toLowerCase().includes(q)
    );
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
    let amount = 0;
    for (const row of rows) {
      for (const p of products) {
        const qty = Number(row.qtyByProduct?.[p.id]) || 0;
        amount += qty * (Number(p.price) || 0);
      }
    }
    return Math.round(amount * 100) / 100;
  }, [rows, products]);

  const billTotal = useMemo(
    () => Math.round(billRows.reduce((s, r) => s + (Number(r.amount) || 0), 0) * 100) / 100,
    [billRows]
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
    if (!row?.invoiceId) {
      notify.error('Generate the bill first');
      return;
    }
    setPrintingId(row.invoiceId);
    try {
      const res = await getMilkHisabBillPrintAction({
        businessId,
        category,
        invoiceId: row.invoiceId,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Could not load bill');
        return;
      }
      await printMilkHisabThermalBill(
        {
          business,
          invoice: res.invoice,
          items: res.items || [],
          houseNo: res.houseNo || row.houseNo || '',
          period: res.period || billingPeriod,
          periodLabel: res.periodLabel || periodLabel,
          category,
        },
        mode
      );
      if (mode === 'pdf') {
        notify.compactSave('58mm bill PDF downloaded');
      } else {
        notify.compactSave('Sent to 58mm printer');
      }
    } catch (e) {
      notify.error(e?.message || 'Print failed');
    } finally {
      setPrintingId(null);
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
          <p className="text-sm text-gray-500">
            Doorstep delivery log, then weekly or monthly 58mm thermal bills for collection.
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
          <span className="text-sm tabular-nums text-gray-600">
            {view === 'daily'
              ? `Day total ${formatCurrency(dayTotal, currency)}`
              : `${billKind === 'week' ? 'Week' : 'Month'} total ${formatCurrency(billTotal, currency)}`}
          </span>
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
                disabled={generating || loading}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1.5" />
                )}
                Generate {billKind === 'week' ? 'weekly' : 'monthly'} bills
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={openInvoices}>
                Open invoices
              </Button>
            </>
          )}
        </div>
      </div>

      {view === 'bills' && periodLabel ? (
        <p className="text-xs text-gray-500">
          Billing period: <span className="font-semibold text-gray-700">{periodLabel}</span>
          {' · '}58mm thermal (POS printer)
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
          onOpenInvoices={openInvoices}
          onPrint={(row) => handlePrintBill(row, 'print')}
          onPdf={(row) => handlePrintBill(row, 'pdf')}
        />
      )}
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
                <label key={p.id} className="text-xs text-gray-500">
                  {p.name} ({p.unit || 'pcs'})
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
                <th key={p.id} className="px-3 py-2.5 whitespace-nowrap">
                  {p.name}
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
  onOpenInvoices,
  onPrint,
  onPdf,
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
              <th key={p.id} className="px-3 py-2.5 whitespace-nowrap">
                {p.name}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right">Amount</th>
            <th className="px-3 py-2.5">Invoice</th>
            <th className="px-3 py-2.5">Payment</th>
            <th className="px-3 py-2.5">58mm bill</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => {
            const busy = printingId === row.invoiceId;
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
                  {row.invoiceId ? (
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
                        {busy ? (
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
                        <Download className="h-3.5 w-3.5" />
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
