# Design Document: Enterprise Dashboard Consolidation & Enhancement

## Overview

This design document specifies the technical architecture for consolidating and enhancing the enterprise dashboard system. The enhancement addresses 15 critical gaps identified in the gap analysis, including missing inventory integration, navigation duplication, lack of domain-specific dashboards, incomplete header functionality, and insufficient Pakistani market features.

### Goals

1. **Inventory Integration**: Display real-time inventory metrics (valuation, batch expiry, serial warranty, warehouse distribution) on the dashboard
2. **Domain-Specific Dashboards**: Implement 5+ category-specific dashboard templates (Pharmacy, Textile, Electronics, Garments, General Retail)
3. **Easy Mode**: Create simplified interface for Pakistani SME users with large buttons, Urdu support, and guided workflows
4. **Navigation Consolidation**: Unify landing page and app navigation, reduce clicks from 3+ to 1-2
5. **Enhanced Header**: Add business switcher, language toggle, mode switcher, and expanded quick actions
6. **Role-Based Views**: Implement dashboards tailored to user roles (Owner, Manager, Sales Staff, Inventory Staff, Accountant)
7. **Pakistani Market Features**: Add FBR compliance widgets, seasonal performance tracking, city-wise sales analysis
8. **Smart Widgets**: Enable drag-and-drop customization with 18+ widget types
9. **Mobile Optimization**: Ensure 100% mobile responsiveness with touch-optimized controls
10. **Real-Time Updates**: Implement WebSocket-based live data synchronization (<2 second latency)

### Success Criteria

- Dashboard load time <2 seconds
- Navigation reduced to 1-2 clicks for common actions
- 90% user preference for Easy Mode (Pakistani SMEs)
- 100% mobile responsiveness (320px - 2560px)
- Real-time updates <2 second latency
- All 18+ widgets functional and customizable


## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Enhanced Header                          │
│  [Logo] [Business Switcher] [Search] [Quick Actions]       │
│  [Mode Toggle] [Language] [Notifications] [User Menu]      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Dashboard Controller                        │
│  - Role Detection                                           │
│  - Domain Detection                                         │
│  - Mode Management (Easy/Advanced)                          │
│  - Widget Registry                                          │
│  - Layout Engine                                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Domain     │   │     Role     │   │    Mode      │
│  Templates   │   │  Templates   │   │  Templates   │
│              │   │              │   │              │
│ - Pharmacy   │   │ - Owner      │   │ - Easy       │
│ - Textile    │   │ - Manager    │   │ - Advanced   │
│ - Electronics│   │ - Sales      │   │              │
│ - Garments   │   │ - Inventory  │   │              │
│ - Retail     │   │ - Accountant │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Widget System                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Revenue  │ │Inventory │ │  Batch   │ │ Serial   │      │
│  │  Chart   │ │Valuation │ │  Expiry  │ │ Warranty │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Warehouse │ │   FBR    │ │ Seasonal │ │City-wise │      │
│  │  Stock   │ │Compliance│ │Performance│ │  Sales   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ... (18+ total widgets)                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  - Supabase Realtime (WebSocket)                           │
│  - Server Actions (Next.js 14)                             │
│  - Local State (React Context)                             │
│  - Cache Layer (React Query)                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Framer Motion
- **State Management**: React Context API, React Query
- **Real-Time**: Supabase Realtime (WebSocket)
- **Charts**: Recharts, React-Grid-Layout (drag-and-drop)
- **Localization**: Custom translation system with RTL support
- **Mobile**: Responsive design, touch gestures, PWA capabilities


## Components and Interfaces

### 1. Enhanced Header Component

**File**: `components/layout/EnhancedHeader.jsx`

**Props**:
```typescript
interface EnhancedHeaderProps {
  user: User;
  businesses: Business[];
  currentBusiness: Business;
  mode: 'easy' | 'advanced';
  onBusinessSwitch: (businessId: string) => void;
  onModeToggle: () => void;
  onLanguageChange: (lang: 'en' | 'ur') => void;
}
```

**Features**:
- Business switcher dropdown (multi-business support)
- Mode toggle button (Easy/Advanced)
- Language toggle with flag icons (EN/UR)
- Enhanced search with barcode scanner integration
- Expanded quick actions menu (12+ actions)
- Smart notifications with priority sorting
- User profile menu with role badge
- Keyboard shortcuts panel (Ctrl+K)

**State Management**:
```typescript
const [selectedBusiness, setSelectedBusiness] = useState<string>();
const [mode, setMode] = useState<'easy' | 'advanced'>('advanced');
const [language, setLanguage] = useState<'en' | 'ur'>('en');
const [notifications, setNotifications] = useState<Notification[]>([]);
```

### 2. Dashboard Controller Component

**File**: `components/dashboard/DashboardController.jsx`

**Props**:
```typescript
interface DashboardControllerProps {
  businessId: string;
  category: string;
  userRole: UserRole;
  mode: 'easy' | 'advanced';
  language: 'en' | 'ur';
}
```

**Responsibilities**:
- Detect user role and business category
- Load appropriate dashboard template
- Manage widget registry and layout
- Handle real-time data subscriptions
- Coordinate widget interactions
- Persist user customizations

**Template Selection Logic**:
```typescript
function selectDashboardTemplate(category: string, role: UserRole, mode: string) {
  // Priority: Mode > Role > Domain
  if (mode === 'easy') {
    return EasyModeDashboard;
  }
  
  const roleTemplate = getRoleTemplate(role);
  const domainTemplate = getDomainTemplate(category);
  
  return mergeTemplates(roleTemplate, domainTemplate);
}
```


### 3. Domain-Specific Dashboard Templates

#### 3.1 Pharmacy Dashboard

**File**: `components/dashboard/templates/PharmacyDashboard.jsx`

**Widgets**:
1. Drug Expiry Calendar (90-day alerts)
2. FBR Compliance Status
3. Controlled Substance Tracking
4. Prescription Capture Rate
5. Batch-wise Stock Valuation
6. Supplier Performance Analysis
7. Revenue Chart
8. Low Stock Alerts

**Layout** (4x4 grid):
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Revenue     │  Drug Expiry │  FBR Status  │  Low Stock   │
│  Chart       │  Calendar    │              │  Alerts      │
│  (2x2)       │  (1x2)       │  (1x1)       │  (1x1)       │
├──────────────┼──────────────┼──────────────┼──────────────┤
│              │  Controlled  │  Prescription│  Supplier    │
│              │  Substances  │  Rate        │  Performance │
│              │  (1x1)       │  (1x1)       │  (1x1)       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### 3.2 Textile Dashboard

**File**: `components/dashboard/templates/TextileDashboard.jsx`

**Widgets**:
1. Roll/Bale Inventory Summary
2. Fabric Type Distribution
3. Cutting Efficiency Metrics
4. Seasonal Demand Forecast
5. Market-wise Sales (Faisalabad, Karachi, Lahore)
6. Finish Status Breakdown
7. Revenue Chart
8. Warehouse Distribution

#### 3.3 Electronics Dashboard

**File**: `components/dashboard/templates/ElectronicsDashboard.jsx`

**Widgets**:
1. Serial Tracking Status
2. Warranty Expiry Calendar
3. IMEI Registration Compliance
4. Brand-wise Sales Performance
5. Return/Repair Rate
6. Supplier Warranty Claims
7. Revenue Chart
8. Low Stock Alerts

#### 3.4 Garments Dashboard

**File**: `components/dashboard/templates/GarmentsDashboard.jsx`

**Widgets**:
1. Size-Color Matrix Stock Status
2. Lot-wise Inventory
3. Seasonal Collection Performance
4. Style-wise Sales Trends
5. Quality Grade Distribution
6. Production vs Sales Gap
7. Revenue Chart
8. Warehouse Distribution

#### 3.5 General Retail Dashboard

**File**: `components/dashboard/templates/RetailDashboard.jsx`

**Widgets**:
1. Category-wise Performance
2. Fast-moving vs Slow-moving Items
3. Margin Analysis
4. Customer Loyalty Metrics
5. Seasonal Trends
6. Market Basket Analysis
7. Revenue Chart
8. Low Stock Alerts


### 4. Role-Based Dashboard Templates

#### 4.1 Owner/Admin Dashboard

**File**: `components/dashboard/templates/OwnerDashboard.jsx`

**Sections**:
- Complete business overview
- Financial summary (revenue, expenses, profit)
- Team performance metrics
- System health indicators
- Audit logs viewer
- Settings quick access
- All widgets available

#### 4.2 Manager Dashboard

**File**: `components/dashboard/templates/ManagerDashboard.jsx`

**Sections**:
- Department performance
- Approval queue (prominent)
- Team productivity metrics
- Inventory alerts
- Sales targets progress
- Reports access

#### 4.3 Sales Staff Dashboard

**File**: `components/dashboard/templates/SalesDashboard.jsx`

**Sections**:
- Today's sales summary
- Customer list (quick access)
- Quick invoice creation
- Product catalog
- Payment collection status
- Commission tracking

#### 4.4 Inventory Staff Dashboard

**File**: `components/dashboard/templates/InventoryDashboard.jsx`

**Sections**:
- Stock levels (all locations)
- Reorder alerts (prominent)
- Batch/serial management
- Stock transfers
- Cycle counting tasks
- Receiving goods queue

#### 4.5 Accountant Dashboard

**File**: `components/dashboard/templates/AccountantDashboard.jsx`

**Sections**:
- Financial summary
- Tax calculations (PST/FST)
- Expense tracking
- Profit/loss analysis
- Bank reconciliation
- FBR compliance status


### 5. Easy Mode Dashboard

**File**: `components/dashboard/EasyModeDashboard.jsx`

**Design Principles**:
- Single-page layout (no tabs)
- Large, colorful tiles (≥44px touch targets)
- Urdu labels with English subtitles
- Minimal clicks (1-2 max)
- Voice guidance support
- Contextual help bubbles
- Step-by-step wizards

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  TENVO - آسان موڈ (Easy Mode)                               │
│  [Switch to Advanced] [مدد Help] [ترتیبات Settings]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  نیا بل      │  │  نیا سامان   │  │  اسٹاک       │    │
│  │ New Invoice  │  │ New Product  │  │  Stock       │    │
│  │   [Icon]     │  │   [Icon]     │  │  [Icon]      │    │
│  │   120x120px  │  │   120x120px  │  │  120x120px   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  گاہک        │  │  رپورٹ       │  │  ترتیبات     │    │
│  │  Customer    │  │  Reports     │  │  Settings    │    │
│  │   [Icon]     │  │   [Icon]     │  │  [Icon]      │    │
│  │   120x120px  │  │   120x120px  │  │  120x120px   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  آج کا خلاصہ / Today's Summary                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Sales: Rs 45,000  |  Orders: 12                       │ │
│  │ Stock Value: Rs 2.5L | Low Stock: 3                   │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- 6 large action tiles (primary actions)
- Today's summary card (key metrics)
- Voice commands (future): "نیا بل بنائیں" (Create new invoice)
- Guided workflows with tooltips
- Automatic language detection
- Offline mode indicators


### 6. Widget System

**File**: `components/dashboard/widgets/WidgetRegistry.js`

**Widget Interface**:
```typescript
interface Widget {
  id: string;
  name: string;
  category: 'inventory' | 'sales' | 'finance' | 'pakistani' | 'general';
  component: React.ComponentType;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
  requiredPermissions: string[];
  requiredDomains?: string[];
  refreshInterval?: number; // milliseconds
}
```

**Available Widgets** (18+ total):

1. **Revenue Chart Widget** (`RevenueChartWidget.jsx`)
   - Area chart with revenue vs expenses
   - Time range selector (day, week, month, year)
   - Export to PDF/Excel

2. **Inventory Valuation Widget** (`InventoryValuationWidget.jsx`)
   - Real-time valuation (FIFO/LIFO/WAC)
   - Breakdown by category
   - Trend analysis

3. **Batch Expiry Widget** (`BatchExpiryWidget.jsx`)
   - Calendar view of expiring batches
   - Color-coded alerts (green >90 days, yellow 30-90, red <30)
   - Quick action: Return to supplier

4. **Serial Warranty Widget** (`SerialWarrantyWidget.jsx`)
   - Warranty status dashboard
   - Expiring warranties countdown
   - Claim tracking

5. **Warehouse Distribution Widget** (`WarehouseDistributionWidget.jsx`)
   - Stock levels by location
   - Interactive map (Pakistan cities)
   - Transfer quick actions

6. **Low Stock Alerts Widget** (`LowStockAlertsWidget.jsx`)
   - Products below minimum stock
   - Reorder recommendations
   - Quick PO creation

7. **FBR Compliance Widget** (`FBRComplianceWidget.jsx`)
   - Filing status indicator
   - Sales tax summary (PST/FST)
   - Next filing deadline

8. **Seasonal Performance Widget** (`SeasonalPerformanceWidget.jsx`)
   - Current season indicator
   - Sales comparison (YoY)
   - Demand forecast

9. **City-wise Sales Widget** (`CityWiseSalesWidget.jsx`)
   - Pakistan map with sales heatmap
   - Top cities ranking
   - Regional trends

10. **Top Products Widget** (`TopProductsWidget.jsx`)
    - Best sellers ranking
    - Revenue contribution
    - Stock status

11. **Top Customers Widget** (`TopCustomersWidget.jsx`)
    - Customer ranking by revenue
    - Loyalty status
    - Recent orders

12. **Payment Collection Widget** (`PaymentCollectionWidget.jsx`)
    - Outstanding invoices
    - Collection rate
    - Overdue alerts

13. **Quick Actions Widget** (`QuickActionsWidget.jsx`)
    - Customizable action buttons
    - Keyboard shortcuts display
    - Recent actions history

14. **Recent Activity Widget** (`RecentActivityWidget.jsx`)
    - Timeline of recent events
    - Filterable by type
    - Quick navigation

15. **Pending Approvals Widget** (`PendingApprovalsWidget.jsx`)
    - Approval queue
    - Priority sorting
    - One-click approve/reject

16. **Team Performance Widget** (`TeamPerformanceWidget.jsx`)
    - Sales by team member
    - Productivity metrics
    - Leaderboard

17. **Market Trends Widget** (`MarketTrendsWidget.jsx`)
    - Pakistani market insights
    - Seasonal trends
    - Category performance

18. **System Health Widget** (`SystemHealthWidget.jsx`)
    - Server status
    - Database performance
    - Error logs


### 7. Widget Customization System

**File**: `components/dashboard/WidgetCustomizer.jsx`

**Features**:
- Drag-and-drop widget arrangement (react-grid-layout)
- Add/remove widgets from library
- Resize widgets (within min/max constraints)
- Save multiple layout presets
- Export/import layouts
- Reset to default

**Layout Persistence**:
```typescript
interface DashboardLayout {
  userId: string;
  businessId: string;
  layoutName: string;
  isDefault: boolean;
  widgets: WidgetConfig[];
  createdAt: Date;
  updatedAt: Date;
}

interface WidgetConfig {
  widgetId: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  settings: Record<string, any>;
}
```

**Database Schema**:
```sql
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  layout_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  widgets JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dashboard_layouts_user ON dashboard_layouts(user_id);
CREATE INDEX idx_dashboard_layouts_business ON dashboard_layouts(business_id);
```


## Data Models

### 1. Dashboard Configuration

```typescript
interface DashboardConfig {
  id: string;
  userId: string;
  businessId: string;
  mode: 'easy' | 'advanced';
  language: 'en' | 'ur';
  theme: 'light' | 'dark';
  currentLayout: string; // layout ID
  preferences: {
    showWelcome: boolean;
    autoRefresh: boolean;
    refreshInterval: number; // seconds
    notifications: {
      enabled: boolean;
      sound: boolean;
      desktop: boolean;
    };
    keyboardShortcuts: boolean;
  };
}
```

### 2. Widget Data Models

#### Inventory Valuation
```typescript
interface InventoryValuation {
  totalValue: number;
  costingMethod: 'FIFO' | 'LIFO' | 'WAC';
  byCategory: {
    category: string;
    value: number;
    quantity: number;
    percentage: number;
  }[];
  trend: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
}
```

#### Batch Expiry
```typescript
interface BatchExpiryData {
  expiringBatches: {
    batchId: string;
    productName: string;
    batchNumber: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    quantity: number;
    value: number;
    severity: 'critical' | 'warning' | 'normal';
  }[];
  summary: {
    critical: number; // <30 days
    warning: number;  // 30-90 days
    normal: number;   // >90 days
  };
}
```

#### Serial Warranty
```typescript
interface SerialWarrantyData {
  activeWarranties: number;
  expiringWarranties: number; // <30 days
  expiredWarranties: number;
  byStatus: {
    status: 'active' | 'expiring' | 'expired';
    count: number;
    value: number;
  }[];
  upcomingExpirations: {
    serialNumber: string;
    productName: string;
    warrantyEndDate: Date;
    daysRemaining: number;
  }[];
}
```

#### Warehouse Distribution
```typescript
interface WarehouseDistribution {
  warehouses: {
    warehouseId: string;
    name: string;
    city: string;
    totalValue: number;
    productCount: number;
    lowStockCount: number;
    coordinates?: { lat: number; lng: number };
  }[];
  totalValue: number;
  totalProducts: number;
}
```

#### FBR Compliance
```typescript
interface FBRComplianceData {
  filingStatus: 'current' | 'due' | 'overdue';
  nextFilingDate: Date;
  daysUntilFiling: number;
  salesTax: {
    pst: number;
    fst: number;
    total: number;
  };
  recentFilings: {
    date: Date;
    type: string;
    status: 'filed' | 'pending';
  }[];
}
```

#### Seasonal Performance
```typescript
interface SeasonalPerformanceData {
  currentSeason: {
    name: string; // 'Eid', 'Summer', 'Winter', 'Monsoon'
    startDate: Date;
    endDate: Date;
    daysRemaining: number;
  };
  performance: {
    currentSales: number;
    targetSales: number;
    achievement: number; // percentage
    yoyGrowth: number;
  };
  topCategories: {
    category: string;
    sales: number;
    growth: number;
  }[];
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Inventory Metrics Display

*For any* dashboard load with inventory data, the system should display inventory valuation calculated using the configured costing method (FIFO/LIFO/WAC), and the displayed value should match the sum of all product valuations.

**Validates: Requirements 1.1**

### Property 2: Batch Expiry Accuracy

*For any* set of batches with expiry dates, the batch expiry widget should display only batches expiring within the configured threshold (default 90 days), sorted by expiry date ascending (FEFO), and the count should match the number of batches meeting the criteria.

**Validates: Requirements 1.2**

### Property 3: Serial Warranty Calculation

*For any* serial number with a warranty period, the warranty status should be correctly calculated as: active (end date > current date), expiring (end date within 30 days), or expired (end date < current date), and the displayed status should match this calculation.

**Validates: Requirements 1.3**

### Property 4: Warehouse Distribution Accuracy

*For any* set of warehouses with stock data, the warehouse distribution widget should display the correct stock quantity for each location, and the sum of all location quantities should equal the total product quantity.

**Validates: Requirements 1.4**

### Property 5: Domain Template Selection

*For any* business category selection, the system should load the corresponding domain-specific dashboard template, and the displayed widgets should match the template definition for that category.

**Validates: Requirements 2.1**

### Property 6: Easy Mode Interface Transformation

*For any* mode toggle action, switching to Easy Mode should transform the interface to display large buttons (≥44px), Urdu labels, and simplified navigation, while switching to Advanced Mode should restore the full feature set.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Navigation Click Efficiency

*For any* common action (create invoice, add product, view reports), the number of clicks required to complete the action should not exceed 2 when using quick actions or keyboard shortcuts.

**Validates: Requirements 4.1**

### Property 8: Keyboard Shortcut Execution

*For any* registered keyboard shortcut, pressing the shortcut key combination should execute the corresponding action immediately without requiring additional clicks.

**Validates: Requirements 4.2**

### Property 9: Business Context Switching

*For any* business switch action in a multi-business account, the dashboard should reload with data specific to the selected business, and no data from the previous business should remain visible.

**Validates: Requirements 5.1, 5.2**

### Property 10: Language Switching Completeness

*For any* language change action, all UI text elements (labels, buttons, tooltips, error messages) should update to the selected language, and no untranslated text should remain visible.

**Validates: Requirements 5.4**

### Property 11: Role-Based Dashboard Filtering

*For any* user role, the dashboard should display only widgets and actions that the role has permission to access, and attempting to access restricted features should be prevented.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 12: Mobile Layout Adaptation

*For any* screen width below 768px, the dashboard should automatically switch to mobile-optimized layout with stacked widgets, bottom navigation, and touch-optimized controls (≥44px touch targets).

**Validates: Requirements 7.1, 7.2**

### Property 13: Widget Arrangement Persistence

*For any* widget arrangement customization, the layout should be saved to the database, and reloading the dashboard should restore the exact same arrangement.

**Validates: Requirements 8.1, 8.2**

### Property 14: Real-Time Data Synchronization

*For any* data update event (new sale, stock adjustment, etc.), the dashboard should reflect the change within 2 seconds via WebSocket connection, and the updated data should be accurate.

**Validates: Requirements 10.1**

### Property 15: Manual Refresh Completeness

*For any* manual refresh action, all widgets should reload their data from the server, and the refresh should complete within 3 seconds for dashboards with up to 10 widgets.

**Validates: Requirements 10.2**


## Error Handling

### 1. Data Loading Errors

**Scenario**: Widget fails to load data from server

**Handling**:
- Display error state in widget with retry button
- Log error to monitoring system
- Show user-friendly error message
- Provide fallback to cached data if available
- Auto-retry with exponential backoff (1s, 2s, 4s)

**Example**:
```typescript
try {
  const data = await fetchWidgetData(widgetId);
  setWidgetData(data);
} catch (error) {
  console.error(`Widget ${widgetId} failed to load:`, error);
  setWidgetError({
    message: 'Failed to load data. Click to retry.',
    canRetry: true,
    fallbackData: getCachedData(widgetId)
  });
  scheduleRetry(widgetId, retryCount);
}
```

### 2. Real-Time Connection Errors

**Scenario**: WebSocket connection drops

**Handling**:
- Display connection status indicator
- Attempt automatic reconnection
- Queue updates during disconnection
- Sync queued updates on reconnection
- Notify user if offline >30 seconds

**Example**:
```typescript
supabase
  .channel('dashboard')
  .on('postgres_changes', { event: '*', schema: 'public' }, handleChange)
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      setConnectionStatus('disconnected');
      attemptReconnection();
    }
  });
```

### 3. Permission Errors

**Scenario**: User attempts to access restricted widget/action

**Handling**:
- Hide restricted widgets from UI
- Show permission denied message if accessed directly
- Log unauthorized access attempts
- Redirect to appropriate dashboard view

**Example**:
```typescript
if (!hasPermission(user.role, widget.requiredPermissions)) {
  return (
    <WidgetPlaceholder>
      <Lock className="w-8 h-8 text-gray-300" />
      <p>You don't have permission to view this widget</p>
    </WidgetPlaceholder>
  );
}
```

### 4. Layout Errors

**Scenario**: Saved layout is corrupted or incompatible

**Handling**:
- Validate layout structure on load
- Fall back to default layout if invalid
- Notify user of layout reset
- Preserve backup of previous layout

**Example**:
```typescript
function loadDashboardLayout(layoutId) {
  try {
    const layout = validateLayout(layoutId);
    return layout;
  } catch (error) {
    console.error('Invalid layout, using default:', error);
    notifyUser('Your dashboard layout was reset to default');
    return getDefaultLayout(user.role, business.category);
  }
}
```

### 5. Mobile Rendering Errors

**Scenario**: Widget fails to render on mobile

**Handling**:
- Detect mobile viewport
- Use mobile-optimized components
- Gracefully degrade complex visualizations
- Provide alternative mobile views

**Example**:
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

if (isMobile && widget.requiresDesktop) {
  return (
    <MobileNotSupported>
      <p>This widget is best viewed on desktop</p>
      <Button onClick={openInDesktopMode}>View in Desktop Mode</Button>
    </MobileNotSupported>
  );
}
```


## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary for comprehensive coverage

### Unit Testing

**Focus Areas**:
- Specific widget rendering scenarios
- User interaction flows (click, drag, keyboard)
- Error state handling
- Edge cases (empty data, missing permissions)
- Integration between components

**Example Unit Tests**:

```typescript
// Widget rendering
describe('InventoryValuationWidget', () => {
  it('should display FIFO valuation correctly', () => {
    const data = { totalValue: 100000, costingMethod: 'FIFO' };
    render(<InventoryValuationWidget data={data} />);
    expect(screen.getByText('Rs 100,000')).toBeInTheDocument();
    expect(screen.getByText('FIFO')).toBeInTheDocument();
  });

  it('should show loading state while fetching data', () => {
    render(<InventoryValuationWidget loading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(<InventoryValuationWidget data={null} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});

// Mode switching
describe('DashboardController', () => {
  it('should switch to Easy Mode when toggled', () => {
    const { rerender } = render(<DashboardController mode="advanced" />);
    fireEvent.click(screen.getByText('Switch to Easy Mode'));
    rerender(<DashboardController mode="easy" />);
    expect(screen.getByText('آسان موڈ')).toBeInTheDocument();
  });
});

// Permission handling
describe('WidgetPermissions', () => {
  it('should hide restricted widgets for non-admin users', () => {
    const user = { role: 'sales_staff' };
    render(<DashboardController user={user} />);
    expect(screen.queryByTestId('system-health-widget')).not.toBeInTheDocument();
  });
});
```

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript)

**Configuration**: Minimum 100 iterations per property test

**Test Tagging Format**: 
```typescript
// Feature: dashboard-enterprise-enhancement, Property 1: Inventory Metrics Display
```

**Example Property Tests**:

```typescript
import fc from 'fast-check';

// Property 1: Inventory Metrics Display
describe('Property 1: Inventory Metrics Display', () => {
  it('should display correct inventory valuation for any product set', () => {
    // Feature: dashboard-enterprise-enhancement, Property 1: Inventory Metrics Display
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          quantity: fc.integer({ min: 0, max: 1000 }),
          cost: fc.float({ min: 0, max: 10000 })
        })),
        fc.constantFrom('FIFO', 'LIFO', 'WAC'),
        (products, method) => {
          const expectedValue = calculateValuation(products, method);
          const widget = renderWidget({ products, method });
          const displayedValue = extractDisplayedValue(widget);
          return Math.abs(displayedValue - expectedValue) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 2: Batch Expiry Accuracy
describe('Property 2: Batch Expiry Accuracy', () => {
  it('should display only batches expiring within threshold', () => {
    // Feature: dashboard-enterprise-enhancement, Property 2: Batch Expiry Accuracy
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          expiryDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
        })),
        fc.integer({ min: 1, max: 365 }),
        (batches, thresholdDays) => {
          const widget = renderBatchExpiryWidget({ batches, thresholdDays });
          const displayedBatches = extractDisplayedBatches(widget);
          const now = new Date();
          const threshold = new Date(now.getTime() + thresholdDays * 24 * 60 * 60 * 1000);
          
          return displayedBatches.every(batch => 
            batch.expiryDate <= threshold && batch.expiryDate >= now
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 4: Warehouse Distribution Accuracy
describe('Property 4: Warehouse Distribution Accuracy', () => {
  it('should sum warehouse quantities to equal total quantity', () => {
    // Feature: dashboard-enterprise-enhancement, Property 4: Warehouse Distribution Accuracy
    fc.assert(
      fc.property(
        fc.array(fc.record({
          warehouseId: fc.uuid(),
          quantity: fc.integer({ min: 0, max: 1000 })
        }), { minLength: 1 }),
        (warehouses) => {
          const widget = renderWarehouseWidget({ warehouses });
          const displayedTotal = extractTotalQuantity(widget);
          const expectedTotal = warehouses.reduce((sum, w) => sum + w.quantity, 0);
          return displayedTotal === expectedTotal;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 7: Navigation Click Efficiency
describe('Property 7: Navigation Click Efficiency', () => {
  it('should complete any common action in ≤2 clicks', () => {
    // Feature: dashboard-enterprise-enhancement, Property 7: Navigation Click Efficiency
    fc.assert(
      fc.property(
        fc.constantFrom('create-invoice', 'add-product', 'view-reports', 'new-customer'),
        (action) => {
          const clickCount = simulateActionFlow(action);
          return clickCount <= 2;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 10: Language Switching Completeness
describe('Property 10: Language Switching Completeness', () => {
  it('should translate all text elements when language changes', () => {
    // Feature: dashboard-enterprise-enhancement, Property 10: Language Switching Completeness
    fc.assert(
      fc.property(
        fc.constantFrom('en', 'ur'),
        (language) => {
          const dashboard = renderDashboard({ language });
          const textElements = extractAllTextElements(dashboard);
          const untranslatedCount = textElements.filter(text => 
            !isTranslated(text, language)
          ).length;
          return untranslatedCount === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 12: Mobile Layout Adaptation
describe('Property 12: Mobile Layout Adaptation', () => {
  it('should use mobile layout for any width <768px', () => {
    // Feature: dashboard-enterprise-enhancement, Property 12: Mobile Layout Adaptation
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }),
        (width) => {
          const dashboard = renderDashboard({ viewportWidth: width });
          const touchTargets = extractTouchTargets(dashboard);
          return touchTargets.every(target => 
            target.width >= 44 && target.height >= 44
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 14: Real-Time Data Synchronization
describe('Property 14: Real-Time Data Synchronization', () => {
  it('should reflect data changes within 2 seconds', () => {
    // Feature: dashboard-enterprise-enhancement, Property 14: Real-Time Data Synchronization
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('sale', 'stock_adjustment', 'new_product'),
          data: fc.anything()
        }),
        async (event) => {
          const startTime = Date.now();
          const dashboard = renderDashboard();
          await simulateDataChange(event);
          const updateTime = await waitForDashboardUpdate(dashboard);
          const latency = updateTime - startTime;
          return latency < 2000;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Focus**: End-to-end user workflows

**Test Scenarios**:
1. User logs in → Dashboard loads with correct template → Widgets display data
2. User switches business → Dashboard reloads → Data updates correctly
3. User customizes layout → Saves → Reloads → Layout persists
4. User toggles Easy Mode → Interface transforms → Actions work correctly
5. User changes language → All text updates → RTL layout applies (Urdu)

### Performance Testing

**Metrics to Track**:
- Dashboard initial load time: <2 seconds
- Widget render time: <100ms per widget
- Real-time update latency: <2 seconds
- Layout save time: <500ms
- Mobile performance score: >90 (Lighthouse)

**Tools**:
- Lighthouse (performance auditing)
- React DevTools Profiler
- Chrome DevTools Performance tab
- WebSocket latency monitoring

### Accessibility Testing

**Requirements**:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios ≥4.5:1
- Touch target sizes ≥44px

**Tools**:
- axe DevTools
- WAVE browser extension
- Manual keyboard testing
- Screen reader testing (NVDA, JAWS)


## Implementation Notes

### Phase 1: Foundation (Week 1-2)

**Tasks**:
1. Create database schema for dashboard layouts
2. Implement DashboardController component
3. Create widget registry system
4. Set up real-time WebSocket connections
5. Implement basic widget loading and error handling

**Deliverables**:
- Database migration file
- DashboardController component
- WidgetRegistry service
- Real-time subscription hooks

### Phase 2: Core Widgets (Week 3-4)

**Tasks**:
1. Implement 8 essential widgets:
   - Revenue Chart
   - Inventory Valuation
   - Batch Expiry
   - Serial Warranty
   - Warehouse Distribution
   - Low Stock Alerts
   - Quick Actions
   - Recent Activity
2. Add widget error states and loading states
3. Implement widget refresh logic

**Deliverables**:
- 8 production-ready widgets
- Widget testing suite
- Widget documentation

### Phase 3: Domain Templates (Week 5-6)

**Tasks**:
1. Create 5 domain-specific templates:
   - Pharmacy Dashboard
   - Textile Dashboard
   - Electronics Dashboard
   - Garments Dashboard
   - General Retail Dashboard
2. Implement template selection logic
3. Add domain-specific widgets (FBR, Seasonal, etc.)

**Deliverables**:
- 5 domain templates
- Template selection system
- Domain-specific widgets

### Phase 4: Role-Based Views (Week 7)

**Tasks**:
1. Create 5 role-based templates:
   - Owner Dashboard
   - Manager Dashboard
   - Sales Staff Dashboard
   - Inventory Staff Dashboard
   - Accountant Dashboard
2. Implement permission checking
3. Add role-based widget filtering

**Deliverables**:
- 5 role templates
- Permission system
- Role-based routing

### Phase 5: Easy Mode & Enhanced Header (Week 8-9)

**Tasks**:
1. Implement Easy Mode dashboard
2. Create large action tiles
3. Add Urdu localization
4. Enhance header with:
   - Business switcher
   - Mode toggle
   - Language toggle
   - Expanded quick actions
5. Implement keyboard shortcuts system

**Deliverables**:
- Easy Mode dashboard
- Enhanced header component
- Keyboard shortcuts system
- Urdu translations

### Phase 6: Customization & Mobile (Week 10-11)

**Tasks**:
1. Implement drag-and-drop widget arrangement
2. Add widget library and customization UI
3. Implement layout persistence
4. Optimize for mobile (responsive design)
5. Add touch gestures
6. Implement mobile-specific features

**Deliverables**:
- Widget customization system
- Mobile-optimized layouts
- Touch gesture support
- Layout persistence

### Phase 7: Pakistani Features & Polish (Week 12)

**Tasks**:
1. Implement Pakistani market widgets:
   - FBR Compliance
   - Seasonal Performance
   - City-wise Sales
2. Add Pakistani market data integration
3. Performance optimization
4. Accessibility improvements
5. Final testing and bug fixes

**Deliverables**:
- Pakistani market widgets
- Performance optimizations
- Accessibility compliance
- Production-ready system

### Technical Considerations

#### Performance Optimization

1. **Code Splitting**:
   - Lazy load widgets using React.lazy()
   - Split domain templates into separate bundles
   - Load only active widgets

2. **Data Caching**:
   - Use React Query for server state management
   - Cache widget data with appropriate TTL
   - Implement optimistic updates

3. **Real-Time Optimization**:
   - Batch WebSocket updates
   - Debounce rapid updates
   - Use efficient data structures

4. **Mobile Optimization**:
   - Reduce bundle size for mobile
   - Optimize images and assets
   - Use service workers for offline support

#### Security Considerations

1. **Permission Enforcement**:
   - Server-side permission checks
   - Client-side UI hiding
   - Audit log for unauthorized access attempts

2. **Data Validation**:
   - Validate all widget configurations
   - Sanitize user inputs
   - Prevent XSS attacks

3. **Real-Time Security**:
   - Authenticate WebSocket connections
   - Validate message sources
   - Rate limit updates

#### Scalability Considerations

1. **Widget Loading**:
   - Load widgets on-demand
   - Implement virtual scrolling for large dashboards
   - Limit concurrent widget renders

2. **Data Fetching**:
   - Paginate large datasets
   - Use server-side aggregation
   - Implement efficient database queries

3. **Real-Time Scaling**:
   - Use Supabase Realtime channels efficiently
   - Implement connection pooling
   - Handle reconnection gracefully

### Migration Strategy

#### Existing Dashboard Migration

1. **Backward Compatibility**:
   - Keep existing EnhancedDashboard.jsx functional
   - Add feature flag for new dashboard
   - Gradual rollout (5% → 20% → 100%)

2. **Data Migration**:
   - No data migration required (new tables)
   - Existing metrics continue to work
   - New widgets fetch from existing tables

3. **User Migration**:
   - Automatic migration to default layout
   - Preserve user preferences where possible
   - Provide migration guide

#### Rollout Plan

1. **Week 1-2**: Internal testing (dev team)
2. **Week 3-4**: Beta testing (selected users)
3. **Week 5**: Gradual rollout (5% of users)
4. **Week 6**: Expand rollout (20% of users)
5. **Week 7**: Monitor and fix issues
6. **Week 8**: Full rollout (100% of users)
7. **Week 9+**: Deprecate old dashboard

### Monitoring and Metrics

#### Key Metrics to Track

1. **Performance**:
   - Dashboard load time (p50, p95, p99)
   - Widget render time
   - Real-time update latency
   - API response times

2. **Usage**:
   - Daily active users
   - Widget usage frequency
   - Mode preference (Easy vs Advanced)
   - Language preference
   - Customization adoption rate

3. **Errors**:
   - Widget load failures
   - WebSocket disconnections
   - Permission errors
   - Layout corruption incidents

4. **Business Impact**:
   - User satisfaction score
   - Support ticket reduction
   - Task completion time
   - Feature adoption rate

#### Monitoring Tools

- **Application Performance**: New Relic / Datadog
- **Error Tracking**: Sentry
- **User Analytics**: Mixpanel / Amplitude
- **Real-Time Monitoring**: Custom WebSocket dashboard
- **Database Performance**: Supabase dashboard

### Documentation Requirements

1. **User Documentation**:
   - Dashboard overview guide
   - Widget customization tutorial
   - Easy Mode guide (Urdu + English)
   - Keyboard shortcuts reference
   - Role-specific guides

2. **Developer Documentation**:
   - Widget development guide
   - Template creation guide
   - API reference
   - Testing guide
   - Deployment guide

3. **Admin Documentation**:
   - Configuration guide
   - Permission management
   - Monitoring guide
   - Troubleshooting guide


## Summary

This design document specifies a comprehensive enterprise dashboard enhancement that addresses all 15 critical gaps identified in the gap analysis. The solution provides:

### Key Features

1. **Inventory Integration**: Real-time inventory metrics (valuation, batch expiry, serial warranty, warehouse distribution) displayed on dashboard
2. **Domain Intelligence**: 5 category-specific dashboard templates optimized for Pharmacy, Textile, Electronics, Garments, and General Retail
3. **Easy Mode**: Simplified interface with large buttons (≥44px), Urdu support, and 1-2 click workflows for Pakistani SME users
4. **Enhanced Navigation**: Consolidated navigation system reducing clicks from 3+ to 1-2 for common actions
5. **Comprehensive Header**: Business switcher, mode toggle, language toggle, expanded quick actions (12+), and keyboard shortcuts
6. **Role-Based Views**: 5 role-specific dashboards (Owner, Manager, Sales Staff, Inventory Staff, Accountant)
7. **Pakistani Market Features**: FBR compliance widgets, seasonal performance tracking, city-wise sales analysis
8. **Smart Widgets**: 18+ customizable widgets with drag-and-drop arrangement
9. **Mobile-First**: 100% responsive design with touch-optimized controls and mobile-specific features
10. **Real-Time Updates**: WebSocket-based live data synchronization with <2 second latency

### Technical Architecture

- **Component-Based**: Modular widget system with registry and lazy loading
- **Template-Driven**: Domain and role templates for automatic dashboard configuration
- **Real-Time**: Supabase Realtime WebSocket connections for live updates
- **Customizable**: User-specific layouts with drag-and-drop and persistence
- **Performant**: Code splitting, caching, and optimization for <2 second load times
- **Accessible**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Secure**: Permission-based access control with server-side enforcement

### Implementation Timeline

- **12 weeks** total implementation time
- **7 phases** from foundation to production
- **Gradual rollout** with feature flags and monitoring
- **Backward compatible** with existing dashboard during migration

### Success Metrics

- Dashboard load time <2 seconds
- Navigation reduced to 1-2 clicks
- 90% user preference for Easy Mode (Pakistani SMEs)
- 100% mobile responsiveness
- Real-time updates <2 second latency
- 50% reduction in support tickets
- 80% user satisfaction score

### Next Steps

1. Review and approve design document
2. Create detailed task breakdown
3. Set up development environment
4. Begin Phase 1 implementation
5. Establish monitoring and metrics tracking

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-03  
**Status**: Ready for Review  
**Prepared By**: Kiro AI Assistant

