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

