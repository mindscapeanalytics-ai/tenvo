'use client';

import { useMemo } from 'react';
import { SalesChart, RevenueBarChart, CategoryPieChart, RevenueAreaChart, TopProductsChart } from './AdvancedCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Package, Users, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import { cn } from '@/lib/utils';
import { aggregateMonthlyData, getTopCatalysts, calculateGrowth } from '@/lib/utils/analytics';

/**
 * Advanced Analytics Component
 * Dynamically aggregates Supabase data for 41 business domains
 */
export function AdvancedAnalytics({ invoices = [], products = [], customers = [], category = 'retail-shop' }) {
  const colors = getDomainColors(category);

  // Aggregate sales trend from real invoices
  const salesHistory = useMemo(() => {
    return aggregateMonthlyData(invoices, 6);
  }, [invoices]);

  // Aggregate category distribution from live inventory
  const categoryData = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  // Calculate real performance metrics
  const totalInvoicedRevenue = useMemo(() =>
    invoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0)
    , [invoices]);

  const totalInventoryValue = useMemo(() =>
    products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || p.price || 0)), 0)
    , [products]);

  // Analyze top products using real invoice items
  const topProducts = useMemo(() => {
    return getTopCatalysts(invoices, products, 5);
  }, [invoices, products]);

  // Calculate real growth metrics
  const performanceGrowth = useMemo(() => {
    return calculateGrowth(invoices);
  }, [invoices]);

  // Calculate customer retention (customers with multiple invoices)
  const customerRetention = useMemo(() => {
    if (customers.length === 0) return '0%';

    const customerInvoiceCounts = {};
    invoices.forEach(inv => {
      const custId = inv.customer_id;
      if (custId) {
        customerInvoiceCounts[custId] = (customerInvoiceCounts[custId] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerInvoiceCounts).filter(count => count > 1).length;
    const totalCustomersWithInvoices = Object.keys(customerInvoiceCounts).length;

    if (totalCustomersWithInvoices === 0) return '0%';

    const retentionRate = (repeatCustomers / totalCustomersWithInvoices) * 100;
    return `${retentionRate.toFixed(0)}%`;
  }, [customers, invoices]);

  const metrics = [
    {
      label: 'Performance',
      value: performanceGrowth.value,
      icon: TrendingUp,
      color: performanceGrowth.trend === 'up' ? 'text-green-600' : performanceGrowth.trend === 'down' ? 'text-red-600' : 'text-gray-600'
    },
    {
      label: 'Inventory Asset',
      value: formatCurrency(totalInventoryValue, 'PKR'),
      icon: Package,
      style: { color: colors.primary }
    },
    {
      label: 'Active Retention',
      value: customerRetention,
      icon: Users,
      color: 'text-blue-600'
    },
  ];

  // Check if we have meaningful data to display
  const hasInvoices = invoices.length > 0;
  const hasProducts = products.length > 0;
  const hasCustomers = customers.length > 0;
  const hasData = hasInvoices || hasProducts || hasCustomers;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Intelligence Analytics</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Real-time performance metrics derived from cloud data</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button className="px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase text-gray-900 bg-white rounded-lg shadow-sm">Monthly View</button>
          <button className="px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">Quarterly</button>
        </div>
      </div>

      {/* KPI Metrics - Always show */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="border-border shadow-sm bg-card transition-shadow hover:shadow-md">
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{m.label}</span>
                <m.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", m.color)} style={m.style || {}} />
              </div>
              <div className="text-lg sm:text-xl font-bold text-foreground">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts - Only show if we have data */}
      {hasData ? (
        <>
          {/* Sales & Revenue Charts */}
          {hasInvoices && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                    Sales Trend (6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] sm:h-[300px]">
                  <SalesChart data={salesHistory} />
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    Revenue & Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] sm:h-[300px]">
                  <RevenueBarChart data={salesHistory.map(d => ({ ...d, name: d.date, profit: d.revenue * 0.2 }))} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stock & Products Charts */}
          {hasProducts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    Stock Composition
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] sm:h-[300px]">
                  {categoryData.length > 0 ? (
                    <CategoryPieChart data={categoryData} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      Add product categories to see distribution
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                    Top Moving Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] sm:h-[300px]">
                  {topProducts.length > 0 ? (
                    <TopProductsChart data={topProducts} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      Add products to track top movers
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cumulative Growth - Only if we have invoices */}
          {hasInvoices && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="border-b border-border pb-3" style={{ backgroundColor: `${colors.primary}05` }}>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base" style={{ color: colors.primary }}>
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Cumulative Growth
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">Correlation between sales volume and gross revenue</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] sm:h-[350px] pt-4 sm:pt-6">
                <RevenueAreaChart data={salesHistory} />
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Empty State */
        <Card className="border-border shadow-sm bg-card">
          <CardContent className="py-12 sm:py-16">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">No Data Available Yet</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
                Start adding products, customers, and creating invoices to see powerful analytics and insights here.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity">
                  Add First Product
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Create Invoice
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
