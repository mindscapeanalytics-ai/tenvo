'use client';

import React, { useMemo } from 'react';
import {
    TrendingUp, Users, ShoppingCart,
    UtensilsCrossed, Package, CreditCard, Clock,
    Zap, Target, ArrowUpRight, ArrowDownRight,
    RefreshCcw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    invoices: any[];
    products: any[];
    customers: any[];
    dateRange: { from: Date; to: Date };
    currency?: string;
    onQuickAction?: (actionId: string) => void;
    dashboardMetrics?: any;
    expenseBreakdown?: any[];
    expenses?: any[];
    domainKnowledge?: any;
    isLoading?: boolean;
}

interface MetricCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: number;
    icon: React.ElementType;
    colorClass: string;
}

// ═══════════════════════════════════════════════════════════════
// SPECIALIZED KPI CARDS
// ═══════════════════════════════════════════════════════════════

function DomainMetricCard({ label, value, subValue, trend, icon: Icon, colorClass }: MetricCardProps) {
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                        <h3 className="text-xl font-black text-gray-900">{value}</h3>
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
    dashboardMetrics,
    expenseBreakdown = [],
    expenses = [],
    domainKnowledge,
    isLoading = false
}: DomainDashboardProps) {
    const { business } = useBusiness() as any;
    const activeBusinessId = businessId || business?.id;
    const colors = getDomainColors(category);
    const campaignEnabled = isCampaignRelevant(category, domainKnowledge);
    const multiLocationEnabled = Boolean(domainKnowledge?.multiLocationEnabled);

    const formatCurrencyCompact = (amount: number) => `${currency} ${Math.round(amount || 0).toLocaleString()}`;

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

        const inRange = (rawDate: any, from: Date, to: Date) => {
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

        const getExpenseDate = (exp: any) => exp?.date || exp?.expense_date || exp?.created_at;
        const getExpenseAmount = (exp: any) => Number(exp?.amount) || Number(exp?.total) || Number(exp?.grand_total) || 0;

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

        return {
            currentOrders,
            previousOrders,
            currentRevenue,
            previousRevenue,
            currentExpenses,
            previousExpenses,
            currentCustomers,
            previousCustomers
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
    }, [dashboardMetrics, periodMetrics, totalExpenses, revenueTrendSigned, ordersTrend, expenseTrend, customerTrend]);

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
            {/* Sidebar Column (3/12) */}
            <div className="space-y-6 lg:col-span-3">
                <RemindersPortlet data={remindersData} onItemClick={onQuickAction} />

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <h3 className="text-sm font-black text-gray-900">Intelligent Insights</h3>
                    </div>
                    <div className="space-y-4">
                        {intelligentInsights.map((insight, idx) => (
                            <button
                                key={`${insight.title}-${idx}`}
                                onClick={() => onQuickAction?.(insight.actionTab)}
                                className={cn(
                                    'w-full text-left p-3 rounded-xl border transition-all hover:shadow-sm',
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

            {/* Main Area (9/12) */}
            <div className="space-y-6 lg:col-span-9">
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
                        />
                    ))}
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
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
                    <div className="lg:col-span-4 space-y-6">
                        <KPIMeter
                            title="Domain Efficiency"
                            value={domainEfficiency}
                            target={95}
                            suffix="%"
                            trendValue={Number(revenueTrendSigned.toFixed(1))}
                            trendLabel="vs previous period"
                        />
                        <PredictivePlanningPortlet businessId={activeBusinessId} domainKnowledge={domainKnowledge} />
                    </div>
                </div>
            </div>
        </NetsuiteDashboard>
    );
}
