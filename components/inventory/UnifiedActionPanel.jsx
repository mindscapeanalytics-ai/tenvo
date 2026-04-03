'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Package, 
  Barcode, 
  Grid3x3, 
  ClipboardList, 
  X,
  Loader2 
} from 'lucide-react';

// Lazy load heavy components for better performance
const BatchTrackingManager = lazy(() => import('./BatchTrackingManager'));
const SerialTrackingManager = lazy(() => import('./SerialTrackingManager'));
const StockAdjustmentManager = lazy(() => import('./StockAdjustmentManager'));

/**
 * UnifiedActionPanel Component
 * 
 * Consolidated interface for all inventory actions in a single panel.
 * Reduces navigation from 3+ clicks to 1-2 clicks.
 * 
 * Features:
 * - Tabbed interface for Batch, Serial, Variant, Adjustment
 * - Keyboard shortcuts (Alt+B, Alt+S, Alt+V, Alt+A, Esc)
 * - Lazy loading for performance
 * - Mobile-responsive with FAB
 * - Category-based tab visibility
 * - Smooth transitions
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.product - Product object
 * @param {string} props.businessId - Business ID
 * @param {string} props.category - Product category
 * @param {string} props.activeTab - Active tab (batch, serial, variant, adjustment)
 * @param {Function} props.onTabChange - Callback when tab changes
 * @param {Function} props.onClose - Callback when panel closes
 * @param {boolean} props.isOpen - Panel open state
 */
export default function UnifiedActionPanel({
  product,
  businessId,
  category,
  activeTab: initialActiveTab = 'batch',
  onTabChange,
  onClose,
  isOpen = false
}) {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      // Alt+B for Batch
      if (e.altKey && e.key === 'b') {
        e.preventDefault();
        handleTabChange('batch');
      }
      // Alt+S for Serial
      else if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleTabChange('serial');
      }
      // Alt+V for Variant
      else if (e.altKey && e.key === 'v') {
        e.preventDefault();
        handleTabChange('variant');
      }
      // Alt+A for Adjustment
      else if (e.altKey && e.key === 'a') {
        e.preventDefault();
        handleTabChange('adjustment');
      }
      // Esc to close
      else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  // Determine which tabs to show based on category
  const getVisibleTabs = () => {
    const tabs = [];
    
    // Batch tracking - show for most categories
    if (shouldShowBatchTracking()) {
      tabs.push({
        id: 'batch',
        label: 'Batch',
        icon: Package,
        shortcut: 'Alt+B'
      });
    }
    
    // Serial tracking - show for electronics, appliances
    if (shouldShowSerialTracking()) {
      tabs.push({
        id: 'serial',
        label: 'Serial',
        icon: Barcode,
        shortcut: 'Alt+S'
      });
    }
    
    // Variant matrix - show for garments
    if (shouldShowVariantMatrix()) {
      tabs.push({
        id: 'variant',
        label: 'Variants',
        icon: Grid3x3,
        shortcut: 'Alt+V'
      });
    }
    
    // Stock adjustment - always show
    tabs.push({
      id: 'adjustment',
      label: 'Adjust',
      icon: ClipboardList,
      shortcut: 'Alt+A'
    });
    
    return tabs;
  };

  const shouldShowBatchTracking = () => {
    const batchCategories = [
      'pharmacy',
      'food-beverage',
      'textile-wholesale',
      'cosmetics',
      'chemicals'
    ];
    return !category || batchCategories.includes(category);
  };

  const shouldShowSerialTracking = () => {
    const serialCategories = [
      'electronics',
      'appliances',
      'mobile-accessories',
      'computers'
    ];
    return serialCategories.includes(category);
  };

  const shouldShowVariantMatrix = () => {
    const variantCategories = [
      'garments',
      'footwear',
      'textile-retail'
    ];
    return variantCategories.includes(category);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const visibleTabs = getVisibleTabs();

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#722F37] mx-auto" />
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'batch':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BatchTrackingManager
              product={product}
              businessId={businessId}
              category={category}
              mode="manage"
            />
          </Suspense>
        );
      
      case 'serial':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SerialTrackingManager
              product={product}
              businessId={businessId}
              category={category}
              mode="manage"
            />
          </Suspense>
        );
      
      case 'variant':
        return (
          <div className="p-6 text-center text-gray-500">
            <Grid3x3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Variant Matrix Editor</p>
            <p className="text-sm mt-1">Coming in Phase 3</p>
          </div>
        );
      
      case 'adjustment':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <StockAdjustmentManager
              product={product}
              businessId={businessId}
              mode="create"
            />
          </Suspense>
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  // Mobile: Slide-in drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-slide-up">
          {/* Handle for swipe */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {product?.name || 'Inventory Actions'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#722F37] border-b-2 border-[#722F37] bg-[#722F37]/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <div>{tab.label}</div>
                </button>
              );
            })}
          </div>
          
          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {renderTabContent()}
          </div>
        </div>
      </>
    );
  }

  // Desktop: Modal panel
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {product?.name || 'Inventory Actions'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              SKU: {product?.sku || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'text-[#722F37] bg-[#722F37]/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={tab.shortcut}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                <span className="text-xs text-gray-400 ml-1">
                  ({tab.shortcut.replace('Alt+', '⌥')})
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#722F37]" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
          {renderTabContent()}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg opacity-75">
          Press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Esc</kbd> to close
        </div>
      </div>
    </>
  );
}

// Floating Action Button for mobile
export function UnifiedActionFAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#722F37] text-white rounded-full shadow-lg hover:bg-[#5a2329] transition-all hover:scale-110 active:scale-95 md:hidden"
      title="Quick Actions"
    >
      <Package className="h-6 w-6 mx-auto" />
    </button>
  );
}
