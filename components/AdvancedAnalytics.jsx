'use client';

import { useState, useEffect } from 'react';
import { SalesChart, RevenueBarChart, CategoryPieChart, TopProductsChart, RevenueAreaChart } from './AdvancedCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Package, Users, BarChart3, RefreshCcw } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  getSalesTrendAction,
  getTopProductsAction,
  getCategoryDistributionAction,
  getKPIMetricsAction
} from '@/lib/actions/premium/ai/analytics';

/**
 * Advanced Analytics Component
 * Powered by Server-Side SQL Aggregation
 * 
 * @param {Object} props
 * @param {string} [props.businessId]
 * @param {string} [props.category]
 */
export function AdvancedAnalytics({ businessId, category = 'retail-shop' }) {
  const colors = getDomainColors(category);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [kpi, setKpi] = useState({
    inventoryAsset: 0,
    growth: { value: '0%', trend: 'neutral' },
    retention: '0%'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Parallel Fetching for Performance
      const [salesRes, productsRes, catRes, kpiRes] = await Promise.all([
        getSalesTrendAction(businessId),
        getTopProductsAction(businessId),
        getCategoryDistributionAction(businessId),
        getKPIMetricsAction(businessId)
      ]);

      if (salesRes.success) setSalesData(salesRes.data);
      if (productsRes.success) setTopProducts(productsRes.data);
      if (catRes.success) setCategoryData(catRes.data);
      if (kpiRes.success) setKpi(kpiRes.data);

    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) loadData();
  }, [businessId]);

  const metrics = [
    {
      label: 'Performance',
      value: kpi.growth.value,
      icon: TrendingUp,
      color: kpi.growth.trend === 'up' ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Inventory Asset',
      value: formatCurrency(kpi.inventoryAsset || 0, 'PKR'), // Default currency
      icon: Package,
      style: { color: colors.primary }
    },
    {
      label: 'Active Retention',
      value: kpi.retention,
      icon: Users,
      color: 'text-blue-600'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="w-8 h-8 text-wine animate-spin" />
      </div>
    );
  }

  const hasData = salesData.some(d => d.revenue > 0) || kpi.inventoryAsset > 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Intelligence Analytics</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Real-time performance metrics derived from cloud data</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <Button variant="ghost" size="sm" onClick={loadData} className="h-7 text-xs">
            <RefreshCcw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
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

      {/* Charts */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  Sales Trend (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] sm:h-[300px]">
                <SalesChart data={salesData} />
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
                <RevenueBarChart data={salesData} />
              </CardContent>
            </Card>
          </div>

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
                    No category data
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
                    No top products yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="border-border shadow-sm bg-card">
          <CardContent className="py-12 sm:py-16 text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No analytics data available. Start recording transactions to see insights.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
