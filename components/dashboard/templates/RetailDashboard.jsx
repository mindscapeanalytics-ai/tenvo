'use client';

import { useMemo } from 'react';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { CategoryPerformanceWidget } from '@/components/dashboard/widgets/CategoryPerformanceWidget';
import { InventoryValuationWidget } from '@/components/dashboard/widgets/InventoryValuationWidget';
import { WarehouseDistributionWidget } from '@/components/dashboard/widgets/WarehouseDistributionWidget';
import { BatchExpiryWidget } from '@/components/dashboard/widgets/BatchExpiryWidget';

/**
 * RetailDashboard Component
 * 
 * Specialized dashboard for general retail businesses.
 * Extends EnhancedDashboard with retail-specific widgets and features.
 * 
 * Key Features:
 * - Category Performance (sales by category)
 * - Fast/Slow Moving Items
 * - Margin Analysis (profit margin breakdown)
 * - Customer Loyalty Metrics
 * 
 * Domain Integration:
 * - Retail domain knowledge from lib/domainData/retail.js
 * - Multi-category tracking
 * - Brand performance
 * - Seasonal pricing
 * - Pakistani payment methods (JazzCash, Easypaisa, COD)
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} props.category - Business category (retail-shop, grocery, fmcg, ecommerce, etc.)
 * @param {Function} [props.onQuickAction] - Quick action callback
 */
export function RetailDashboard({ businessId, category, onQuickAction }) {
  // Retail-specific stats configuration
  const retailStats = useMemo(() => [
    {
      title: 'Total Revenue',
      value: 'PKR 0',
      change: '+0%',
      trend: 'up',
      icon: 'TrendingUp'
    },
    {
      title: 'Total Orders',
      value: '0',
      subtitle: 'This Month',
      icon: 'ShoppingBag'
    },
    {
      title: 'Active Categories',
      value: '0',
      subtitle: 'Product Categories',
      icon: 'Grid'
    },
    {
      title: 'Customers',
      value: '0',
      subtitle: 'Active Customers',
      icon: 'Users'
    }
  ], []);

  // Retail-specific quick actions
  const retailQuickActions = useMemo(() => [
    { label: 'New Invoice', action: 'new-invoice', icon: 'Plus' },
    { label: 'Add Product', action: 'add-product', icon: 'Package' },
    { label: 'New Customer', action: 'new-customer', icon: 'User' },
    { label: 'Reports', action: 'reports', icon: 'BarChart' }
  ], []);

  // Retail-specific alerts
  const retailAlerts = useMemo(() => {
    const alerts = [];
    
    // Add category performance alerts
    alerts.push({
      type: 'info',
      message: 'Check category performance for insights',
      action: 'View Categories',
      actionCallback: () => onQuickAction?.('view-categories')
    });

    return alerts;
  }, [onQuickAction]);

  return (
    <div className="space-y-6">
      {/* Use base EnhancedDashboard for common features */}
      <EnhancedDashboard
        businessId={businessId}
        category={category}
        onQuickAction={onQuickAction}
        customStats={retailStats}
        customQuickActions={retailQuickActions}
        customAlerts={retailAlerts}
      />

      {/* Retail-Specific Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Performance Widget - Primary widget for retail */}
        <CategoryPerformanceWidget
          businessId={businessId}
          category={category}
          onViewDetails={(action) => onQuickAction?.(action)}
        />

        {/* Inventory Valuation Widget */}
        <InventoryValuationWidget
          businessId={businessId}
          category={category}
          onViewDetails={(action) => onQuickAction?.(action)}
        />

        {/* Batch Expiry Widget (for categories with expiry tracking) */}
        {['grocery', 'fmcg', 'bakery-confectionery', 'supermarket'].includes(category) && (
          <BatchExpiryWidget
            businessId={businessId}
            category={category}
            onViewDetails={(action) => onQuickAction?.(action)}
          />
        )}

        {/* Warehouse Distribution Widget (if multi-location enabled) */}
        <WarehouseDistributionWidget
          businessId={businessId}
          category={category}
          onViewDetails={(action) => onQuickAction?.(action)}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div>
              <p className="font-medium">Today's Sales</p>
              <p className="text-sm text-gray-600">0 invoices, PKR 0</p>
            </div>
            <button 
              className="text-wine hover:underline text-sm"
              onClick={() => onQuickAction?.('view-sales')}
            >
              View All
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div>
              <p className="font-medium">Low Stock Items</p>
              <p className="text-sm text-gray-600">Check inventory levels</p>
            </div>
            <button 
              className="text-wine hover:underline text-sm"
              onClick={() => onQuickAction?.('view-inventory')}
            >
              View Items
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div>
              <p className="font-medium">Pending Payments</p>
              <p className="text-sm text-gray-600">Outstanding invoices</p>
            </div>
            <button 
              className="text-wine hover:underline text-sm"
              onClick={() => onQuickAction?.('view-payments')}
            >
              View Payments
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div>
              <p className="font-medium">Top Selling Products</p>
              <p className="text-sm text-gray-600">Best performers this month</p>
            </div>
            <button 
              className="text-wine hover:underline text-sm"
              onClick={() => onQuickAction?.('view-top-products')}
            >
              View Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
