'use client';

import { useMemo } from 'react';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { SizeColorMatrixWidget } from '@/components/dashboard/widgets/SizeColorMatrixWidget';
import { InventoryValuationWidget } from '@/components/dashboard/widgets/InventoryValuationWidget';
import { WarehouseDistributionWidget } from '@/components/dashboard/widgets/WarehouseDistributionWidget';
import { SeasonalPerformanceWidget } from '@/components/dashboard/widgets/SeasonalPerformanceWidget';

/**
 * GarmentsDashboard Component
 * 
 * Specialized dashboard for garment businesses (wholesale, retail, boutique).
 * Extends EnhancedDashboard with garment-specific widgets and features.
 * 
 * Key Features:
 * - Size-Color Matrix (stock status by size-color combinations)
 * - Lot Inventory Widget (lot-wise tracking)
 * - Seasonal Collection Widget (seasonal performance)
 * - Style Trends Widget (style-wise sales trends)
 * 
 * Domain Integration:
 * - Garments domain knowledge from lib/domainData/retail.js
 * - Size-color matrix tracking
 * - Seasonal collections (Summer, Winter, Eid, Spring)
 * - Designer/brand tracking
 * - Stitching status tracking
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} props.category - Business category (garments-wholesale, garments-retail, boutique)
 * @param {Function} [props.onQuickAction] - Quick action callback
 */
export function GarmentsDashboard({ businessId, category, onQuickAction }) {
  // Garment-specific stats configuration
  const garmentStats = useMemo(() => [
    {
      title: 'Total Revenue',
      value: 'PKR 0',
      change: '+0%',
      trend: 'up',
      icon: 'TrendingUp'
    },
    {
      title: 'Size-Color Variants',
      value: '0',
      subtitle: 'Active SKUs',
      icon: 'Package'
    },
    {
      title: 'Seasonal Collections',
      value: '0',
      subtitle: 'Active Collections',
      icon: 'Calendar'
    },
    {
      title: 'Pending Orders',
      value: '0',
      subtitle: 'Custom Stitching',
      icon: 'ShoppingBag'
    }
  ], []);

  // Garment-specific quick actions
  const garmentQuickActions = useMemo(() => [
    { label: 'New Order', action: 'new-order', icon: 'Plus' },
    { label: 'Add Product', action: 'add-product', icon: 'Package' },
    { label: 'Manage Variants', action: 'manage-variants', icon: 'Grid' },
    { label: 'New Customer', action: 'new-customer', icon: 'User' }
  ], []);

  // Garment-specific alerts
  const garmentAlerts = useMemo(() => {
    const alerts = [];
    
    // Add size-color matrix alerts
    alerts.push({
      type: 'warning',
      message: 'Check size-color matrix for low stock variants',
      action: 'View Matrix',
      actionCallback: () => onQuickAction?.('view-matrix')
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
        customStats={garmentStats}
        customQuickActions={garmentQuickActions}
        customAlerts={garmentAlerts}
      />

      {/* Garment-Specific Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Size-Color Matrix Widget - Primary widget for garments */}
        <SizeColorMatrixWidget
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

        {/* Warehouse Distribution Widget (if multi-location enabled) */}
        <WarehouseDistributionWidget
          businessId={businessId}
          category={category}
          onViewDetails={(action) => onQuickAction?.(action)}
        />

        {/* Seasonal Performance Widget */}
        <SeasonalPerformanceWidget
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
              <p className="font-medium">Pending Custom Orders</p>
              <p className="text-sm text-gray-600">0 orders awaiting stitching</p>
            </div>
            <button 
              className="text-wine hover:underline text-sm"
              onClick={() => onQuickAction?.('view-orders')}
            >
              View All
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div>
              <p className="font-medium">Low Stock Variants</p>
              <p className="text-sm text-gray-600">Check size-color matrix</p>
            </div>
            <button 
              className="text-wine hover:underline text-sm"
              onClick={() => onQuickAction?.('view-matrix')}
            >
              View Matrix
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div>
              <p className="font-medium">Seasonal Collections</p>
              <p className="text-sm text-gray-600">Manage active collections</p>
            </div>
            <button 
              className="text-wine hover:underline text-sm"
              onClick={() => onQuickAction?.('view-collections')}
            >
              View Collections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
