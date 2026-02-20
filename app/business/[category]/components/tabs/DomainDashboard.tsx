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
    domainKnowledge,
    isLoading = false
}: DomainDashboardProps) {
    const { business } = useBusiness() as any;
    const activeBusinessId = businessId || business?.id;
    const colors = getDomainColors(category);

    // Track expense context
    const totalExpenses = useMemo(() =>
        expenseBreakdown.reduce((sum, exp) => sum + (exp.value || 0), 0)
        , [expenseBreakdown]);

    // ─── Domain-Aware KPI Logic ──────────────────────────────────
    const domainKpis = useMemo(() => {
        if (!dashboardMetrics) return [];

        const defaultKpis = [
            { id: 'rev', label: 'Revenue', value: `${currency} ${dashboardMetrics.revenue?.toLocaleString()}`, subValue: 'Gross Income', trend: 12, icon: TrendingUp, color: 'bg-indigo-500' },
            { id: 'orders', label: 'Orders', value: dashboardMetrics.orders?.total || 0, subValue: 'Total Transactions', trend: 5, icon: ShoppingCart, color: 'bg-emerald-500' },
        ];

        switch (category) {
            case 'restaurant-cafe':
                return [
                    ...defaultKpis,
                    { id: 'occupancy', label: 'Table Occupancy', value: '78%', subValue: 'High Demand', trend: 8, icon: UtensilsCrossed, color: 'bg-rose-500' },
                    { id: 'prep_time', label: 'Avg Prep Time', value: '14 min', subValue: 'Target: 12 min', trend: -10, icon: Clock, color: 'bg-amber-500' },
                ];
            case 'retail-shop':
            case 'pharmacy':
                return [
                    ...defaultKpis,
                    { id: 'turnover', label: 'Stock Turnover', value: '4.2x', subValue: 'Monthly average', trend: 15, icon: RefreshCcw, color: 'bg-blue-500' },
                    { id: 'basket', label: 'Avg Basket Size', value: `${currency} 1,240`, subValue: 'Healthy growth', trend: 3, icon: Package, color: 'bg-purple-500' },
                ];
            case 'wholesale-distribution':
                return [
                    ...defaultKpis,
                    { id: 'receivables', label: 'Avg AR Days', value: '18 Days', subValue: 'Net 30 terms', trend: -2, icon: CreditCard, color: 'bg-orange-500' },
                    { id: 'fulfillment', label: 'Fulfillment Rate', value: '96%', subValue: 'Target: 98%', trend: 1, icon: Target, color: 'bg-teal-500' },
                ];
            default:
                return [
                    ...defaultKpis,
                    { id: 'expenses', label: 'Period Expenses', value: `${currency} ${totalExpenses.toLocaleString()}`, subValue: 'Operating costs', trend: -5, icon: CreditCard, color: 'bg-rose-600' },
                    { id: 'customers', label: 'Active Customers', value: customers.length, subValue: 'Retention focus', trend: 4, icon: Users, color: 'bg-blue-500' },
                ];
        }
    }, [category, dashboardMetrics, customers, products, currency, dateRange, totalExpenses]);

    const remindersData = useMemo(() => ({
        lowStock: dashboardMetrics?.alerts?.lowStock || 0,
        overdueInvoices: dashboardMetrics?.alerts?.overdueInvoices || 0,
        pendingOrders: dashboardMetrics?.orders?.pending || 0
    }), [dashboardMetrics]);

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
                <RemindersPortlet data={remindersData} />

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <h3 className="text-sm font-black text-gray-900">Intelligent Insights</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <p className="text-[11px] font-bold text-indigo-700">Predictive Restock</p>
                            <p className="text-[10px] text-indigo-600/80 mt-1">3 items likely to stock out in 48h based on velocity.</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-[11px] font-bold text-emerald-700">Optimal Promotion</p>
                            <p className="text-[10px] text-emerald-600/80 mt-1">Bundle "Product A" with "Product B" for 22% lift.</p>
                        </div>
                    </div>
                </div>

                <RecentActivityFeed businessId={activeBusinessId} />
            </div>

            {/* Main Area (9/12) */}
            <div className="space-y-6 lg:col-span-9">
                <QuickActionTiles onAction={onQuickAction} />

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
                        />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <KPIMeter
                            title="Domain Efficiency"
                            value={category === 'restaurant-cafe' ? 82 : 91}
                            target={95}
                            suffix="%"
                        />
                        <PredictivePlanningPortlet businessId={activeBusinessId} domainKnowledge={domainKnowledge} />
                    </div>
                </div>
            </div>
        </NetsuiteDashboard>
    );
}
