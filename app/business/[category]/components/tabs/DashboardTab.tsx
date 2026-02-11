/**
 * Dashboard Tab - Server Component
 * Displays overview statistics, recent invoices, and low stock alerts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '../islands/StatsCards.client';
import { IndustryInsights } from '../islands/IndustryInsights.client';
import { AnalyticsDashboard } from '../islands/AnalyticsDashboard.client';
import { RecentInvoices } from '../islands/RecentInvoices.client';
import { HealthScore } from '../islands/HealthScore.client';
import { QuickReports } from '../islands/QuickReports.client';
import { AlertTriangle } from 'lucide-react';
import { getDomainColors } from '@/lib/domainColors';

import type { Product, Invoice, Customer } from '@/types';
import type { CurrencyCode } from '@/lib/currency';

interface DashboardTabProps {
    category: string;
    invoices: Invoice[];
    products: Product[];
    customers: Customer[];
    dateRange: { from: Date; to: Date };
    currency?: CurrencyCode;
    onQuickAction?: (actionId: string) => void;
    accountingSummary?: any;
    chartData?: any[];
}

export function DashboardTab({
    category,
    invoices,
    products,
    customers,
    dateRange,
    currency = 'PKR',
    onQuickAction,
    accountingSummary,
    chartData = []
}: DashboardTabProps) {
    const colors = getDomainColors(category);

    // Merge server-calculated stats with GL-driven accounting summary if available
    const baseStats = calculateStats(invoices, products, customers, dateRange);
    const stats = {
        ...baseStats,
        // Override with GL-driven data for better accuracy if available
        totalRevenue: accountingSummary?.totalRevenue || baseStats.totalRevenue,
        grossRevenue: accountingSummary?.totalRevenue || baseStats.grossRevenue,
    };

    const recentInvoices = invoices.slice(0, 10);
    const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.min_stock_level || 5));

    return (
        <div className="space-y-6">
            {/* Top Row: Main Stats (Compact) */}
            <StatsCards stats={stats} currency={currency} onQuickAction={onQuickAction} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Analytics & Feed */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Visualizations Island */}
                    <AnalyticsDashboard chartData={chartData} products={products} colors={colors} />

                    {/* Recent Activities Section - Professional Version */}
                    <RecentInvoices
                        invoices={recentInvoices}
                        currency={currency}
                        onViewInvoice={() => onQuickAction?.('view-invoice')}
                    />
                </div>

                {/* Right Column: Intelligence & Alerts */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Business Health Score */}
                    <HealthScore stats={stats} />

                    {/* Quick Reports Section */}
                    <QuickReports onNavigate={(tab) => onQuickAction?.(tab)} />

                    {/* Expert Industry Advice */}
                    <IndustryInsights category={category} />

                    {/* Low Stock Alerts (Condensed) */}
                    {lowStockProducts.length > 0 && (
                        <Card className="border-orange-200 bg-orange-50/30 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-orange-900 text-base">
                                    <AlertTriangle className="w-4 h-4" />
                                    Inventory Alerts
                                </CardTitle>
                                <CardDescription className="text-orange-700 text-xs">
                                    {lowStockProducts.length} items below safety threshold
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {lowStockProducts.slice(0, 3).map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-2.5 bg-white/60 border border-orange-100 rounded-lg shadow-sm"
                                        >
                                            <div className="overflow-hidden mr-2">
                                                <p className="font-medium text-sm truncate">{product.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    SKU: {product.sku || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-orange-600 text-sm">
                                                    {product.stock || 0}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    min {product.min_stock_level || 5}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {lowStockProducts.length > 3 && (
                                        <button
                                            onClick={() => onQuickAction?.('inventory')}
                                            className="w-full text-center text-xs text-orange-700 font-medium hover:underline mt-2"
                                        >
                                            View all {lowStockProducts.length} alerts
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Helper Functions (Server-side only)
// ============================================================================

function calculateStats(
    invoices: Invoice[],
    products: Product[],
    customers: Customer[],
    dateRange: { from: Date; to: Date }
) {
    const filteredInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= dateRange.from && invDate <= dateRange.to;
    });

    const totalRevenue = filteredInvoices
        .filter(inv => inv.status?.toLowerCase() === 'paid')
        .reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.amount) || 0), 0);

    const grossRevenue = filteredInvoices
        .reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.amount) || 0), 0);

    const grossProfit = filteredInvoices
        .filter(inv => inv.status?.toLowerCase() === 'paid')
        .reduce((sum, inv) => {
            const revenue = Number(inv.grand_total) || Number(inv.amount) || 0;
            // Simplified: Assume 30% default margin if cost not tracked per item in invoice
            return sum + (revenue * 0.3);
        }, 0);

    const accountsReceivable = filteredInvoices
        .filter(inv => inv.status?.toLowerCase() === 'pending' || inv.status?.toLowerCase() === 'overdue')
        .reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.amount) || 0), 0);

    const inventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || 0)), 0);

    const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending').length;

    const totalOrders = filteredInvoices.length;
    const totalProducts = products.length;
    const totalCustomers = customers.length;
    const lowStockCount = products.filter(p => (p.stock || 0) <= (p.min_stock_level || 5)).length;

    return {
        totalRevenue,
        grossRevenue,
        grossProfit,
        inventoryValue,
        accountsReceivable,
        pendingInvoices,
        totalOrders,
        totalProducts,
        totalCustomers,
        lowStockCount
    };
}
