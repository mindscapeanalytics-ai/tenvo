# Design Document: Dashboard and Inventory System Deep Consolidation & Gap Closure

## Overview

This design addresses critical technical debt and missing implementations across dashboard and inventory systems through deep consolidation. The system currently suffers from 25-30% code duplication (~500-700 lines), incomplete implementations, mock data dependencies, oversized components (5 components >500 lines), and weak integration between domains.

The consolidation will:
- Extract all duplicate utilities into centralized modules (formatCurrency, formatDateTime, useLanguage)
- Implement missing shared components (DashboardStatsGrid, DashboardLoadingSkeleton, RevenueChartSection)
- Replace 100% mock data with real API calls across all widgets
- Extract 14+ inline widgets into separate, reusable components
- Implement comprehensive widget registry for discovery and configuration
- Reduce all components to <300 lines through extraction and composition
- Complete missing Phase 3-5 dashboard features (layout persistence, multi-tenant isolation, performance optimization)
- Complete missing Phase 3-4 inventory features (Pakistani market features, mobile-first interfaces, navigation simplification)
- Establish 10+ dashboard-inventory integration points (inventory valuation, batch expiry, low stock, cycle counts, stock transfers)
- Implement unified services for error handling, data fetching, and form validation
- Add Advanced/Easy Mode dashboard switching with mode toggle, preference persistence, and separate layouts

This consolidation reduces duplication from 25-30% to <10%, eliminates all mock data, achieves 0 components >300 lines, and increases dashboard-inventory integration from 2 to 10+ touchpoints.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RoleBasedDashboardController                             │  │
│  │  ├─ OwnerDashboard                                        │  │
│  │  ├─ ManagerDashboard                                      │  │
│  │  ├─ SalesDashboard                                        │  │
│  │  ├─ InventoryDashboard                                    │  │
│  │  ├─ AccountantDashboard                                   │  │
│  │  └─ DashboardTemplateSelector (domain-specific)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Advanced/Easy Mode Controller                            │  │
│  │  ├─ Mode Toggle Component                                 │  │
│  │  ├─ Mode Preference Manager                               │  │
│  │  └─ Layout Configuration Manager                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Widget Registry Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Widget Registry (lib/widgets/widgetRegistry.js)         │  │
│  │  ├─ Widget Metadata Store                                 │  │
│  │  ├─ Permission-Based Filtering                            │  │
│  │  ├─ Category-Based Discovery                              │  │
│  │  └─ Dynamic Widget Registration                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Widget Component Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Extracted Widgets (components/dashboard/widgets/)       │  │
│  │  ├─ TeamPerformanceWidget                                 │  │
│  │  ├─ InventoryAlertsWidget                                 │  │
│  │  ├─ SalesTargetsWidget                                    │  │
│  │  ├─ TodaysSalesWidget                                     │  │
│  │  ├─ CommissionWidget                                      │  │
│  │  ├─ CustomersWidget                                       │  │
│  │  ├─ StockLevelsWidget                                     │  │
│  │  ├─ ReorderAlertsWidget                                   │  │
│  │  ├─ CycleCountTasksWidget                                 │  │
│  │  ├─ ReceivingQueueWidget                                  │  │
│  │  └─ SystemHealthWidget                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Shared Component Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Shared Components (components/shared/)                   │  │
│  │  ├─ DashboardStatsGrid                                    │  │
│  │  ├─ DashboardLoadingSkeleton                              │  │
│  │  ├─ RevenueChartSection                                   │  │
│  │  ├─ StatsCard                                             │  │
│  │  ├─ WidgetContainer                                       │  │
│  │  ├─ EmptyState                                            │  │
│  │  └─ ErrorState                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Unified Services (lib/services/)                         │  │
│  │  ├─ ErrorHandlingService                                  │  │
│  │  ├─ DataFetchingService                                   │  │
│  │  └─ FormValidationService                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Utilities Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Centralized Utilities (lib/utils/)                       │  │
│  │  ├─ currency.js (formatCurrency)                          │  │
│  │  ├─ datetime.js (formatDateTime)                          │  │
│  │  ├─ number.js (formatNumber, formatPercentage)            │  │
│  │  └─ permissions.js (hasPermission)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Centralized Hooks (lib/hooks/)                           │  │
│  │  ├─ useLanguage                                           │  │
│  │  └─ useDashboardMetrics                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Dashboard-Inventory Integration                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Integration Points                                        │  │
│  │  ├─ Inventory Valuation → Financial Widgets               │  │
│  │  ├─ Batch Expiry Alerts → Inventory Alert Widgets         │  │
│  │  ├─ Low Stock Alerts → Reorder Widgets                    │  │
│  │  ├─ Cycle Count Tasks → Inventory Staff Widgets           │  │
│  │  ├─ Stock Transfer Approvals → Manager Approval Queue     │  │
│  │  ├─ Serial Warranty Status → System Health Widgets        │  │
│  │  └─ Warehouse Distribution → Multi-Location Widgets       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Endpoints (replacing mock data)                      │  │
│  │  ├─ /api/dashboard/metrics                                │  │
│  │  ├─ /api/inventory/valuation                              │  │
│  │  ├─ /api/inventory/batch-expiry                           │  │
│  │  ├─ /api/inventory/low-stock                              │  │
│  │  ├─ /api/inventory/cycle-counts                           │  │
│  │  ├─ /api/inventory/stock-transfers                        │  │
│  │  └─ /api/dashboard/layouts                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Consolidation Strategy

The consolidation follows a layered approach:

1. **Utilities Layer**: Extract all duplicate utility functions (formatCurrency, formatDateTime, useLanguage) into centralized modules
2. **Services Layer**: Implement unified services for cross-cutting concerns (error handling, data fetching, form validation)
3. **Shared Components Layer**: Implement missing shared components and extract common UI patterns
4. **Widget Layer**: Extract inline widgets into separate, reusable components registered in Widget Registry
5. **Dashboard Layer**: Refactor dashboard templates to use shared components and extracted widgets
6. **Integration Layer**: Establish strong dashboard-inventory integration through shared data flows

### Advanced/Easy Mode Architecture

The Advanced/Easy Mode system provides two dashboard experiences:

**Advanced Mode (Default)**:
- All 25+ widgets available
- Full customization: drag-and-drop layout editing, widget sizing, multi-column layouts
- Advanced features: keyboard shortcuts, real-time updates, advanced filters
- Power user interface with maximum flexibility

**Easy Mode (Simplified)**:
- 6-8 essential widgets: revenue, inventory alerts, quick actions, recent activity
- Fixed layout with simplified navigation
- Reduced customization options
- Beginner-friendly interface with guided workflows

**Mode Switching**:
- Toggle button in dashboard header
- Smooth transition animation (fade-out/fade-in, 300ms)
- Preference persistence in user_preferences table
- Separate layout configurations per mode per user
- Automatic layout restoration on mode switch


## Components and Interfaces

### Centralized Utilities

**lib/utils/currency.js**
```javascript
/**
 * Format currency value with locale-aware formatting
 * @param {number} value - Numeric value to format
 * @param {string} currency - Currency code (PKR, USD, EUR)
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'PKR', options = {}) {
  const { locale = 'en-PK', decimals = 2, showSymbol = true } = options;
  
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return formatter.format(value);
}
```

**lib/utils/datetime.js**
```javascript
/**
 * Format date/time with locale-aware formatting
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type (short, long, time, datetime)
 * @param {string} locale - Locale code
 * @returns {string} Formatted date string
 */
export function formatDateTime(date, format = 'short', locale = 'en-PK') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatOptions = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };
  
  return new Intl.DateTimeFormat(locale, formatOptions[format]).format(dateObj);
}
```

**lib/utils/number.js**
```javascript
/**
 * Format number with locale-aware formatting
 */
export function formatNumber(value, locale = 'en-PK', decimals = 0) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format percentage with configurable decimal places
 */
export function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}
```

**lib/hooks/useLanguage.js**
```javascript
/**
 * Language context hook with translation support
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t: (key) => translations[context.language]?.[key] || key
  };
}
```

### Shared Components

**components/shared/DashboardStatsGrid.jsx**
```javascript
/**
 * Reusable stats grid component
 * @param {Array} stats - Array of stat objects with label, value, icon, color, trend
 * @param {string} colorTheme - Color theme (default, primary, success, warning, danger)
 * @param {Function} onStatClick - Click handler for individual stats
 */
export function DashboardStatsGrid({ stats, colorTheme = 'default', onStatClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color || colorTheme}
          trend={stat.trend}
          onClick={() => onStatClick?.(stat)}
        />
      ))}
    </div>
  );
}
```

**components/shared/DashboardLoadingSkeleton.jsx**
```javascript
/**
 * Loading skeleton for dashboard
 * @param {number} cardCount - Number of skeleton cards to display
 * @param {string} layout - Layout type (grid, list)
 */
export function DashboardLoadingSkeleton({ cardCount = 4, layout = 'grid' }) {
  return (
    <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
      {Array.from({ length: cardCount }).map((_, index) => (
        <Card key={index} className="glass-card border-none">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**components/shared/RevenueChartSection.jsx**
```javascript
/**
 * Revenue chart with time range selection and export
 * @param {string} businessId - Business ID
 * @param {string} timeRange - Time range (day, week, month, year)
 * @param {Function} onTimeRangeChange - Time range change handler
 * @param {Function} onExport - Export handler
 */
export function RevenueChartSection({ businessId, timeRange, onTimeRangeChange, onExport }) {
  const { data, loading, error } = useDashboardMetrics(businessId, 'revenue', timeRange);
  
  if (loading) return <DashboardLoadingSkeleton cardCount={1} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return <EmptyState message="No revenue data available" />;
  
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Overview</CardTitle>
          <div className="flex items-center gap-2">
            <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**components/shared/WidgetContainer.jsx**
```javascript
/**
 * Widget container with error boundary and consistent chrome
 * @param {ReactNode} children - Widget content
 * @param {string} title - Widget title
 * @param {ReactNode} icon - Widget icon
 * @param {Function} onRefresh - Refresh handler
 */
export function WidgetContainer({ children, title, icon, onRefresh }) {
  return (
    <ErrorBoundary fallback={<ErrorState onRetry={onRefresh} />}>
      <Card className="glass-card border-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon && <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-200">{icon}</div>}
              <CardTitle className="text-sm font-bold">{title}</CardTitle>
            </div>
            {onRefresh && (
              <Button onClick={onRefresh} variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
```

### Widget Registry

**lib/widgets/widgetRegistry.js**
```javascript
/**
 * Widget Registry - Centralized catalog of all available widgets
 */
class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
  }
  
  /**
   * Register a widget
   * @param {object} definition - Widget definition
   */
  registerWidget(definition) {
    const { id, name, component, category, description, requiredPermissions, defaultSize, minSize, maxSize } = definition;
    
    if (!id || !name || !component) {
      throw new Error('Widget definition must include id, name, and component');
    }
    
    this.widgets.set(id, {
      id,
      name,
      component,
      category: category || 'general',
      description: description || '',
      requiredPermissions: requiredPermissions || [],
      defaultSize: defaultSize || { w: 2, h: 2 },
      minSize: minSize || { w: 1, h: 1 },
      maxSize: maxSize || { w: 4, h: 4 }
    });
  }
  
  /**
   * Get widget by ID
   */
  getWidget(id) {
    return this.widgets.get(id);
  }
  
  /**
   * Get widgets by category
   */
  getWidgetsByCategory(category) {
    return Array.from(this.widgets.values()).filter(w => w.category === category);
  }
  
  /**
   * Get widgets by permission
   */
  getWidgetsByPermission(permissions) {
    return Array.from(this.widgets.values()).filter(w => 
      w.requiredPermissions.length === 0 || 
      w.requiredPermissions.some(p => permissions.includes(p))
    );
  }
  
  /**
   * Get all widgets
   */
  getAllWidgets() {
    return Array.from(this.widgets.values());
  }
}

export const widgetRegistry = new WidgetRegistry();

// Register all widgets
widgetRegistry.registerWidget({
  id: 'team-performance',
  name: 'Team Performance',
  component: TeamPerformanceWidget,
  category: 'management',
  description: 'Team productivity and sales metrics',
  requiredPermissions: ['view_team_metrics'],
  defaultSize: { w: 2, h: 3 }
});

widgetRegistry.registerWidget({
  id: 'inventory-alerts',
  name: 'Inventory Alerts',
  component: InventoryAlertsWidget,
  category: 'inventory',
  description: 'Low stock and expiry alerts',
  requiredPermissions: ['view_inventory'],
  defaultSize: { w: 2, h: 2 }
});

// ... register all 25+ widgets
```


### Unified Services

**lib/services/errorHandling.js**
```javascript
/**
 * Centralized error handling service
 */
export class ErrorHandlingService {
  /**
   * Handle error with context
   */
  static handleError(error, context = {}) {
    const errorType = this.categorizeError(error);
    const errorMessage = this.getErrorMessage(error);
    
    // Log error with context
    console.error(`[${errorType}] ${errorMessage}`, { error, context });
    
    // Send critical errors to monitoring
    if (errorType === 'system') {
      this.sendToMonitoring(error, context);
    }
    
    return { type: errorType, message: errorMessage };
  }
  
  /**
   * Categorize error type
   */
  static categorizeError(error) {
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'network';
    }
    if (error.message?.includes('validation')) {
      return 'validation';
    }
    if (error.message?.includes('permission')) {
      return 'permission';
    }
    return 'system';
  }
  
  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error) {
    const messages = {
      network: 'Network error. Please check your connection and try again.',
      validation: 'Invalid data. Please check your input and try again.',
      permission: 'You do not have permission to perform this action.',
      system: 'An unexpected error occurred. Please try again later.'
    };
    
    const type = this.categorizeError(error);
    return messages[type] || messages.system;
  }
  
  /**
   * Retry with exponential backoff
   */
  static async retryWithBackoff(fn, options = {}) {
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = Math.min(initialDelay * Math.pow(2, i), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  /**
   * Send to monitoring service
   */
  static sendToMonitoring(error, context) {
    // Implementation depends on monitoring service (Sentry, etc.)
    console.error('Critical error:', error, context);
  }
}
```

**lib/services/dataFetching.js**
```javascript
/**
 * Centralized data fetching service
 */
export class DataFetchingService {
  static cache = new Map();
  static pendingRequests = new Map();
  
  /**
   * Fetch with authentication
   */
  static async fetchWithAuth(url, options = {}) {
    const token = await this.getAuthToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Fetch with retry logic
   */
  static async fetchWithRetry(url, options = {}) {
    return ErrorHandlingService.retryWithBackoff(
      () => this.fetchWithAuth(url, options),
      { maxRetries: 3 }
    );
  }
  
  /**
   * Fetch with caching
   */
  static async fetchWithCache(url, options = {}) {
    const { ttl = 300000 } = options; // 5 minutes default
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    // Deduplicate concurrent requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }
    
    // Fetch data
    const promise = this.fetchWithRetry(url, options)
      .then(res => res.json())
      .then(data => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });
    
    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }
  
  /**
   * Validate business_id for multi-tenant isolation
   */
  static validateBusinessId(businessId) {
    if (!businessId) {
      throw new Error('business_id is required for multi-tenant isolation');
    }
    return businessId;
  }
  
  /**
   * Get auth token
   */
  static async getAuthToken() {
    // Implementation depends on auth system
    return localStorage.getItem('auth_token');
  }
}
```

**lib/services/formValidation.js**
```javascript
/**
 * Centralized form validation service
 */
export class FormValidationService {
  /**
   * Validate required field
   */
  static validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }
  
  /**
   * Validate number with range
   */
  static validateNumber(value, min, max) {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid number' };
    }
    if (min !== undefined && num < min) {
      return { valid: false, error: `Must be at least ${min}` };
    }
    if (max !== undefined && num > max) {
      return { valid: false, error: `Must be at most ${max}` };
    }
    return { valid: true };
  }
  
  /**
   * Validate date with range
   */
  static validateDate(value, minDate, maxDate) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Must be a valid date' };
    }
    if (minDate && date < new Date(minDate)) {
      return { valid: false, error: `Must be after ${minDate}` };
    }
    if (maxDate && date > new Date(maxDate)) {
      return { valid: false, error: `Must be before ${maxDate}` };
    }
    return { valid: true };
  }
  
  /**
   * Validate currency value
   */
  static validateCurrency(value, currency) {
    const result = this.validateNumber(value, 0);
    if (!result.valid) return result;
    
    // Additional currency-specific validation
    const decimals = currency === 'PKR' ? 2 : 2;
    const parts = String(value).split('.');
    if (parts[1] && parts[1].length > decimals) {
      return { valid: false, error: `Maximum ${decimals} decimal places allowed` };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate SKU uniqueness
   */
  static async validateSKU(value, businessId) {
    const response = await DataFetchingService.fetchWithAuth(
      `/api/products/check-sku?sku=${value}&business_id=${businessId}`
    );
    const data = await response.json();
    
    if (data.exists) {
      return { valid: false, error: 'SKU already exists' };
    }
    return { valid: true };
  }
  
  /**
   * Validate batch number format
   */
  static validateBatchNumber(value) {
    const batchPattern = /^[A-Z0-9]{3,20}$/;
    if (!batchPattern.test(value)) {
      return { valid: false, error: 'Batch number must be 3-20 alphanumeric characters' };
    }
    return { valid: true };
  }
  
  /**
   * Validate serial number uniqueness
   */
  static async validateSerialNumber(value, businessId) {
    const response = await DataFetchingService.fetchWithAuth(
      `/api/inventory/check-serial?serial=${value}&business_id=${businessId}`
    );
    const data = await response.json();
    
    if (data.exists) {
      return { valid: false, error: 'Serial number already exists' };
    }
    return { valid: true };
  }
}
```

### Advanced/Easy Mode Implementation

**components/dashboard/ModeToggle.jsx**
```javascript
/**
 * Mode toggle component for switching between Advanced and Easy modes
 */
export function ModeToggle({ currentMode, onModeChange }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const handleToggle = async () => {
    setIsTransitioning(true);
    
    // Fade out current mode
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Switch mode
    const newMode = currentMode === 'advanced' ? 'easy' : 'advanced';
    await onModeChange(newMode);
    
    // Fade in new mode
    await new Promise(resolve => setTimeout(resolve, 150));
    setIsTransitioning(false);
  };
  
  return (
    <div className="flex items-center gap-2">
      <Tooltip content={currentMode === 'advanced' ? 'Switch to Easy Mode' : 'Switch to Advanced Mode'}>
        <Button
          onClick={handleToggle}
          variant="outline"
          size="sm"
          disabled={isTransitioning}
          className="font-bold"
        >
          {currentMode === 'advanced' ? (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Advanced Mode
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Easy Mode
            </>
          )}
        </Button>
      </Tooltip>
    </div>
  );
}
```

**lib/services/modePreference.js**
```javascript
/**
 * Mode preference manager
 */
export class ModePreferenceService {
  /**
   * Save mode preference
   */
  static async saveModePreference(userId, businessId, mode) {
    await DataFetchingService.fetchWithAuth('/api/user-preferences', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        business_id: businessId,
        preference_key: 'dashboard_mode',
        preference_value: mode
      })
    });
  }
  
  /**
   * Load mode preference
   */
  static async loadModePreference(userId, businessId) {
    const response = await DataFetchingService.fetchWithAuth(
      `/api/user-preferences?user_id=${userId}&business_id=${businessId}&key=dashboard_mode`
    );
    const data = await response.json();
    return data.preference_value || 'advanced'; // Default to advanced
  }
  
  /**
   * Save layout configuration
   */
  static async saveLayoutConfig(userId, businessId, mode, layout) {
    await DataFetchingService.fetchWithAuth('/api/dashboard/layouts', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        business_id: businessId,
        mode: mode,
        layout: layout
      })
    });
  }
  
  /**
   * Load layout configuration
   */
  static async loadLayoutConfig(userId, businessId, mode) {
    const response = await DataFetchingService.fetchWithAuth(
      `/api/dashboard/layouts?user_id=${userId}&business_id=${businessId}&mode=${mode}`
    );
    const data = await response.json();
    return data.layout || this.getDefaultLayout(mode);
  }
  
  /**
   * Get default layout for mode
   */
  static getDefaultLayout(mode) {
    if (mode === 'easy') {
      return {
        widgets: [
          { id: 'revenue-summary', position: { x: 0, y: 0, w: 2, h: 2 } },
          { id: 'inventory-alerts', position: { x: 2, y: 0, w: 2, h: 2 } },
          { id: 'quick-actions', position: { x: 0, y: 2, w: 2, h: 1 } },
          { id: 'recent-activity', position: { x: 2, y: 2, w: 2, h: 2 } }
        ]
      };
    }
    
    // Advanced mode: all widgets available
    return {
      widgets: [] // User customizes
    };
  }
}
```


## Data Models

### Widget Registry Schema

```typescript
interface WidgetDefinition {
  id: string;                    // Unique widget identifier
  name: string;                  // Display name
  component: React.Component;    // Widget component
  category: string;              // Widget category (inventory, sales, finance, etc.)
  description: string;           // Widget description
  requiredPermissions: string[]; // Required permissions to view
  defaultSize: { w: number; h: number };  // Default grid size
  minSize: { w: number; h: number };      // Minimum grid size
  maxSize: { w: number; h: number };      // Maximum grid size
}
```

### Dashboard Layout Schema

```typescript
interface DashboardLayout {
  id: string;
  user_id: string;
  business_id: string;
  mode: 'advanced' | 'easy';
  layout: {
    widgets: Array<{
      id: string;
      position: { x: number; y: number; w: number; h: number };
    }>;
  };
  created_at: Date;
  updated_at: Date;
}
```

### User Preference Schema

```typescript
interface UserPreference {
  id: string;
  user_id: string;
  business_id: string;
  preference_key: string;        // e.g., 'dashboard_mode'
  preference_value: string;      // e.g., 'advanced' or 'easy'
  created_at: Date;
  updated_at: Date;
}
```

### Dashboard-Inventory Integration Data Models

**Inventory Valuation**
```typescript
interface InventoryValuation {
  business_id: string;
  total_value: number;
  costing_method: 'FIFO' | 'LIFO' | 'WAC';
  by_category: Array<{
    category: string;
    value: number;
    quantity: number;
  }>;
  by_location: Array<{
    location_id: string;
    location_name: string;
    value: number;
  }>;
  calculated_at: Date;
}
```

**Batch Expiry Alert**
```typescript
interface BatchExpiryAlert {
  batch_id: string;
  product_id: string;
  product_name: string;
  batch_number: string;
  expiry_date: Date;
  quantity: number;
  severity: 'critical' | 'warning' | 'normal';  // <30 days, 30-90 days, >90 days
  location_id: string;
  location_name: string;
}
```

**Low Stock Alert**
```typescript
interface LowStockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  minimum_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  days_until_stockout: number;
  location_id: string;
  location_name: string;
}
```

**Cycle Count Task**
```typescript
interface CycleCountTask {
  id: string;
  schedule_id: string;
  name: string;
  assigned_to: string;
  due_date: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  product_count: number;
  completed_count: number;
  location_id: string;
  location_name: string;
}
```

**Stock Transfer Approval**
```typescript
interface StockTransferApproval {
  id: string;
  transfer_number: string;
  product_id: string;
  product_name: string;
  quantity: number;
  from_location_id: string;
  from_location_name: string;
  to_location_id: string;
  to_location_name: string;
  requester_id: string;
  requester_name: string;
  transfer_value: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: Date;
}
```

### Dashboard Layout Serialization

**Export Format (JSON)**
```json
{
  "version": "1.0",
  "mode": "advanced",
  "layout": {
    "widgets": [
      {
        "id": "team-performance",
        "position": { "x": 0, "y": 0, "w": 2, "h": 3 },
        "config": {
          "timeRange": "month",
          "showTrends": true
        }
      },
      {
        "id": "inventory-alerts",
        "position": { "x": 2, "y": 0, "w": 2, "h": 2 },
        "config": {
          "alertTypes": ["low_stock", "expiry"],
          "severity": "all"
        }
      }
    ]
  },
  "exported_at": "2024-01-15T10:30:00Z"
}
```

### Inventory Data Import/Export

**Product Export Format (Excel)**
```
| SKU       | Name              | Category  | Price  | Stock | Batch Number | Expiry Date | Serial Numbers |
|-----------|-------------------|-----------|--------|-------|--------------|-------------|----------------|
| MED-001   | Paracetamol 500mg | Medicine  | 50.00  | 500   | BATCH-2024-1 | 2025-12-31  |                |
| ELC-089   | Samsung Galaxy A54| Electronics| 45000 | 10    |              |             | SN001,SN002... |
```

**Import Validation Rules**
- SKU: Required, unique, alphanumeric
- Name: Required, max 200 characters
- Category: Required, must exist in system
- Price: Required, numeric, >= 0
- Stock: Required, integer, >= 0
- Batch Number: Optional, alphanumeric if provided
- Expiry Date: Optional, valid date if provided
- Serial Numbers: Optional, comma-separated if provided

## Dashboard-Inventory Integration Architecture

### Integration Points

**1. Inventory Valuation → Financial Widgets**
```javascript
// Financial widgets fetch inventory valuation
const inventoryValuation = await DataFetchingService.fetchWithCache(
  `/api/inventory/valuation?business_id=${businessId}&costing_method=${costingMethod}`
);

// Display in financial summary
<FinancialSummaryWidget
  revenue={revenueData}
  inventoryValue={inventoryValuation.total_value}
  cogs={inventoryValuation.cogs}
/>
```

**2. Batch Expiry Alerts → Inventory Alert Widgets**
```javascript
// Inventory alert widgets fetch batch expiry data
const batchExpiryAlerts = await DataFetchingService.fetchWithCache(
  `/api/inventory/batch-expiry?business_id=${businessId}&days_threshold=90`
);

// Display in inventory alerts widget
<InventoryAlertsWidget
  lowStockAlerts={lowStockData}
  batchExpiryAlerts={batchExpiryAlerts}
  onAlertClick={(alert) => navigate(`/inventory/batches/${alert.batch_id}`)}
/>
```

**3. Low Stock Alerts → Reorder Widgets**
```javascript
// Reorder widgets fetch low stock data
const lowStockAlerts = await DataFetchingService.fetchWithCache(
  `/api/inventory/low-stock?business_id=${businessId}`
);

// Display in reorder alerts widget
<ReorderAlertsWidget
  alerts={lowStockAlerts}
  onCreatePO={(productId) => navigate(`/purchase-orders/create?product=${productId}`)}
/>
```

**4. Cycle Count Tasks → Inventory Staff Widgets**
```javascript
// Inventory staff widgets fetch cycle count tasks
const cycleCountTasks = await DataFetchingService.fetchWithCache(
  `/api/inventory/cycle-counts?user_id=${userId}&business_id=${businessId}&status=pending`
);

// Display in cycle count tasks widget
<CycleCountTasksWidget
  tasks={cycleCountTasks}
  onStartCount={(scheduleId) => navigate(`/inventory/cycle-count/${scheduleId}`)}
/>
```

**5. Stock Transfer Approvals → Manager Approval Queue**
```javascript
// Manager approval queue fetches pending stock transfers
const pendingTransfers = await DataFetchingService.fetchWithCache(
  `/api/inventory/stock-transfers?business_id=${businessId}&status=pending`
);

// Display in pending approvals widget
<PendingApprovalsWidget
  stockTransfers={pendingTransfers}
  onApprove={(transferId) => approveTransfer(transferId)}
  onReject={(transferId) => rejectTransfer(transferId)}
/>
```

**6. Serial Warranty Status → System Health Widgets**
```javascript
// System health widgets fetch serial warranty data
const warrantyStatus = await DataFetchingService.fetchWithCache(
  `/api/inventory/serial-warranty?business_id=${businessId}&expiring_within_days=30`
);

// Display in system health widget
<SystemHealthWidget
  systemMetrics={systemData}
  warrantyExpiringCount={warrantyStatus.expiring_count}
  onViewWarranties={() => navigate('/inventory/serials?filter=warranty_expiring')}
/>
```

**7. Warehouse Distribution → Multi-Location Widgets**
```javascript
// Multi-location widgets fetch warehouse distribution
const warehouseDistribution = await DataFetchingService.fetchWithCache(
  `/api/inventory/warehouse-distribution?business_id=${businessId}`
);

// Display in warehouse distribution widget
<WarehouseDistributionWidget
  distribution={warehouseDistribution}
  onLocationClick={(locationId) => navigate(`/inventory?location=${locationId}`)}
/>
```

### Real-Time Updates

**WebSocket Integration**
```javascript
// Establish WebSocket connection for real-time updates
const ws = new WebSocket(`wss://api.example.com/ws?business_id=${businessId}`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch (update.type) {
    case 'inventory_change':
      // Invalidate inventory-related cache
      DataFetchingService.cache.delete(`/api/inventory/valuation:${businessId}`);
      DataFetchingService.cache.delete(`/api/inventory/low-stock:${businessId}`);
      // Trigger widget refresh
      queryClient.invalidateQueries(['inventory']);
      break;
      
    case 'batch_expiry_alert':
      // Invalidate batch expiry cache
      DataFetchingService.cache.delete(`/api/inventory/batch-expiry:${businessId}`);
      // Trigger widget refresh
      queryClient.invalidateQueries(['batch-expiry']);
      break;
      
    case 'cycle_count_update':
      // Invalidate cycle count cache
      DataFetchingService.cache.delete(`/api/inventory/cycle-counts:${userId}`);
      // Trigger widget refresh
      queryClient.invalidateQueries(['cycle-counts']);
      break;
  }
};
```

### Performance Optimization

**Caching Strategy**
- Dashboard metrics: 5-minute TTL
- Inventory valuation: 5-minute TTL
- Batch expiry alerts: 10-minute TTL
- Low stock alerts: 5-minute TTL
- Cycle count tasks: 2-minute TTL
- Stock transfer approvals: 1-minute TTL

**Lazy Loading**
```javascript
// Load above-fold widgets immediately
const aboveFoldWidgets = ['revenue-summary', 'inventory-alerts', 'quick-actions'];

// Lazy load below-fold widgets
const belowFoldWidgets = ['team-performance', 'sales-targets', 'cycle-counts'];

useEffect(() => {
  // Load above-fold widgets
  aboveFoldWidgets.forEach(widgetId => loadWidget(widgetId));
  
  // Lazy load below-fold widgets after 500ms
  setTimeout(() => {
    belowFoldWidgets.forEach(widgetId => loadWidget(widgetId));
  }, 500);
}, []);
```

**Code Splitting**
```javascript
// Lazy load dashboard templates
const OwnerDashboard = lazy(() => import('./templates/OwnerDashboard'));
const ManagerDashboard = lazy(() => import('./templates/ManagerDashboard'));
const SalesDashboard = lazy(() => import('./templates/SalesDashboard'));
const InventoryDashboard = lazy(() => import('./templates/InventoryDashboard'));
const AccountantDashboard = lazy(() => import('./templates/AccountantDashboard'));

// Lazy load widgets
const TeamPerformanceWidget = lazy(() => import('./widgets/TeamPerformanceWidget'));
const InventoryAlertsWidget = lazy(() => import('./widgets/InventoryAlertsWidget'));
// ... etc
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties and performed redundancy elimination:

**Redundancy Analysis:**
- Properties for formatDateTime, formatNumber, formatPercentage can be combined into a single "formatting functions preserve data integrity" property
- Properties for Widget Registry methods (getWidget, getWidgetsByCategory, getWidgetsByPermission) are all testing registry lookup correctness - can be combined
- Properties for error categorization and error message generation are related but test different aspects - keep separate
- Properties for DataFetchingService methods (fetchWithAuth, fetchWithRetry, fetchWithCache) test different aspects - keep separate
- Properties for FormValidationService methods test different validation rules - keep separate but group related ones
- Properties for inventory integration (valuation, batch expiry, low stock) test different data sources - keep separate
- Properties for layout serialization and product export are both round-trip properties but for different data types - keep separate
- Properties for mode preference persistence and layout configuration are related but test different aspects - keep separate

**Final Property Set (after redundancy elimination):**
- Utility formatting functions (combined)
- Widget Registry operations (combined)
- Error handling service operations
- Data fetching service operations
- Form validation service operations
- Dashboard layout serialization (round-trip)
- Product data export/import (round-trip)
- Inventory integration functions
- Permission-based widget filtering
- Domain-role widget merging
- Mode preference persistence
- Multi-tenant isolation

### Property 1: Utility Formatting Functions Preserve Data Integrity

*For any* valid input value, formatting then parsing should preserve the original value within acceptable precision bounds.

**Validates: Requirements 1.2, 1.4, 1.5**

**Rationale:** Formatting functions like formatDateTime, formatNumber, and formatPercentage should not lose information. While exact round-trip may not be possible due to formatting (e.g., "1.5%" becomes "1.5"), the semantic value should be preserved.

### Property 2: Widget Registry Lookup Correctness

*For any* registered widget, the Widget Registry should return the correct widget definition when queried by ID, category, or permission.

**Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.6**

**Rationale:** The Widget Registry is the central catalog for all widgets. Any widget that is registered should be retrievable through various lookup methods, and the returned definition should match the original registration.

### Property 3: Dashboard Layout Round-Trip Preservation

*For any* valid dashboard layout, exporting to JSON then importing should produce an equivalent layout with all widget positions, sizes, and configurations preserved.

**Validates: Requirements 7.1, 26.1, 26.3, 26.4**

**Rationale:** Layout serialization must preserve all layout information to allow users to export and import their dashboard configurations without data loss.

### Property 4: Product Data Export/Import Round-Trip Preservation

*For any* valid product dataset, exporting to Excel then importing should produce an equivalent dataset with all fields (including batch and serial information) and data types preserved.

**Validates: Requirements 27.1, 27.4, 27.8**

**Rationale:** Product data export/import must preserve all product information including Unicode characters (Urdu text) to allow users to work offline and bulk update data.

### Property 5: Error Categorization Consistency

*For any* error object, the ErrorHandlingService should consistently categorize it as network, validation, permission, or system error based on error characteristics.

**Validates: Requirements 10.2, 10.4**

**Rationale:** Consistent error categorization ensures that errors are handled appropriately and users receive relevant error messages.

### Property 6: Exponential Backoff Retry Behavior

*For any* failing function, retryWithBackoff should retry with exponentially increasing delays up to the maximum retry count, and the delay between retries should follow the exponential backoff pattern.

**Validates: Requirements 7.8, 10.3**

**Rationale:** Exponential backoff prevents overwhelming failing services while giving them time to recover.

### Property 7: Data Fetching Authentication Header Injection

*For any* API request, fetchWithAuth should add authentication headers to the request.

**Validates: Requirements 11.1**

**Rationale:** All authenticated API requests must include authentication headers for security.

### Property 8: Data Fetching Cache Behavior

*For any* API request with caching enabled, fetchWithCache should return cached data within TTL and fetch fresh data after TTL expires.

**Validates: Requirements 11.3**

**Rationale:** Caching reduces API load and improves performance while ensuring data freshness.

### Property 9: Request Deduplication for Concurrent Requests

*For any* set of concurrent identical API requests, the DataFetchingService should make only one actual API call and return the same result to all callers.

**Validates: Requirements 11.6**

**Rationale:** Request deduplication prevents unnecessary API calls and reduces server load.

### Property 10: Multi-Tenant Isolation Enforcement

*For any* API request, the DataFetchingService should validate that business_id is present, and queries with different business_ids should return different data.

**Validates: Requirements 7.4, 11.4**

**Rationale:** Multi-tenant isolation ensures that users can only access data for their own business.

### Property 11: Form Validation Required Field Rejection

*For any* empty or null value, validateRequired should return invalid result with appropriate error message.

**Validates: Requirements 12.1**

**Rationale:** Required fields must be validated to prevent incomplete data submission.

### Property 12: Form Validation Number Range Enforcement

*For any* numeric value, validateNumber should accept values within the specified range and reject values outside the range.

**Validates: Requirements 12.2**

**Rationale:** Number validation ensures that numeric inputs are within acceptable bounds.

### Property 13: Form Validation Date Range Enforcement

*For any* date value, validateDate should accept dates within the specified range and reject dates outside the range.

**Validates: Requirements 12.3**

**Rationale:** Date validation ensures that date inputs are within acceptable bounds.

### Property 14: Form Validation Currency Precision Enforcement

*For any* currency value, validateCurrency should accept valid currency values with correct decimal places and reject invalid values.

**Validates: Requirements 12.4**

**Rationale:** Currency validation ensures that monetary values have correct precision for the specified currency.

### Property 15: Form Validation Batch Number Format Enforcement

*For any* batch number string, validateBatchNumber should accept strings matching the pattern (3-20 alphanumeric characters) and reject non-matching strings.

**Validates: Requirements 12.6**

**Rationale:** Batch number validation ensures consistent batch number formatting across the system.

### Property 16: Inventory Valuation Calculation Correctness

*For any* set of inventory batches and costing method (FIFO, LIFO, WAC), calculateInventoryValuation should return the correct valuation according to the specified costing method.

**Validates: Requirements 15.1**

**Rationale:** Inventory valuation must be calculated correctly according to the chosen costing method for accurate financial reporting.

### Property 17: Batch Expiry Severity Classification

*For any* batch with an expiry date, the system should classify it as critical (<30 days), warning (30-90 days), or normal (>90 days) based on days until expiry.

**Validates: Requirements 16.1, 16.2**

**Rationale:** Consistent batch expiry classification helps users prioritize actions on expiring inventory.

### Property 18: Low Stock Alert Identification

*For any* product, the system should identify it as low stock if and only if current_stock < minimum_stock_level.

**Validates: Requirements 17.1, 17.2**

**Rationale:** Low stock alerts must accurately identify products that need reordering.

### Property 19: Cycle Count Task Retrieval

*For any* user and business, getCycleCountTasks should return only cycle count tasks assigned to that user within that business.

**Validates: Requirements 18.1**

**Rationale:** Cycle count tasks must be filtered by user and business for proper task assignment.

### Property 20: Stock Transfer Approval Retrieval

*For any* business, getPendingStockTransfers should return only pending stock transfers for that business.

**Validates: Requirements 19.1**

**Rationale:** Stock transfer approvals must be filtered by business and status for proper approval workflow.

### Property 21: Permission-Based Widget Filtering

*For any* user with a set of permissions, widget filtering should return only widgets that the user has permission to access (widgets with no required permissions or widgets where the user has at least one required permission).

**Validates: Requirements 13.1, 13.2**

**Rationale:** Widget filtering ensures users only see widgets they have permission to access, maintaining security and reducing UI clutter.

### Property 22: Domain-Role Widget Merging Without Duplicates

*For any* domain and role combination, merging domain-specific widgets with role-specific widgets should produce a set containing both types with no duplicate widget IDs.

**Validates: Requirements 14.1, 14.5**

**Rationale:** Widget merging must combine domain and role widgets while eliminating duplicates to provide a clean widget set.

### Property 23: Domain Widget Prioritization in Layout

*For any* merged widget set containing both domain-specific and generic widgets, domain-specific widgets should appear before generic widgets in the layout.

**Validates: Requirements 14.4**

**Rationale:** Domain-specific widgets are more relevant to the user's business and should be prioritized in the layout.

### Property 24: Mode Preference Persistence Round-Trip

*For any* user, business, and mode preference, saving the preference then loading it should return the same mode value.

**Validates: Requirements 28.6**

**Rationale:** Mode preferences must be persisted correctly to maintain user's preferred dashboard experience across sessions.

### Property 25: Separate Layout Storage Per Mode

*For any* user and business, the system should maintain separate layout configurations for Advanced and Easy modes, and switching modes should not affect the layout of the other mode.

**Validates: Requirements 28.14**

**Rationale:** Separate layout storage per mode allows users to customize each mode independently without affecting the other.

### Property 26: Widget Loads Fetch Real API Data

*For any* widget, when it loads, it should make API calls to real endpoints rather than using mock data.

**Validates: Requirements 3.11**

**Rationale:** All widgets must fetch real data from APIs to provide accurate information to users.


## Error Handling

### Error Categories

The system categorizes errors into four types:

1. **Network Errors**: Connection failures, timeouts, DNS resolution failures
2. **Validation Errors**: Invalid input data, format violations, constraint violations
3. **Permission Errors**: Unauthorized access attempts, insufficient permissions
4. **System Errors**: Unexpected errors, internal server errors, unhandled exceptions

### Error Handling Strategy

**Widget-Level Error Handling**
```javascript
// Each widget wrapped in error boundary
<ErrorBoundary fallback={<ErrorState onRetry={refetch} />}>
  <WidgetComponent />
</ErrorBoundary>
```

**Dashboard-Level Error Handling**
```javascript
// Dashboard falls back to cached data on error
try {
  const data = await fetchDashboardMetrics(businessId);
  return data;
} catch (error) {
  const cached = getCachedData(businessId);
  if (cached) {
    console.warn('Using cached data due to error:', error);
    return cached;
  }
  throw error;
}
```

**Retry Strategy**
- Network errors: Retry with exponential backoff (3 attempts, 1s → 2s → 4s delays)
- Validation errors: No retry (user must fix input)
- Permission errors: No retry (user lacks permission)
- System errors: Retry once after 5s delay

**User-Friendly Error Messages**
- Network errors: "Network error. Please check your connection and try again."
- Validation errors: Specific field-level messages (e.g., "SKU must be unique")
- Permission errors: "You do not have permission to perform this action."
- System errors: "An unexpected error occurred. Please try again later."

**Error Logging and Monitoring**
- All errors logged with context (user, business, action, timestamp)
- Critical errors (system errors) sent to monitoring service
- Permission denials logged for security audit
- Error trends monitored for proactive issue detection

### Error Recovery

**Graceful Degradation**
- Widget fails → Show error state with retry button, other widgets continue working
- API fails → Fall back to cached data if available
- Layout load fails → Fall back to default layout
- Widget Registry lookup fails → Skip widget, log error, continue rendering other widgets

**User Actions on Error**
- Retry button: Attempt to refetch data
- Refresh button: Clear cache and refetch all data
- Reset button: Reset to default layout/configuration
- Contact support: Link to support with error details pre-filled

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Component rendering with specific props
- API integration with mock responses
- Error handling with specific error types
- User interactions (clicks, form submissions)
- Edge cases (empty data, missing fields, invalid inputs)

**Property-Based Tests**: Verify universal properties across all inputs
- Formatting functions preserve data integrity
- Widget Registry lookup correctness
- Layout serialization round-trip preservation
- Error categorization consistency
- Form validation enforcement
- Inventory calculation correctness

**Balance**: Unit tests focus on specific scenarios and integration points, while property tests handle comprehensive input coverage through randomization. Together they provide both concrete bug detection and general correctness verification.

### Property-Based Testing Configuration

**Library Selection**: fast-check (JavaScript/TypeScript property-based testing library)

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test tagged with reference to design document property
- Tag format: `Feature: dashboard-inventory-deep-consolidation, Property {number}: {property_text}`

**Example Property Test**:
```javascript
import fc from 'fast-check';

describe('Property 3: Dashboard Layout Round-Trip Preservation', () => {
  it('should preserve layout after export and import', () => {
    // Feature: dashboard-inventory-deep-consolidation, Property 3: Dashboard Layout Round-Trip Preservation
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.string(),
          position: fc.record({
            x: fc.integer({ min: 0, max: 12 }),
            y: fc.integer({ min: 0, max: 100 }),
            w: fc.integer({ min: 1, max: 4 }),
            h: fc.integer({ min: 1, max: 4 })
          })
        })),
        (widgets) => {
          const layout = { widgets };
          const exported = exportLayout(layout);
          const imported = importLayout(exported);
          expect(imported).toEqual(layout);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Component Tests**:
- Shared components (DashboardStatsGrid, DashboardLoadingSkeleton, RevenueChartSection)
- Extracted widgets (TeamPerformanceWidget, InventoryAlertsWidget, etc.)
- Mode toggle component
- Error and empty state components

**Service Tests**:
- ErrorHandlingService (error categorization, retry logic)
- DataFetchingService (authentication, caching, deduplication)
- FormValidationService (validation rules)
- ModePreferenceService (preference persistence)

**Integration Tests**:
- Dashboard-inventory integration points
- Widget Registry integration with dashboard templates
- Permission-based widget filtering
- Domain-role widget merging
- Mode switching with layout preservation

**End-to-End Tests**:
- Dashboard load with real data
- Widget customization and layout persistence
- Stock adjustment workflow
- Mode switching workflow
- Layout export and import

### Test Coverage Goals

- Overall code coverage: >80%
- Shared components: 100% (critical reusable components)
- Services: 100% (critical business logic)
- Widgets: >80% (many widgets, focus on critical paths)
- Integration points: 100% (critical for dashboard-inventory integration)

### Testing Mock Data Elimination

**Verification Strategy**:
- Unit tests verify that widgets call API endpoints (not mock data)
- Integration tests verify that API endpoints return real data
- End-to-end tests verify that dashboard displays real data

**Example Test**:
```javascript
describe('Mock Data Elimination', () => {
  it('should fetch real data from API', async () => {
    const fetchSpy = jest.spyOn(DataFetchingService, 'fetchWithCache');
    
    render(<TeamPerformanceWidget businessId="test-business" />);
    
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/team-performance'),
        expect.any(Object)
      );
    });
    
    // Verify no mock data used
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('mock'),
      expect.any(Object)
    );
  });
});
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Extract centralized utilities (formatCurrency, formatDateTime, formatNumber, formatPercentage)
- Implement unified services (ErrorHandlingService, DataFetchingService, FormValidationService)
- Implement Widget Registry
- Write property-based tests for utilities and services

### Phase 2: Shared Components (Weeks 3-4)
- Implement shared components (DashboardStatsGrid, DashboardLoadingSkeleton, RevenueChartSection, StatsCard, WidgetContainer, EmptyState, ErrorState)
- Write unit tests for shared components
- Update existing components to use shared components

### Phase 3: Widget Extraction (Weeks 5-6)
- Extract inline widgets into separate components
- Register all widgets in Widget Registry
- Replace mock data with real API calls in all widgets
- Write unit tests for extracted widgets

### Phase 4: Dashboard Refactoring (Weeks 7-8)
- Refactor dashboard templates to use shared components and extracted widgets
- Reduce component sizes to <300 lines
- Implement permission-based widget filtering
- Implement domain-role widget merging
- Write integration tests for dashboard templates

### Phase 5: Advanced/Easy Mode (Week 9)
- Implement mode toggle component
- Implement mode preference persistence
- Implement separate layout storage per mode
- Implement mode switching with layout preservation
- Write unit and integration tests for mode switching

### Phase 6: Dashboard-Inventory Integration (Weeks 10-11)
- Implement inventory valuation integration
- Implement batch expiry alert integration
- Implement low stock alert integration
- Implement cycle count task integration
- Implement stock transfer approval integration
- Implement serial warranty status integration
- Implement warehouse distribution integration
- Write integration tests for all integration points

### Phase 7: Layout Persistence & Serialization (Week 12)
- Implement layout persistence (save/load)
- Implement layout export/import with JSON serialization
- Implement layout reset-to-default
- Implement layout versioning
- Write property-based tests for serialization

### Phase 8: Product Data Import/Export (Week 13)
- Implement product data export to Excel
- Implement product data import from Excel
- Implement Excel template generation
- Implement data validation during import
- Write property-based tests for import/export

### Phase 9: Missing Implementations (Weeks 14-15)
- Complete dashboard Phase 3-5 missing implementations
- Complete inventory Phase 3-4 missing implementations
- Implement multi-tenant isolation
- Implement performance optimizations
- Implement real-time updates via WebSocket

### Phase 10: Testing & Polish (Weeks 16-17)
- Achieve >80% test coverage
- Fix all failing tests
- Perform accessibility audit
- Perform performance audit
- Write documentation

### Phase 11: Migration & Deployment (Week 18)
- Create migration scripts
- Implement feature flags for gradual rollout
- Deploy to staging environment
- Perform user acceptance testing
- Deploy to production

## Success Metrics

### Code Quality Metrics
- Code duplication rate: <10% (from 25-30%)
- Duplicate utility code: <50 lines (from 500-700 lines)
- Components >300 lines: 0 (from 5)
- Average component size: <250 lines (from 400+ lines)
- Mock data usage: 0% (from 100%)
- Test coverage: >80%

### Integration Metrics
- Dashboard-inventory integration points: 10+ (from 2)
- Widget Registry size: 25+ widgets
- Shared component reuse: 100% (all dashboards use shared components)

### Performance Metrics
- Dashboard load time: <2 seconds
- Widget load time: <1 second
- API response time: <500ms (with caching)
- Cache hit rate: >70%

### User Experience Metrics
- Mode switching time: <300ms (animation duration)
- Layout persistence success rate: 100%
- Error recovery success rate: >95%
- Accessibility compliance: WCAG 2.1 AA (manual verification required)

