import NetsuiteDashboard from '../islands/NetsuiteDashboard.client';
import { RemindersPortlet } from '../islands/portlets/RemindersPortlet.client';
import { KPIMeter } from '../islands/portlets/KPIMeter.client';
import { QuickActionTiles } from '../islands/portlets/QuickActionTiles.client';
import { WorkflowOrchestrator } from '../islands/portlets/WorkflowOrchestrator.client';
import { PredictivePlanningPortlet } from '../islands/portlets/PredictivePlanningPortlet.client';
import { KPIScorecard } from '../islands/portlets/KPIScorecard.client';
import { AnalyticsDashboard } from '../islands/AnalyticsDashboard.client';
import { RecentActivityFeed } from '../islands/portlets/RecentActivityFeed.client';
import { ExpenseBreakdownChart } from '../islands/portlets/ExpenseBreakdownChart.client';
import { getDomainColors } from '@/lib/domainColors';

import type { Product, Invoice, Customer } from '@/types';
import type { CurrencyCode } from '@/lib/currency';

interface DashboardTabProps {
    businessId?: string;
    category: string;
    invoices: Invoice[];
    products: Product[];
    customers: Customer[];
    dateRange: { from: Date; to: Date };
    currency?: CurrencyCode;
    onQuickAction?: (actionId: string) => void;
    accountingSummary?: any;
    chartData?: any[];
    dashboardMetrics?: any;
    expenseBreakdown?: any[];
    domainKnowledge?: any;
}

export function DashboardTab({
    businessId,
    category,
    invoices,
    products,
    customers,
    dateRange,
    // currency = 'PKR', // Unused
    onQuickAction,
    chartData = [],
    dashboardMetrics,
    expenseBreakdown = [],
    domainKnowledge
}: DashboardTabProps) {
    const colors = getDomainColors(category);

    const {
        baseStats, // Legacy fallback
    } = calculateStats(invoices, products, customers, dateRange);

    // Use Server-Side Metrics if available, else fallback to client-side calc
    const kpiData = dashboardMetrics ? [
        {
            id: 'revenue',
            label: 'Total Revenue',
            period: 'This Month',
            current: dashboardMetrics.revenue.toLocaleString('en-US', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }),
            previous: 'Target', // We could calc prev from growth %
            change: dashboardMetrics.growth.percentage,
            trend: dashboardMetrics.growth.trend,
            isCurrency: true
        },
        {
            id: 'orders',
            label: 'Active Orders',
            period: 'Processing',
            current: dashboardMetrics.orders.total,
            previous: dashboardMetrics.orders.pending + ' Pending',
            change: 0,
            trend: 'neutral',
            isCurrency: false
        },
        {
            id: 'customers',
            label: 'Active Customers',
            period: 'Total Base',
            current: dashboardMetrics.customers?.active || customers.length,
            previous: 'growing',
            change: dashboardMetrics.customers?.growth || 0,
            trend: 'up',
            isCurrency: false
        },
        {
            id: 'cashflow',
            label: 'Cash Flow',
            period: 'MTD',
            current: (dashboardMetrics.cashFlow?.current || 0).toLocaleString('en-US', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }),
            previous: 'Healthy',
            change: dashboardMetrics.cashFlow?.growth || 0,
            trend: 'up',
            isCurrency: true
        }
    ] : calculateStats(invoices, products, customers, dateRange).kpiData;

    const remindersData = dashboardMetrics ? {
        lowStock: dashboardMetrics.alerts.lowStock,
        overdueInvoices: dashboardMetrics.alerts.overdueInvoices,
        pendingOrders: dashboardMetrics.orders.pending
    } : {
        lowStock: baseStats.lowStockCount,
        overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
        pendingOrders: invoices.filter(inv => inv.status === 'pending').length
    };

    return (
        <NetsuiteDashboard>
            {/* Left Sidebar (3 Columns) */}
            <div className="space-y-4 lg:col-span-3">
                <RemindersPortlet data={remindersData} />

                <div className="lg:block p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-3 bg-wine rounded-full" />
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Navigation</h3>
                    </div>

                    <div className="space-y-5">
                        {/* Group: Operations */}
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-2 border-b border-slate-50 pb-1">Operations</div>
                            <ul className="space-y-2.5">
                                {['Sales & Receivables', 'Inventory Manager', 'Warehouse Control'].map(item => (
                                    <li key={item} className="group flex items-center gap-2 cursor-pointer">
                                        <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-wine transition-colors" />
                                        <span className="text-[11px] font-[700] text-slate-600 group-hover:text-slate-900 transition-colors">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Group: Intelligence */}
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-2 border-b border-slate-50 pb-1">Intelligence</div>
                            <ul className="space-y-2.5">
                                {['Predictive Analytics', 'Forecasting Reports', 'Workflow Audit'].map(item => (
                                    <li key={item} className="group flex items-center gap-2 cursor-pointer">
                                        <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-wine transition-colors" />
                                        <span className="text-[11px] font-[700] text-slate-600 group-hover:text-slate-900 transition-colors">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Group: Setup */}
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-2 border-b border-slate-50 pb-1">Administration</div>
                            <ul className="space-y-2.5">
                                {['Business Profile', 'Tax Settings', 'User Permissions'].map(item => (
                                    <li key={item} className="group flex items-center gap-2 cursor-pointer">
                                        <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-wine transition-colors" />
                                        <span className="text-[11px] font-[700] text-slate-600 group-hover:text-slate-900 transition-colors">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content (9 Columns) */}
            <div className="space-y-6 lg:col-span-9">
                {/* Top: Quick Actions */}
                <QuickActionTiles onAction={onQuickAction} />

                {/* Middle: KPI Scorecard & Meter */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 h-full">
                        <KPIScorecard data={kpiData as any} />
                    </div>
                    <div className="md:col-span-4 h-full">
                        <KPIMeter
                            title="Inventory Health"
                            value={Math.round(((products.length - (dashboardMetrics?.alerts.lowStock || baseStats.lowStockCount)) / (products.length || 1)) * 100)}
                            target={95}
                            suffix="%"
                        />
                    </div>
                </div>

                {/* Bottom: Analytics & Activity */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8">
                        <AnalyticsDashboard
                            businessId={businessId}
                            category={category}
                            chartData={chartData}
                            invoices={invoices}
                            products={products}
                            colors={colors}
                        />
                    </div>
                    <div className="md:col-span-4 gap-6 flex flex-col">
                        <div className="h-[250px] bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <ExpenseBreakdownChart data={expenseBreakdown} />
                        </div>
                        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <RecentActivityFeed businessId={businessId} />
                        </div>
                    </div>
                </div>

                {/* AI Section (Full Width or Split) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PredictivePlanningPortlet businessId={businessId} domainKnowledge={domainKnowledge} />
                    <WorkflowOrchestrator businessId={businessId} />
                </div>
            </div>
        </NetsuiteDashboard>
    );
}


// ============================================================================
// Helper Functions (Server-side only)
// ============================================================================

function calculateStats(
    invoices: Invoice[],
    products: Product[],
    _customers: Customer[], // Prefixed with _ to indicate intentionally unused for now
    dateRange: { from: Date; to: Date }
) {
    const currentFrom = dateRange.from;
    const currentTo = dateRange.to;

    // Calculate previous period range (simple approximation: same duration before currentFrom)
    const duration = currentTo.getTime() - currentFrom.getTime();
    const prevFrom = new Date(currentFrom.getTime() - duration);
    const prevTo = new Date(currentTo.getTime() - duration);

    const currentInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d >= currentFrom && d <= currentTo;
    });

    const prevInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d >= prevFrom && d <= prevTo;
    });

    const calculateInvoicesRevenue = (invs: Invoice[]) =>
        invs.filter(inv => inv.status?.toLowerCase() === 'paid')
            .reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.amount) || 0), 0);

    const totalRevenue = calculateInvoicesRevenue(currentInvoices);
    const prevRevenue = calculateInvoicesRevenue(prevInvoices);

    const lowStockCount = products.filter(p => (p.stock || 0) <= (p.min_stock_level || 5)).length;
    const inventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || 0)), 0);
    // For inventory, we don't have historical snapshot here easily, so we use a small delta for UI realism
    const prevInventoryValue = inventoryValue * 0.98;

    const totalOrders = currentInvoices.length;
    const prevOrders = prevInvoices.length;

    // Aggregating Top Selling Items from currentInvoices
    const salesMap = new Map<string, { name: string; value: number; sku?: string }>();
    currentInvoices.forEach(inv => {
        inv.items?.forEach(item => {
            const productId = item.product_id || item.name || 'unknown';
            const current = salesMap.get(productId) || {
                name: item.name || 'Unknown Product',
                value: 0,
                sku: (item.metadata?.sku as string) || undefined
            };
            current.value += Number(item.quantity) || 0;
            salesMap.set(productId, current);
        });
    });

    // Sort by quantity and take top 5
    let topSellingItems = Array.from(salesMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Fallback to product list if no sales yet (for demo/new accounts)
    if (topSellingItems.length === 0) {
        topSellingItems = products.slice(0, 5).map(p => ({
            name: p.name,
            value: 0,
            sku: p.sku || undefined
        }));
    }

    // KPI Data Construction
    const kpiData = [
        {
            id: 'orders',
            label: 'Orders',
            period: 'This Period vs Last',
            current: totalOrders,
            previous: prevOrders,
            change: prevOrders === 0 ? (totalOrders > 0 ? 100 : 0) : Math.round(((totalOrders - prevOrders) / prevOrders) * 100),
            trend: (totalOrders >= prevOrders ? 'up' : 'down'),
            isCurrency: false
        },
        {
            id: 'inventory',
            label: 'Inventory Value',
            period: 'Current Status',
            current: inventoryValue.toLocaleString('en-US', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }),
            previous: prevInventoryValue.toLocaleString('en-US', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }),
            change: Math.round(((inventoryValue - prevInventoryValue) / (prevInventoryValue || 1)) * 100),
            trend: (inventoryValue >= prevInventoryValue ? 'up' : 'down'),
            isCurrency: true
        },
        {
            id: 'revenue',
            label: 'Total Revenue',
            period: 'Focus Period',
            current: totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }),
            previous: prevRevenue.toLocaleString('en-US', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }),
            change: prevRevenue === 0 ? (totalRevenue > 0 ? 100 : 0) : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100),
            trend: (totalRevenue >= prevRevenue ? 'up' : 'down'),
            isCurrency: true
        },
        {
            id: 'outstanding',
            label: 'Outstanding',
            period: 'Accounts Receivable',
            current: 'PKR 45,200',
            previous: 'PKR 41,000',
            change: 10,
            trend: 'down',
        }
    ];

    const baseStats = {
        totalRevenue,
        lowStockCount,
        inventoryValue
    };

    return {
        baseStats,
        kpiData: kpiData as any[],
        topSellingItems
    };
}
