'use client';

import React, { useMemo, useCallback } from 'react';
import {
    TrendingUp, Users, ShoppingCart,
    CreditCard, Clock,
    Zap, ArrowUpRight, ArrowDownRight,
    Boxes, Warehouse, RotateCcw, BadgeDollarSign
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { getDomainColors } from '@/lib/domainColors';
import { isCampaignRelevant } from '@/lib/config/domains';
import { KPIMeter } from '../islands/portlets/KPIMeter.client';
import { QuickActionTiles } from '../islands/portlets/QuickActionTiles.client';
import { RemindersPortlet } from '../islands/portlets/RemindersPortlet.client';
import { RecentActivityFeed } from '../islands/portlets/RecentActivityFeed.client';
import { AnalyticsDashboard } from '../islands/AnalyticsDashboard.client';
import { PredictivePlanningPortlet } from '../islands/portlets/PredictivePlanningPortlet.client';
import NetsuiteDashboard from '../islands/NetsuiteDashboard.client';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

interface DomainDashboardProps {
    businessId?: string;
    category: string;
    invoices: InvoiceLike[];
    products: ProductLike[];
    customers: CustomerLike[];
    dateRange: { from: Date; to: Date };
    currency?: string;
    onQuickAction?: (actionId: string) => void;
    onDateRangePresetChange?: (preset: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd') => void;
    dashboardMetrics?: DashboardMetrics | null;
    accountingSummary?: AccountingSummaryLike | null;
    expenseBreakdown?: ExpenseBreakdownItem[];
    expenses?: ExpenseLike[];
    domainKnowledge?: DomainKnowledgeLike;
    isLoading?: boolean;
}

interface InvoiceItemLike {
    quantity?: number | string;
}

interface InvoiceLike {
    status?: string;
    date?: string | Date;
    customer_id?: string | number | null;
    customer_name?: string;
    grand_total?: number | string;
    amount?: number | string;
    items?: InvoiceItemLike[];
}

interface ProductLike {
    id?: string | number;
    stock?: number | string;
    cost_price?: number | string;
    purchase_price?: number | string;
    price?: number | string;
    max_stock?: number | string;
    max_stock_level?: number | string;
    stock_checked_at?: string | Date;
    updated_at?: string | Date;
    created_at?: string | Date;
}

interface CustomerLike {
    id?: string | number;
}

interface ExpenseLike {
    date?: string | Date;
    expense_date?: string | Date;
    created_at?: string | Date;
    amount?: number | string;
    total?: number | string;
    grand_total?: number | string;
}

interface ExpenseBreakdownItem {
    value?: number;
}

interface DashboardMetrics {
    revenue?: number;
    orders?: { total?: number; pending?: number; paid?: number };
    products?: number;
    customers?: { active?: number; growth?: number };
    cashFlow?: { current?: number; growth?: number };
    growth?: { trend?: 'up' | 'down'; percentage?: number; value?: string };
    alerts?: { lowStock?: number; overdueInvoices?: number };
    timeline?: Array<Record<string, unknown>>;
}

interface AccountingSummaryLike {
    inventoryValue?: number;
}

interface DomainKnowledgeLike {
    multiLocationEnabled?: boolean;
}

interface MetricCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: number;
    icon: React.ElementType;
    colorClass: string;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════
// SPECIALIZED KPI CARDS
// ═══════════════════════════════════════════════════════════════

function DomainMetricCard({ label, value, subValue, trend, icon: Icon, colorClass, className }: MetricCardProps) {
    return (
        <Card className={cn("border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white h-full", className)}>
            <CardContent className="p-3.5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                        <h3 className="text-lg xl:text-xl font-black text-gray-900 leading-tight">{value}</h3>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">{subValue}</p>
                    </div>
                    <div className={cn("p-2 rounded-xl shadow-sm", colorClass)}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                </div>
                {trend !== undefined && trend !== 0 && (
                    <div className="mt-3 flex items-center gap-1">
                        {trend > 0 ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        ) : (
                            <ArrowDownRight className="w-3 h-3 text-rose-500" />
                        )}
                        <span className={cn("text-[10px] font-bold", trend > 0 ? "text-emerald-600" : "text-rose-600")}>
                            {Math.abs(trend)}% from last period
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DomainDashboard({
    businessId,
    category,
    invoices,
    products,
    customers,
    dateRange,
    currency = 'PKR',
    onQuickAction,
    onDateRangePresetChange,
    dashboardMetrics,
    accountingSummary,
    expenseBreakdown = [],
    expenses = [],
    domainKnowledge,
    isLoading = false
}: DomainDashboardProps) {
    const { business } = useBusiness() as { business?: { id?: string } | null };
    const activeBusinessId = businessId || business?.id;
    const colors = getDomainColors(category);
    const campaignEnabled = isCampaignRelevant(category, (domainKnowledge ?? null) as any);
    const multiLocationEnabled = Boolean(domainKnowledge?.multiLocationEnabled);

    const formatCurrencyCompact = useCallback(
        (amount: number) => `${currency} ${Math.round(amount || 0).toLocaleString()}`,
        [currency]
    );
    const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

    const calcGrowth = (current: number, previous: number) => {
        if (previous > 0) return ((current - previous) / previous) * 100;
        if (current > 0) return 100;
        return 0;
    };

    const periodMetrics = useMemo(() => {
        const currentFrom = new Date(dateRange.from);
        const currentTo = new Date(dateRange.to);
        const duration = Math.max(1, currentTo.getTime() - currentFrom.getTime());
        const prevFrom = new Date(currentFrom.getTime() - duration);
        const prevTo = new Date(currentTo.getTime() - duration);

        const inRange = (rawDate: string | Date | undefined, from: Date, to: Date) => {
            const parsed = rawDate ? new Date(rawDate) : null;
            if (!parsed || Number.isNaN(parsed.getTime())) return false;
            return parsed >= from && parsed <= to;
        };

        const validInvoices = invoices.filter(inv => !['cancelled', 'draft'].includes(String(inv?.status || '').toLowerCase()));
        const paidInvoices = validInvoices.filter(inv => String(inv?.status || '').toLowerCase() === 'paid');

        const currentOrders = validInvoices.filter(inv => inRange(inv?.date, currentFrom, currentTo)).length;
        const previousOrders = validInvoices.filter(inv => inRange(inv?.date, prevFrom, prevTo)).length;

        const currentRevenue = paidInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .reduce((sum, inv) => sum + (Number(inv?.grand_total) || Number(inv?.amount) || 0), 0);
        const previousRevenue = paidInvoices
            .filter(inv => inRange(inv?.date, prevFrom, prevTo))
            .reduce((sum, inv) => sum + (Number(inv?.grand_total) || Number(inv?.amount) || 0), 0);

        const getExpenseDate = (exp: ExpenseLike) => exp?.date || exp?.expense_date || exp?.created_at;
        const getExpenseAmount = (exp: ExpenseLike) => Number(exp?.amount) || Number(exp?.total) || Number(exp?.grand_total) || 0;

        const currentExpenses = expenses
            .filter(exp => inRange(getExpenseDate(exp), currentFrom, currentTo))
            .reduce((sum, exp) => sum + getExpenseAmount(exp), 0);
        const previousExpenses = expenses
            .filter(exp => inRange(getExpenseDate(exp), prevFrom, prevTo))
            .reduce((sum, exp) => sum + getExpenseAmount(exp), 0);

        const currentCustomers = new Set(
            validInvoices
                .filter(inv => inRange(inv?.date, currentFrom, currentTo))
                .map(inv => inv?.customer_id || inv?.customer_name)
                .filter(Boolean)
        ).size;
        const previousCustomers = new Set(
            validInvoices
                .filter(inv => inRange(inv?.date, prevFrom, prevTo))
                .map(inv => inv?.customer_id || inv?.customer_name)
                .filter(Boolean)
        ).size;

        const soldUnits = validInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .reduce((sum, inv) => sum + (inv?.items || []).reduce((itemSum: number, item: InvoiceItemLike) => itemSum + (Number(item?.quantity) || 0), 0), 0);

        const returnInvoices = validInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .filter(inv => {
                const status = String(inv?.status || '').toLowerCase();
                return status.includes('return') || status.includes('refund') || status.includes('credit');
            }).length;

        const pendingReturns = validInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .filter(inv => String(inv?.status || '').toLowerCase().includes('return-pending')).length;

        return {
            currentOrders,
            previousOrders,
            currentRevenue,
            previousRevenue,
            currentExpenses,
            previousExpenses,
            currentCustomers,
            previousCustomers,
            soldUnits,
            returnInvoices,
            pendingReturns
        };
    }, [dateRange, invoices, expenses]);

    // Track expense context
    const totalExpenses = useMemo(() =>
        expenseBreakdown.reduce((sum, exp) => sum + (exp.value || 0), 0)
        , [expenseBreakdown]);

    const revenueTrendSigned = dashboardMetrics?.growth?.trend === 'down'
        ? -(dashboardMetrics?.growth?.percentage || 0)
        : (dashboardMetrics?.growth?.percentage ?? calcGrowth(periodMetrics.currentRevenue, periodMetrics.previousRevenue));

    const ordersTrend = calcGrowth(periodMetrics.currentOrders, periodMetrics.previousOrders);
    const expenseTrend = calcGrowth(periodMetrics.currentExpenses, periodMetrics.previousExpenses);
    const customerTrend = dashboardMetrics?.customers?.growth ?? calcGrowth(periodMetrics.currentCustomers, periodMetrics.previousCustomers);

    // ─── Robust KPI Logic ─────────────────────────────────────────
    const domainKpis = useMemo(() => {
        const revenueValue = dashboardMetrics?.revenue ?? periodMetrics.currentRevenue;
        const ordersValue = dashboardMetrics?.orders?.total ?? periodMetrics.currentOrders;
        const expenseValue = periodMetrics.currentExpenses > 0 ? periodMetrics.currentExpenses : totalExpenses;
        const activeCustomers = dashboardMetrics?.customers?.active ?? periodMetrics.currentCustomers;

        return [
            {
                id: 'rev',
                label: 'Revenue',
                value: formatCurrencyCompact(revenueValue),
                subValue: 'Gross income',
                trend: Number(revenueTrendSigned.toFixed(1)),
                icon: TrendingUp,
                color: 'bg-indigo-500'
            },
            {
                id: 'orders',
                label: 'Orders',
                value: ordersValue || 0,
                subValue: 'Total transactions',
                trend: Number(ordersTrend.toFixed(1)),
                icon: ShoppingCart,
                color: 'bg-emerald-500'
            },
            {
                id: 'expenses',
                label: 'Period Expenses',
                value: formatCurrencyCompact(expenseValue),
                subValue: 'Operating costs',
                trend: Number((-expenseTrend).toFixed(1)),
                icon: CreditCard,
                color: 'bg-rose-600'
            },
            {
                id: 'customers',
                label: 'Active Customers',
                value: activeCustomers || 0,
                subValue: 'Retention focus',
                trend: Number(customerTrend.toFixed(1)),
                icon: Users,
                color: 'bg-blue-500'
            }
        ];
    }, [dashboardMetrics, periodMetrics, totalExpenses, revenueTrendSigned, ordersTrend, expenseTrend, customerTrend, formatCurrencyCompact]);

    const remindersData = useMemo(() => ({
        lowStock: dashboardMetrics?.alerts?.lowStock || 0,
        overdueInvoices: dashboardMetrics?.alerts?.overdueInvoices || 0,
        pendingOrders: dashboardMetrics?.orders?.pending || 0
    }), [dashboardMetrics]);

    const domainEfficiency = useMemo(() => {
        const productBase = Math.max(products.length, 1);
        const orderBase = Math.max(dashboardMetrics?.orders?.total || periodMetrics.currentOrders || 1, 1);

        const inventoryScore = Math.max(0, 100 - ((remindersData.lowStock || 0) / productBase) * 100);
        const pendingScore = Math.max(0, 100 - ((remindersData.pendingOrders || 0) / orderBase) * 100);
        const overdueScore = Math.max(0, 100 - ((remindersData.overdueInvoices || 0) / orderBase) * 120);
        const growthBoost = Math.max(-10, Math.min(10, revenueTrendSigned / 2));

        const score = Math.round((inventoryScore * 0.45) + (pendingScore * 0.3) + (overdueScore * 0.25) + growthBoost);
        return Math.max(0, Math.min(100, score));
    }, [products.length, dashboardMetrics, periodMetrics.currentOrders, remindersData, revenueTrendSigned]);

    const inventoryValue = useMemo(() => {
        const summaryInventory = Number(accountingSummary?.inventoryValue);
        if (Number.isFinite(summaryInventory) && summaryInventory !== 0) {
            return summaryInventory;
        }

        return products.reduce((sum: number, product: ProductLike) => {
            const stock = Number(product?.stock) || 0;
            const unitCost = Number(product?.cost_price) || Number(product?.purchase_price) || Number(product?.price) || 0;
            return sum + (Math.max(stock, 0) * unitCost);
        }, 0);
    }, [products, accountingSummary?.inventoryValue]);

    const inStockUnits = useMemo(() => {
        return products.reduce((sum: number, product: ProductLike) => sum + Math.max(0, Number(product?.stock) || 0), 0);
    }, [products]);

    const avgOrderValue = useMemo(() => {
        const orders = Math.max(periodMetrics.currentOrders, 1);
        return periodMetrics.currentRevenue / orders;
    }, [periodMetrics.currentOrders, periodMetrics.currentRevenue]);

    const returnRate = useMemo(() => {
        const orders = Math.max(periodMetrics.currentOrders, 1);
        return (periodMetrics.returnInvoices / orders) * 100;
    }, [periodMetrics.currentOrders, periodMetrics.returnInvoices]);

    const coverageDays = useMemo(() => {
        const msInDay = 1000 * 60 * 60 * 24;
        const daysInRange = Math.max(1, Math.round((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / msInDay));
        const dailyVelocity = periodMetrics.soldUnits / daysInRange;
        if (dailyVelocity <= 0) return 365;
        return Math.round(inStockUnits / dailyVelocity);
    }, [dateRange.from, dateRange.to, periodMetrics.soldUnits, inStockUnits]);

    const stockCheckRecency = useMemo(() => {
        const referenceTime = new Date(dateRange.to).getTime();
        const latestStockTouch = products.reduce((latest: number, product: ProductLike) => {
            const stockDate = product?.stock_checked_at || product?.updated_at || product?.created_at;
            if (!stockDate) return latest;
            const parsed = new Date(stockDate).getTime();
            if (Number.isNaN(parsed)) return latest;
            return Math.max(latest, parsed);
        }, 0);

        if (!latestStockTouch) return null;
        const validReference = Number.isNaN(referenceTime) ? latestStockTouch : referenceTime;
        const days = Math.floor((validReference - latestStockTouch) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    }, [products, dateRange.to]);

    const paidOrderRate = useMemo(() => {
        const total = Number(dashboardMetrics?.orders?.total) || 0;
        const paid = Number(dashboardMetrics?.orders?.paid) || 0;
        if (total <= 0) return null;
        return clamp((paid / total) * 100, 0, 100);
    }, [dashboardMetrics?.orders?.total, dashboardMetrics?.orders?.paid]);

    const warehouseUtilization = useMemo(() => {
        const capacityFromConfiguredProducts = products.reduce((sum: number, product: ProductLike) => {
            const maxStock = Number(product?.max_stock) || Number(product?.max_stock_level) || 0;
            return sum + Math.max(maxStock, 10);
        }, 0);

        if (capacityFromConfiguredProducts <= 0) return null;
        return clamp((inStockUnits / capacityFromConfiguredProducts) * 100, 0, 100);
    }, [products, inStockUnits]);

    const dashboardHeaderHighlights = useMemo(() => ([
        {
            label: 'At-Risk SKUs',
            value: remindersData.lowStock || 0,
            tone: remindersData.lowStock > 0 ? 'text-rose-600' : 'text-emerald-600'
        },
        {
            label: 'Pending Orders',
            value: remindersData.pendingOrders || 0,
            tone: remindersData.pendingOrders > 0 ? 'text-amber-600' : 'text-emerald-600'
        },
        {
            label: 'Overdue Invoices',
            value: remindersData.overdueInvoices || 0,
            tone: remindersData.overdueInvoices > 0 ? 'text-rose-600' : 'text-emerald-600'
        },
        {
            label: 'Return Rate',
            value: `${returnRate.toFixed(1)}%`,
            tone: returnRate > 5 ? 'text-rose-600' : 'text-emerald-600'
        }
    ]), [remindersData, returnRate]);

    const hasCoreData = (products.length + invoices.length + customers.length) > 0;

    const periodLabel = useMemo(() => {
        const msInDay = 1000 * 60 * 60 * 24;
        const days = Math.max(1, Math.round((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / msInDay));
        if (days <= 7) return 'Last 7 Days';
        if (days <= 31) return 'This Month';
        if (days <= 92) return 'Last Quarter';
        return 'Custom Period';
    }, [dateRange.from, dateRange.to]);

    const activePreset = useMemo<'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd' | 'custom'>(() => {
        const from = new Date(dateRange.from);
        const to = new Date(dateRange.to);
        const diffMs = Math.max(1, to.getTime() - from.getTime());
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

        const sameDay =
            from.getFullYear() === to.getFullYear() &&
            from.getMonth() === to.getMonth() &&
            from.getDate() === to.getDate();
        if (sameDay) return 'today';

        const isMtd =
            from.getFullYear() === to.getFullYear() &&
            from.getMonth() === to.getMonth() &&
            from.getDate() === 1;
        if (isMtd) return 'mtd';

        const prevMonthDate = new Date(to);
        prevMonthDate.setMonth(to.getMonth() - 1, 1);
        const prevMonthEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0);
        const isLastMonth =
            from.getFullYear() === prevMonthDate.getFullYear() &&
            from.getMonth() === prevMonthDate.getMonth() &&
            from.getDate() === 1 &&
            to.getFullYear() === prevMonthEnd.getFullYear() &&
            to.getMonth() === prevMonthEnd.getMonth() &&
            to.getDate() === prevMonthEnd.getDate();
        if (isLastMonth) return 'last_month';

        const isYtd = from.getFullYear() === to.getFullYear()
            && from.getMonth() === 0
            && from.getDate() === 1;
        if (isYtd) return 'ytd';
        if (days >= 6 && days <= 8) return '7d';
        if (days >= 29 && days <= 31) return '30d';
        if (days >= 89 && days <= 92) return '90d';
        return 'custom';
    }, [dateRange.from, dateRange.to]);

    const topStripKpis = useMemo(() => ([
        {
            label: 'Orders In Period',
            value: periodMetrics.currentOrders,
            trend: Number(ordersTrend.toFixed(1)),
            icon: ShoppingCart,
            colorClass: 'bg-cyan-500'
        },
        {
            label: 'Revenue In Period',
            value: formatCurrencyCompact(periodMetrics.currentRevenue),
            trend: Number(revenueTrendSigned.toFixed(1)),
            icon: BadgeDollarSign,
            colorClass: 'bg-emerald-500'
        },
        {
            label: 'Inventory Value',
            value: formatCurrencyCompact(inventoryValue),
            trend: undefined,
            icon: Boxes,
            colorClass: 'bg-indigo-600'
        },
        {
            label: 'Overdue',
            value: remindersData.overdueInvoices,
            trend: remindersData.overdueInvoices > 0 ? -Math.min(remindersData.overdueInvoices * 3, 25) : 0,
            icon: Clock,
            colorClass: 'bg-rose-500'
        }
    ]), [periodMetrics.currentOrders, periodMetrics.currentRevenue, ordersTrend, revenueTrendSigned, inventoryValue, remindersData.overdueInvoices, formatCurrencyCompact]);

    const intelligentInsights = useMemo(() => {
        const insights = [] as Array<{ title: string; text: string; tone: string; actionTab: string }>;

        if (remindersData.lowStock > 0) {
            insights.push({
                title: 'Predictive Restock',
                text: `${remindersData.lowStock} item${remindersData.lowStock > 1 ? 's are' : ' is'} below safety stock. Generate replenishment early to avoid stock-outs.`,
                tone: 'indigo',
                actionTab: 'inventory'
            });
        }

        if (remindersData.overdueInvoices > 0) {
            insights.push({
                title: 'Collections Alert',
                text: `${remindersData.overdueInvoices} overdue invoice${remindersData.overdueInvoices > 1 ? 's' : ''} need follow-up to protect cash flow health.`,
                tone: 'amber',
                actionTab: 'invoices'
            });
        }

        if (campaignEnabled && revenueTrendSigned <= 0) {
            insights.push({
                title: 'Campaign Opportunity',
                text: 'Revenue momentum softened. Launch a targeted win-back or bundle campaign to recover demand quickly.',
                tone: 'emerald',
                actionTab: 'campaigns'
            });
        }

        if (periodMetrics.currentExpenses > 0 && expenseTrend > 10) {
            insights.push({
                title: 'Expense Pressure',
                text: `Period expenses rose ${expenseTrend.toFixed(1)}%. Review high-cost categories and tighten discretionary spend.`,
                tone: 'rose',
                actionTab: 'expenses'
            });
        }

        if (insights.length === 0) {
            insights.push({
                title: 'Operational Stability',
                text: 'Core KPIs are stable. Use analytics projections to identify the next growth lever.',
                tone: 'slate',
                actionTab: 'reports'
            });
        }

        if (insights.length < 2) {
            insights.push({
                title: 'Tracking Coverage',
                text: 'Open analytics and verify trends by segment, product, and period to improve decision confidence.',
                tone: 'slate',
                actionTab: 'reports'
            });
        }

        return insights.slice(0, 2);
    }, [remindersData, campaignEnabled, revenueTrendSigned, periodMetrics.currentExpenses, expenseTrend]);

    if (isLoading) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-gray-100 rounded-2xl" />
                    <div className="h-96 bg-gray-100 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <NetsuiteDashboard>
            {/* Main Area (9/12) */}
            <div className="space-y-4 order-1 lg:order-1 lg:col-span-9">
                {!hasCoreData && (
                    <Card className="border border-indigo-100 bg-indigo-50/40 shadow-sm">
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Quick Setup</p>
                                <p className="text-sm font-bold text-slate-800 mt-1">Start by adding products, customers, or your first invoice to unlock richer KPI insights.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" className="h-8 text-[11px] font-bold" onClick={() => onQuickAction?.('add-product')}>Add Product</Button>
                                <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold" onClick={() => onQuickAction?.('add-customer')}>Add Customer</Button>
                                <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold" onClick={() => onQuickAction?.('new-invoice')}>New Invoice</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 xl:auto-rows-fr">
                    {topStripKpis.map((item) => (
                        <DomainMetricCard
                            key={item.label}
                            label={item.label}
                            value={item.value}
                            subValue={periodLabel}
                            trend={item.trend}
                            icon={item.icon}
                            colorClass={item.colorClass}
                            className="h-full"
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 xl:items-stretch">
                    <Card className="xl:col-span-8 border border-slate-200 shadow-sm bg-white">
                        <CardContent className="p-3.5 md:p-4.5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard Overview</p>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">Operations Intelligence Hub</h2>
                                    <p className="text-[11px] text-slate-500 font-semibold mt-1">
                                        {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Realtime KPI Sync</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white">
                                        <label htmlFor="domain-date-filter" className="text-[10px] font-black uppercase tracking-wider text-slate-500">Date</label>
                                        <select
                                            id="domain-date-filter"
                                            value={activePreset}
                                            onChange={(e) => {
                                                const preset = e.target.value as 'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd' | 'custom';
                                                if (preset !== 'custom') onDateRangePresetChange?.(preset);
                                            }}
                                            className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-wine/20"
                                        >
                                            <option value="today">Today</option>
                                            <option value="7d">Last 7 Days</option>
                                            <option value="30d">Last 30 Days</option>
                                            <option value="90d">Last 90 Days</option>
                                            <option value="mtd">This Month</option>
                                            <option value="last_month">Last Month</option>
                                            <option value="ytd">Year to Date</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                                {dashboardHeaderHighlights.map((item) => (
                                    <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                                        <p className={cn('text-base font-black mt-1', item.tone)}>{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="xl:col-span-4 grid grid-cols-2 gap-3 auto-rows-fr">
                        <Card className="border border-slate-200 shadow-sm bg-white">
                            <CardContent className="p-3.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Inventory Value</p>
                                <p className="text-lg font-black text-slate-900 mt-1">{formatCurrencyCompact(inventoryValue)}</p>
                                <p className="text-[10px] text-slate-500 mt-1">GL-backed when available</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-sm bg-white">
                            <CardContent className="p-3.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">In-Stock Units</p>
                                <p className="text-lg font-black text-slate-900 mt-1">{inStockUnits.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Total available quantity</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-sm bg-white">
                            <CardContent className="p-3.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Warehouse Utilization</p>
                                <p className="text-lg font-black text-slate-900 mt-1">{warehouseUtilization === null ? 'N/A' : `${warehouseUtilization.toFixed(1)}%`}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Requires configured max stock</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-sm bg-white">
                            <CardContent className="p-3.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Paid Order Ratio</p>
                                <p className="text-lg font-black text-slate-900 mt-1">{paidOrderRate === null ? 'N/A' : `${paidOrderRate.toFixed(1)}%`}</p>
                                <p className="text-[10px] text-slate-500 mt-1">From paid vs total orders</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <QuickActionTiles
                    onAction={onQuickAction}
                    campaignEnabled={campaignEnabled}
                    multiLocationEnabled={multiLocationEnabled}
                />

                {/* Domain Specialized KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {domainKpis.map(kpi => (
                        <DomainMetricCard
                            key={kpi.id}
                            label={kpi.label}
                            value={kpi.value}
                            subValue={kpi.subValue}
                            trend={kpi.trend}
                            icon={kpi.icon}
                            colorClass={kpi.color}
                            className="h-full"
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:auto-rows-fr">
                    <DomainMetricCard
                        label="Avg Order Value"
                        value={formatCurrencyCompact(avgOrderValue)}
                        subValue="Revenue per order"
                        trend={Number(revenueTrendSigned.toFixed(1))}
                        icon={TrendingUp}
                        colorClass="bg-indigo-600"
                        className="h-full"
                    />
                    <DomainMetricCard
                        label="Return Rate"
                        value={`${returnRate.toFixed(1)}%`}
                        subValue={`${periodMetrics.returnInvoices} return docs`}
                        trend={Number((-returnRate).toFixed(1))}
                        icon={RotateCcw}
                        colorClass="bg-rose-600"
                        className="h-full"
                    />
                    <DomainMetricCard
                        label="Pending Returns"
                        value={periodMetrics.pendingReturns}
                        subValue="Awaiting processing"
                        trend={periodMetrics.pendingReturns > 0 ? -Math.min(periodMetrics.pendingReturns * 2, 20) : 0}
                        icon={Clock}
                        colorClass="bg-amber-500"
                        className="h-full"
                    />
                    <DomainMetricCard
                        label="Coverage Days"
                        value={coverageDays > 365 ? '365+' : coverageDays}
                        subValue="Estimated stock coverage"
                        trend={Number((coverageDays / 10).toFixed(1))}
                        icon={Boxes}
                        colorClass="bg-blue-600"
                        className="h-full"
                    />
                    <DomainMetricCard
                        label="Stock Check Recency"
                        value={stockCheckRecency === null ? 'N/A' : `${stockCheckRecency}d`}
                        subValue="Since last stock touch"
                        trend={stockCheckRecency === null ? undefined : (stockCheckRecency > 30 ? -Math.min(stockCheckRecency / 2, 25) : 4)}
                        icon={Warehouse}
                        colorClass="bg-slate-600"
                        className="h-full"
                    />
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-stretch">
                    <div className="lg:col-span-7">
                        <AnalyticsDashboard
                            businessId={activeBusinessId}
                            category={category}
                            chartData={dashboardMetrics?.timeline || []}
                            invoices={invoices}
                            products={products}
                            colors={colors}
                            onQuickAction={onQuickAction}
                        />
                    </div>
                    <div className="lg:col-span-5 space-y-3">
                        <KPIMeter
                            title="Domain Efficiency"
                            value={domainEfficiency}
                            target={95}
                            suffix="%"
                            trendValue={Number(revenueTrendSigned.toFixed(1))}
                            trendLabel="vs previous period"
                        />

                        <Card className="border border-slate-200 shadow-sm bg-white">
                            <CardContent className="p-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Customers</p>
                                        <p className="text-base font-black text-slate-900 mt-1">{dashboardMetrics?.customers?.active ?? 0}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cash Flow</p>
                                        <p className="text-base font-black text-slate-900 mt-1">{formatCurrencyCompact(dashboardMetrics?.cashFlow?.current || 0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-stretch">
                    <div className="lg:col-span-8">
                        <PredictivePlanningPortlet businessId={activeBusinessId} domainKnowledge={domainKnowledge} />
                    </div>
                    <div className="lg:col-span-4">
                        <Card className="border border-slate-200 shadow-sm bg-white h-full">
                            <CardContent className="p-3.5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">KPI Insight Summary</p>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                        <p className="text-[10px] font-black text-slate-600">Coverage vs Velocity</p>
                                        <p className="text-sm font-extrabold text-slate-900 mt-1">{coverageDays > 365 ? '365+' : coverageDays} days projected</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                        <p className="text-[10px] font-black text-slate-600">Average Order Value</p>
                                        <p className="text-sm font-extrabold text-slate-900 mt-1">{formatCurrencyCompact(avgOrderValue)}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                        <p className="text-[10px] font-black text-slate-600">Stock Check Recency</p>
                                        <p className="text-sm font-extrabold text-slate-900 mt-1">{stockCheckRecency === null ? 'N/A' : `${stockCheckRecency} days ago`}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Sidebar Column (3/12) */}
            <div className="space-y-4 order-2 lg:order-2 lg:col-span-3">
                <RemindersPortlet data={remindersData} onItemClick={onQuickAction} />

                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <h3 className="text-sm font-black text-gray-900">Intelligent Insights</h3>
                    </div>
                    <div className="space-y-3">
                        {intelligentInsights.map((insight, idx) => (
                            <button
                                key={`${insight.title}-${idx}`}
                                onClick={() => onQuickAction?.(insight.actionTab)}
                                aria-label={`${insight.title}. ${insight.text}`}
                                className={cn(
                                    'w-full text-left p-2.5 rounded-xl border transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/30',
                                    insight.tone === 'indigo' && 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100/50',
                                    insight.tone === 'emerald' && 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50',
                                    insight.tone === 'amber' && 'bg-amber-50 border-amber-100 hover:bg-amber-100/50',
                                    insight.tone === 'rose' && 'bg-rose-50 border-rose-100 hover:bg-rose-100/50',
                                    insight.tone === 'slate' && 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
                                )}
                            >
                                <p className="text-[11px] font-bold text-slate-700">{insight.title}</p>
                                <p className="text-[10px] text-slate-600 mt-1">{insight.text}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <RecentActivityFeed businessId={activeBusinessId} onViewAll={() => onQuickAction?.('reports')} />
            </div>
        </NetsuiteDashboard>
    );
}
