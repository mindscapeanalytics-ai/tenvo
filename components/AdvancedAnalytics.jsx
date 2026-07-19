'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SalesChart, RevenueBarChart, CategoryPieChart, TopProductsChart } from './AdvancedCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  BarChart3, 
  RefreshCcw, 
  DollarSign, 
  ShoppingCart,
  PieChart,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAnalyticsBundleAction } from '@/lib/actions/premium/ai/analytics';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';

function buildDateFilter(dateRange) {
  if (!dateRange?.from || !dateRange?.to) return {};
  const from = dateRange.from instanceof Date ? dateRange.from.toISOString() : String(dateRange.from);
  const to = dateRange.to instanceof Date ? dateRange.to.toISOString() : String(dateRange.to);
  return { from, to };
}

function formatRangeLabel(dateRange) {
  if (!dateRange?.from || !dateRange?.to) return null;
  try {
    const a = dateRange.from instanceof Date ? dateRange.from : new Date(dateRange.from);
    const b = dateRange.to instanceof Date ? dateRange.to : new Date(dateRange.to);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    return `${a.toLocaleDateString(undefined, { dateStyle: 'medium' })} - ${b.toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
  } catch {
    return null;
  }
}

/**
 * Advanced Analytics Component
 * Powered by Server-Side SQL Aggregation.
 * Shares React Query key `hubAnalytics` with DataContext idle prefetch.
 *
 * @param {Object} props
 * @param {string} [props.businessId]
 * @param {string} [props.category]
 * @param {{ from: Date; to: Date }} [props.dateRange] Dashboard header filter
 */
export function AdvancedAnalytics({ businessId, category = 'retail-shop', currency, dateRange }) {
  const resolvedBusinessId = useResolvedBusinessId(businessId);
  const colors = getDomainColors(category);
  const filter = buildDateFilter(dateRange);
  const fromKey = filter.from || '';
  const toKey = filter.to || '';

  const {
    data: bundleData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['hubAnalytics', resolvedBusinessId, fromKey, toKey],
    enabled: Boolean(resolvedBusinessId),
    staleTime: 60_000,
    // Keep previous only for same tenant (never cross-business paint).
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery?.queryKey) return undefined;
      if (previousQuery.queryKey[1] !== resolvedBusinessId) return undefined;
      return previousData;
    },
    queryFn: async () => {
      const bundle = await getAnalyticsBundleAction(resolvedBusinessId, filter);
      if (!bundle?.success) {
        return { salesTrend: [], topProducts: [], categoryData: [], kpi: null };
      }
      return bundle.data || { salesTrend: [], topProducts: [], categoryData: [], kpi: null };
    },
  });

  const salesData = bundleData?.salesTrend || [];
  const topProducts = bundleData?.topProducts || [];
  const categoryData = bundleData?.categoryData || [];
  const kpi = bundleData?.kpi || {
    inventoryAsset: 0,
    growth: { value: '0%', trend: 'neutral' },
    retention: '0%',
    retentionDetail: null,
    growthDetail: null,
  };

  const loading = isLoading && !bundleData;
  const loadData = useCallback(() => {
    void refetch();
  }, [refetch]);

  const metrics = useMemo(() => [
    {
      label: 'Performance',
      value: kpi.growth?.value ?? '0%',
      subtitle: kpi.growthDetail?.periodRevenue != null 
        ? `${formatCurrency(kpi.growthDetail.periodRevenue, currency)} this period`
        : 'vs previous period',
      icon: kpi.growth?.trend === 'up' ? TrendingUp : TrendingDown,
      iconBg: kpi.growth?.trend === 'up' ? 'bg-emerald-100' : 'bg-red-100',
      iconColor: kpi.growth?.trend === 'up' ? 'text-emerald-600' : 'text-red-600',
      trend: kpi.growth?.trend === 'up' ? 'positive' : kpi.growth?.trend === 'down' ? 'negative' : 'neutral'
    },
    {
      label: 'Inventory Asset',
      value: formatCurrency(kpi.inventoryAsset || 0, currency),
      subtitle: 'Stock value at cost',
      icon: Package,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      trend: 'neutral'
    },
    {
      label: 'Active Retention',
      value: kpi.retention,
      subtitle: kpi.retentionDetail != null 
        ? (kpi.retentionDetail.invoicedCustomers === 0
            ? 'No customer data yet'
            : `${kpi.retentionDetail.repeatCustomers} of ${kpi.retentionDetail.invoicedCustomers} customers`)
        : 'Customer loyalty rate',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trend: 'neutral'
    },
    {
      label: 'Total Orders',
      value: (kpi.growthDetail?.periodOrders ?? salesData.reduce((sum, d) => sum + (d.orderCount || 0), 0)).toLocaleString(),
      subtitle: kpi.growthDetail?.periodOrders != null
        ? 'Invoices + POS + storefront (selected range)'
        : '6-month chart series (set a date range for period orders)',
      icon: ShoppingCart,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trend: 'neutral'
    },
  ], [kpi, currency, salesData]);

  // Wait for tenant hydrate — keep previous paint when revalidating (no blank spinner).
  if (!resolvedBusinessId || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="w-8 h-8 text-wine animate-spin" />
      </div>
    );
  }

  const hasData = salesData.some((d) => (d.revenue > 0) || (d.profit > 0) || (d.orderCount > 0)) || kpi.inventoryAsset > 0;

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden animate-in fade-in duration-500">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isFetching}
          className="h-8 gap-1.5 px-2.5 text-xs shadow-sm"
        >
          <RefreshCcw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Compact KPI Grid - 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card 
            key={i} 
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl shadow-sm",
                  m.iconBg
                )}>
                  <m.icon className={cn("w-6 h-6", m.iconColor)} />
                </div>
                {m.trend !== 'neutral' && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border-0",
                      m.trend === 'positive' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-red-50 text-red-700'
                    )}
                  >
                    {m.trend === 'positive' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {m.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {m.value}
                </p>
                <p className="text-xs text-gray-600 leading-snug">
                  {m.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts - Optimized 2-Column Layout */}
      {hasData ? (
        <div className="space-y-4">
          {/* Top Row - Revenue Trend & Department Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg">
                      <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Revenue Trend</CardTitle>
                      <CardDescription className="text-xs">Monthly revenue vs GL profit</CardDescription>
                    </div>
                  </div>
                  {dateRange && formatRangeLabel(dateRange) && (
                    <Badge variant="secondary" className="text-xs">
                      {formatRangeLabel(dateRange)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px]">
                  <SalesChart data={salesData} colors={colors} currency={currency} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg">
                    <PieChart className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-gray-900">Inventory by Category</CardTitle>
                    <CardDescription className="text-xs">Stock value at cost</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] flex items-center justify-center">
                  {categoryData.length > 0 ? (
                    <CategoryPieChart
                      data={categoryData.map((c) => ({
                        name: c.name,
                        value: Number(c.assetValue) > 0 ? Number(c.assetValue) : Number(c.value) || 0,
                      }))}
                    />
                  ) : (
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No category data available</p>
                      <p className="text-xs text-gray-400 mt-1">Add products with categories to see composition</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Revenue by month & top products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-gray-900">Revenue by Month</CardTitle>
                    <CardDescription className="text-xs">Monthly revenue vs GL profit</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px]">
                  <RevenueBarChart data={salesData} colors={colors} currency={currency} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-gray-900">Top Products</CardTitle>
                    <CardDescription className="text-xs">Highest revenue in selected range</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] flex items-center justify-center">
                  {topProducts.length > 0 ? (
                    <TopProductsChart data={topProducts} colors={colors} currency={currency} />
                  ) : (
                    <div className="text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No top products yet</p>
                      <p className="text-xs text-gray-400 mt-1">Complete sales transactions to see top performers</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info Panel */}
          {(formatRangeLabel(dateRange) || kpi.growthDetail) && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Analytics Period Information</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {formatRangeLabel(dateRange) && (
                        <span className="font-medium">Range: {formatRangeLabel(dateRange)}. </span>
                      )}
                      Performance compares combined revenue (invoices + POS + non-cancelled storefront orders) in this range to the immediately preceding period of the same length.
                      {kpi.growthDetail?.periodRevenue != null && (
                        <span className="block mt-1.5 text-gray-700">
                          <span className="font-semibold">Current: </span>{formatCurrency(kpi.growthDetail.periodRevenue, currency)}
                          <span className="mx-2">·</span>
                          <span className="font-semibold">Previous: </span>{formatCurrency(kpi.growthDetail.priorPeriodRevenue || 0, currency)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="py-20 text-center">
            <div className="max-w-md mx-auto">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Analytics Data Available</h3>
              <p className="text-sm text-gray-600">
                Start recording transactions, invoices, and sales to generate insights and see your business performance metrics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
