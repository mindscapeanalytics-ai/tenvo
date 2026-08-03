'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, PieChart, LineChart, Table2, FileText, Download,
    Plus, Trash2, GripVertical, Save, Layers, TrendingUp,
    DollarSign, Package, Users, ShoppingCart, Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getAnalyticsBundleAction } from '@/lib/actions/premium/ai/analytics';
import { formatCurrency } from '@/lib/currency';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';
import { useBusiness } from '@/lib/context/BusinessContext';
import { generateAnalyticsReportPDF } from '@/lib/pdf/analyticsReportPdf';
import { SalesInsightsFilterBar } from '@/components/sales/SalesInsightsFilterBar';
import {
    normalizeSalesChannel,
    normalizeSalesCategory,
} from '@/lib/analytics/salesPerformanceFilter';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import { EMPTY_VALUE, normalizeProseCopy } from '@/lib/utils/copyTypography';

const REPORT_BUILDER_STORAGE_PREFIX = 'tenvo_report_builder_v2_';

function buildDateFilter(dr) {
    if (!dr?.from || !dr?.to) return {};
    const from = dr.from instanceof Date ? dr.from.toISOString() : String(dr.from);
    const to = dr.to instanceof Date ? dr.to.toISOString() : String(dr.to);
    return { from, to };
}

function isoDateOnly(v) {
    if (v == null || v === '') return null;
    const s = v instanceof Date ? v.toISOString() : String(v);
    return s.slice(0, 10);
}

function addDaysUtc(isoYYYYMMdd, deltaDays) {
    const d = new Date(`${isoYYYYMMdd}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return d.toISOString().slice(0, 10);
}

function mergeReportWindowFilter(dashboardDateRange, reportWindow, customFrom, customTo) {
    if (reportWindow === 'custom') {
        const fromStr = isoDateOnly(customFrom);
        const toStr = isoDateOnly(customTo);
        if (fromStr && toStr) {
            const a = fromStr <= toStr ? fromStr : toStr;
            const b = fromStr <= toStr ? toStr : fromStr;
            return { from: `${a}T00:00:00.000Z`, to: `${b}T23:59:59.999Z` };
        }
        return buildDateFilter(dashboardDateRange);
    }
    if (reportWindow === 'header') {
        return buildDateFilter(dashboardDateRange);
    }
    const endStr = isoDateOnly(dashboardDateRange?.to) || isoDateOnly(new Date());
    let fromStr;
    let toStr = endStr;

    switch (reportWindow) {
        case 'today':
            fromStr = endStr;
            break;
        case 'yesterday':
            toStr = addDaysUtc(endStr, -1);
            fromStr = toStr;
            break;
        case '7d':
            fromStr = addDaysUtc(endStr, -6);
            break;
        case '30d':
            fromStr = addDaysUtc(endStr, -29);
            break;
        case '90d':
            fromStr = addDaysUtc(endStr, -89);
            break;
        case 'mtd': {
            const end = new Date(`${endStr}T12:00:00.000Z`);
            fromStr = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1, 12)).toISOString().slice(0, 10);
            break;
        }
        case 'ytd': {
            const end = new Date(`${endStr}T12:00:00.000Z`);
            fromStr = new Date(Date.UTC(end.getUTCFullYear(), 0, 1, 12)).toISOString().slice(0, 10);
            break;
        }
        case 'last_month': {
            const end = new Date(`${endStr}T12:00:00.000Z`);
            const firstThis = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1, 12));
            const lastPrev = new Date(firstThis);
            lastPrev.setUTCDate(0);
            const fy = lastPrev.getUTCFullYear();
            const fm = lastPrev.getUTCMonth();
            fromStr = new Date(Date.UTC(fy, fm, 1, 12)).toISOString().slice(0, 10);
            toStr = lastPrev.toISOString().slice(0, 10);
            break;
        }
        case 'this_quarter': {
            const end = new Date(`${endStr}T12:00:00.000Z`);
            const m = end.getUTCMonth();
            const qStartMonth = Math.floor(m / 3) * 3;
            fromStr = new Date(Date.UTC(end.getUTCFullYear(), qStartMonth, 1, 12)).toISOString().slice(0, 10);
            break;
        }
        default:
            return buildDateFilter(dashboardDateRange);
    }

    if (fromStr > toStr) {
        const t = fromStr;
        fromStr = toStr;
        toStr = t;
    }

    return {
        from: `${fromStr}T00:00:00.000Z`,
        to: `${toStr}T23:59:59.999Z`,
    };
}

function reportStorageKey(businessId) {
    return `${REPORT_BUILDER_STORAGE_PREFIX}${businessId || 'anon'}`;
}

function loadSavedReports(businessId) {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(reportStorageKey(businessId));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function persistSavedReports(businessId, reports) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(reportStorageKey(businessId), JSON.stringify(reports.slice(0, 20)));
    } catch {
        /* quota */
    }
}

function periodLabelFromFilter(filter) {
    if (!filter?.from || !filter?.to) return '';
    try {
        const a = new Date(filter.from);
        const b = new Date(filter.to);
        if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
        return `Period: ${a.toLocaleDateString(undefined, { dateStyle: 'medium' })} - ${b.toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
    } catch {
        return '';
    }
}

const DATA_SOURCES = [
    { id: 'sales', label: 'Sales & Revenue', icon: DollarSign, color: 'bg-emerald-500' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, color: 'bg-blue-500' },
    { id: 'customers', label: 'Customers', icon: Users, color: 'bg-wine-500' },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp, color: 'bg-orange-500' },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart, color: 'bg-indigo-500' },
];

const WIDGET_TYPES = [
    { id: 'kpi', label: 'KPI Card', icon: Layers, description: 'Live period metric' },
    { id: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Monthly revenue bars' },
    { id: 'line', label: 'Line Chart', icon: LineChart, description: 'Revenue trend' },
    { id: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Category or expense mix' },
    { id: 'table', label: 'Data Table', icon: Table2, description: 'Top products' },
    { id: 'summary', label: 'Summary', icon: FileText, description: 'Period totals' },
];

const FOCUS_TITLES = {
    revenue: 'Period revenue',
    orders: 'Orders',
    growth: 'Growth vs prior',
    inventory: 'Inventory asset',
    retention: 'Retention',
    expenses: 'Expenses (GL)',
};

function titleCaseFocus(focus) {
    if (!focus) return '';
    return FOCUS_TITLES[focus] || String(focus).replace(/_/g, ' ');
}

/** Professional widget chrome title (no em dash). */
function buildWidgetTitle({ type, focus, source, reportName }) {
    if (type === 'kpi') return titleCaseFocus(focus || 'revenue');
    if (type === 'pie') {
        if (focus === 'expenses' || source === 'expenses') return 'Expense mix';
        if (focus === 'inventory' || source === 'inventory') return 'Category mix (at cost)';
        return 'Category mix';
    }
    if (type === 'bar') return 'Revenue by month';
    if (type === 'line') return 'Revenue trend';
    if (type === 'table') return 'Top products';
    if (type === 'summary') return reportName ? `Summary: ${reportName}` : 'Period summary';
    const typeLabel = WIDGET_TYPES.find((w) => w.id === type)?.label || type;
    return normalizeProseCopy(String(typeLabel));
}

function defaultWidgetCol(type) {
    if (type === 'kpi') return 4;
    if (type === 'table' || type === 'summary') return 12;
    if (type === 'pie') return 6;
    if (type === 'bar' || type === 'line') return 12;
    return 6;
}

function colSpanClass(col) {
    const n = Number(col) || 6;
    if (n >= 12) return 'lg:col-span-12';
    if (n >= 8) return 'lg:col-span-8';
    if (n >= 6) return 'lg:col-span-6';
    if (n >= 4) return 'lg:col-span-4';
    if (n >= 3) return 'lg:col-span-3';
    return 'lg:col-span-6';
}

/** Templates with explicit cols so each row fills the 12-column grid. */
const PRESET_TEMPLATES = [
    {
        id: 'sales_summary',
        name: 'Sales Summary',
        source: 'sales',
        description: 'Period revenue, growth, trend, and top products',
        widgets: [
            { type: 'kpi', focus: 'revenue', col: 4 },
            { type: 'kpi', focus: 'orders', col: 4 },
            { type: 'kpi', focus: 'growth', col: 4 },
            { type: 'bar', col: 12 },
            { type: 'table', col: 6 },
            { type: 'summary', col: 6 },
        ],
    },
    {
        id: 'inventory_val',
        name: 'Inventory Valuation',
        source: 'inventory',
        description: 'Stock value at cost and category mix',
        widgets: [
            { type: 'kpi', focus: 'inventory', col: 4 },
            { type: 'kpi', focus: 'revenue', col: 4 },
            { type: 'kpi', focus: 'orders', col: 4 },
            { type: 'pie', focus: 'inventory', col: 6 },
            { type: 'summary', col: 6 },
            { type: 'table', col: 12 },
        ],
    },
    {
        id: 'customer_retention',
        name: 'Customer Retention',
        source: 'customers',
        description: 'Repeat purchase rate and sales trend',
        widgets: [
            { type: 'kpi', focus: 'retention', col: 4 },
            { type: 'kpi', focus: 'revenue', col: 4 },
            { type: 'kpi', focus: 'orders', col: 4 },
            { type: 'line', col: 6 },
            { type: 'table', col: 6 },
            { type: 'summary', col: 12 },
        ],
    },
    {
        id: 'sales_performance',
        name: 'Sales Performance',
        source: 'sales',
        description: 'Channel sales KPIs (not formal Finance P&L)',
        widgets: [
            { type: 'kpi', focus: 'revenue', col: 4 },
            { type: 'kpi', focus: 'orders', col: 4 },
            { type: 'kpi', focus: 'growth', col: 4 },
            { type: 'bar', col: 12 },
            { type: 'table', col: 6 },
            { type: 'summary', col: 6 },
        ],
    },
    {
        id: 'expense_report',
        name: 'Expense Report',
        source: 'expenses',
        description: 'GL expense categories for the selected range',
        widgets: [
            { type: 'kpi', focus: 'expenses', col: 4 },
            { type: 'kpi', focus: 'revenue', col: 4 },
            { type: 'kpi', focus: 'growth', col: 4 },
            { type: 'pie', focus: 'expenses', col: 6 },
            { type: 'summary', col: 6 },
            { type: 'bar', col: 12 },
        ],
    },
];

function resolveKpiDisplay(focus, liveSnapshot, currency) {
    const kpi = liveSnapshot?.kpi;
    const gd = kpi?.growthDetail || {};
    const expenseTotal = (liveSnapshot?.expenseBreakdown || []).reduce((s, e) => s + (Number(e.value) || 0), 0);

    switch (focus) {
        case 'orders':
            return {
                title: 'Orders',
                value: gd.periodOrders != null ? String(gd.periodOrders) : EMPTY_VALUE,
                sub: 'Invoices + POS + storefront',
            };
        case 'growth':
            return {
                title: 'Growth vs prior',
                value: kpi?.growth?.value || EMPTY_VALUE,
                sub: 'Same-length prior period',
                trend: kpi?.growth?.value,
                positive: kpi?.growth?.trend === 'up',
            };
        case 'inventory':
            return {
                title: 'Inventory asset',
                value: formatCurrency(Number(kpi?.inventoryAsset) || 0, currency),
                sub: 'At cost',
            };
        case 'retention':
            return {
                title: 'Retention',
                value: kpi?.retention || EMPTY_VALUE,
                sub: kpi?.retentionDetail
                    ? `${kpi.retentionDetail.repeatCustomers}/${kpi.retentionDetail.invoicedCustomers} repeat`
                    : 'Invoice customers',
            };
        case 'expenses':
            return {
                title: 'Expenses (GL)',
                value: formatCurrency(expenseTotal, currency),
                sub: 'Selected range',
            };
        case 'revenue':
        default:
            return {
                title: 'Period revenue',
                value: formatCurrency(Number(gd.periodRevenue) || 0, currency),
                sub: 'Invoices + POS + storefront',
            };
    }
}

function LiveBarChart({ salesTrend = [], currency }) {
    const max = Math.max(1, ...salesTrend.map((m) => Number(m.revenue || m.sales) || 0));
    if (!salesTrend.length) {
        return <p className="text-[10px] text-gray-400 text-center py-6">No trend data for this window</p>;
    }
    return (
        <div className="space-y-1">
            <div className="flex items-end gap-1.5 h-28 px-1 pt-2">
                {salesTrend.map((m, i) => {
                    const v = Number(m.revenue || m.sales) || 0;
                    const h = Math.max(4, Math.round((v / max) * 100));
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                            <div
                                className="w-full rounded-t-md bg-indigo-400/90 hover:bg-indigo-500 transition-colors"
                                style={{ height: `${h}%` }}
                                title={`${m.date || ''}: ${formatCurrency(v, currency)}`}
                            />
                            <span className="text-[9px] font-semibold text-gray-400 truncate w-full text-center">
                                {m.date || ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LiveLineChart({ salesTrend = [] }) {
    if (!salesTrend.length) {
        return <p className="py-4 text-center text-[11px] text-gray-400">No trend data for this window</p>;
    }
    const vals = salesTrend.map((m) => Number(m.revenue || m.sales) || 0);
    const max = Math.max(1, ...vals);
    const min = Math.min(0, ...vals);
    const span = Math.max(1, max - min);
    const w = 280;
    const h = 88;
    const pts = vals.map((v, i) => {
        const x = vals.length === 1 ? w / 2 : (i / (vals.length - 1)) * w;
        const y = h - ((v - min) / span) * (h - 16) - 10;
        return `${x},${y}`;
    });
    const line = pts.join(' ');
    const area = `0,${h} ${line} ${w},${h}`;
    return (
        <div className="space-y-1">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" preserveAspectRatio="none">
                <polyline fill="none" stroke="#6366F1" strokeWidth="2.5" points={line} />
                <polygon fill="#6366F1" opacity="0.12" points={area} />
            </svg>
            <div className="flex justify-between gap-1 px-0.5">
                {salesTrend.map((m, i) => (
                    <span key={i} className="flex-1 truncate text-center text-[9px] font-medium text-gray-400">
                        {m.date || ''}
                    </span>
                ))}
            </div>
        </div>
    );
}

function LivePieChart({ slices = [], currency }) {
    if (!slices.length) {
        return <p className="py-4 text-center text-[11px] text-gray-400">No breakdown for this window</p>;
    }
    const colors = ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#4F46E5', '#312E81'];
    const total = slices.reduce((s, x) => s + x.value, 0) || 1;
    let offset = 0;
    const circumference = 2 * Math.PI * 40;
    return (
        <div className="flex items-start gap-3">
            <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0">
                {slices.slice(0, 6).map((slice, i) => {
                    const len = (slice.value / total) * circumference;
                    const el = (
                        <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth="18"
                            strokeDasharray={`${len} ${circumference - len}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 50 50)"
                        />
                    );
                    offset += len;
                    return el;
                })}
            </svg>
            <div className="min-w-0 flex-1 space-y-1.5">
                {slices.slice(0, 6).map((slice, i) => (
                    <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-[11px]">
                        <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: colors[i % colors.length] }}
                        />
                        <span className="truncate font-medium text-gray-600">{slice.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-gray-900">
                            {formatCurrency(slice.value, currency)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WidgetPreview({ widget, onRemove, liveSnapshot, currency }) {
    const typeConfig = WIDGET_TYPES.find((w) => w.id === widget.type);
    const Icon = typeConfig?.icon || Layers;
    const kpi = resolveKpiDisplay(widget.focus || 'revenue', liveSnapshot, currency);

    const pieSlices = useMemo(() => {
        if (widget.focus === 'expenses' || widget.source === 'expenses') {
            return (liveSnapshot?.expenseBreakdown || []).map((e) => ({
                name: e.name,
                value: Number(e.value) || 0,
            }));
        }
        return (liveSnapshot?.categoryData || []).map((c) => ({
            name: c.name,
            value: Number(c.assetValue) > 0 ? Number(c.assetValue) : Number(c.value) || 0,
        }));
    }, [widget.focus, widget.source, liveSnapshot]);

    const displayTitle = widget.title || buildWidgetTitle({
        type: widget.type,
        focus: widget.focus,
        source: widget.source,
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={cn(
                'group relative col-span-12 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm',
                colSpanClass(widget.col)
            )}
        >
            <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                    <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    <span className="truncate text-xs font-semibold text-gray-800">{displayTitle}</span>
                </div>
                <button
                    type="button"
                    onClick={() => onRemove(widget.id)}
                    className="rounded-md p-1 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                    title="Remove widget"
                >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
            </div>

            {widget.type === 'kpi' && (
                <div className="flex min-h-[4.5rem] flex-col justify-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{kpi.title}</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">{kpi.value}</p>
                    {kpi.trend ? (
                        <span className={cn('mt-0.5 text-[11px] font-semibold', kpi.positive ? 'text-emerald-600' : 'text-red-500')}>
                            {kpi.trend}
                        </span>
                    ) : null}
                    <p className="mt-0.5 text-[10px] text-gray-500">{kpi.sub}</p>
                </div>
            )}
            {widget.type === 'bar' && <LiveBarChart salesTrend={liveSnapshot?.salesTrend} currency={currency} />}
            {widget.type === 'line' && <LiveLineChart salesTrend={liveSnapshot?.salesTrend} />}
            {widget.type === 'pie' && (
                <LivePieChart slices={pieSlices} currency={currency} />
            )}
            {widget.type === 'table' && (
                liveSnapshot?.topProducts?.length ? (
                    <div className="max-h-44 space-y-1 overflow-y-auto">
                        {liveSnapshot.topProducts.slice(0, 12).map((p, i) => (
                            <div
                                key={`${p.name}-${i}`}
                                className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px]"
                            >
                                <span className="truncate font-medium text-gray-800">{p.name}</span>
                                <span className="font-semibold tabular-nums text-gray-900">
                                    {formatCurrency(Number(p.value) || 0, currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-4 text-center text-[11px] text-gray-400">No product rows for this window</p>
                )
            )}
            {widget.type === 'summary' && (
                <div className="divide-y divide-gray-100">
                    {liveSnapshot?.kpi ? (
                        <>
                            {[
                                {
                                    label: 'Range revenue',
                                    value: formatCurrency(Number(liveSnapshot.kpi.growthDetail?.periodRevenue) || 0, currency),
                                },
                                {
                                    label: 'Orders',
                                    value: liveSnapshot.kpi.growthDetail?.periodOrders ?? EMPTY_VALUE,
                                },
                                {
                                    label: 'Inventory (at cost)',
                                    value: formatCurrency(Number(liveSnapshot.kpi.inventoryAsset) || 0, currency),
                                },
                                {
                                    label: 'Trend profit (at cost)',
                                    value: formatCurrency(Number(liveSnapshot.trailingProfit) || 0, currency),
                                    emphasize: true,
                                },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 text-xs first:pt-0 last:pb-0"
                                >
                                    <span className={cn('text-gray-500', row.emphasize && 'font-semibold text-gray-800')}>
                                        {row.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'font-semibold tabular-nums text-gray-900',
                                            row.emphasize && 'text-emerald-600'
                                        )}
                                    >
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <p className="py-4 text-center text-[11px] text-gray-400">Loading live totals...</p>
                    )}
                </div>
            )}
        </motion.div>
    );
}

export function ReportBuilder({ businessId, currency, dateRange: dashboardDateRange }) {
    const resolvedBusinessId = useResolvedBusinessId(businessId);
    const { business, regionalPack } = useBusiness();
    const [widgets, setWidgets] = useState([]);
    const [showAddWidget, setShowAddWidget] = useState(false);
    const idCounterRef = useRef(1);
    const [reportName, setReportName] = useState('Sales Summary');
    const [reportWindow, setReportWindow] = useState('header');
    const [customFrom, setCustomFrom] = useState(() => isoDateOnly(dashboardDateRange?.from) || '');
    const [customTo, setCustomTo] = useState(() => isoDateOnly(dashboardDateRange?.to) || '');
    const [selectedSource, setSelectedSource] = useState('sales');
    const [salesChannel, setSalesChannel] = useState('all');
    const [salesCategory, setSalesCategory] = useState(null);
    const [liveSnapshot, setLiveSnapshot] = useState(null);
    const [savedLayouts, setSavedLayouts] = useState([]);
    const [pdfBusy, setPdfBusy] = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        void Promise.resolve().then(() => {
            if (resolvedBusinessId && typeof window !== 'undefined') {
                setSavedLayouts(loadSavedReports(resolvedBusinessId));
            }
        });
    }, [resolvedBusinessId]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            if (!resolvedBusinessId) {
                if (!cancelled) setLiveSnapshot(null);
                return;
            }
            try {
                setLoadError(null);
                const filter = {
                    ...mergeReportWindowFilter(dashboardDateRange, reportWindow, customFrom, customTo),
                    channel: normalizeSalesChannel(salesChannel),
                    category: normalizeSalesCategory(salesCategory),
                };
                const bundle = await getAnalyticsBundleAction(resolvedBusinessId, filter);
                if (cancelled) return;
                if (bundle.success && bundle.data) {
                    const months = bundle.data.salesTrend || [];
                    const trailingRevenue = months.reduce((s, m) => s + (Number(m.revenue) || 0), 0);
                    const trailingProfit = months.reduce((s, m) => s + (Number(m.profit) || 0), 0);
                    setLiveSnapshot({
                        kpi: bundle.data.kpi,
                        trailingRevenue,
                        trailingProfit,
                        topProducts: bundle.data.topProducts || [],
                        salesTrend: months,
                        categoryData: bundle.data.categoryData || [],
                        productCategories: bundle.data.productCategories || [],
                        expenseBreakdown: bundle.data.expenseBreakdown || [],
                        appliedRange: bundle.data.range,
                        filter,
                    });
                } else if (!cancelled) {
                    setLiveSnapshot(null);
                    setLoadError(bundle?.error || 'Could not load report data');
                }
            } catch (err) {
                if (!cancelled) {
                    setLiveSnapshot(null);
                    setLoadError(err?.message || 'Could not load report data');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resolvedBusinessId, dashboardDateRange, reportWindow, customFrom, customTo, salesChannel, salesCategory]);

    const handleAddWidget = (type) => {
        const focus =
            selectedSource === 'inventory' ? 'inventory'
                : selectedSource === 'expenses' ? 'expenses'
                    : selectedSource === 'customers' ? 'retention'
                        : 'revenue';
        const newWidget = {
            id: `w-${idCounterRef.current++}`,
            type: type.id,
            source: selectedSource,
            focus: type.id === 'kpi' || type.id === 'pie' ? focus : undefined,
            title: buildWidgetTitle({
                type: type.id,
                focus: type.id === 'kpi' || type.id === 'pie' ? focus : undefined,
                source: selectedSource,
                reportName,
            }),
            col: defaultWidgetCol(type.id),
        };
        setWidgets((prev) => [...prev, newWidget]);
        setShowAddWidget(false);
    };

    const handleRemoveWidget = (id) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
    };

    const handleLoadTemplate = (template) => {
        const generated = template.widgets.map((spec, idx) => {
            const wType = typeof spec === 'string' ? spec : spec.type;
            const focus = typeof spec === 'object' ? spec.focus : undefined;
            const col = typeof spec === 'object' && spec.col != null
                ? spec.col
                : defaultWidgetCol(wType);
            return {
                id: `tpl-${template.id}-${idx}-${idCounterRef.current++}`,
                type: wType,
                source: template.source,
                focus,
                title: buildWidgetTitle({
                    type: wType,
                    focus,
                    source: template.source,
                    reportName: template.name,
                }),
                col,
            };
        });
        setWidgets(generated);
        setReportName(template.name);
        setSelectedSource(template.source);
    };

    const handleSaveLayout = () => {
        if (!resolvedBusinessId || typeof window === 'undefined') return;
        const trimmed = reportName.trim() || 'Untitled report';
        const entry = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`,
            name: trimmed,
            widgets,
            reportWindow,
            customFrom,
            customTo,
            salesChannel,
            salesCategory,
            updatedAt: new Date().toISOString(),
        };
        const list = loadSavedReports(resolvedBusinessId);
        const next = [entry, ...list.filter((x) => x.name !== trimmed)].slice(0, 20);
        persistSavedReports(resolvedBusinessId, next);
        setSavedLayouts(next);
    };

    const handleLoadSaved = (e) => {
        const id = e.target.value;
        if (!id) return;
        const entry = savedLayouts.find((x) => x.id === id);
        if (!entry) return;
        setWidgets(entry.widgets || []);
        setReportName(entry.name || 'My Custom Report');
        if (entry.reportWindow) setReportWindow(entry.reportWindow);
        if (entry.customFrom) setCustomFrom(entry.customFrom);
        if (entry.customTo) setCustomTo(entry.customTo);
        if (entry.salesChannel) setSalesChannel(normalizeSalesChannel(entry.salesChannel));
        if (entry.salesCategory !== undefined) {
            setSalesCategory(normalizeSalesCategory(entry.salesCategory));
        }
        e.target.value = '';
    };

    const handleExportJson = () => {
        if (typeof window === 'undefined') return;
        const payload = {
            reportName,
            reportWindow,
            customFrom,
            customTo,
            salesChannel,
            salesCategory,
            widgets,
            businessId: resolvedBusinessId,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(reportName || 'report').replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportTopProductsCsv = () => {
        if (typeof window === 'undefined' || !liveSnapshot?.topProducts?.length) return;
        const rows = [
            ['Product', 'Category', 'Revenue', 'Units'],
            ...liveSnapshot.topProducts.map((p) => [p.name || '', p.category || '', p.value ?? '', p.volume ?? '']),
        ];
        const esc = (c) => `"${String(c).replace(/"/g, '""')}"`;
        const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(reportName || 'top-products').replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = useCallback(() => {
        if (!liveSnapshot?.kpi) return;
        setPdfBusy(true);
        try {
            generateAnalyticsReportPDF({
                business,
                currency: currency || regionalPack?.currency || '',
                locale: regionalPack?.locale,
                reportName: reportName.trim() || 'Business Report',
                periodLabel: periodLabelFromFilter(liveSnapshot.filter || liveSnapshot.appliedRange),
                snapshot: liveSnapshot,
            });
        } catch (err) {
            console.error('Report PDF failed', err);
        } finally {
            setPdfBusy(false);
        }
    }, [liveSnapshot, business, currency, regionalPack, reportName]);

    return (
        <div className="min-w-0 space-y-6 overflow-x-hidden">
            {loadError && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="py-3 text-sm text-amber-900 font-medium">{loadError}</CardContent>
                </Card>
            )}

            {resolvedBusinessId && liveSnapshot?.kpi && (
                <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white shadow-sm">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                            Live business snapshot
                        </CardTitle>
                        {periodLabelFromFilter(liveSnapshot.filter || liveSnapshot.appliedRange) && (
                            <p className="text-[10px] text-emerald-700/80 mt-1 font-medium">
                                {periodLabelFromFilter(liveSnapshot.filter || liveSnapshot.appliedRange)}
                                {reportWindow !== 'header' ? ' (report window)' : ''}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4">
                        <div className="rounded-xl bg-white/80 border border-emerald-100 p-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Period revenue</p>
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">
                                {formatCurrency(liveSnapshot.kpi.growthDetail?.periodRevenue || 0, currency)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/80 border border-emerald-100 p-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Orders</p>
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">
                                {liveSnapshot.kpi.growthDetail?.periodOrders ?? EMPTY_VALUE}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/80 border border-emerald-100 p-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Growth</p>
                            <p className="text-sm font-semibold text-gray-900">{liveSnapshot.kpi.growth?.value ?? EMPTY_VALUE}</p>
                        </div>
                        <div className="rounded-xl bg-white/80 border border-emerald-100 p-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Inventory (at cost)</p>
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">
                                {formatCurrency(liveSnapshot.kpi.inventoryAsset || 0, currency)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {resolvedBusinessId && (
                <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-muted/30 p-3">
                    <Button type="button" variant="outline" size="sm" className="h-9 flex-1 text-xs font-bold sm:flex-none" onClick={handleSaveLayout}>
                        Save layout
                    </Button>
                    <select
                        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-xs font-semibold sm:min-w-[140px] sm:flex-none"
                        defaultValue=""
                        onChange={handleLoadSaved}
                        aria-label="Load saved report layout"
                    >
                        <option value="">Load saved...</option>
                        {savedLayouts.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <Button type="button" variant="outline" size="sm" className="h-9 flex-1 text-xs font-bold sm:flex-none" onClick={handleExportJson}>
                        Export JSON
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-full text-xs font-bold sm:w-auto"
                        disabled={!liveSnapshot?.topProducts?.length}
                        onClick={handleExportTopProductsCsv}
                    >
                        Top products CSV
                    </Button>
                </div>
            )}

            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
                <Input
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 text-sm font-bold lg:w-64"
                />

                <select
                    value={reportWindow}
                    onChange={(e) => setReportWindow(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-gray-200 px-3 text-sm font-medium lg:w-auto"
                >
                    <option value="header">Match header</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="mtd">This Month</option>
                    <option value="this_quarter">This Quarter</option>
                    <option value="last_month">Last Month</option>
                    <option value="ytd">Year to Date</option>
                    <option value="custom">Custom Range</option>
                </select>

                {reportWindow === 'custom' && (
                    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                        <Input
                            type="date"
                            value={customFrom || ''}
                            onChange={(e) => setCustomFrom(e.target.value)}
                            className="h-10 w-[9.5rem] rounded-xl border-2 text-xs"
                        />
                        <span className="text-xs text-gray-400 font-semibold">to</span>
                        <Input
                            type="date"
                            value={customTo || ''}
                            onChange={(e) => setCustomTo(e.target.value)}
                            className="h-10 w-[9.5rem] rounded-xl border-2 text-xs"
                        />
                    </div>
                )}

                <div className="flex flex-wrap gap-2 lg:ml-auto">
                    <Button variant="outline" className="h-10 flex-1 rounded-xl border-2 text-xs font-bold sm:flex-none" onClick={() => setShowAddWidget(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Widget
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 flex-1 rounded-xl border-2 text-xs font-bold sm:flex-none"
                        type="button"
                        disabled={!liveSnapshot?.kpi || pdfBusy}
                        onClick={handleExportPdf}
                    >
                        <Download className="w-4 h-4 mr-2" /> {pdfBusy ? 'Preparing...' : 'Export PDF'}
                    </Button>
                    <Button className="h-10 flex-1 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 sm:flex-none" type="button" onClick={handleSaveLayout}>
                        <Save className="w-4 h-4 mr-2" /> Save report
                    </Button>
                </div>
            </div>

            {(selectedSource === 'sales' || widgets.some((w) => w.source === 'sales')) && (
                <SalesInsightsFilterBar
                    channel={salesChannel}
                    category={salesCategory}
                    categories={liveSnapshot?.productCategories || []}
                    from={
                        toAnalyticsIsoDate(liveSnapshot?.appliedRange?.from)
                        || toAnalyticsIsoDate(liveSnapshot?.filter?.from)
                        || customFrom
                    }
                    to={
                        toAnalyticsIsoDate(liveSnapshot?.appliedRange?.to)
                        || toAnalyticsIsoDate(liveSnapshot?.filter?.to)
                        || customTo
                    }
                    periodHint={reportWindow === 'header' ? 'report window matches hub header' : 'report window'}
                    onChannelChange={(next) => setSalesChannel(normalizeSalesChannel(next))}
                    onCategoryChange={(next) => setSalesCategory(normalizeSalesCategory(next))}
                />
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {PRESET_TEMPLATES.map((tpl) => (
                    <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleLoadTemplate(tpl)}
                        className={cn(
                            'flex items-start gap-2 rounded-xl border bg-white px-3 py-2.5 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/50',
                            reportName === tpl.name && widgets.length > 0
                                ? 'border-indigo-300 ring-1 ring-indigo-100'
                                : 'border-gray-200'
                        )}
                    >
                        <Database className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800">{tpl.name}</p>
                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-400">{tpl.description}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid min-h-[280px] grid-cols-12 gap-3">
                <AnimatePresence>
                    {widgets.map((widget) => (
                        <WidgetPreview
                            key={widget.id}
                            widget={widget}
                            onRemove={handleRemoveWidget}
                            liveSnapshot={liveSnapshot}
                            currency={currency}
                        />
                    ))}
                </AnimatePresence>

                {widgets.length === 0 && (
                    <div className="col-span-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-14 text-center">
                        <BarChart3 className="mb-3 h-10 w-10 text-gray-200" />
                        <h3 className="text-sm font-semibold text-gray-500">Choose a template to start</h3>
                        <p className="mt-1 max-w-sm text-xs text-gray-400">
                            Templates fill a full 12-column layout with live KPIs, charts, and summaries.
                        </p>
                    </div>
                )}
            </div>

            <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Add Widget</DialogTitle>
                        <DialogDescription>Choose a data focus and widget type. Charts use your live analytics bundle.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div>
                            <Label className="text-xs font-bold text-gray-600 mb-2 block">Data Source</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {DATA_SOURCES.map((src) => (
                                    <button
                                        key={src.id}
                                        type="button"
                                        onClick={() => setSelectedSource(src.id)}
                                        className={cn(
                                            'flex items-center gap-2 p-2.5 rounded-xl text-left transition-all border-2',
                                            selectedSource === src.id
                                                ? 'border-indigo-300 bg-indigo-50'
                                                : 'border-gray-100 hover:border-gray-200'
                                        )}
                                    >
                                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white', src.color)}>
                                            <src.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">{src.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-gray-600 mb-2 block">Widget Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {WIDGET_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => handleAddWidget(type)}
                                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left"
                                    >
                                        <type.icon className="w-5 h-5 text-indigo-500" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{type.label}</p>
                                            <p className="text-[10px] text-gray-400">{type.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
