/**
 * SimpleDashboardExample Component
 * 
 * Example dashboard demonstrating the use of all shared components.
 * This serves as a reference implementation for building new dashboards.
 * 
 * Features demonstrated:
 * - DashboardStatsGrid for metrics
 * - RevenueChartSection for charts
 * - WidgetContainer for widgets
 * - useDashboardMetrics hook for data fetching
 * - Error and loading states
 * - Empty states
 */

'use client';

import { DashboardStatsGrid } from '@/components/shared/DashboardStatsGrid';
import { RevenueChartSection } from '@/components/shared/RevenueChartSection';
import { WidgetContainer } from '@/components/shared/WidgetContainer';
import { DashboardLoadingSkeleton } from '@/components/shared/DashboardLoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useMemo } from 'react';

export function SimpleDashboardExample({ businessId }) {
  // Fetch dashboard metrics using the shared hook
  const { metrics, loading, error, refetch } = useDashboardMetrics({
    timeRange: '30d',
    includeChartData: false
  });

  // Transform metrics into stats format
  const stats = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        label: 'Total Revenue',
        value: metrics.revenue || '₨0',
        change: metrics.growth?.value || '+0%',
        trend: metrics.growth?.trend || 'up',
        icon: DollarSign,
        colorTheme: 'blue'
      },
      {
        label: 'Total Orders',
        value: metrics.orders?.total?.toString() || '0',
        change: `${metrics.orders?.paid || 0} paid`,
        trend: 'up',
        icon: ShoppingCart,
        colorTheme: 'green'
      },
      {
        label: 'Products',
        value: metrics.products?.count?.toString() || '0',
        change: `${metrics.products?.growth || 0}%`,
        trend: metrics.products?.growth >= 0 ? 'up' : 'down',
        icon: Package,
        colorTheme: 'purple'
      },
      {
        label: 'Active Customers',
        value: metrics.customers?.active?.toString() || '0',
        change: `${metrics.customers?.growth || 0}%`,
        trend: metrics.customers?.growth >= 0 ? 'up' : 'down',
        icon: Users,
        colorTheme: 'orange'
      }
    ];
  }, [metrics]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardLoadingSkeleton variant="card" cardCount={4} />
        <DashboardLoadingSkeleton variant="chart" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardLoadingSkeleton variant="widget" />
          <DashboardLoadingSkeleton variant="widget" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState 
          error={error} 
          onRetry={refetch}
          message="Failed to load dashboard"
          showDetails={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <DashboardStatsGrid 
        stats={stats}
        onStatClick={(stat) => console.log('Stat clicked:', stat)}
      />

      {/* Revenue Chart */}
      <RevenueChartSection
        title="Revenue Performance"
        defaultTimeRange="30d"
        showExport={true}
        chartType="area"
      />

      {/* Example Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Widget with data */}
        <WidgetContainer
          title="Recent Activity"
          icon={TrendingUp}
          onRefresh={() => console.log('Refresh clicked')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">New order received</span>
              <span className="text-xs text-gray-400">2 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Product added</span>
              <span className="text-xs text-gray-400">15 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Payment received</span>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </WidgetContainer>

        {/* Widget with empty state */}
        <WidgetContainer
          title="Alerts"
          icon={AlertCircle}
          empty={true}
          emptyMessage="No alerts at this time"
        >
          {/* This content won't be shown because empty=true */}
        </WidgetContainer>
      </div>

      {/* Standalone Empty State Example */}
      <div className="border border-gray-200 rounded-lg p-8">
        <EmptyState
          icon={Package}
          message="No products found"
          description="Add your first product to get started with inventory management"
          action={{
            label: 'Add Product',
            onClick: () => console.log('Add product clicked')
          }}
        />
      </div>
    </div>
  );
}
