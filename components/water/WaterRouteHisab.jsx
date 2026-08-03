'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Loader2,
  RefreshCw,
  Save,
  FileText,
  Printer,
  Download,
  Bell,
  MessageCircle,
  Mail,
  Receipt,
  Truck,
  ShieldCheck,
  Droplets,
  AlertTriangle,
  Plus,
  CheckCircle2,
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
  getWaterHisabDayAction,
  saveWaterHisabDayAction,
  getWaterHisabPeriodSummaryAction,
  generateWaterHisabInvoicesAction,
  getWaterHisabBillPrintAction,
  getWaterHisabCustomerDayBreakdownAction,
  getWaterHisabBulkDayBreakdownAction,
  sendWaterHisabReminderAction,
  sendWaterHisabBulkRemindersAction,
  setWaterHisabBillPaymentStatusAction,
  getWaterRiderShiftsAction,
  saveWaterRiderShiftAction,
  getWaterBottleFloatIntelligenceAction,
  saveWaterBottleFloatSettingsAction,
} from '@/lib/actions/standard/waterHisab';
import {
  toWaterHisabDateKey,
  toWaterHisabPeriodKey,
  toWaterHisabWeekKey,
  shortWaterHisabProductLabel,
  buildWaterHisabPeriodKpis,
  isWaterHisabBillRemindable,
} from '@/lib/storefront/waterShopHisab';
import {
  printWaterDailySaleBill,
  printWaterDailySaleBulk,
  printWaterPeriodBill,
  printWaterPeriodBulk,
  printWaterThermalBill,
  printWaterThermalBillFromRow,
  printWaterDeliveryChecklist,
  createWaterPeriodPdfBlob,
} from '@/lib/print/waterHisabThermalBill';
import { downloadStandardInvoicePdfFromRow } from '@/lib/print/clientInvoicePrint';
import { openWhatsAppSmart, shareOrDownloadMilkHisabBillPdf } from '@/lib/storefront/milkShopHisabReminders';
import { MARKETING_STAT_VALUE } from '@/lib/utils/typography';
import { resolveBusinessCountryIso } from '@/lib/utils/businessRegionalContext';

/** Water Route Hisab Phase 1: online-only (offline queue deferred). */
function isWaterHisabOfflineEnabled() {
  return false;
}
function isWaterHisabNetworkFailure() {
  return false;
}
function useWaterHisabOffline() {
  return {
    offlineReady: false,
    pendingCount: 0,
    isSyncing: false,
    lastError: null,
    flushQueue: async () => {},
    saveDaySnapshot: async () => {},
    loadDaySnapshot: async () => null,
    enqueueSave: async () => {},
    savePeriodSnapshot: async () => {},
    loadPeriodSnapshot: async () => null,
  };
}
function WaterHisabOfflineBanner() {
  return null;
}


function todayKey() {
  return toWaterHisabDateKey(new Date());
}

function currentMonth() {
  return toWaterHisabPeriodKey(new Date());
}

function currentWeek() {
  return toWaterHisabWeekKey(new Date());
}

/**
 * Water-delivery Daily Route: daily doorstep grid + week/month 58mm bills.
 * Hub tab key remains `route-hisab`; UI label is Daily Route.
 */
export function WaterRouteHisab({ businessId, category }) {
  const { currency, business, planTier } = useBusiness();
  const handle = business?.handle || business?.domain || category;
  const urduBillsEnabled = resolveBusinessCountryIso(business) === 'PK';
  const offlineEnabled = isWaterHisabOfflineEnabled({
    category: business?.category || category,
    planTier,
    settings: business?.settings,
  });
  const {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncPending,
    queueDaySave,
    cacheDaySnapshot,
    readDaySnapshot,
    cachePeriodSnapshot,
    readPeriodSnapshot,
  } = useWaterHisabOffline(businessId, { enabled: offlineEnabled });

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
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [paymentBusyId, setPaymentBusyId] = useState(null);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [billRows, setBillRows] = useState([]);
  const [productColumns, setProductColumns] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');
  const [dayKpis, setDayKpis] = useState(null);
  const [billKpis, setBillKpis] = useState(null);
  const [filter, setFilter] = useState('');
  const [dayDirty, setDayDirty] = useState(false);
  const [daySnapshotReady, setDaySnapshotReady] = useState(true);
  const [billsFromCache, setBillsFromCache] = useState(false);

  // Rider Shifts & Bottle Float state
  const [riderShifts, setRiderShifts] = useState([]);
  const [riderShiftsSummary, setRiderShiftsSummary] = useState(null);
  const [riderLoading, setRiderLoading] = useState(false);
  const [savingRiderShift, setSavingRiderShift] = useState(false);

  const [bottleSummary, setBottleSummary] = useState(null);
  const [idleCustomers, setIdleCustomers] = useState([]);
  const [bottleLoading, setBottleLoading] = useState(false);
  const [savingBottleSettings, setSavingBottleSettings] = useState(false);
  const [bottleForm, setBottleForm] = useState({
    plantFull: 120,
    plantEmpty: 45,
    damagedScrapped: 5,
    bottleUnitCost: 1200,
  });

  const billingPeriod = billKind === 'week' ? weekPeriod : monthPeriod;

  const loadDay = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setDaySnapshotReady(true);
    try {
      if (offlineEnabled && typeof navigator !== 'undefined' && !navigator.onLine) {
        const snap = await readDaySnapshot(businessId, deliveryDate);
        if (!snap) {
          setRows([]);
          setProducts([]);
          setDayKpis(null);
          setDaySnapshotReady(false);
          notify.error('No offline copy of this day. Open it once while online.');
          return;
        }
        setProducts(snap.products || []);
        setRows(snap.rows || []);
        setDayKpis(snap.kpis || null);
        setDayDirty(false);
        setDaySnapshotReady(true);
        return;
      }

      const res = await getWaterHisabDayAction({
        businessId,
        category,
        deliveryDate,
      });
      if (!res?.success) {
        // Network/action failure: try snapshot
        if (offlineEnabled) {
          const snap = await readDaySnapshot(businessId, deliveryDate);
          if (snap) {
            setProducts(snap.products || []);
            setRows(snap.rows || []);
            setDayKpis(snap.kpis || null);
            setDayDirty(false);
            setDaySnapshotReady(true);
            notify.compactSave('Loaded offline day sheet copy');
            return;
          }
        }
        notify.error(res?.error || 'Failed to load day sheet');
        setRows([]);
        setProducts([]);
        setDayKpis(null);
        setDaySnapshotReady(false);
        return;
      }
      setProducts(res.products || []);
      setRows(res.rows || []);
      setDayKpis(res.kpis || null);
      setDayDirty(false);
      setDaySnapshotReady(true);
      if (offlineEnabled) {
        try {
          await cacheDaySnapshot(businessId, deliveryDate, {
            products: res.products || [],
            rows: res.rows || [],
            kpis: res.kpis || null,
          });
        } catch {
          /* IndexedDB optional */
        }
      }
    } catch (e) {
      if (offlineEnabled) {
        try {
          const snap = await readDaySnapshot(businessId, deliveryDate);
          if (snap) {
            setProducts(snap.products || []);
            setRows(snap.rows || []);
            setDayKpis(snap.kpis || null);
            setDayDirty(false);
            setDaySnapshotReady(true);
            notify.compactSave('Loaded offline day sheet copy');
            return;
          }
        } catch {
          /* ignore */
        }
      }
      notify.error(e?.message || 'Failed to load day sheet');
      setDaySnapshotReady(false);
    } finally {
      setLoading(false);
    }
  }, [
    businessId,
    category,
    deliveryDate,
    offlineEnabled,
    readDaySnapshot,
    cacheDaySnapshot,
  ]);

  const loadBills = useCallback(async () => {
    if (!businessId || !billingPeriod) return;
    setLoading(true);
    setBillsFromCache(false);
    try {
      if (offlineEnabled && typeof navigator !== 'undefined' && !navigator.onLine) {
        const snap = await readPeriodSnapshot(businessId, billingPeriod);
        if (!snap) {
          setBillRows([]);
          setProductColumns([]);
          setPeriodLabel('');
          setBillKpis(null);
          notify.error('No offline bill summary for this period. Open it once while online.');
          return;
        }
        setBillRows(snap.rows || []);
        setProductColumns(snap.productColumns || []);
        setPeriodLabel(snap.label || billingPeriod);
        setBillKpis(snap.kpis || buildWaterHisabPeriodKpis(snap.rows || []));
        setBillsFromCache(true);
        return;
      }

      const res = await getWaterHisabPeriodSummaryAction({
        businessId,
        category,
        period: billingPeriod,
      });
      if (!res?.success) {
        if (offlineEnabled) {
          const snap = await readPeriodSnapshot(businessId, billingPeriod);
          if (snap) {
            setBillRows(snap.rows || []);
            setProductColumns(snap.productColumns || []);
            setPeriodLabel(snap.label || billingPeriod);
            setBillKpis(snap.kpis || buildWaterHisabPeriodKpis(snap.rows || []));
            setBillsFromCache(true);
            notify.compactSave('Loaded offline bill summary');
            return;
          }
        }
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
      setBillKpis(res.kpis || buildWaterHisabPeriodKpis(res.rows || []));
      if (offlineEnabled) {
        try {
          await cachePeriodSnapshot(businessId, billingPeriod, {
            rows: res.rows || [],
            productColumns: res.productColumns || [],
            label: res.label || billingPeriod,
            kpis: res.kpis || null,
          });
        } catch {
          /* optional */
        }
      }
    } catch (e) {
      if (offlineEnabled) {
        try {
          const snap = await readPeriodSnapshot(businessId, billingPeriod);
          if (snap) {
            setBillRows(snap.rows || []);
            setProductColumns(snap.productColumns || []);
            setPeriodLabel(snap.label || billingPeriod);
            setBillKpis(snap.kpis || buildWaterHisabPeriodKpis(snap.rows || []));
            setBillsFromCache(true);
            notify.compactSave('Loaded offline bill summary');
            return;
          }
        } catch {
          /* ignore */
        }
      }
      notify.error(e?.message || 'Failed to load bill summary');
    } finally {
      setLoading(false);
    }
  }, [
    businessId,
    category,
    billingPeriod,
    offlineEnabled,
    readPeriodSnapshot,
    cachePeriodSnapshot,
  ]);

  const loadRiderShifts = useCallback(async () => {
    if (!businessId) return;
    setRiderLoading(true);
    try {
      const res = await getWaterRiderShiftsAction({
        businessId,
        category,
        deliveryDate,
      });
      if (res?.success) {
        setRiderShifts(res.shifts || []);
        setRiderShiftsSummary(res.summary || null);
      }
    } catch (e) {
      console.error('loadRiderShifts', e);
    } finally {
      setRiderLoading(false);
    }
  }, [businessId, category, deliveryDate]);

  const handleSaveRiderShift = async (shiftData) => {
    setSavingRiderShift(true);
    try {
      const res = await saveWaterRiderShiftAction({
        businessId,
        category,
        deliveryDate,
        shiftData,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to save rider shift');
        return;
      }
      notify.compactSave('Rider shift load-out saved');
      await loadRiderShifts();
    } catch (e) {
      notify.error(e?.message || 'Failed to save rider shift');
    } finally {
      setSavingRiderShift(false);
    }
  };

  const loadBottleIntelligence = useCallback(async () => {
    if (!businessId) return;
    setBottleLoading(true);
    try {
      const res = await getWaterBottleFloatIntelligenceAction({
        businessId,
        category,
      });
      if (res?.success) {
        setBottleSummary(res.summary || null);
        setIdleCustomers(res.idleCustomers || []);
        if (res.summary) {
          setBottleForm({
            plantFull: res.summary.plantFull,
            plantEmpty: res.summary.plantEmpty,
            damagedScrapped: res.summary.damagedScrapped,
            bottleUnitCost: res.summary.bottleUnitCost,
          });
        }
      }
    } catch (e) {
      console.error('loadBottleIntelligence', e);
    } finally {
      setBottleLoading(false);
    }
  }, [businessId, category]);

  const handleSaveBottleSettings = async (formData) => {
    setSavingBottleSettings(true);
    try {
      const res = await saveWaterBottleFloatSettingsAction({
        businessId,
        category,
        ...formData,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to save bottle inventory');
        return;
      }
      notify.compactSave('Plant bottle inventory updated');
      await loadBottleIntelligence();
    } catch (e) {
      notify.error(e?.message || 'Failed to save bottle inventory');
    } finally {
      setSavingBottleSettings(false);
    }
  };

  useEffect(() => {
    if (view === 'daily') void loadDay();
    else if (view === 'bills') void loadBills();
    else if (view === 'rider-shifts') void loadRiderShifts();
    else if (view === 'bottle-control') void loadBottleIntelligence();
  }, [view, loadDay, loadBills, loadRiderShifts, loadBottleIntelligence]);

  // After background sync lands, refresh the visible sheet from the server.
  useEffect(() => {
    if (!offlineEnabled || !lastSyncAt || !isOnline) return;
    if (view === 'daily') void loadDay();
    else void loadBills();
  }, [lastSyncAt]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: reload only on sync timestamp

  useEffect(() => {
    if (!dayDirty || view !== 'daily') return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dayDirty, view]);

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
    let amount = 0;
    let cash = 0;
    let del = 0;
    let rec = 0;
    for (const row of rows) {
      const rate =
        Number(row.productRate) > 0
          ? Number(row.productRate)
          : null;
      for (const p of products) {
        const qty = Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id]) || 0;
        const unit = rate != null ? rate : Number(p.price) || 0;
        amount += qty * unit;
        del += qty;
        rec += Number(row.recByProduct?.[String(p.id)] ?? row.recByProduct?.[p.id]) || 0;
      }
      amount -= Number(row.specialDiscount) || 0;
      cash += Number(row.cashCollected) || 0;
    }
    return {
      amount: Math.max(0, Math.round(amount * 100) / 100),
      cash: Math.round(cash * 100) / 100,
      del: Math.round(del * 1000) / 1000,
      rec: Math.round(rec * 1000) / 1000,
    };
  }, [rows, products]);

  const liveBillKpis = useMemo(() => buildWaterHisabPeriodKpis(billRows), [billRows]);

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
        hint: 'Accounts today',
      },
      {
        label: 'Del bottles',
        value: dayTotal.del,
        valueTone: 'text-sky-700',
        hint: 'Delivered',
      },
      {
        label: 'Rec empties',
        value: dayTotal.rec,
        hint: 'Empty return',
      },
      {
        label: 'Sale total',
        value: formatCurrency(dayTotal.amount, currency),
        valueTone: 'text-gray-900',
      },
      {
        label: 'Cash recovery',
        value: formatCurrency(dayTotal.cash, currency),
        valueTone: 'text-emerald-700',
        hint: 'Collected today',
      },
      {
        label: 'Pending',
        value: pending,
        valueTone: pending ? 'text-amber-700' : 'text-gray-900',
        hint: `${housesSetLive} houses set`,
        alert: pending > 0 && deliveredLive > 0,
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
        hint: `${liveBillKpis.unpaidCount || 0} open`,
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

  const riderStatItems = useMemo(() => {
    if (!riderShifts.length && !riderShiftsSummary) return [];
    const s = riderShiftsSummary || {};
    return [
      { label: 'Riders today', value: Number(s.totalRiders || riderShifts.length || 0), hint: 'Active shifts' },
      { label: 'Bottles loaded', value: Number(s.totalBottlesLoaded || 0), valueTone: 'text-sky-700' },
      { label: 'Bottles returned', value: Number(s.totalBottlesReturned || 0) },
      { label: 'Cash collected', value: formatCurrency(Number(s.totalCashCollected || 0), currency), valueTone: 'text-emerald-700' },
      { label: 'Shortage', value: formatCurrency(Number(s.totalCashShortage || 0), currency), valueTone: Number(s.totalCashShortage || 0) > 0 ? 'text-rose-700' : 'text-gray-900', alert: Number(s.totalCashShortage || 0) > 0 },
    ];
  }, [riderShifts, riderShiftsSummary, currency]);

  const bottleStatItems = useMemo(() => {
    if (!bottleSummary) return [];
    const s = bottleSummary || {};
    return [
      { label: 'Total owned', value: Number(s.totalOwned || 0), hint: 'Full asset count' },
      { label: 'Full (plant)', value: Number(s.fullAtPlant || 0), valueTone: 'text-sky-700' },
      { label: 'With customers', value: Number(s.withCustomers || 0), hint: 'Deposits outstanding' },
      { label: 'With riders', value: Number(s.withRiders || 0) },
      { label: 'Empty (plant)', value: Number(s.emptyAtPlant || 0) },
      { label: 'Idle risk', value: Number(s.idleRisk || idleCustomers.length || 0), valueTone: Number(s.idleRisk || idleCustomers.length || 0) > 0 ? 'text-amber-700' : 'text-gray-900', alert: (idleCustomers.length || 0) > 0, hint: 'No delivery 14+ days' },
    ];
  }, [bottleSummary, idleCustomers, currency]);

  const updateQty = (customerId, productId, value) => {
    const next = value === '' ? '' : value;
    const pid = String(productId);
    setDayDirty(true);
    setRows((prev) =>
      prev.map((r) => {
        if (String(r.customerId) !== String(customerId)) return r;
        return {
          ...r,
          qtyByProduct: {
            ...r.qtyByProduct,
            [pid]: next === '' ? '' : Number(next),
          },
        };
      })
    );
  };

  const updateRec = (customerId, productId, value) => {
    const next = value === '' ? '' : value;
    const pid = String(productId);
    setDayDirty(true);
    setRows((prev) =>
      prev.map((r) => {
        if (String(r.customerId) !== String(customerId)) return r;
        return {
          ...r,
          recByProduct: {
            ...(r.recByProduct || {}),
            [pid]: next === '' ? '' : Number(next),
          },
        };
      })
    );
  };

  const updateRowField = (customerId, field, value) => {
    setDayDirty(true);
    setRows((prev) =>
      prev.map((r) => (r.customerId === customerId ? { ...r, [field]: value } : r))
    );
  };

  const buildDayPayloadRows = () =>
    rows.map((r) => {
      const qtyByProduct = {};
      const recByProduct = {};
      for (const [pid, raw] of Object.entries(r.qtyByProduct || {})) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) qtyByProduct[String(pid)] = n;
      }
      for (const [pid, raw] of Object.entries(r.recByProduct || {})) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) recByProduct[String(pid)] = n;
      }
      return {
        customerId: r.customerId,
        houseNo: r.houseNo,
        floorFlat: r.floorFlat,
        routeLabel: r.routeLabel,
        accountNo: r.accountNo,
        townCode: r.townCode,
        productRate: r.productRate,
        notes: r.notes,
        cashCollected: Number(r.cashCollected) || 0,
        specialDiscount: Number(r.specialDiscount) || 0,
        qtyByProduct,
        recByProduct,
      };
    });

  const queueAndCacheDay = async (payloadRows) => {
    await queueDaySave({
      category,
      deliveryDate,
      rows: payloadRows,
    });
    try {
      await cacheDaySnapshot(businessId, deliveryDate, {
        products,
        rows,
        kpis: dayKpis,
      });
    } catch {
      /* optional */
    }
    setDayDirty(false);
  };

  const handleSaveDay = async () => {
    if (offlineEnabled && !isOnline && !daySnapshotReady) {
      notify.error('Cannot save offline without a cached day sheet');
      return;
    }
    setSaving(true);
    try {
      const payloadRows = buildDayPayloadRows();

      if (offlineEnabled && !isOnline) {
        await queueAndCacheDay(payloadRows);
        notify.compactSave('Day sheet saved offline — will sync when online');
        return;
      }

      const res = await saveWaterHisabDayAction({
        businessId,
        category,
        deliveryDate,
        rows: payloadRows,
      });
      if (!res?.success) {
        // Only queue on transport failures — never hide validation/auth errors.
        if (offlineEnabled && isWaterHisabNetworkFailure(null, res?.error || res?.code || '')) {
          await queueAndCacheDay(payloadRows);
          notify.compactSave('Save queued offline — will sync when connection is stable');
          return;
        }
        notify.error(res?.error || 'Save failed');
        return;
      }
      notify.compactSave('Day sheet saved');
      await loadDay();
    } catch (e) {
      if (offlineEnabled && isWaterHisabNetworkFailure(e)) {
        try {
          await queueAndCacheDay(buildDayPayloadRows());
          notify.compactSave('Save queued offline — will sync when online');
          return;
        } catch (queueErr) {
          notify.error(queueErr?.message || e?.message || 'Save failed');
          return;
        }
      }
      notify.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!isOnline) {
      notify.error('Connect to the internet to generate bills');
      return;
    }
    setGenerating(true);
    try {
      const res = await generateWaterHisabInvoicesAction({
        businessId,
        category,
        period: billingPeriod,
      });
      // Always refresh so partial creates show invoice numbers
      await loadBills();
      if (!res?.success) {
        notify.error(res?.error || 'Bill generation failed');
        return;
      }
      const created = res.created?.length || 0;
      const skipped = res.skipped?.length || 0;
      const failed = res.failed?.length || 0;
      const paidPending = (res.created || []).filter((c) => c.hisabPaidPending).length;
      const kindLabel = billKind === 'week' ? 'weekly' : 'monthly';
      if (created) {
        notify.compactSave(
          `Created ${created} ${kindLabel} bill${created === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped` : ''}${failed ? ` · ${failed} failed` : ''}`
        );
      } else if (failed) {
        notify.error(res.failed[0]?.reason || 'Bill generation failed');
      } else if (skipped) {
        notify.compactSave(`No new bills (${skipped} already billed or empty)`);
      } else {
        notify.compactSave('No deliveries to bill in this period');
      }
      if (failed && created) {
        notify.error(`${failed} customer bill${failed === 1 ? '' : 's'} failed: ${res.failed[0]?.reason || 'error'}`);
      }
      if (paidPending) {
        notify.error(
          `${paidPending} paid hisab bill${paidPending === 1 ? '' : 's'} need Mark paid again on the invoice`
        );
      }
    } catch (e) {
      await loadBills();
      notify.error(e?.message || 'Bill generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const thermalBusiness = useMemo(
    () => ({
      ...(business || {}),
      business_name:
        business?.business_name || business?.name || business?.businessName || 'Water supply',
      category: business?.category || category,
    }),
    [business, category]
  );

  const handlePrintBill = async (row, mode = 'print', billLocale = 'en') => {
    if (!row || !(Number(row.amount) > 0 || row.invoiceId)) {
      notify.error('No billable amount for this customer');
      return;
    }
    const localeKey = billLocale === 'ur' && urduBillsEnabled ? 'ur' : 'en';
    if (billLocale === 'ur' && !urduBillsEnabled) {
      notify.error('Urdu bills are only available for Pakistan businesses');
      return;
    }
    const printKey = `${row.invoiceId || row.customerId}:${mode}:${localeKey}`;
    setPrintingId(printKey);
    try {
      if (!isOnline) {
        const ok = await printWaterThermalBillFromRow(
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
        notify.compactSave(mode === 'pdf' ? '58mm totals PDF downloaded' : '58mm totals sent to printer');
        return;
      }

      if (row.customerId && billingPeriod) {
        const dayRes = await getWaterHisabCustomerDayBreakdownAction({
          businessId,
          category,
          customerId: row.customerId,
          period: billingPeriod,
        });
        if (dayRes?.success && dayRes.breakdown?.days?.length) {
          const ok = await printWaterPeriodBill(
            {
              business: thermalBusiness,
              breakdown: dayRes.breakdown,
              customerName: dayRes.customerName || row.customerName || 'Customer',
              houseNo: dayRes.houseNo || row.houseNo || '',
              floorFlat: dayRes.floorFlat || row.floorFlat || '',
              accountNo: dayRes.accountNo || row.accountNo || '',
              townCode: dayRes.townCode || row.townCode || '',
              cashCollected: dayRes.cashCollected ?? row.cashCollected ?? 0,
              specialDiscount: dayRes.specialDiscount || 0,
              delTotal: dayRes.delTotal || 0,
              recTotal: dayRes.recTotal || 0,
              bottleBalance: dayRes.bottleBalance ?? row.bottleBalance,
              period: dayRes.period || billingPeriod,
              periodLabel: dayRes.label || periodLabel,
              invoiceNumber: dayRes.invoiceNumber || row.invoiceNumber || '',
              grandTotal: dayRes.amount ?? row.amount ?? 0,
              paymentStatus: dayRes.paymentStatus || row.paymentStatus || 'unpaid',
              productMeta: dayRes.productMeta || row.productMeta || {},
              billLocale: localeKey,
            },
            mode
          );
          if (!ok) {
            notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
            return;
          }
          notify.compactSave(
            mode === 'pdf'
              ? `${billKind === 'week' ? 'Weekly' : 'Monthly'} 58mm bill downloaded`
              : `${billKind === 'week' ? 'Weekly' : 'Monthly'} 58mm bill sent to printer`
          );
          return;
        }
      }

      if (row.invoiceId) {
        const res = await getWaterHisabBillPrintAction({
          businessId,
          category,
          invoiceId: row.invoiceId,
        });
        if (!res?.success) {
          const ok = await printWaterThermalBillFromRow(
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
          notify.compactSave('Printed totals from bills row');
          return;
        }
        const ok = await printWaterThermalBill(
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
        const ok = await printWaterThermalBillFromRow(
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
      notify.compactSave(mode === 'pdf' ? '58mm bill PDF downloaded' : '58mm bill sent to printer');
    } catch (e) {
      console.error('handlePrintBill', e);
      notify.error(e?.message || 'Print failed');
    } finally {
      setPrintingId(null);
    }
  };

  const handlePrintDailyCustomer = async (row, mode = 'pdf') => {
    if (!row) return;
    const hasActivity =
      Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0) ||
      Object.values(row.recByProduct || {}).some((q) => Number(q) > 0) ||
      Number(row.cashCollected) > 0;
    if (!hasActivity) {
      notify.error('No delivery or cash on this row yet');
      return;
    }
    setPrintingId(`${row.customerId}:${mode}:daily`);
    try {
      const ok = await printWaterDailySaleBill(
        {
          business: thermalBusiness,
          row,
          products,
          deliveryDate,
          category,
        },
        mode
      );
      if (!ok) {
        notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
        return;
      }
      notify.compactSave(
        mode === 'pdf' ? 'Daily 58mm bill downloaded' : 'Daily 58mm bill sent to printer'
      );
    } catch (e) {
      notify.error(e?.message || 'Daily bill failed');
    } finally {
      setPrintingId(null);
    }
  };

  const handleBulkDailyBills = async (mode = 'pdf') => {
    const active = (visibleRows || []).filter(
      (row) =>
        Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0) ||
        Object.values(row.recByProduct || {}).some((q) => Number(q) > 0) ||
        Number(row.cashCollected) > 0
    );
    if (!active.length) {
      notify.error('No deliveries to print today');
      return;
    }
    setBulkPrinting(true);
    try {
      const ok = await printWaterDailySaleBulk(
        {
          business: thermalBusiness,
          rows: active,
          products,
          deliveryDate,
          category,
        },
        mode
      );
      if (!ok) {
        notify.error('Could not open daily bills');
        return;
      }
      notify.compactSave(
        mode === 'print'
          ? `Printing ${active.length} daily bills (58mm)`
          : `Daily bills ready — use Save as PDF for all ${active.length} customers`
      );
    } catch (e) {
      notify.error(e?.message || 'Bulk daily bills failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handlePrintDeliveryChecklist = async (mode = 'print') => {
    const list = visibleRows || rows || [];
    if (!list.length) {
      notify.error('No route customers on this shift');
      return;
    }
    setBulkPrinting(true);
    try {
      const ok = await printWaterDeliveryChecklist(
        {
          business: thermalBusiness,
          rows: list,
          products,
          deliveryDate,
        },
        mode
      );
      if (!ok) {
        notify.error('Could not print delivery checklist');
        return;
      }
      notify.compactSave(
        mode === 'print' ? 'Delivery checklist sent to printer' : 'Delivery checklist opened'
      );
    } catch (e) {
      notify.error(e?.message || 'Delivery checklist failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handleBulkPeriodBills = async (mode = 'pdf') => {
    const billable = (visibleBillRows || []).filter((r) => Number(r.amount) > 0 || r.invoiceId);
    if (!billable.length) {
      notify.error(`No ${billKind === 'week' ? 'weekly' : 'monthly'} bills to print`);
      return;
    }
    if (!isOnline) {
      notify.error('Connect to the internet to download week/month day sheets');
      return;
    }
    setBulkPrinting(true);
    try {
      const res = await getWaterHisabBulkDayBreakdownAction({
        businessId,
        category,
        period: billingPeriod,
      });
      if (!res?.success || !res.sheets?.length) {
        notify.error(res?.error || 'Could not load period sheets');
        return;
      }
      const visibleIds = new Set(billable.map((r) => String(r.customerId)));
      const models = res.sheets
        .filter((s) => visibleIds.has(String(s.customerId)))
        .map((s) => ({
          business: thermalBusiness,
          breakdown: s.breakdown,
          customerName: s.customerName,
          houseNo: s.houseNo,
          floorFlat: s.floorFlat,
          accountNo: s.accountNo,
          townCode: s.townCode,
          cashCollected: s.cashCollected,
          specialDiscount: s.specialDiscount,
          delTotal: s.delTotal,
          recTotal: s.recTotal,
          bottleBalance: s.bottleBalance,
          period: res.period || billingPeriod,
          periodLabel: res.label || periodLabel,
          invoiceNumber: s.invoiceNumber || '',
          grandTotal: s.amount || 0,
          paymentStatus: s.paymentStatus || 'unpaid',
          productMeta: s.productMeta || {},
          billLocale: 'en',
        }));
      if (!models.length) {
        notify.error('No matching customers in this filter');
        return;
      }
      const ok = await printWaterPeriodBulk({
        models,
        periodLabel: res.label || periodLabel,
        kind: res.kind || billKind,
        mode,
      });
      if (!ok) {
        notify.error('Could not open period bills');
        return;
      }
      notify.compactSave(
        mode === 'print'
          ? `Printing ${models.length} ${billKind === 'week' ? 'weekly' : 'monthly'} bills`
          : `${models.length} ${billKind === 'week' ? 'weekly' : 'monthly'} bills ready — Save as PDF`
      );
    } catch (e) {
      notify.error(e?.message || 'Bulk period bills failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handleDownloadStandardInvoice = async (row) => {
    if (!row?.invoiceId) {
      notify.error('Generate the weekly/monthly invoice first for a standard A4 bill');
      return;
    }
    setPrintingId(`${row.invoiceId}:pdf:a4`);
    try {
      const res = await getWaterHisabBillPrintAction({
        businessId,
        category,
        invoiceId: row.invoiceId,
      });
      if (!res?.success || !res.invoice) {
        notify.error(res?.error || 'Could not load invoice');
        return;
      }
      await downloadStandardInvoicePdfFromRow(res.invoice, thermalBusiness, category, {
        businessId,
      });
      notify.compactSave('Standard A4 Delivery Bill downloaded');
    } catch (e) {
      notify.error(e?.message || 'A4 invoice download failed');
    } finally {
      setPrintingId(null);
    }
  };

  const openWhatsApp = (url) => {
    if (!url || typeof window === 'undefined') return;
    openWhatsAppSmart(url);
  };

  /**
   * Prepare 58mm week/month day-sheet PDF for WhatsApp (share when possible, else download).
   */
  const prepareWhatsAppBillPdf = async (row) => {
    if (!row?.customerId || !billingPeriod || !isOnline) return null;
    try {
      const dayRes = await getWaterHisabCustomerDayBreakdownAction({
        businessId,
        category,
        customerId: row.customerId,
        period: billingPeriod,
      });
      if (!dayRes?.success || !dayRes.breakdown?.days?.length) return null;
      return await createWaterPeriodPdfBlob({
        business: thermalBusiness,
        breakdown: dayRes.breakdown,
        customerName: dayRes.customerName || row.customerName || 'Customer',
        houseNo: dayRes.houseNo || row.houseNo || '',
        floorFlat: dayRes.floorFlat || row.floorFlat || '',
        accountNo: dayRes.accountNo || row.accountNo || '',
        townCode: dayRes.townCode || row.townCode || '',
        cashCollected: dayRes.cashCollected || 0,
        delTotal: dayRes.delTotal || 0,
        recTotal: dayRes.recTotal || 0,
        bottleBalance: dayRes.bottleBalance,
        period: dayRes.period || billingPeriod,
        periodLabel: dayRes.label || periodLabel,
        invoiceNumber: dayRes.invoiceNumber || row.invoiceNumber || '',
        grandTotal: dayRes.amount ?? row.amount ?? 0,
        paymentStatus: dayRes.paymentStatus || row.paymentStatus || 'unpaid',
        productMeta: dayRes.productMeta || row.productMeta || {},
      });
    } catch (err) {
      console.warn('[WaterRouteHisab] WhatsApp bill PDF prep failed', err);
      return null;
    }
  };

  const handleRemindCustomer = async (row, channels = ['hub', 'email', 'whatsapp']) => {
    if (!isOnline) {
      notify.error('Connect to the internet to send reminders');
      return;
    }
    if (!row?.customerId || !(Number(row.amount) > 0)) {
      notify.error('No amount to remind for this customer');
      return;
    }
    if (!isWaterHisabBillRemindable(row)) {
      notify.error('Already paid. No reminder needed.');
      return;
    }
    setRemindingId(row.customerId);
    try {
      const wantWhatsApp = channels.includes('whatsapp');
      let pdfPack = null;
      if (wantWhatsApp) {
        pdfPack = await prepareWhatsAppBillPdf(row);
      }

      const res = await sendWaterHisabReminderAction({
        businessId,
        category,
        customerId: row.customerId,
        period: billingPeriod,
        amount: row.amount,
        invoiceId: row.invoiceId,
        invoiceNumber: row.invoiceNumber,
        houseNo: row.houseNo,
        qtyByProduct: row.qtyByProduct,
        productMeta: row.productMeta,
        channels,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Reminder failed');
        return;
      }

      if (wantWhatsApp && pdfPack?.blob) {
        const shareResult = await shareOrDownloadMilkHisabBillPdf({
          blob: pdfPack.blob,
          filename: pdfPack.filename,
          text: res.message || '',
          title: `${periodLabel || 'Hisab'} bill`,
        });
        if (shareResult.shared) {
          notify.compactSave('Bill PDF shared — pick WhatsApp to send with the file');
        } else if (shareResult.downloaded) {
          if (res.whatsappUrl) openWhatsApp(res.whatsappUrl);
          notify.compactSave('58mm bill PDF downloaded — attach it in WhatsApp');
        } else if (res.whatsappUrl) {
          openWhatsApp(res.whatsappUrl);
        }
      } else if (res.whatsappUrl && wantWhatsApp) {
        openWhatsApp(res.whatsappUrl);
      }

      const parts = [];
      if (res.results?.hub?.ok) parts.push('hub alert');
      if (res.results?.email?.ok) parts.push('email');
      if (res.results?.whatsapp?.ok) parts.push('WhatsApp');
      if (!(wantWhatsApp && pdfPack?.blob)) {
        notify.compactSave(parts.length ? `Reminder: ${parts.join(', ')}` : 'Reminder prepared');
      }
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
    if (!isOnline) {
      notify.error('Connect to the internet to send reminders');
      return;
    }
    setBulkReminding(true);
    try {
      const res = await sendWaterHisabBulkRemindersAction({
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

  const handleBillPaymentStatus = async (row, nextStatus) => {
    if (!isOnline) {
      notify.error('Connect to the internet to update payment');
      return;
    }
    if (!row?.customerId || !(Number(row.amount) > 0 || row.billed)) {
      notify.error('No bill amount for this customer');
      return;
    }
    const next = String(nextStatus || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid';
    const current = String(row.paymentStatus || 'unpaid').toLowerCase() === 'paid' ? 'paid' : 'unpaid';
    if (next === current) return;

    setPaymentBusyId(row.customerId);
    try {
      const res = await setWaterHisabBillPaymentStatusAction({
        businessId,
        category,
        invoiceId: row.invoiceId || null,
        customerId: row.customerId,
        period: billingPeriod,
        paymentStatus: next,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Could not update payment');
        return;
      }
      setBillRows((prev) =>
        prev.map((r) =>
          r.customerId === row.customerId
            ? {
                ...r,
                paymentStatus: res.paymentStatus || next,
                hisabPaymentStatus: next,
              }
            : r
        )
      );
      setBillKpis(null);
      notify.compactSave(next === 'paid' ? 'Marked paid' : 'Marked unpaid');
    } catch (e) {
      notify.error(e?.message || 'Could not update payment');
    } finally {
      setPaymentBusyId(null);
    }
  };

  const openInvoices = () => {
    navigateHubTab({ domain: handle, tab: 'invoices' });
  };

  return (
    <div className={cn(HUB_MOBILE_ROOT, 'space-y-4')}>
      <div className="lg:hidden">
        <MobileTabHeader
          title="Water Route"
          subtitle="Rider sheet by city, area, and delivery day"
          icon={BookOpen}
        />
      </div>

      <div className="hidden lg:flex lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Water Route</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Rider Del / Rec / BAL sheet by city and area. Download 58mm daily slips per house, or all
            on-route customers. Bills tab covers weekly and monthly day sheets for one or all accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('open-modal', { detail: { modalId: 'expense' } })
                );
              }
            }}
            title="Log water plant or route fuel expense"
          >
            <Receipt className="h-4 w-4 mr-1.5" />
            Log Expense
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (view === 'daily') loadDay();
              else if (view === 'bills') loadBills();
              else if (view === 'rider-shifts') loadRiderShifts();
              else if (view === 'bottle-control') loadBottleIntelligence();
            }}
            disabled={loading || riderLoading || bottleLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1.5', (loading || riderLoading || bottleLoading) && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <WaterHisabOfflineBanner
        offlineEnabled={offlineEnabled}
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        daySnapshotReady={daySnapshotReady}
        view={view}
        onSync={async () => {
          const res = await syncPending();
          if (res?.synced) {
            notify.compactSave(
              `Synced ${res.synced} day sheet${res.synced === 1 ? '' : 's'}`
            );
            if (view === 'daily') await loadDay();
            else await loadBills();
          } else if (res?.failed) {
            notify.error('Some offline saves failed to sync');
          } else {
            notify.compactSave('Nothing pending to sync');
          }
        }}
      />

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
            Daily Sheet
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'rider-shifts' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('rider-shifts')}
          >
            Rider Shifts
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'bottle-control' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('bottle-control')}
          >
            Bottle Control
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

        {view === 'daily' && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value || todayKey())}
              className="h-9 w-[10.5rem]"
            />
          </label>
        )}
        {view === 'bills' && (
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
        {view === 'rider-shifts' && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value || todayKey())}
              className="h-9 w-[10.5rem]"
            />
          </label>
        )}

        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter house or customer"
          className="h-9 max-w-xs"
        />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {view === 'daily' && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePrintDeliveryChecklist('print')}
                disabled={bulkPrinting || loading || !rows.length}
                title="Print 58mm physical route delivery checklist for riders with [ ] checkboxes"
                className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
              >
                <FileText className="h-4 w-4 mr-1.5 text-sky-600" />
                Print Checklist
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkDailyBills('print')}
                disabled={bulkPrinting || loading || !rows.length}
                title="Print 58mm daily sale slips for all delivered customers"
              >
                {bulkPrinting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-1.5" />
                )}
                Print all daily
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkDailyBills('pdf')}
                disabled={bulkPrinting || loading || !rows.length}
                title="Download / Save as PDF — all daily 58mm slips"
              >
                <Download className="h-4 w-4 mr-1.5" />
                All daily bills
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveDay}
                disabled={
                  saving ||
                  loading ||
                  (offlineEnabled && !isOnline && !daySnapshotReady)
                }
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                {offlineEnabled && !isOnline ? 'Save offline' : 'Save day'}
              </Button>
            </>
          )}
          {view === 'bills' && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkPeriodBills('print')}
                disabled={bulkPrinting || loading || !billRows.length || !isOnline}
                title={`Print all ${billKind === 'week' ? 'weekly' : 'monthly'} 58mm bills`}
              >
                {bulkPrinting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-1.5" />
                )}
                Print all {billKind === 'week' ? 'weekly' : 'monthly'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkPeriodBills('pdf')}
                disabled={bulkPrinting || loading || !billRows.length || !isOnline}
                title={`Download all ${billKind === 'week' ? 'weekly' : 'monthly'} 58mm bills (Save as PDF)`}
              >
                <Download className="h-4 w-4 mr-1.5" />
                All {billKind === 'week' ? 'weekly' : 'monthly'} bills
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateInvoices}
                disabled={
                  generating ||
                  loading ||
                  !isOnline ||
                  billsFromCache ||
                  !(liveBillKpis.unbilledCount > 0)
                }
                title={!isOnline ? 'Needs internet' : undefined}
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
                  !isOnline ||
                  !(liveBillKpis.unpaidCount || 0)
                }
                title={!isOnline ? 'Needs internet' : undefined}
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

      <MobileStatStrip items={view === 'daily' ? dayStatItems : view === 'rider-shifts' ? riderStatItems : view === 'bottle-control' ? bottleStatItems : billStatItems} layout="scroll" />
      <HisabKpiStrip items={view === 'daily' ? dayStatItems : view === 'rider-shifts' ? riderStatItems : view === 'bottle-control' ? bottleStatItems : billStatItems} />

      {view === 'daily' && dayDirty ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Unsaved changes. Click <span className="font-semibold">Save day</span> so deliveries are
          recorded and appear on weekly/monthly bills.
        </p>
      ) : null}

      {view === 'bills' && periodLabel ? (
        <p className="text-xs text-gray-500">
          Billing period: <span className="font-semibold text-gray-700">{periodLabel}</span>
          {billsFromCache ? ' · Offline cache' : ''}
          {' · '}Generate creates standard A4 invoices · Print icons: 58mm day sheet · File icon: A4 Delivery Bill
          {urduBillsEnabled ? ' · اردو thermal available' : ''}
          {' · '}Remind can share the 58mm day sheet PDF
        </p>
      ) : null}

      {view === 'daily' && offlineEnabled && !isOnline && !daySnapshotReady ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          This day was not cached for offline use. Reconnect, open the day once, then you can log the
          route without internet.
        </p>
      ) : null}

      {loading || riderLoading || bottleLoading ? (
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
          onRec={updateRec}
          onField={updateRowField}
          onPrintDaily={(row) => handlePrintDailyCustomer(row, 'print')}
          onPdfDaily={(row) => handlePrintDailyCustomer(row, 'pdf')}
          printingId={printingId}
          readOnly={offlineEnabled && !isOnline && !daySnapshotReady}
        />
      ) : view === 'rider-shifts' ? (
        <RiderShiftsSheet
          shifts={riderShifts}
          summary={riderShiftsSummary}
          loading={riderLoading}
          saving={savingRiderShift}
          deliveryDate={deliveryDate}
          currency={currency}
          onSaveShift={handleSaveRiderShift}
        />
      ) : view === 'bottle-control' ? (
        <BottleControlSheet
          summary={bottleSummary}
          idleCustomers={idleCustomers}
          loading={bottleLoading}
          saving={savingBottleSettings}
          currency={currency}
          bottleForm={bottleForm}
          setBottleForm={setBottleForm}
          onSaveSettings={handleSaveBottleSettings}
        />
      ) : (
        <BillsSheet
          productColumns={productColumns}
          rows={visibleBillRows}
          currency={currency}
          printingId={printingId}
          remindingId={remindingId}
          paymentBusyId={paymentBusyId}
          paymentDisabled={!isOnline}
          urduBillsEnabled={urduBillsEnabled}
          onOpenInvoices={openInvoices}
          onPaymentStatus={handleBillPaymentStatus}
          onPrint={(row) => handlePrintBill(row, 'print', 'en')}
          onPdf={(row) => handlePrintBill(row, 'pdf', 'en')}
          onInvoicePdf={handleDownloadStandardInvoice}
          onPrintUrdu={(row) => handlePrintBill(row, 'print', 'ur')}
          onPdfUrdu={(row) => handlePrintBill(row, 'pdf', 'ur')}
          onRemind={(row) => handleRemindCustomer(row)}
          onRemindWhatsApp={(row) => handleRemindCustomer(row, ['hub', 'whatsapp'])}
          onRemindEmail={(row) => handleRemindCustomer(row, ['hub', 'email'])}
          remindersDisabled={!isOnline}
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

function dailyRowQtyEntries(row, products) {
  return (products || [])
    .map((p) => {
      const qty = Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id] ?? 0);
      if (!(qty > 0)) return null;
      return {
        id: p.id,
        label: shortWaterHisabProductLabel(p, 12),
        qty,
        unit: p.unit || 'pcs',
      };
    })
    .filter(Boolean);
}

function DailySheet({
  products,
  rows,
  currency,
  onQty,
  onRec,
  onField,
  onPrintDaily,
  onPdfDaily,
  printingId = null,
  readOnly = false,
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-semibold text-gray-700">No route customers yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Add Home & Flat accounts with House / Villa, Town Code, and turn on delivery route in Customers.
        </p>
      </div>
    );
  }

  const toggleRow = (customerId) => {
    setExpandedId((prev) => (String(prev) === String(customerId) ? null : customerId));
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
      let targetRow = rowIndex;
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        targetRow = rowIndex + 1;
      } else if (e.key === 'ArrowUp') {
        targetRow = rowIndex - 1;
      }

      if (targetRow !== rowIndex && targetRow >= 0 && targetRow < rows.length) {
        e.preventDefault();
        const nextInput = document.getElementById(`nav-${targetRow}-${colIndex}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      }
    }
  };

  return (
    <>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="space-y-2 lg:hidden">
        {rows.map((row) => {
          const open = String(expandedId) === String(row.customerId);
          const filled = dailyRowQtyEntries(row, products);
          const filledCount = filled.length;
          return (
            <div
              key={row.customerId}
              className={cn(
                'rounded-xl border bg-white shadow-sm overflow-hidden',
                open ? 'border-sky-300 ring-1 ring-sky-100' : 'border-gray-200'
              )}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 p-3 bg-white cursor-pointer select-none text-left"
                onClick={() => toggleRow(row.customerId)}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                    open ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-gray-200 bg-gray-50 text-gray-500'
                  )}
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', open ? 'rotate-0' : '-rotate-90')}
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900 truncate">
                    {row.customerName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-500 truncate">
                    {row.accountNo ? `A/C ${row.accountNo} · ` : ''}
                    House {row.houseNo || '-'}
                    {row.floorFlat ? ` / ${row.floorFlat}` : ''}
                    {row.routeLabel ? ` · ${row.routeLabel}` : ''}
                    {filledCount > 0
                      ? ` · ${filled
                          .slice(0, 3)
                          .map((e) => `${e.label} ${e.qty}`)
                          .join(', ')}${filledCount > 3 ? '…' : ''}`
                      : ' · No Del yet'}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                    filledCount > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  {filledCount > 0 ? `${filledCount} item${filledCount === 1 ? '' : 's'}` : 'Pending'}
                </span>
              </button>

              {open ? (
                <div
                  id={`daily-route-row-${row.customerId}`}
                  className="border-t border-gray-100 bg-gray-50/60 px-3 py-2.5 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-gray-500">
                      A/C no
                      <Input
                        value={row.accountNo || ''}
                        onChange={(e) => onField(row.customerId, 'accountNo', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Town code
                      <Input
                        value={row.townCode || ''}
                        onChange={(e) => onField(row.customerId, 'townCode', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      House / villa
                      <Input
                        value={row.houseNo || ''}
                        onChange={(e) => onField(row.customerId, 'houseNo', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Floor / flat
                      <Input
                        value={row.floorFlat || ''}
                        onChange={(e) => onField(row.customerId, 'floorFlat', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Route / rider
                      <Input
                        value={row.routeLabel || ''}
                        onChange={(e) => onField(row.customerId, 'routeLabel', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Rate
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.productRate || ''}
                        onChange={(e) => onField(row.customerId, 'productRate', e.target.value === '' ? '' : Number(e.target.value))}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-2.5 py-2">Product</th>
                          <th className="px-2 py-2 text-right w-20">Del</th>
                          <th className="px-2 py-2 text-right w-20">Rec</th>
                          <th className="px-2.5 py-2 text-right w-16">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td className="px-2.5 py-1.5 font-medium text-gray-900">
                              {shortWaterHisabProductLabel(p, 18)}
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                inputMode="decimal"
                                value={
                                  row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id] ?? ''
                                }
                                onChange={(e) => onQty(row.customerId, p.id, e.target.value)}
                                className="ml-auto h-9 w-[4.25rem] tabular-nums text-center bg-white"
                                disabled={readOnly}
                                aria-label={`${p.name} delivered`}
                              />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                inputMode="decimal"
                                value={
                                  row.recByProduct?.[String(p.id)] ?? row.recByProduct?.[p.id] ?? ''
                                }
                                onChange={(e) => onRec?.(row.customerId, p.id, e.target.value)}
                                className="ml-auto h-9 w-[4.25rem] tabular-nums text-center bg-white"
                                disabled={readOnly}
                                aria-label={`${p.name} empties received`}
                              />
                            </td>
                            <td className="px-2.5 py-1.5 text-right text-[11px] tabular-nums text-gray-500">
                              {formatCurrency(
                                Number(row.productRate) > 0
                                  ? Number(row.productRate)
                                  : Number(p.price) || 0,
                                currency
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-gray-500">
                      Cash recovery
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.cashCollected || ''}
                        onChange={(e) =>
                          onField(
                            row.customerId,
                            'cashCollected',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Sp. discount
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.specialDiscount || ''}
                        onChange={(e) =>
                          onField(
                            row.customerId,
                            'specialDiscount',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Prev bottles {Number(row.prevBottle) || 0} · Bal after save{' '}
                    {Number(row.bottleBalance) || 0}
                  </p>

                  <label className="block text-xs text-gray-500">
                    Notes
                    <Input
                      value={row.notes || ''}
                      onChange={(e) => onField(row.customerId, 'notes', e.target.value)}
                      className="mt-0.5 h-9 bg-white"
                      disabled={readOnly}
                      placeholder="Optional"
                    />
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:print:daily`}
                      onClick={() => onPrintDaily?.(row)}
                      title="Print 58mm daily sale slip"
                      aria-label="Print daily bill"
                    >
                      {printingId === `${row.customerId}:print:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:pdf:daily`}
                      onClick={() => onPdfDaily?.(row)}
                      title="Download 58mm daily sale PDF"
                      aria-label="Download daily bill"
                    >
                      {printingId === `${row.customerId}:pdf:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="text-[11px] text-gray-400">58mm daily slip</span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-300 bg-white shadow-2xs">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-slate-100/90 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-300">
            <tr>
              <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200">A/C</th>
              <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200">House</th>
              <th className="px-3 py-2 whitespace-nowrap border-r border-slate-200">Customer</th>
              <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200">Route</th>
              {products.map((p) => (
                <th
                  key={p.id}
                  className="px-2 py-1.5 text-center align-bottom border-r border-slate-200 bg-slate-200/50"
                  title={`${p.name} · Del / Rec empties`}
                >
                  <span className="block truncate text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                    {shortWaterHisabProductLabel(p, 16)}
                  </span>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] font-bold normal-case border-t border-slate-300 pt-0.5">
                    <span className="text-emerald-700">Del</span>
                    <span className="text-amber-700">Rec</span>
                  </div>
                </th>
              ))}
              <th className="px-2.5 py-2 text-center whitespace-nowrap border-r border-slate-200">Cash</th>
              <th className="px-2.5 py-2 text-center whitespace-nowrap border-r border-slate-200">Disc</th>
              <th className="px-3 py-2 whitespace-nowrap border-r border-slate-200">Notes</th>
              <th className="px-2.5 py-2 text-center whitespace-nowrap">Bill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.customerId} className="hover:bg-sky-50/50 transition-colors divide-x divide-gray-200">
                <td className="px-1.5 py-1">
                  <Input
                    value={row.accountNo || ''}
                    onChange={(e) => onField(row.customerId, 'accountNo', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 px-2 text-xs font-mono border-gray-300 rounded-sm bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                    placeholder="A/C"
                  />
                </td>
                <td className="px-1.5 py-1">
                  <Input
                    value={row.houseNo || ''}
                    onChange={(e) => onField(row.customerId, 'houseNo', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-24 px-2 text-xs border-gray-300 rounded-sm bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-3 py-1 font-semibold text-gray-900 whitespace-nowrap">
                  {row.customerName}
                  {row.townCode ? (
                    <span className="ml-1 text-[10px] font-normal text-gray-400">T{row.townCode}</span>
                  ) : null}
                </td>
                <td className="px-1.5 py-1">
                  <Input
                    value={row.routeLabel || ''}
                    onChange={(e) => onField(row.customerId, 'routeLabel', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-28 px-2 text-xs border-gray-300 rounded-sm bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                {products.map((p) => (
                  <td key={p.id} className="px-1.5 py-1 text-center bg-slate-50/30">
                    <div className="inline-flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id] ?? ''}
                        onChange={(e) => onQty(row.customerId, p.id, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="h-8 w-16 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:bg-emerald-50/50 focus:outline-none transition-colors"
                        disabled={readOnly}
                        title="Delivered bottles"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={row.recByProduct?.[String(p.id)] ?? row.recByProduct?.[p.id] ?? ''}
                        onChange={(e) => onRec?.(row.customerId, p.id, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="h-8 w-16 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:bg-amber-50/50 focus:outline-none transition-colors"
                        disabled={readOnly}
                        title="Empty bottles received"
                      />
                    </div>
                  </td>
                ))}
                <td className="px-1.5 py-1 text-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.cashCollected || ''}
                    onChange={(e) =>
                      onField(
                        row.customerId,
                        'cashCollected',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="mx-auto h-8 w-20 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-1.5 py-1 text-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.specialDiscount || ''}
                    onChange={(e) =>
                      onField(
                        row.customerId,
                        'specialDiscount',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="mx-auto h-8 w-16 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-1.5 py-1">
                  <Input
                    value={row.notes || ''}
                    onChange={(e) => onField(row.customerId, 'notes', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 min-w-[9rem] w-full px-2 text-xs border-gray-300 rounded-sm bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-2 py-1 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:print:daily`}
                      onClick={() => onPrintDaily?.(row)}
                      title="Print 58mm daily sale slip"
                      aria-label="Print daily bill"
                    >
                      {printingId === `${row.customerId}:print:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:pdf:daily`}
                      onClick={() => onPdfDaily?.(row)}
                      title="Download 58mm daily sale PDF"
                      aria-label="Download daily bill"
                    >
                      {printingId === `${row.customerId}:pdf:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WaterHisabPaymentToggle({ status, disabled, busy, onChange }) {
  const paid = String(status || '').toLowerCase() === 'paid';
  return (
    <div
      className="inline-flex h-7 items-stretch overflow-hidden rounded border border-gray-200 bg-white"
      role="group"
      aria-label="Payment status"
    >
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => onChange('unpaid')}
        className={cn(
          'inline-flex min-w-[3.1rem] items-center justify-center px-2 text-[10px] font-semibold uppercase tracking-wide transition-colors',
          !paid
            ? 'bg-rose-600 text-white'
            : 'bg-white text-gray-500 hover:bg-rose-50 hover:text-rose-700',
          (disabled || busy) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {busy && !paid ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Unpaid'}
      </button>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => onChange('paid')}
        className={cn(
          'inline-flex min-w-[3.1rem] items-center justify-center border-l border-gray-200 px-2 text-[10px] font-semibold uppercase tracking-wide transition-colors',
          paid
            ? 'bg-emerald-600 text-white'
            : 'bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-700',
          (disabled || busy) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {busy && paid ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Paid'}
      </button>
    </div>
  );
}

const BILL_ACTION_BTN =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 bg-white p-0 text-gray-700 hover:bg-gray-50 disabled:opacity-50';

function BillsActionCluster({
  row,
  printingId,
  remindingId,
  urduBillsEnabled = false,
  remindersDisabled = false,
  onPrint,
  onPdf,
  onInvoicePdf,
  onPrintUrdu,
  onPdfUrdu,
  onRemind,
  onRemindWhatsApp,
  onRemindEmail,
}) {
  const baseId = row.invoiceId || row.customerId;
  const busy = typeof printingId === 'string' && printingId.startsWith(`${baseId}:`);
  const remindable = isWaterHisabBillRemindable(row) && !remindersDisabled;
  const remindBusy = remindingId === row.customerId || remindersDisabled;
  const canPrint = Boolean(row.invoiceId) || Number(row.amount) > 0;
  const canA4 = Boolean(row.invoiceId);
  const spin = (mode, locale) => printingId === `${baseId}:${mode}:${locale}`;

  if (!canPrint && !remindable) {
    return <span className="text-xs text-gray-300">-</span>;
  }

  return (
    <div className="inline-flex flex-nowrap items-center gap-1">
      {canA4 ? (
        <button
          type="button"
          className={cn(BILL_ACTION_BTN, 'text-sky-700 border-sky-200')}
          disabled={busy}
          onClick={() => onInvoicePdf?.(row)}
          title="Download standard A4 Delivery Bill (invoice)"
          aria-label="Download A4 invoice"
        >
          {printingId === `${row.invoiceId}:pdf:a4` ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
      {canPrint ? (
        <>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={busy}
            onClick={() => onPrint(row)}
            title="Print English 58mm week/month day sheet"
            aria-label="Print English thermal bill"
          >
            {spin('print', 'en') ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={busy}
            onClick={() => onPdf(row)}
            title="Download English 58mm week/month day sheet"
            aria-label="Download English thermal PDF"
          >
            {spin('pdf', 'en') ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>
          {urduBillsEnabled ? (
            <>
              <button
                type="button"
                className={cn(BILL_ACTION_BTN, 'w-auto min-w-[1.75rem] px-1.5 font-urdu text-[10px] leading-none')}
                disabled={busy}
                onClick={() => onPrintUrdu?.(row)}
                title="اردو بل پرنٹ کریں"
                aria-label="Print Urdu bill"
              >
                {spin('print', 'ur') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'اردو'}
              </button>
              <button
                type="button"
                className={BILL_ACTION_BTN}
                disabled={busy}
                onClick={() => onPdfUrdu?.(row)}
                title="اردو بل PDF"
                aria-label="Download Urdu PDF"
              >
                {spin('pdf', 'ur') ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </button>
            </>
          ) : null}
        </>
      ) : null}

      {canPrint && remindable ? <span className="mx-0.5 h-4 w-px shrink-0 bg-gray-200" aria-hidden /> : null}

      {remindable ? (
        <>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={remindBusy}
            onClick={() => onRemind(row)}
            title="Remind with bill details (hub, email, WhatsApp)"
            aria-label="Send reminder"
          >
            {remindBusy && remindingId === row.customerId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            className={cn(BILL_ACTION_BTN, 'text-emerald-700')}
            disabled={remindBusy}
            onClick={() => onRemindWhatsApp(row)}
            title="WhatsApp reminder with bill details (unpaid only)"
            aria-label="WhatsApp reminder"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={remindBusy}
            onClick={() => onRemindEmail(row)}
            title="Email reminder with bill details (unpaid only)"
            aria-label="Email reminder"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
        </>
      ) : Number(row.amount) > 0 && String(row.paymentStatus || '').toLowerCase() === 'paid' ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Paid</span>
      ) : null}
    </div>
  );
}

function billProductSummary(row, productColumns) {
  const bits = [];
  for (const p of productColumns || []) {
    const qty = Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id]) || 0;
    if (qty <= 0) continue;
    const label = shortWaterHisabProductLabel(p, 8);
    bits.push(`${qty}${p.unit ? ` ${p.unit}` : ''} ${label}`);
  }
  return bits.join(' · ');
}

function BillsSheet({
  productColumns,
  rows,
  currency,
  printingId,
  remindingId,
  paymentBusyId,
  paymentDisabled = false,
  urduBillsEnabled = false,
  onOpenInvoices,
  onPaymentStatus,
  onPrint,
  onPdf,
  onInvoicePdf,
  onPrintUrdu,
  onPdfUrdu,
  onRemind,
  onRemindWhatsApp,
  onRemindEmail,
  remindersDisabled = false,
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
    <>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => {
          const summary = billProductSummary(row, productColumns);
          const payBusy = paymentBusyId === row.customerId;
          const canPay = Number(row.amount) > 0 || row.billed;
          return (
            <div
              key={row.customerId}
              className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{row.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {row.accountNo ? `A/C ${row.accountNo} · ` : ''}
                    House {row.houseNo || '-'}
                    {' · '}
                    {row.stopCount || 0} days
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                  {formatCurrency(Number(row.amount) || 0, currency)}
                </p>
              </div>
              {summary ? <p className="mt-1.5 text-[11px] text-gray-500 leading-snug">{summary}</p> : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {row.invoiceNumber ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-sky-700 hover:underline"
                    onClick={onOpenInvoices}
                  >
                    {row.invoiceNumber}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Not billed</span>
                )}
                {canPay ? (
                  <WaterHisabPaymentToggle
                    status={row.paymentStatus || 'unpaid'}
                    disabled={paymentDisabled}
                    busy={payBusy}
                    onChange={(next) => onPaymentStatus?.(row, next)}
                  />
                ) : null}
              </div>
              <div className="mt-2 border-t border-gray-100 pt-2">
                <BillsActionCluster
                  row={row}
                  printingId={printingId}
                  remindingId={remindingId}
                  urduBillsEnabled={urduBillsEnabled}
                  remindersDisabled={remindersDisabled}
                  onPrint={onPrint}
                  onPdf={onPdf}
                  onInvoicePdf={onInvoicePdf}
                  onPrintUrdu={onPrintUrdu}
                  onPdfUrdu={onPdfUrdu}
                  onRemind={onRemind}
                  onRemindWhatsApp={onRemindWhatsApp}
                  onRemindEmail={onRemindEmail}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2">House</th>
              <th className="sticky left-[4.5rem] z-10 bg-gray-50 px-3 py-2">Customer</th>
              <th className="px-3 py-2 text-center">Days</th>
              {productColumns.map((p) => (
                <th
                  key={p.id}
                  className="px-2 py-2 text-center align-bottom min-w-[4.5rem] max-w-[5.5rem]"
                  title={p.name}
                >
                  <span className="block truncate text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    {shortWaterHisabProductLabel(p, 12)}
                  </span>
                  {p.unit ? (
                    <span className="mt-0.5 block font-normal normal-case text-[10px] text-gray-400">
                      {p.unit}
                    </span>
                  ) : null}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 whitespace-nowrap">Invoice</th>
              <th className="px-3 py-2 whitespace-nowrap">Status</th>
              <th className="px-3 py-2 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const payBusy = paymentBusyId === row.customerId;
              const canPay = Number(row.amount) > 0 || row.billed;
              return (
                <tr key={row.customerId} className="hover:bg-sky-50/40">
                  <td className="sticky left-0 z-[1] bg-white px-3 py-1.5 whitespace-nowrap text-gray-700 align-middle">
                    {row.houseNo || '-'}
                  </td>
                  <td className="sticky left-[4.5rem] z-[1] bg-white px-3 py-1.5 font-semibold text-gray-900 whitespace-nowrap align-middle">
                    {row.customerName}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums text-center text-gray-600 align-middle">
                    {row.stopCount || 0}
                  </td>
                  {productColumns.map((p) => (
                    <td
                      key={p.id}
                      className="px-2 py-1.5 tabular-nums text-center text-gray-700 align-middle"
                    >
                      {Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id]) || 0}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-gray-900 align-middle whitespace-nowrap">
                    {formatCurrency(Number(row.amount) || 0, currency)}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {row.invoiceNumber ? (
                      <button
                        type="button"
                        className="text-sky-700 font-semibold hover:underline"
                        onClick={onOpenInvoices}
                      >
                        {row.invoiceNumber}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400" title="Optional: Generate weekly/monthly invoices">
                        Not billed
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {canPay ? (
                      <WaterHisabPaymentToggle
                        status={row.paymentStatus || 'unpaid'}
                        disabled={paymentDisabled}
                        busy={payBusy}
                        onChange={(next) => onPaymentStatus?.(row, next)}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    <BillsActionCluster
                      row={row}
                      printingId={printingId}
                      remindingId={remindingId}
                      urduBillsEnabled={urduBillsEnabled}
                      remindersDisabled={remindersDisabled}
                      onPrint={onPrint}
                      onPdf={onPdf}
                      onInvoicePdf={onInvoicePdf}
                      onPrintUrdu={onPrintUrdu}
                      onPdfUrdu={onPdfUrdu}
                      onRemind={onRemind}
                      onRemindWhatsApp={onRemindWhatsApp}
                      onRemindEmail={onRemindEmail}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RiderShiftsSheet({
  shifts = [],
  summary = null,
  loading = false,
  saving = false,
  deliveryDate,
  currency,
  onSaveShift,
}) {
  const [form, setForm] = useState({
    id: null,
    riderName: '',
    routeLabel: '',
    vehicleNo: '',
    loadedBottles: 60,
    returnedFull: 0,
    returnedEmpty: 0,
    cashCollected: 0,
    defaultUnitPrice: 150,
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.riderName.trim()) {
      notify.error('Rider name is required');
      return;
    }
    onSaveShift(form);
    setForm({
      id: null,
      riderName: '',
      routeLabel: '',
      vehicleNo: '',
      loadedBottles: 60,
      returnedFull: 0,
      returnedEmpty: 0,
      cashCollected: 0,
      defaultUnitPrice: 150,
      notes: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Shifts Today</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{summary?.totalShifts || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Loaded 19L</p>
          <p className="text-lg font-bold text-sky-700 mt-1">{summary?.totalLoaded || 0} bottles</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Delivered 19L</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">{summary?.totalDelivered || 0} bottles</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Cash Collected</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(summary?.totalCash || 0, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Cash Shortage</p>
          <p className={cn('text-lg font-bold mt-1', (summary?.totalShortage || 0) > 0 ? 'text-rose-600' : 'text-emerald-600')}>
            {formatCurrency(summary?.totalShortage || 0, currency)}
          </p>
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Truck className="h-4 w-4 text-sky-600" />
          Rider Dispatch & Shift Load Reconciliation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Rider Name *</label>
            <Input
              value={form.riderName}
              onChange={(e) => setForm({ ...form, riderName: e.target.value })}
              placeholder="e.g. Rider Ali"
              className="h-9 bg-white"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Route / Area</label>
            <Input
              value={form.routeLabel}
              onChange={(e) => setForm({ ...form, routeLabel: e.target.value })}
              placeholder="e.g. Clifton Morning"
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Vehicle / Van No.</label>
            <Input
              value={form.vehicleNo}
              onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
              placeholder="e.g. KHI-4890"
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Morning Load-Out (19L)</label>
            <Input
              type="number"
              value={form.loadedBottles}
              onChange={(e) => setForm({ ...form, loadedBottles: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Returned Full (Unsold)</label>
            <Input
              type="number"
              value={form.returnedFull}
              onChange={(e) => setForm({ ...form, returnedFull: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Returned Empties</label>
            <Input
              type="number"
              value={form.returnedEmpty}
              onChange={(e) => setForm({ ...form, returnedEmpty: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Cash Recovered</label>
            <Input
              type="number"
              value={form.cashCollected}
              onChange={(e) => setForm({ ...form, cashCollected: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Bottle Unit Rate</label>
            <Input
              type="number"
              value={form.defaultUnitPrice}
              onChange={(e) => setForm({ ...form, defaultUnitPrice: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Shift Record
          </Button>
        </div>
      </form>

      {/* Shifts Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b font-semibold">
            <tr>
              <th className="p-3">Rider / Van</th>
              <th className="p-3">Route</th>
              <th className="p-3 text-right">Loaded</th>
              <th className="p-3 text-right">Ret. Full</th>
              <th className="p-3 text-right">Delivered</th>
              <th className="p-3 text-right">Ret. Empties</th>
              <th className="p-3 text-right">Cash Recovered</th>
              <th className="p-3 text-right">Cash Shortage</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-3 font-semibold text-gray-900">
                  {s.riderName}
                  {s.vehicleNo ? <span className="block text-[11px] text-gray-400 font-normal">{s.vehicleNo}</span> : null}
                </td>
                <td className="p-3 text-gray-600">{s.routeLabel}</td>
                <td className="p-3 text-right font-medium text-sky-700">{s.loadedBottles}</td>
                <td className="p-3 text-right text-gray-600">{s.returnedFull}</td>
                <td className="p-3 text-right font-semibold text-emerald-700">{s.deliveredBottles}</td>
                <td className="p-3 text-right text-gray-600">{s.returnedEmpty}</td>
                <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(s.cashCollected, currency)}</td>
                <td className={cn('p-3 text-right font-semibold', s.cashShortage > 0 ? 'text-rose-600' : 'text-gray-600')}>
                  {formatCurrency(s.cashShortage, currency)}
                </td>
                <td className="p-3 text-center">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', s.isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                    {s.isBalanced ? 'Balanced' : 'Shortage'}
                  </span>
                </td>
              </tr>
            ))}
            {!shifts.length && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-400">
                  No rider shift load-out records for {deliveryDate} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BottleControlSheet({
  summary,
  idleCustomers = [],
  loading = false,
  saving = false,
  currency,
  bottleForm,
  setBottleForm,
  onSaveSettings,
}) {
  return (
    <div className="space-y-4">
      {/* Plant asset metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Plant Full Bottles</p>
          <p className="text-lg font-bold text-sky-700 mt-1">{summary?.plantFull || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ready for dispatch</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Plant Empty Bottles</p>
          <p className="text-lg font-bold text-amber-700 mt-1">{summary?.plantEmpty || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Awaiting refill</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Bottles with Customers</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">{summary?.withCustomers || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Customer float</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Float Bottles</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{summary?.totalFloatBottles || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Total company float</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Float Asset Value</p>
          <p className="text-lg font-bold text-indigo-700 mt-1">{formatCurrency(summary?.totalAssetValue || 0, currency)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">@{summary?.bottleUnitCost || 1200} per bottle</p>
        </div>
      </div>

      {/* Plant stock update form */}
      <form onSubmit={(e) => { e.preventDefault(); onSaveSettings(bottleForm); }} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          Plant Bottle Inventory Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Plant Full Bottles (19L)</label>
            <Input
              type="number"
              value={bottleForm.plantFull}
              onChange={(e) => setBottleForm({ ...bottleForm, plantFull: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Plant Empty Bottles</label>
            <Input
              type="number"
              value={bottleForm.plantEmpty}
              onChange={(e) => setBottleForm({ ...bottleForm, plantEmpty: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Damaged / Scrapped</label>
            <Input
              type="number"
              value={bottleForm.damagedScrapped}
              onChange={(e) => setBottleForm({ ...bottleForm, damagedScrapped: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Replacement Cost / Bottle</label>
            <Input
              type="number"
              value={bottleForm.bottleUnitCost}
              onChange={(e) => setBottleForm({ ...bottleForm, bottleUnitCost: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Bottle Inventory
          </Button>
        </div>
      </form>

      {/* Idle Bottle Risk Alerts */}
      <div className="rounded-xl border border-amber-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <h3 className="text-sm font-semibold text-amber-900">Idle Empty Bottle Recovery Alerts</h3>
          </div>
          <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            {idleCustomers.length} accounts holding empty bottles
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b font-semibold">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">House / Address</th>
              <th className="p-3">Route</th>
              <th className="p-3 text-right">Unreturned Empties</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {idleCustomers.map((c) => {
              const waText = encodeURIComponent(`Assalamu Alaikum ${c.name},\nThis is a gentle reminder regarding ${c.bottleBalance} empty 19L water bottles at your address (${c.houseNo || 'Home'}). Please let us know when our rider can collect the empties or replace them with refills. Thank you!`);
              const waUrl = c.phone ? `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${waText}` : null;
              return (
                <tr key={c.id} className="hover:bg-amber-50/30">
                  <td className="p-3 font-semibold text-gray-900">
                    {c.name}
                    {c.accountNo ? <span className="block text-[11px] text-gray-400 font-normal">A/C {c.accountNo}</span> : null}
                  </td>
                  <td className="p-3 text-gray-600">{c.houseNo || '-'}</td>
                  <td className="p-3 text-gray-600">{c.routeLabel || '-'}</td>
                  <td className="p-3 text-right font-bold text-amber-700">{c.bottleBalance} bottles</td>
                  <td className="p-3 text-center">
                    {waUrl ? (
                      <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Remind Return
                      </a>
                    ) : (
                      <span className="text-gray-400">No phone</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!idleCustomers.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No idle unreturned empty bottles detected. All customer bottle balances are clear!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WaterRouteHisab;

