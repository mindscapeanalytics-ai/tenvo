'use client';

import { useMemo } from 'react';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { CategoryPerformanceWidget } from '@/components/dashboard/widgets/CategoryPerformanceWidget';
import { InventoryValuationWidget } from '@/components/dashboard/widgets/InventoryValuationWidget';
import { WarehouseDistributionWidget } from '@/components/dashboard/widgets/WarehouseDistributionWidget';
import { BatchExpiryWidget } from '@/components/dashboard/widgets/BatchExpiryWidget';
import { Plus, Package, Users, BarChart3, Droplets, Milk } from 'lucide-react';
import { isWaterHisabRelevant } from '@/lib/storefront/waterShopHisab';
import { isMilkHisabRelevant } from '@/lib/storefront/milkShopHisab';

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
  const retailQuickActions = useMemo(() => {
    const isWater = isWaterHisabRelevant(category);
    const isMilk = isMilkHisabRelevant(category);

    const actions = [];
    if (isWater) {
      actions.push({ label: 'Water Route', action: 'route-hisab', icon: Droplets, color: 'text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200' });
    } else if (isMilk) {
      actions.push({ label: 'Milk Record', action: 'route-hisab', icon: Milk, color: 'text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200' });
    }

    actions.push(
      { label: 'New Invoice', action: 'new-invoice', icon: Plus, color: 'text-wine bg-wine/10 hover:bg-wine/20 border-wine/20' },
      { label: 'Add Product', action: 'add-product', icon: Package, color: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200' },
      { label: 'New Customer', action: 'new-customer', icon: Users, color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
      { label: 'Reports', action: 'reports', icon: BarChart3, color: 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200' }
    );

    return actions;
  }, [category]);

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

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {retailQuickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => onQuickAction?.(action.action)}
              className={`flex items-center gap-3 p-3.5 rounded-xl shadow-sm border transition-all text-left ${action.color}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-sm">{action.label}</span>
            </button>
          );
        })}
      </div>

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
