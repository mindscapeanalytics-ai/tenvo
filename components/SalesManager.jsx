'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp, DollarSign, ShoppingCart, Users,
    Target, Receipt, ChevronUp, ChevronDown, BarChart2,
    Award, Clock, Package, CreditCard, Activity, RefreshCcw
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import { SalesChart, RevenueBarChart } from './AdvancedCharts';
import { MobileTabHeader, MobileStatStrip } from '@/components/mobile/MobileTabHeader';
import { useStorefrontEmbedded } from '@/lib/context/StorefrontMobileContext';
import { useFilters } from '@/lib/context/FilterContext';
import { getSalesPerformanceAction } from '@/lib/actions/basic/dashboard';
import { SalesInsightsFilterBar } from '@/components/sales/SalesInsightsFilterBar';
import {
    formatSalesPeriodLabel,
    normalizeSalesChannel,
    normalizeSalesCategory,
} from '@/lib/analytics/salesPerformanceFilter';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import {
    hubSalesPerformanceQueryKey,
    sameTenantPlaceholderData,
} from '@/lib/dashboard/hubQueryKeys';

// ── Trend Badge ──────────────────────────────────────────────────────────────
function TrendBadge({ value }) {
    if (value == null || Number.isNaN(Number(value))) return null;
    const up = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(value).toFixed(1)}%
        </span>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, growth, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                </div>
                <TrendBadge value={growth} />
            </div>
            <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

function KpiSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
            <div className="mb-3 h-9 w-9 rounded-lg bg-gray-100" />
            <div className="mb-2 h-3 w-20 rounded bg-gray-100" />
            <div className="h-7 w-28 rounded bg-gray-100" />
        </div>
    );
}

export function SalesManager({
    category = 'retail-shop',
    businessId = null,
    currency,
}) {
    const colors = getDomainColors(category);
    const { dateRange } = useFilters();
    const [channel, setChannel] = useState('all');
    const [productCategory, setProductCategory] = useState(null);
    const primaryColor = colors.primary || '#6366f1';

    const fromISO = toAnalyticsIsoDate(dateRange?.from);
    const toISO = toAnalyticsIsoDate(dateRange?.to);
    const periodLabel = formatSalesPeriodLabel(fromISO, toISO);
    const channelKey = normalizeSalesChannel(channel);
    const categoryKey = normalizeSalesCategory(productCategory);

    const {
        data: serverInsights,
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useQuery({
        queryKey: hubSalesPerformanceQueryKey(businessId, fromISO, toISO, channelKey, categoryKey),
        enabled: Boolean(businessId && fromISO && toISO),
        staleTime: 60_000,
        placeholderData: (previousData, previousQuery) =>
            sameTenantPlaceholderData(previousData, previousQuery, businessId),
        queryFn: async () => {
            const res = await getSalesPerformanceAction(businessId, {
                from: fromISO,
                to: toISO,
                channel: channelKey,
                category: categoryKey,
                topLimit: 8,
            });
            if (!res?.success) {
                throw new Error(res?.error || res?.message || 'Could not load sales performance');
            }
            return {
                meta: res.meta,
                categories: res.categories || [],
                salesTrend: res.salesTrend,
                topProducts: res.topProducts,
                topCustomers: res.topCustomers || [],
                recentActivity: res.recentActivity,
                kpi: res.kpi,
            };
        },
    });

    const loadInsights = useCallback(() => {
        void refetch();
    }, [refetch]);

    const loading = Boolean(businessId) && isLoading && !serverInsights;
    const loadError = queryError?.message || null;
    const serverKpi = serverInsights?.kpi;
    const categoryScoped = Boolean(serverKpi?.categoryScoped || productCategory);
    // Never skeleton when we have previous/cached insights (same-tenant keep-previous).
    const showSkeleton = Boolean(businessId) && isLoading && !serverInsights;

    const metrics = useMemo(() => {
        if (!serverKpi) return null;
        const g = serverKpi.growth || {};
        const profitEst = serverKpi.profitEst;
        const collected = serverKpi.collected;
        const outstanding = serverKpi.outstanding;
        const retentionRate = serverKpi.retentionRate;
        return {
            total: serverKpi.grossTotal,
            count: serverKpi.orderCount,
            avg: serverKpi.avgOrder,
            paid: collected,
            outstanding,
            activeCustomers: serverKpi.activeCustomers,
            profitEst,
            retentionRate,
            profitBasis: serverKpi.profitBasis || 'cost',
            marginPct: serverKpi.marginPct,
            categoryScoped: serverKpi.categoryScoped,
            totalFmt: formatCurrency(serverKpi.grossTotal, currency),
            countFmt: String(serverKpi.orderCount),
            avgFmt: formatCurrency(serverKpi.avgOrder, currency),
            paidFmt: collected == null ? '—' : formatCurrency(collected, currency),
            outstandingFmt: outstanding == null ? '—' : formatCurrency(outstanding, currency),
            profitFmt: formatCurrency(profitEst, currency),
            retentionFmt: retentionRate == null ? '—' : `${retentionRate}%`,
            growth: {
                revenue: g.revenue ?? 0,
                count: g.count ?? 0,
                avg: g.avg ?? 0,
                customers: g.customers ?? 0,
                profit: g.profit ?? 0,
                retention: g.retention ?? 0,
            },
        };
    }, [serverKpi, currency]);

    const chartData = useMemo(() => {
        if (serverInsights?.salesTrend?.length) return serverInsights.salesTrend;
        return [];
    }, [serverInsights]);

    const topCatalysts = useMemo(() => {
        if (serverInsights?.topProducts?.length) return serverInsights.topProducts;
        return [];
    }, [serverInsights]);

    const recentInvoices = useMemo(() => {
        if (serverInsights?.recentActivity?.length) {
            return serverInsights.recentActivity.map((row) => ({
                source: row.source,
                customer_name: row.party,
                invoice_number: row.ref,
                date: row.date,
                grand_total: row.amount,
                payment_status: row.paymentStatus,
                status: row.status,
            }));
        }
        return [];
    }, [serverInsights]);

    const topCustomers = useMemo(() => {
        if (serverInsights?.topCustomers?.length) return serverInsights.topCustomers;
        return [];
    }, [serverInsights]);

    const filterCategories = serverInsights?.categories || [];

    const statusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-500';
        const s = status.toLowerCase();
        if (s === 'paid' || s === 'completed') return 'bg-emerald-50 text-emerald-600';
        if (s === 'partial') return 'bg-amber-50 text-amber-600';
        if (s === 'unpaid' || s === 'overdue') return 'bg-red-50 text-red-500';
        return 'bg-gray-100 text-gray-500';
    };

    const embeddedInStorefront = useStorefrontEmbedded();
    const unavailableSub = 'Not available with category filter';

    return (
        <div className="min-w-0 space-y-2 overflow-x-hidden touch-manipulation lg:space-y-5">
            {!embeddedInStorefront && (
                <MobileTabHeader
                    icon={BarChart2}
                    iconClassName="bg-indigo-100 text-indigo-600"
                    title="Sales Performance"
                    subtitle={metrics ? `${metrics.countFmt} orders · ${periodLabel}` : periodLabel}
                    actions={[
                        {
                            id: 'refresh',
                            label: 'Refresh',
                            onClick: () => void loadInsights(),
                        },
                    ]}
                />
            )}

            <SalesInsightsFilterBar
                channel={channel}
                category={productCategory}
                categories={filterCategories}
                from={fromISO}
                to={toISO}
                periodHint="change dates in the header"
                disabled={loading || !businessId}
                onChannelChange={(next) => setChannel(normalizeSalesChannel(next))}
                onCategoryChange={(next) => setProductCategory(normalizeSalesCategory(next))}
            />

            {loadError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {loadError}
                    <button
                        type="button"
                        onClick={() => void loadInsights()}
                        className="ml-2 font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="lg:hidden">
                {showSkeleton ? (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
                        <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
                    </div>
                ) : metrics ? (
                    <MobileStatStrip
                        items={[
                            { label: 'Revenue', value: metrics.totalFmt, valueTone: 'text-emerald-600' },
                            { label: 'Orders', value: metrics.countFmt },
                            { label: 'AOV', value: metrics.avgFmt },
                            {
                                label: 'Outstanding',
                                value: metrics.outstandingFmt,
                                valueTone: metrics.outstanding == null ? 'text-gray-400' : 'text-red-600',
                            },
                        ]}
                    />
                ) : null}
            </div>

            {/* Desktop header */}
            <div className="hidden items-center justify-between lg:flex">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" style={{ color: primaryColor }} />
                        Sales Performance
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Revenue analytics across invoices, POS, and online · {periodLabel}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadInsights()}
                    disabled={loading || !businessId}
                    className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    title="Refresh sales data"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading || isFetching ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ── KPI Row 1 ───────────────────────────────────────────────── */}
            <div className="hidden grid-cols-2 gap-4 lg:grid lg:grid-cols-4">
                {showSkeleton ? (
                    <>
                        <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
                    </>
                ) : metrics ? (
                    <>
                        <KpiCard label="Gross Revenue" value={metrics.totalFmt} sub={periodLabel} icon={DollarSign} growth={metrics.growth.revenue} color={primaryColor} />
                        <KpiCard label="Orders" value={metrics.countFmt} sub="Completed deals" icon={ShoppingCart} growth={metrics.growth.count} color="#8b5cf6" />
                        <KpiCard label="Avg Order Value" value={metrics.avgFmt} sub="Basket size" icon={Target} growth={metrics.growth.avg} color="#f59e0b" />
                        <KpiCard label="Active Customers" value={metrics.activeCustomers.toLocaleString()} sub={periodLabel} icon={Users} growth={metrics.growth.customers} color="#10b981" />
                    </>
                ) : (
                    <p className="col-span-4 text-sm text-gray-400 py-6 text-center">No sales data for this filter</p>
                )}
            </div>

            {/* ── KPI Row 2 ───────────────────────────────────────────────── */}
            <div className="hidden grid-cols-2 gap-4 lg:grid lg:grid-cols-4">
                {showSkeleton ? (
                    <>
                        <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
                    </>
                ) : metrics ? (
                    <>
                        <KpiCard
                            label="Gross Profit"
                            value={metrics.profitFmt}
                            sub={
                                metrics.marginPct != null
                                    ? `${Number(metrics.marginPct).toFixed(1)}% margin (at cost)`
                                    : 'Revenue minus cost'
                            }
                            icon={TrendingUp}
                            growth={metrics.growth.profit}
                            color="#6366f1"
                        />
                        <KpiCard
                            label="Amount Collected"
                            value={metrics.paidFmt}
                            sub={categoryScoped ? unavailableSub : 'Paid / completed'}
                            icon={CreditCard}
                            growth={categoryScoped ? null : 0}
                            color="#0ea5e9"
                        />
                        <KpiCard
                            label="Outstanding"
                            value={metrics.outstandingFmt}
                            sub={categoryScoped ? unavailableSub : 'Unpaid balance'}
                            icon={Receipt}
                            growth={categoryScoped ? null : 0}
                            color="#ef4444"
                        />
                        <KpiCard
                            label="Retention Rate"
                            value={metrics.retentionFmt}
                            sub={categoryScoped ? unavailableSub : 'Repeat customers in period'}
                            icon={Award}
                            growth={categoryScoped ? null : metrics.growth.retention}
                            color="#f97316"
                        />
                    </>
                ) : null}
            </div>

            {/* ── Revenue Chart + Top Products ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Revenue Trend</p>
                            <p className="text-xs text-gray-400">{periodLabel} · cost-based profit</p>
                        </div>
                        <Activity className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="p-4 h-[280px]">
                        {showSkeleton ? (
                            <div className="h-full animate-pulse rounded-lg bg-gray-50" />
                        ) : (
                            <SalesChart data={chartData} colors={colors} currency={currency} />
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Top Products</p>
                            <p className="text-xs text-gray-400">By revenue · {periodLabel}</p>
                        </div>
                        <Package className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="divide-y divide-gray-50">
                        {!showSkeleton && topCatalysts.length === 0 && (
                            <p className="text-xs text-gray-400 px-5 py-6 text-center">No sales data yet</p>
                        )}
                        {showSkeleton && (
                            <div className="space-y-3 p-5">
                                <div className="h-8 animate-pulse rounded bg-gray-50" />
                                <div className="h-8 animate-pulse rounded bg-gray-50" />
                                <div className="h-8 animate-pulse rounded bg-gray-50" />
                            </div>
                        )}
                        {topCatalysts.slice(0, 6).map((p, i) => (
                            <div key={p.id || p.name || i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                    <p className="text-[11px] text-gray-400">{(p.sales ?? p.volume ?? 0)} sold</p>
                                </div>
                                <span className="text-sm font-semibold text-gray-800 shrink-0">{formatCurrency(p.revenue ?? p.value ?? 0, currency)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Order Distribution + Recent Transactions ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-800">Revenue Distribution</p>
                        <p className="text-xs text-gray-400">By month · {periodLabel}</p>
                    </div>
                    <div className="p-4 h-[260px]">
                        {showSkeleton ? (
                            <div className="h-full animate-pulse rounded-lg bg-gray-50" />
                        ) : (
                            <RevenueBarChart data={chartData} colors={colors} currency={currency} />
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Recent Transactions</p>
                            <p className="text-xs text-gray-400">In selected period</p>
                        </div>
                        <Clock className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[260px] overflow-y-auto">
                        {!showSkeleton && recentInvoices.length === 0 && (
                            <p className="text-xs text-gray-400 px-5 py-6 text-center">No transactions yet</p>
                        )}
                        {recentInvoices.map((inv, i) => (
                            <div key={inv.id || inv.invoice_number || i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <Receipt className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{inv.customer?.name || inv.customer_name || 'Walk-in'}</p>
                                    <p className="text-[11px] text-gray-400">
                                        {inv.invoice_number}
                                        {inv.source && inv.source !== 'invoice' ? ` · ${inv.source}` : ''}
                                        {' · '}
                                        {inv.date ? new Date(inv.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(inv.grand_total, currency)}</p>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor(inv.payment_status || inv.status)}`}>
                                        {inv.payment_status || inv.status || 'pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Top Customers ────────────────────────────────────────────── */}
            {topCustomers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-800">Top Customers</p>
                        <p className="text-xs text-gray-400">Ranked by total spend · {periodLabel}</p>
                    </div>
                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide px-5 py-3">#</th>
                                    <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Customer</th>
                                    <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Orders</th>
                                    <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Total Spend</th>
                                    <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Avg Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topCustomers.map((c, i) => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3 text-xs font-bold text-gray-300">{i + 1}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {c.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-medium text-gray-800">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right text-gray-600">{c.count}</td>
                                        <td className="px-5 py-3 text-right font-semibold text-gray-800">{formatCurrency(c.total, currency)}</td>
                                        <td className="px-5 py-3 text-right text-gray-500">{formatCurrency(c.count > 0 ? c.total / c.count : 0, currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="divide-y divide-gray-50 lg:hidden">
                        {topCustomers.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                                <span className="w-4 shrink-0 text-xs font-bold text-gray-300">{i + 1}</span>
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                    {c.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-gray-800">{c.name}</p>
                                    <p className="text-[11px] text-gray-400">{c.count} orders · avg {formatCurrency(c.count > 0 ? c.total / c.count : 0, currency)}</p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-800">{formatCurrency(c.total, currency)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
