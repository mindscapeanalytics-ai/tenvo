# Design Document: Enterprise-Grade Inventory System Consolidation & Enhancement

## Overview

This design consolidates duplicate inventory components (reducing 1,200+ lines to <100), simplifies navigation from 3+ clicks to 1-2 clicks, adds 10+ enterprise features (FIFO/LIFO/WAC costing, multi-location sync, approval workflows), integrates Pakistani market features (textile roll tracking, FBR compliance, Urdu localization), and achieves 100% mobile responsiveness while maintaining backward compatibility.

### Design Goals

1. **Code Consolidation**: Merge duplicate batch, serial, and stock adjustment components into unified implementations
2. **Navigation Simplification**: Direct access to operations via action panels and keyboard shortcuts
3. **Enterprise Features**: FIFO/LIFO/WAC costing, multi-location real-time sync, approval workflows, enhanced audit trails
4. **Pakistani Market Integration**: Textile roll/bale tracking, garment lot tracking, pharmacy FBR compliance, seasonal adjustments, Urdu localization
5. **Mobile-First UX**: Touch-optimized interfaces for batch scanning, stock transfers, and product management
6. **Performance**: <100ms response times, virtual scrolling, intelligent caching
7. **Backward Compatibility**: Zero breaking changes to existing database schema and API contracts

### Success Metrics

- 92% reduction in duplicate code (1,200 → <100 lines)
- Average component size reduced from 400+ to 250 lines
- Navigation clicks reduced from 3+ to 1-2
- 10+ enterprise features added
- 100% mobile responsiveness (320px-768px)
- 5+ Pakistani market features integrated
- <100ms response time for stock queries
- Zero data migration issues

## Architecture

### System Architecture Overview


```
┌─────────────────────────────────────────────────────────────────────┐
│                     InventoryManager (Main Hub)                      │
│                         ~1,500 lines max                             │
├─────────────────────────────────────────────────────────────────────┤
│  Tab Navigation: Products | Locations | Manufacturing | Orders      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐      ┌──────────▼──────────┐    ┌──────────▼──────────┐
│ ProductEntryHub│      │ UnifiedActionPanel  │    │ MobileOptimizedViews│
│  ~800 lines    │      │   ~400 lines        │    │   ~600 lines        │
├────────────────┤      ├─────────────────────┤    ├─────────────────────┤
│ Modes:         │      │ Tabs:               │    │ - BatchScanner      │
│ - Quick        │      │ - Batch Tracking    │    │ - StockTransfer     │
│ - Standard     │      │ - Serial Tracking   │    │ - ProductCards      │
│ - Excel        │      │ - Variant Matrix    │    │ - SwipeActions      │
│ - Template     │      │ - Stock Adjustment  │    │ - PullToRefresh     │
└────────────────┘      └─────────────────────┘    └─────────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────────┐  ┌──────────▼──────────┐  ┌──────────▼──────────┐
│BatchTrackingManager│  │SerialTrackingManager│  │StockAdjustmentManager│
│   ~250 lines       │  │   ~250 lines        │  │   ~250 lines         │
├────────────────────┤  ├─────────────────────┤  ├──────────────────────┤
│ Consolidates:      │  │ Consolidates:       │  │ Consolidates:        │
│ - BatchManager.jsx │  │ - SerialScanner.jsx │  │ - StockAdjustment    │
│ - BatchTracking.jsx│  │ - SerialTracking.jsx│  │ - StockAdjustmentForm│
└────────────────────┘  └─────────────────────┘  └──────────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   Shared Business Logic       │
                    ├───────────────────────────────┤
                    │ - useBatchTracking()          │
                    │ - useSerialTracking()         │
                    │ - useStockAdjustment()        │
                    │ - useCostingMethod()          │
                    │ - useMultiLocationSync()      │
                    │ - useApprovalWorkflow()       │
                    │ - usePakistaniFeatures()      │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   Data Layer & API            │
                    ├───────────────────────────────┤
                    │ - batchAPI                    │
                    │ - serialAPI                   │
                    │ - stockAdjustmentAPI          │
                    │ - multiLocationAPI            │
                    │ - approvalAPI                 │
                    │ - auditTrailAPI               │
                    └───────────────────────────────┘
```

### Component Hierarchy



**Top Level (InventoryManager.jsx - ~1,500 lines)**
- Main inventory dashboard with tab navigation
- Product list with virtual scrolling
- Global search and filters
- Keyboard shortcuts (Alt+1-5 for tabs, Alt+B/S/A for actions)
- Mobile/Desktop view mode switching

**Product Entry Layer (ProductEntryHub.jsx - ~800 lines)**
- Unified product form with 4 modes: Quick, Standard, Excel, Template
- Domain-specific field rendering
- Smart defaults and validation
- Batch/Serial integration
- Pakistani market fields (textile, garment, pharmacy)

**Action Panel Layer (UnifiedActionPanel.jsx - ~400 lines)**
- Tabbed interface for Batch, Serial, Variant, Adjustment operations
- Context-aware: shows relevant tabs based on product category
- Direct access (no dropdown menus)
- Keyboard shortcuts (Alt+B, Alt+S, Alt+V, Alt+A)

**Consolidated Components (each ~250 lines)**
1. **BatchTrackingManager.jsx**: Merges BatchManager + BatchTracking
   - FEFO (First Expiry First Out) logic
   - Batch merging and splitting
   - Expiry alerts and monitoring
   - Pakistani textile roll/bale tracking

2. **SerialTrackingManager.jsx**: Merges SerialScanner + SerialTracking
   - Individual unit tracking (IMEI, chassis numbers)
   - Warranty management
   - Mobile barcode scanning
   - Status tracking (available, sold, defective)

3. **StockAdjustmentManager.jsx**: Merges StockAdjustmentForm + StockAdjustment
   - Manual stock corrections
   - Approval workflows for high-value adjustments
   - Reason codes and audit trail
   - Multi-location support

**Mobile-Optimized Views (~600 lines total)**
- BatchScanner: Camera-based batch scanning with offline support
- StockTransferMobile: Touch-optimized transfer interface
- ProductCardView: Swipe gestures for quick actions
- Responsive layouts for 320px-768px screens

### Data Flow Architecture



```
User Action → Component → Hook → API → Database
     │            │         │      │       │
     │            │         │      │       └─→ Supabase (products, batches, serials)
     │            │         │      └─→ Server Actions (CRUD operations)
     │            │         └─→ Business Logic (validation, calculations)
     │            └─→ UI State Management (React state, optimistic updates)
     └─→ Event (click, scan, keyboard shortcut)

Real-Time Sync Flow (Multi-Location):
Location A: Stock Adjustment → API → Database → Realtime Channel
                                                        │
Location B: ←──────────────────────────────────────────┘
            Realtime Listener → Update Local State → Re-render
```

### State Management Strategy

**Local Component State (useState)**
- Form inputs and temporary UI state
- Modal/dialog visibility
- Tab selection and view modes

**Custom Hooks (Shared Logic)**
- `useBatchTracking()`: Batch CRUD, FEFO sorting, expiry calculations
- `useSerialTracking()`: Serial CRUD, warranty calculations, status management
- `useStockAdjustment()`: Adjustment logic, approval workflow, audit trail
- `useCostingMethod()`: FIFO/LIFO/WAC calculations
- `useMultiLocationSync()`: Real-time inventory synchronization
- `usePakistaniFeatures()`: Seasonal pricing, Urdu localization, FBR compliance

**Server State (Supabase Realtime)**
- Product inventory levels
- Batch quantities and expiry dates
- Serial number status
- Stock movements across locations

**Optimistic Updates**
- Immediate UI feedback for stock adjustments
- Rollback on server error
- Conflict resolution for concurrent updates

## Components and Interfaces

### 1. BatchTrackingManager Component

**Purpose**: Unified batch tracking with FEFO logic, expiry management, and Pakistani textile features

**Props Interface**:
```typescript
interface BatchTrackingManagerProps {
  product: Product;
  businessId: string;
  category: string;
  mode: 'register' | 'view' | 'manage';
  onBatchCreated?: (batch: Batch) => void;
  onBatchUpdated?: (batch: Batch) => void;
}
```



**Key Features**:
- FEFO (First Expiry First Out) automatic sorting
- Batch merging: Combine multiple batches with weighted average cost
- Batch splitting: Divide batch into smaller units
- Expiry alerts: 90/30/7 day warnings
- Pakistani textile tracking: Roll number, length (yards), width (inches), weight (kg)
- Mobile barcode scanning with offline support
- Batch status indicators in product list

**State Management**:
```javascript
const {
  batches,
  loading,
  addBatch,
  mergeBatches,
  splitBatch,
  getNextExpiryBatch,
  getExpiringBatches
} = useBatchTracking(productId, businessId);
```

**UI Layout**:
- Stats cards: Total batches, available stock, inventory value, next expiry
- Entry form: Batch number, mfg date, expiry date, quantity, cost, location
- FEFO priority queue: Sorted list with expiry status badges
- Quick actions: Merge, split, adjust quantity

### 2. SerialTrackingManager Component

**Purpose**: Unified serial number tracking with warranty management and mobile scanning

**Props Interface**:
```typescript
interface SerialTrackingManagerProps {
  product: Product;
  businessId: string;
  category: string;
  mode: 'register' | 'scan' | 'view';
  onSerialScanned?: (serial: Serial) => void;
}
```

**Key Features**:
- Individual unit tracking (IMEI, chassis, MAC address)
- Warranty period calculation and status
- Mobile camera scanning with haptic feedback
- Bulk serial registration (paste list)
- Serial status: available, sold, returned, defective, under_repair
- Warranty alerts: Active, expiring soon, expired

**State Management**:
```javascript
const {
  serials,
  loading,
  registerSerial,
  bulkRegisterSerials,
  updateSerialStatus,
  getWarrantyStatus,
  getAvailableSerials
} = useSerialTracking(productId, businessId);
```

**UI Layout**:
- Stats cards: Total serials, in warranty, available, sold
- Entry form: Serial number, IMEI, MAC, warranty months, notes
- Serial list: Status badges, warranty countdown, quick actions
- Bulk add dialog: Textarea for multiple serials



### 3. StockAdjustmentManager Component

**Purpose**: Unified stock adjustment with approval workflows and audit trails

**Props Interface**:
```typescript
interface StockAdjustmentManagerProps {
  product: Product;
  businessId: string;
  locations: Location[];
  approvalThreshold: number;
  onAdjustmentComplete?: (adjustment: StockAdjustment) => void;
}
```

**Key Features**:
- Manual stock corrections with reason codes
- Approval workflow for adjustments exceeding threshold
- Multi-level approvals (manager → director)
- Enhanced audit trail: user, timestamp, IP, before/after values
- Location-specific adjustments
- Batch/serial-aware adjustments

**State Management**:
```javascript
const {
  adjustments,
  pendingApprovals,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment,
  getAuditTrail
} = useStockAdjustment(productId, businessId);
```

**UI Layout**:
- Adjustment form: Product, location, quantity change, reason, notes
- Approval status: Pending, approved, rejected with approver details
- Audit trail viewer: Filterable history with export
- Pending queue: List of adjustments awaiting approval

### 4. ProductEntryHub Component

**Purpose**: Unified product entry with 4 modes replacing multiple forms

**Props Interface**:
```typescript
interface ProductEntryHubProps {
  product?: Product;
  category: string;
  businessId: string;
  mode: 'quick' | 'standard' | 'excel' | 'template';
  onSave: (product: Product) => void;
  onCancel: () => void;
}
```

**Modes**:

1. **Quick Mode** (~150 lines)
   - Essential fields only: name, SKU, price, stock
   - Single-column layout
   - Keyboard shortcuts: Enter to save, Esc to cancel

2. **Standard Mode** (~400 lines)
   - All product fields including batch, serial, domain-specific
   - Tabbed interface: Basic | Inventory | Intelligence | Media
   - Smart defaults from domain knowledge
   - Validation with inline errors

3. **Excel Mode** (~200 lines)
   - Spreadsheet-style grid for bulk entry
   - Inline editing with cell validation
   - Copy/paste support
   - Bulk save with progress indicator

4. **Template Mode** (~150 lines)
   - Domain-specific templates (textile, garment, pharmacy)
   - Pre-filled fields based on category
   - Smart suggestions from domain knowledge

**Mode Switching**:
- Preserve entered data when switching modes
- Remember last used mode in user preferences
- Visual mode selector with icons



### 5. UnifiedActionPanel Component

**Purpose**: Direct access to batch, serial, variant, and adjustment operations

**Props Interface**:
```typescript
interface UnifiedActionPanelProps {
  product: Product;
  businessId: string;
  category: string;
  activeTab?: 'batch' | 'serial' | 'variant' | 'adjustment';
  onTabChange?: (tab: string) => void;
}
```

**Tab Visibility Logic**:
```javascript
const visibleTabs = {
  batch: isBatchTrackingEnabled(category),
  serial: isSerialTrackingEnabled(category),
  variant: isSizeColorMatrixEnabled(category),
  adjustment: true // Always visible
};
```

**Keyboard Shortcuts**:
- Alt+B: Open batch tab
- Alt+S: Open serial tab
- Alt+V: Open variant tab
- Alt+A: Open adjustment tab
- Esc: Close panel

**UI Layout**:
- Horizontal tab bar with icons
- Tab content area with lazy loading
- Floating action button for mobile
- Slide-in panel animation

## Data Models

### Enhanced Product Model

```typescript
interface Product {
  // Core fields (existing)
  id: string;
  business_id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  cost_price: number;
  mrp: number;
  stock: number;
  min_stock: number;
  max_stock: number;
  
  // New enterprise fields
  costing_method: 'FIFO' | 'LIFO' | 'WAC';
  reorder_point: number;
  reorder_quantity: number;
  
  // Tracking flags
  batch_tracking_enabled: boolean;
  serial_tracking_enabled: boolean;
  
  // Pakistani market fields
  domain_data: {
    // Textile
    roll_number?: string;
    length_yards?: number;
    width_inches?: number;
    weight_kg?: number;
    fabric_type?: string;
    finish_status?: 'kora' | 'finished' | 'dyed' | 'printed';
    
    // Garment
    lot_number?: string;
    size_color_matrix?: SizeColorMatrix;
    quality_grade?: 'A' | 'B' | 'C';
    
    // Pharmacy
    drug_registration_number?: string;
    controlled_substance_schedule?: 'H' | 'X';
    
    // Seasonal
    seasonal_pricing_enabled?: boolean;
  };
  
  // Relationships
  batches?: Batch[];
  serials?: Serial[];
  locations?: ProductLocation[];
}
```



### Batch Model

```typescript
interface Batch {
  id: string;
  business_id: string;
  product_id: string;
  warehouse_id?: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date?: string;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  cost_price: number;
  mrp: number;
  status: 'active' | 'expired' | 'quarantine' | 'merged' | 'split';
  notes?: string;
  
  // Merge/split tracking
  parent_batch_id?: string;
  child_batch_ids?: string[];
  
  // Audit
  created_at: string;
  created_by: string;
  updated_at: string;
}
```

### Serial Model

```typescript
interface Serial {
  id: string;
  business_id: string;
  product_id: string;
  warehouse_id?: string;
  serial_number: string;
  imei?: string;
  mac_address?: string;
  status: 'available' | 'sold' | 'returned' | 'defective' | 'under_repair';
  purchase_date?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  warranty_period_months: number;
  customer_id?: string;
  invoice_id?: string;
  notes?: string;
  
  // Audit
  created_at: string;
  created_by: string;
  updated_at: string;
}
```

### StockAdjustment Model

```typescript
interface StockAdjustment {
  id: string;
  business_id: string;
  product_id: string;
  warehouse_id?: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity_before: number;
  quantity_after: number;
  quantity_change: number;
  reason_code: 'damage' | 'theft' | 'count_error' | 'return' | 'other';
  reason_notes: string;
  adjustment_value: number;
  
  // Approval workflow
  requires_approval: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  
  // Audit
  ip_address: string;
  user_agent: string;
  created_at: string;
}
```

### ProductLocation Model (Multi-Location)

```typescript
interface ProductLocation {
  id: string;
  business_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  min_stock: number;
  max_stock: number;
  last_sync_at: string;
}
```



### SizeColorMatrix Model (Garment Variants)

```typescript
interface SizeColorMatrix {
  sizes: string[]; // ['S', 'M', 'L', 'XL']
  colors: string[]; // ['Red', 'Blue', 'Black']
  variants: {
    [key: string]: { // 'S-Red', 'M-Blue', etc.
      sku: string;
      quantity: number;
      price: number;
    };
  };
}
```

## API Design

### Batch API

```typescript
// Create batch
POST /api/batches
Body: {
  business_id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date?: string;
  quantity: number;
  cost_price: number;
  mrp: number;
}
Response: { success: boolean; batch: Batch; }

// Get batches by product (FEFO sorted)
GET /api/batches?product_id={id}&business_id={id}
Response: { success: boolean; batches: Batch[]; }

// Get expiring batches
GET /api/batches/expiring?business_id={id}&days={30}
Response: { success: boolean; batches: Batch[]; }

// Merge batches
POST /api/batches/merge
Body: {
  business_id: string;
  batch_ids: string[];
  new_batch_number: string;
}
Response: { success: boolean; merged_batch: Batch; }

// Split batch
POST /api/batches/split
Body: {
  business_id: string;
  batch_id: string;
  splits: { quantity: number; batch_number: string; }[];
}
Response: { success: boolean; split_batches: Batch[]; }
```

### Serial API

```typescript
// Register serial
POST /api/serials
Body: {
  business_id: string;
  product_id: string;
  serial_number: string;
  imei?: string;
  mac_address?: string;
  warranty_period_months: number;
}
Response: { success: boolean; serial: Serial; }

// Bulk register serials
POST /api/serials/bulk
Body: {
  business_id: string;
  product_id: string;
  serials: { serial_number: string; warranty_period_months: number; }[];
}
Response: { success: boolean; serials: Serial[]; count: number; }

// Get serial by number
GET /api/serials/{serial_number}?business_id={id}
Response: { success: boolean; serial: Serial; }

// Update serial status
PATCH /api/serials/{id}
Body: {
  status: 'available' | 'sold' | 'returned' | 'defective' | 'under_repair';
  customer_id?: string;
  invoice_id?: string;
}
Response: { success: boolean; serial: Serial; }
```



### Stock Adjustment API

```typescript
// Create adjustment
POST /api/stock-adjustments
Body: {
  business_id: string;
  product_id: string;
  warehouse_id?: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity_change: number;
  reason_code: string;
  reason_notes: string;
}
Response: { 
  success: boolean; 
  adjustment: StockAdjustment;
  requires_approval: boolean;
}

// Approve adjustment
POST /api/stock-adjustments/{id}/approve
Body: {
  approval_notes?: string;
}
Response: { success: boolean; adjustment: StockAdjustment; }

// Reject adjustment
POST /api/stock-adjustments/{id}/reject
Body: {
  rejection_reason: string;
}
Response: { success: boolean; adjustment: StockAdjustment; }

// Get pending approvals
GET /api/stock-adjustments/pending?business_id={id}
Response: { success: boolean; adjustments: StockAdjustment[]; }

// Get audit trail
GET /api/stock-adjustments/audit?product_id={id}&from={date}&to={date}
Response: { success: boolean; trail: StockAdjustment[]; }
```

### Multi-Location API

```typescript
// Get product locations
GET /api/products/{id}/locations?business_id={id}
Response: { success: boolean; locations: ProductLocation[]; }

// Transfer stock
POST /api/stock-transfers
Body: {
  business_id: string;
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  notes?: string;
}
Response: { 
  success: boolean; 
  transfer: StockTransfer;
  transfer_id: string;
}

// Confirm receipt
POST /api/stock-transfers/{id}/confirm
Body: {
  received_quantity: number;
  notes?: string;
}
Response: { success: boolean; transfer: StockTransfer; }

// Sync inventory (real-time)
WebSocket: /api/realtime/inventory
Subscribe: { business_id, warehouse_id }
Events: {
  'stock.updated': { product_id, warehouse_id, quantity }
  'batch.expiring': { batch_id, days_until_expiry }
  'adjustment.pending': { adjustment_id, product_id }
}
```

### Costing Method API

```typescript
// Calculate COGS (Cost of Goods Sold)
POST /api/costing/calculate-cogs
Body: {
  business_id: string;
  product_id: string;
  quantity_sold: number;
  costing_method: 'FIFO' | 'LIFO' | 'WAC';
}
Response: {
  success: boolean;
  cogs: number;
  unit_cost: number;
  batches_used: { batch_id: string; quantity: number; cost: number; }[];
}

// Get inventory valuation
GET /api/costing/valuation?business_id={id}&method={FIFO|LIFO|WAC}
Response: {
  success: boolean;
  total_value: number;
  products: { product_id: string; quantity: number; value: number; }[];
}
```



## Pakistani Market Integration

### Textile Roll/Bale Tracking

**Domain-Specific Fields**:
```typescript
interface TextileProduct extends Product {
  domain_data: {
    roll_number: string;
    length_yards: number;
    width_inches: number;
    weight_kg: number;
    fabric_type: 'Cotton Lawn' | 'Khaddar' | 'Silk' | 'Chiffon' | 'Linen';
    finish_status: 'kora' | 'finished' | 'dyed' | 'printed';
    article_number: string;
    design_number: string;
    cutting_requirement: number; // suits per roll
  };
}
```

**Calculations**:
- Total area: `length_yards × width_inches / 1296` (square yards)
- Suits per roll: `length_yards / cutting_requirement`
- Price per yard: `price / length_yards`

**UI Components**:
- Roll entry form with textile-specific fields
- Cutting calculator: Input suit length → Output suits per roll
- Partial roll tracking: Update remaining length after sale
- Bale management: Group multiple rolls into bales

### Garment Lot Tracking

**Size-Color Matrix**:
```typescript
interface GarmentProduct extends Product {
  domain_data: {
    lot_number: string;
    production_date: string;
    quality_grade: 'A' | 'B' | 'C';
    size_color_matrix: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'];
      colors: ['Red', 'Blue', 'Black', 'White'];
      variants: {
        'S-Red': { sku: 'BASE-S-RED', quantity: 10, price: 1500 },
        'M-Blue': { sku: 'BASE-M-BLUE', quantity: 15, price: 1500 },
        // ... all combinations
      };
    };
  };
}
```

**Matrix Operations**:
- Auto-generate SKUs: `{base_sku}-{size}-{color}`
- Bulk stock entry: Enter total quantity → Distribute across matrix
- Low stock highlighting: Red cells for out-of-stock variants
- Matrix export: Excel format with size rows × color columns

**UI Components**:
- Interactive matrix grid with inline editing
- Bulk operations: Set all prices, adjust all quantities
- Visual stock indicators: Color-coded cells (green/yellow/red)
- Matrix templates: Pre-defined size/color combinations

### Pharmacy FBR Compliance

**Drug Registration**:
```typescript
interface PharmacyProduct extends Product {
  domain_data: {
    drug_registration_number: string; // FBR format: alphanumeric 10-15 chars
    controlled_substance_schedule?: 'H' | 'X';
    generic_name: string;
    manufacturer: string;
    batch_tracking_required: true;
    expiry_tracking_required: true;
  };
}
```

**Compliance Rules**:
- Validate drug registration number format
- Block sale of expired medicines (hard stop)
- Require prescription for Schedule H/X drugs
- Generate FBR-compliant batch reports
- 90-day expiry alerts

**UI Components**:
- Drug registration number validator with format hints
- Prescription capture: Number, prescriber, date
- Expiry dashboard: Near-expiry medicines with action buttons
- FBR report generator: Batch-wise sales with registration numbers



### Seasonal Pricing

**Integration with pakistaniSeasons.js**:
```javascript
import { getCurrentSeason, getSeasonalDiscount, applySeasonalPricing } from '@/lib/domainData/pakistaniSeasons';

// In ProductForm or PricingComponent
const currentSeason = getCurrentSeason();
const discount = getSeasonalDiscount(product.category);
const pricing = applySeasonalPricing(product.price, discount);

// Display
{currentSeason && discount > 0 && (
  <div className="seasonal-pricing">
    <Badge>{currentSeason.name.en}</Badge>
    <span className="original-price">{pricing.original}</span>
    <span className="discounted-price">{pricing.discounted}</span>
    <span className="savings">Save {pricing.savings}</span>
  </div>
)}
```

**Seasonal Adjustments**:
- Auto-apply discounts during active seasons
- Bulk seasonal pricing: Apply to entire category
- Seasonal demand forecasting: Historical data from previous years
- Restock alerts: 30 days before peak season

### Urdu Localization

**Translation Integration**:
```javascript
import { t, formatCurrency, formatDate, getDirection } from '@/lib/translations';

// Component with language support
function InventoryForm({ lang = 'en' }) {
  return (
    <div dir={getDirection(lang)}>
      <Label>{t('product_name', lang)}</Label>
      <Input placeholder={t('enter_product_name', lang)} />
      
      <Label>{t('price', lang)}</Label>
      <span>{formatCurrency(product.price, lang)}</span>
      
      <Label>{t('date', lang)}</Label>
      <span>{formatDate(product.created_at, lang)}</span>
    </div>
  );
}
```

**Urdu-Specific Features**:
- RTL layout support for Urdu interface
- Urdu numerals option (۰۱۲۳۴۵۶۷۸۹)
- Bilingual labels: English (primary) + Urdu (secondary)
- Language switcher in header (persists in user preferences)

## Mobile-First UI/UX Patterns

### Responsive Breakpoints

```css
/* Mobile First Approach */
.inventory-container {
  /* Base: Mobile (320px-767px) */
  padding: 1rem;
  
  /* Tablet (768px-1023px) */
  @media (min-width: 768px) {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
  
  /* Desktop (1024px+) */
  @media (min-width: 1024px) {
    padding: 2rem;
    grid-template-columns: 300px 1fr 300px;
  }
}
```

### Mobile Batch Scanner

**Features**:
- Camera access for barcode scanning
- Offline mode with local storage queue
- Haptic feedback on successful scan
- Large touch targets (min 44px)
- Swipe gestures for quick actions

**UI Flow**:
```
1. Tap "Scan Batch" button
2. Camera opens with overlay guide
3. Scan barcode → Haptic feedback
4. Batch details slide up from bottom
5. Quick actions: Adjust Qty | View Details | Next Scan
6. Swipe down to dismiss
```

**Offline Support**:
```javascript
const useBatchScanner = () => {
  const [offlineQueue, setOfflineQueue] = useState([]);
  
  const scanBatch = async (barcode) => {
    const batch = await fetchBatchDetails(barcode);
    
    if (!navigator.onLine) {
      // Store in local queue
      setOfflineQueue(prev => [...prev, batch]);
      toast.info('Saved offline. Will sync when online.');
    } else {
      // Process immediately
      await processBatch(batch);
    }
  };
  
  // Auto-sync when online
  useEffect(() => {
    if (navigator.onLine && offlineQueue.length > 0) {
      syncOfflineQueue(offlineQueue);
      setOfflineQueue([]);
    }
  }, [navigator.onLine]);
  
  return { scanBatch, offlineQueue };
};
```



### Mobile Stock Transfer

**Touch-Optimized Interface**:
- Bottom sheet for transfer form
- Product search with autocomplete
- Location picker with visual warehouse map
- Quantity stepper with +/- buttons
- Photo capture for documentation
- Push notifications for transfer status

**UI Components**:
```jsx
<MobileStockTransfer>
  <BottomSheet>
    <ProductSearch 
      onSelect={setProduct}
      showBarcodeScan={true}
    />
    
    <LocationPicker
      from={sourceWarehouse}
      to={destinationWarehouse}
      showMap={true}
    />
    
    <QuantityStepper
      value={quantity}
      max={availableStock}
      onChange={setQuantity}
    />
    
    <PhotoCapture
      onCapture={setTransferPhoto}
      label="Document Transfer"
    />
    
    <Button 
      size="lg"
      className="w-full"
      onClick={submitTransfer}
    >
      Initiate Transfer
    </Button>
  </BottomSheet>
</MobileStockTransfer>
```

### Mobile Product Cards

**Card Layout**:
```jsx
<ProductCard>
  <SwipeableCard
    onSwipeLeft={() => openEditForm(product)}
    onSwipeRight={() => confirmDelete(product)}
  >
    <CardHeader>
      <ProductImage src={product.image_url} />
      <StockBadge 
        stock={product.stock}
        minStock={product.min_stock}
      />
    </CardHeader>
    
    <CardBody>
      <ProductName>{product.name}</ProductName>
      <ProductSKU>{product.sku}</ProductSKU>
      <PriceDisplay price={product.price} />
    </CardBody>
    
    <CardFooter>
      <QuickActions>
        <IconButton icon={<Edit />} />
        <IconButton icon={<Package />} />
        <IconButton icon={<MoreVertical />} />
      </QuickActions>
    </CardFooter>
  </SwipeableCard>
</ProductCard>
```

**Swipe Gestures**:
- Swipe left: Edit product
- Swipe right: Delete product (with confirmation)
- Long press: Multi-select mode
- Pull to refresh: Reload product list

### Touch Optimization

**Design Principles**:
- Minimum touch target: 44px × 44px
- Spacing between targets: 8px minimum
- Large, clear typography: 16px base font size
- High contrast for outdoor visibility
- Thumb-friendly navigation: Bottom tab bar

**Performance**:
- Virtual scrolling for lists > 100 items
- Image lazy loading with placeholders
- Debounced search input (300ms)
- Optimistic UI updates
- Skeleton screens during loading

## Performance Optimization

### Virtual Scrolling

**Implementation**:
```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function ProductList({ products }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
    overscan: 5 // Render 5 extra rows
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <ProductRow
            key={virtualRow.index}
            product={products[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  );
}
```



### Intelligent Caching

**Strategy**:
```javascript
// Cache frequently accessed data
const useProductCache = () => {
  const [cache, setCache] = useState(() => {
    const stored = localStorage.getItem('product_cache');
    return stored ? JSON.parse(stored) : {};
  });
  
  const cacheProduct = (product) => {
    const updated = { ...cache, [product.id]: product };
    setCache(updated);
    localStorage.setItem('product_cache', JSON.stringify(updated));
  };
  
  const getCachedProduct = (id) => {
    return cache[id];
  };
  
  const invalidateCache = (id) => {
    const updated = { ...cache };
    delete updated[id];
    setCache(updated);
    localStorage.setItem('product_cache', JSON.stringify(updated));
  };
  
  return { cacheProduct, getCachedProduct, invalidateCache };
};
```

**Cache Invalidation**:
- On product update: Invalidate specific product
- On batch/serial change: Invalidate parent product
- On stock adjustment: Invalidate product + location
- Time-based: Clear cache after 1 hour
- Manual: Clear cache button in settings

### Lazy Loading

**Component-Level**:
```javascript
// Lazy load heavy components
const BatchTrackingManager = lazy(() => import('./BatchTrackingManager'));
const SerialTrackingManager = lazy(() => import('./SerialTrackingManager'));
const VariantMatrixEditor = lazy(() => import('./VariantMatrixEditor'));

function UnifiedActionPanel({ activeTab }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {activeTab === 'batch' && <BatchTrackingManager />}
      {activeTab === 'serial' && <SerialTrackingManager />}
      {activeTab === 'variant' && <VariantMatrixEditor />}
    </Suspense>
  );
}
```

**Data-Level**:
```javascript
// Load batch/serial data only when tab is opened
const useLazyBatchData = (productId, isActive) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isActive && batches.length === 0) {
      setLoading(true);
      fetchBatches(productId).then(data => {
        setBatches(data);
        setLoading(false);
      });
    }
  }, [isActive, productId]);
  
  return { batches, loading };
};
```

### API Response Optimization

**Compression**:
```javascript
// Server-side gzip compression
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

**Pagination**:
```javascript
// Cursor-based pagination for large datasets
GET /api/products?cursor={last_id}&limit=50

Response: {
  products: Product[];
  next_cursor: string | null;
  has_more: boolean;
}
```

**Field Selection**:
```javascript
// Request only needed fields
GET /api/products?fields=id,name,sku,stock,price

// Reduces response size by 60-70%
```

### Database Query Optimization

**Indexes**:
```sql
-- Product queries
CREATE INDEX idx_products_business_category ON products(business_id, category);
CREATE INDEX idx_products_stock_low ON products(business_id, stock) WHERE stock <= min_stock;

-- Batch queries
CREATE INDEX idx_batches_product_expiry ON batches(product_id, expiry_date) WHERE status = 'active';
CREATE INDEX idx_batches_expiring ON batches(business_id, expiry_date) WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days';

-- Serial queries
CREATE INDEX idx_serials_product_status ON serials(product_id, status);
CREATE INDEX idx_serials_warranty ON serials(business_id, warranty_end_date) WHERE warranty_end_date >= CURRENT_DATE;
```

**Query Optimization**:
```sql
-- Use EXPLAIN ANALYZE to identify slow queries
EXPLAIN ANALYZE
SELECT p.*, 
       COUNT(b.id) as batch_count,
       MIN(b.expiry_date) as next_expiry
FROM products p
LEFT JOIN batches b ON p.id = b.product_id AND b.status = 'active'
WHERE p.business_id = $1
GROUP BY p.id
ORDER BY p.name;

-- Add covering indexes for common queries
CREATE INDEX idx_products_list_covering ON products(business_id, name) INCLUDE (sku, stock, price);
```



## Migration and Backward Compatibility

### Database Schema Compatibility

**No Breaking Changes**:
- All existing tables remain unchanged
- New columns added with DEFAULT values
- Nullable columns for new features
- Backward-compatible data types

**Schema Additions**:
```sql
-- Add costing method to business settings
ALTER TABLE businesses 
ADD COLUMN costing_method VARCHAR(10) DEFAULT 'FIFO' CHECK (costing_method IN ('FIFO', 'LIFO', 'WAC'));

-- Add approval threshold
ALTER TABLE businesses
ADD COLUMN approval_threshold_amount DECIMAL(15,2) DEFAULT 10000.00;

-- Add batch merge/split tracking
ALTER TABLE batches
ADD COLUMN parent_batch_id UUID REFERENCES batches(id),
ADD COLUMN is_merged BOOLEAN DEFAULT FALSE,
ADD COLUMN is_split BOOLEAN DEFAULT FALSE;

-- Add multi-location support
CREATE TABLE IF NOT EXISTS product_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- Add stock transfer tracking
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  product_id UUID NOT NULL REFERENCES products(id),
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  quantity DECIMAL(15,3) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  initiated_by UUID NOT NULL REFERENCES users(id),
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);
```

### API Backward Compatibility

**Versioned Endpoints**:
```javascript
// Old endpoint (still supported)
GET /api/products/{id}
Response: {
  id, name, sku, price, stock, ...
}

// New endpoint with extended data
GET /api/v2/products/{id}
Response: {
  id, name, sku, price, stock, ...
  costing_method, locations, batches, serials
}

// Fallback logic
app.get('/api/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);
  
  // Return basic fields for backward compatibility
  const response = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    stock: product.stock,
    // ... other existing fields
  };
  
  res.json(response);
});
```

### Component Migration Strategy

**Phase 1: Parallel Components (Week 1-2)**
- Keep old components functional
- Deploy new consolidated components alongside
- Feature flag to switch between old/new
- Monitor for issues

**Phase 2: Gradual Migration (Week 3-4)**
- Migrate low-risk features first (batch tracking)
- User testing and feedback
- Fix issues before next migration
- Rollback capability maintained

**Phase 3: Full Cutover (Week 5-6)**
- Switch all users to new components
- Deprecate old components (keep code for 1 month)
- Monitor error rates and performance
- Final cleanup and removal

**Feature Flags**:
```javascript
const useConsolidatedComponents = () => {
  const { features } = useBusiness();
  return features?.consolidated_inventory_v2 === true;
};

function InventoryManager() {
  const useNew = useConsolidatedComponents();
  
  return useNew ? (
    <NewInventoryManager />
  ) : (
    <LegacyInventoryManager />
  );
}
```

### Data Migration Scripts

**Batch Data Migration**:
```javascript
// Migrate legacy batch records to new format
async function migrateBatchData() {
  const legacyBatches = await db.query(`
    SELECT * FROM batches 
    WHERE parent_batch_id IS NULL 
    AND is_merged IS NULL
  `);
  
  for (const batch of legacyBatches) {
    await db.query(`
      UPDATE batches 
      SET is_merged = FALSE,
          is_split = FALSE,
          available_quantity = quantity - COALESCE(reserved_quantity, 0)
      WHERE id = $1
    `, [batch.id]);
  }
  
  console.log(`Migrated ${legacyBatches.length} batch records`);
}
```

**Serial Data Migration**:
```javascript
// Add warranty end dates to existing serials
async function migrateSerialData() {
  const serials = await db.query(`
    SELECT * FROM serials 
    WHERE warranty_end_date IS NULL 
    AND warranty_start_date IS NOT NULL
  `);
  
  for (const serial of serials) {
    const endDate = new Date(serial.warranty_start_date);
    endDate.setMonth(endDate.getMonth() + (serial.warranty_period_months || 12));
    
    await db.query(`
      UPDATE serials 
      SET warranty_end_date = $1
      WHERE id = $2
    `, [endDate, serial.id]);
  }
  
  console.log(`Migrated ${serials.length} serial records`);
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Backward Compatibility Preservation

*For any* existing API endpoint and database query, calling it with the same inputs after consolidation should produce equivalent outputs to before consolidation.

**Validates: Requirements 1.7, 1.8**

### Property 2: Keyboard Shortcut Consistency

*For any* keyboard shortcut (Alt+B, Alt+S, Alt+A, Alt+V), pressing it should open the corresponding panel (batch, serial, adjustment, variant) regardless of current UI state.

**Validates: Requirements 2.6**

### Property 3: Batch/Serial Status Display

*For any* product with batch or serial tracking enabled, the product list view should display status indicators including count and next expiry/warranty date.

**Validates: Requirements 2.7, 2.8**

### Property 4: FIFO Costing Correctness

*For any* sequence of stock receipts with different costs, when using FIFO costing method, selling N units should consume the N oldest batches first by receipt date.

**Validates: Requirements 3.1, 3.4**

### Property 5: LIFO Costing Correctness

*For any* sequence of stock receipts with different costs, when using LIFO costing method, selling N units should consume the N newest batches first by receipt date.

**Validates: Requirements 3.2, 3.4**

### Property 6: WAC Costing Correctness

*For any* set of batches with different costs and quantities, the weighted average cost should equal the sum of (cost × quantity) divided by total quantity.

**Validates: Requirements 3.3, 3.4**

### Property 7: Stock Receipt Recording

*For any* stock receipt transaction, the system should persist both the purchase cost and receipt date, and these values should be retrievable for costing calculations.

**Validates: Requirements 3.5**

### Property 8: Costing Method Future Application

*For any* costing method change at time T, transactions before T should use the old method and transactions after T should use the new method.

**Validates: Requirements 3.7**

### Property 9: Inventory Valuation Report Accuracy

*For any* inventory state and selected costing method, the valuation report total should equal the sum of (quantity × unit_cost) for all products using that costing method.

**Validates: Requirements 3.8, 3.9**

### Property 10: Multi-Location Sync Latency

*For any* stock adjustment at location A, the inventory level at location A should be updated and visible at all other locations within 2 seconds.

**Validates: Requirements 4.1**

### Property 11: Stock Transfer Reservation

*For any* initiated stock transfer of quantity Q from location A to location B, the available quantity at location A should be reduced by Q until the transfer is completed or cancelled.

**Validates: Requirements 4.4**

### Property 12: In-Transit Status Tracking

*For any* stock transfer between locations, while the transfer status is 'in_transit', the quantity should not be available at either source or destination location.

**Validates: Requirements 4.5**

### Property 13: Overselling Prevention

*For any* sale attempt of quantity Q, if the sum of available quantities across all locations is less than Q, the sale should be rejected.

**Validates: Requirements 4.6**

### Property 14: Offline Queue Synchronization

*For any* stock movement made while offline, when network connectivity is restored, the movement should be synced to the server and reflected in all locations.

**Validates: Requirements 4.8**

### Property 15: Approval Threshold Enforcement

*For any* stock adjustment with value V, if V exceeds the configured approval threshold, the adjustment status should be 'pending' and require approval before processing.

**Validates: Requirements 5.2**

### Property 16: Approval Notification Delivery

*For any* stock adjustment requiring approval, approval notifications should be sent to all designated approvers via both email and in-app channels.

**Validates: Requirements 5.3**

### Property 17: Mandatory Approval Comments

*For any* approval or rejection action, the system should require a non-empty comment field before allowing the action to complete.

**Validates: Requirements 5.4**

### Property 18: Rejection Notification

*For any* rejected stock adjustment, the requester should receive a notification containing the rejection reason within 5 seconds of rejection.

**Validates: Requirements 5.5**



### Property 19: Batch FEFO Sorting

*For any* product with multiple active batches, the batch list should be sorted by expiry date in ascending order (earliest expiry first).

**Validates: Requirements 7.1 (implicit FEFO requirement)**

### Property 20: Batch Merge Weighted Average

*For any* set of batches being merged, the merged batch cost should equal the weighted average: sum(batch.cost × batch.quantity) / sum(batch.quantity).

**Validates: Requirements 7.2, 7.3**

### Property 21: Batch Split Preservation

*For any* batch split operation, the sum of quantities in split batches should equal the original batch quantity, and all split batches should have the same cost and expiry date as the original.

**Validates: Requirements 7.4, 7.5**

### Property 22: Cycle Count Variance Detection

*For any* cycle count where physical count differs from system count, the variance should be calculated as (physical - system) and flagged for review if absolute variance exceeds tolerance percentage.

**Validates: Requirements 8.5, 8.6**

### Property 23: Textile Roll Area Calculation

*For any* textile product with length L yards and width W inches, the total area should equal (L × W) / 1296 square yards.

**Validates: Requirements 9.2**

### Property 24: Garment Matrix SKU Generation

*For any* garment product with size-color matrix, each variant SKU should follow the pattern {base_sku}-{size}-{color} and be unique within the product.

**Validates: Requirements 10.2**

### Property 25: Pharmacy Expiry Blocking

*For any* pharmacy product batch with expiry date in the past, attempting to sell from that batch should be rejected with an error message.

**Validates: Requirements 11.3**

### Property 26: Seasonal Pricing Application

*For any* product in a category with active seasonal discount, the displayed price should equal original_price × (1 - discount_percent/100).

**Validates: Requirements 12.1, 12.2**

### Property 27: Urdu RTL Layout

*For any* UI component when Urdu language is selected, the text direction should be right-to-left (RTL) and layout should mirror horizontally.

**Validates: Requirements 13.4**

### Property 28: Mobile Batch Scan Response Time

*For any* batch barcode scan on mobile device, the batch details should be displayed within 1 second of successful scan.

**Validates: Requirements 14.2**

### Property 29: Mobile Offline Queue Persistence

*For any* batch scan or stock operation performed while offline, the operation should be stored in local queue and automatically synced when connection is restored.

**Validates: Requirements 14.3**

### Property 30: Product List Virtual Scrolling

*For any* product list with more than 100 items, only visible items plus overscan buffer should be rendered in the DOM, reducing render time to under 100ms.

**Validates: Requirements 17.5**

### Property 31: Excel Import Round-Trip

*For any* valid product export to Excel, importing the exported file and exporting again should produce an equivalent file (preserving all data including batch and serial information).

**Validates: Requirements 24.4**

### Property 32: Excel Import Validation

*For any* Excel import with invalid data, the system should return descriptive error messages including row number, column name, and validation failure reason.

**Validates: Requirements 24.5**

## Error Handling

### Client-Side Error Handling

**Network Errors**:
```javascript
const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    toast.error('No internet connection. Changes will be saved locally and synced when online.');
    queueOfflineOperation(operation);
  } else if (error.status === 504) {
    toast.error('Server timeout. Please try again.');
  } else {
    toast.error('Network error. Please check your connection.');
  }
};
```

**Validation Errors**:
```javascript
const handleValidationError = (errors) => {
  // Display inline errors for each field
  Object.entries(errors).forEach(([field, message]) => {
    setFieldError(field, message);
  });
  
  // Show summary toast
  const fieldCount = Object.keys(errors).length;
  toast.error(`Please fix ${fieldCount} validation error${fieldCount > 1 ? 's' : ''}`);
  
  // Focus first error field
  const firstErrorField = Object.keys(errors)[0];
  document.getElementById(firstErrorField)?.focus();
};
```

**Concurrent Update Conflicts**:
```javascript
const handleConflict = async (localData, serverData) => {
  // Show conflict resolution dialog
  const resolution = await showConflictDialog({
    local: localData,
    server: serverData,
    options: ['keep_local', 'keep_server', 'merge']
  });
  
  if (resolution === 'keep_local') {
    await forceUpdate(localData);
  } else if (resolution === 'keep_server') {
    updateLocalState(serverData);
  } else {
    const merged = mergeData(localData, serverData);
    await update(merged);
  }
};
```

### Server-Side Error Handling

**Database Errors**:
```javascript
app.post('/api/batches', async (req, res) => {
  try {
    const batch = await createBatch(req.body);
    res.json({ success: true, batch });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        error: 'Batch number already exists',
        field: 'batch_number'
      });
    } else if (error.code === '23503') { // Foreign key violation
      res.status(400).json({
        success: false,
        error: 'Invalid product or warehouse ID',
        field: 'product_id'
      });
    } else {
      console.error('Database error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});
```

**Business Logic Errors**:
```javascript
const validateStockAdjustment = (adjustment) => {
  const errors = [];
  
  if (adjustment.quantity_change === 0) {
    errors.push({ field: 'quantity_change', message: 'Quantity change cannot be zero' });
  }
  
  if (adjustment.adjustment_type === 'decrease' && 
      Math.abs(adjustment.quantity_change) > product.stock) {
    errors.push({ 
      field: 'quantity_change', 
      message: `Cannot decrease by ${Math.abs(adjustment.quantity_change)}. Only ${product.stock} units available.`
    });
  }
  
  if (!adjustment.reason_code) {
    errors.push({ field: 'reason_code', message: 'Reason code is required' });
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};
```

### Graceful Degradation

**Offline Mode**:
- Queue all write operations in IndexedDB
- Show offline indicator in UI
- Allow read-only access to cached data
- Auto-sync when connection restored

**Partial Feature Failure**:
- If batch tracking fails, allow basic product operations
- If serial tracking fails, show warning but don't block sales
- If real-time sync fails, fall back to polling every 30 seconds

**Browser Compatibility**:
- Detect missing features (camera, local storage, service workers)
- Provide alternative workflows
- Show helpful messages for unsupported browsers



## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests as complementary approaches:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific batch merge scenarios with known inputs/outputs
- Edge cases like zero quantity, negative adjustments
- Error conditions like network failures, validation errors
- Integration points between components

**Property-Based Tests**: Verify universal properties across all inputs
- FIFO/LIFO/WAC costing correctness for any batch sequence
- Batch merge weighted average for any set of batches
- Stock transfer reservation for any quantity and location
- Comprehensive input coverage through randomization

Together, these approaches provide comprehensive coverage: unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library Selection**: fast-check (JavaScript/TypeScript property-based testing library)

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Seed-based reproducibility for failed tests
- Shrinking to find minimal failing examples
- Timeout: 30 seconds per property test

**Property Test Tagging**:
Each property test must reference its design document property using this format:

```javascript
/**
 * Feature: inventory-system-consolidation
 * Property 4: FIFO Costing Correctness
 * 
 * For any sequence of stock receipts with different costs, when using FIFO 
 * costing method, selling N units should consume the N oldest batches first 
 * by receipt date.
 */
test('FIFO costing uses oldest batches first', () => {
  fc.assert(
    fc.property(
      fc.array(batchArbitrary, { minLength: 2, maxLength: 10 }),
      fc.integer({ min: 1, max: 100 }),
      (batches, quantityToSell) => {
        // Sort batches by receipt date (oldest first)
        const sortedBatches = [...batches].sort((a, b) => 
          new Date(a.receipt_date) - new Date(b.receipt_date)
        );
        
        // Calculate COGS using FIFO
        const cogs = calculateCOGS(batches, quantityToSell, 'FIFO');
        
        // Manually calculate expected COGS from oldest batches
        let remaining = quantityToSell;
        let expectedCOGS = 0;
        for (const batch of sortedBatches) {
          if (remaining <= 0) break;
          const used = Math.min(remaining, batch.quantity);
          expectedCOGS += used * batch.cost;
          remaining -= used;
        }
        
        // Property: FIFO COGS should match manual calculation
        expect(cogs).toBeCloseTo(expectedCOGS, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

**Batch Merge Test**:
```javascript
describe('Batch Merging', () => {
  test('merges two batches with weighted average cost', () => {
    const batch1 = { quantity: 100, cost: 10, expiry: '2024-12-31' };
    const batch2 = { quantity: 50, cost: 15, expiry: '2024-11-30' };
    
    const merged = mergeBatches([batch1, batch2]);
    
    expect(merged.quantity).toBe(150);
    expect(merged.cost).toBeCloseTo(11.67, 2); // (100*10 + 50*15) / 150
    expect(merged.expiry).toBe('2024-11-30'); // Earliest expiry
  });
  
  test('rejects merge of batches with different products', () => {
    const batch1 = { product_id: 'A', quantity: 100 };
    const batch2 = { product_id: 'B', quantity: 50 };
    
    expect(() => mergeBatches([batch1, batch2])).toThrow('Cannot merge batches from different products');
  });
});
```

**Stock Transfer Test**:
```javascript
describe('Stock Transfer', () => {
  test('reserves quantity at source location', async () => {
    const product = await createProduct({ stock: 100 });
    const sourceLocation = await createLocation();
    const destLocation = await createLocation();
    
    await setProductLocation(product.id, sourceLocation.id, 100);
    
    const transfer = await initiateTransfer({
      product_id: product.id,
      from_warehouse_id: sourceLocation.id,
      to_warehouse_id: destLocation.id,
      quantity: 30
    });
    
    const sourceStock = await getProductLocation(product.id, sourceLocation.id);
    expect(sourceStock.available_quantity).toBe(70); // 100 - 30 reserved
    expect(sourceStock.reserved_quantity).toBe(30);
  });
});
```

### Integration Tests

**Multi-Location Sync Test**:
```javascript
describe('Multi-Location Sync', () => {
  test('syncs stock adjustment across locations within 2 seconds', async () => {
    const product = await createProduct();
    const location1 = await createLocation();
    const location2 = await createLocation();
    
    // Subscribe to real-time updates at location2
    const updates = [];
    const subscription = subscribeToInventoryUpdates(location2.id, (update) => {
      updates.push({ ...update, timestamp: Date.now() });
    });
    
    // Make adjustment at location1
    const adjustmentTime = Date.now();
    await adjustStock(product.id, location1.id, 50);
    
    // Wait for sync
    await waitFor(() => updates.length > 0, { timeout: 3000 });
    
    // Verify sync latency
    const syncLatency = updates[0].timestamp - adjustmentTime;
    expect(syncLatency).toBeLessThan(2000);
    
    subscription.unsubscribe();
  });
});
```

### End-to-End Tests

**Complete Stock Adjustment Workflow**:
```javascript
describe('Stock Adjustment Workflow', () => {
  test('high-value adjustment requires approval', async () => {
    // Setup
    await setApprovalThreshold(10000);
    const product = await createProduct({ cost: 100, stock: 100 });
    const requester = await createUser({ role: 'staff' });
    const approver = await createUser({ role: 'manager' });
    
    // Request adjustment
    const adjustment = await createAdjustment({
      product_id: product.id,
      quantity_change: 150, // Value: 15000 > threshold
      reason: 'Stock count correction',
      requested_by: requester.id
    });
    
    // Verify pending status
    expect(adjustment.status).toBe('pending');
    expect(adjustment.requires_approval).toBe(true);
    
    // Verify notification sent
    const notifications = await getNotifications(approver.id);
    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: 'approval_request',
        adjustment_id: adjustment.id
      })
    );
    
    // Approve adjustment
    await approveAdjustment(adjustment.id, approver.id, 'Approved after verification');
    
    // Verify stock updated
    const updatedProduct = await getProduct(product.id);
    expect(updatedProduct.stock).toBe(250); // 100 + 150
    
    // Verify audit trail
    const auditTrail = await getAuditTrail(product.id);
    expect(auditTrail).toContainEqual(
      expect.objectContaining({
        adjustment_id: adjustment.id,
        approved_by: approver.id,
        quantity_before: 100,
        quantity_after: 250
      })
    );
  });
});
```

### Performance Tests

**Virtual Scrolling Performance**:
```javascript
describe('Product List Performance', () => {
  test('renders 10,000 products in under 2 seconds', async () => {
    const products = await createProducts(10000);
    
    const startTime = performance.now();
    render(<ProductList products={products} />);
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(2000);
    
    // Verify only visible items are in DOM
    const renderedItems = screen.getAllByTestId('product-row');
    expect(renderedItems.length).toBeLessThan(50); // Only visible + overscan
  });
  
  test('search returns results within 500ms', async () => {
    const products = await createProducts(10000);
    
    const startTime = performance.now();
    const results = await searchProducts('test query', products);
    const searchTime = performance.now() - startTime;
    
    expect(searchTime).toBeLessThan(500);
  });
});
```

### Mobile Responsiveness Tests

**Touch Interaction Tests**:
```javascript
describe('Mobile Batch Scanner', () => {
  test('responds to barcode scan within 1 second', async () => {
    render(<BatchScanner />);
    
    const startTime = performance.now();
    await simulateBarcodeScan('BATCH-001');
    
    await waitFor(() => screen.getByText('BATCH-001'));
    const responseTime = performance.now() - startTime;
    
    expect(responseTime).toBeLessThan(1000);
  });
  
  test('provides haptic feedback on successful scan', async () => {
    const vibrateSpy = jest.spyOn(navigator, 'vibrate');
    
    render(<BatchScanner />);
    await simulateBarcodeScan('BATCH-001');
    
    expect(vibrateSpy).toHaveBeenCalledWith(200);
  });
});
```

### Accessibility Tests

**WCAG 2.1 AA Compliance**:
```javascript
describe('Accessibility', () => {
  test('batch tracking form is keyboard navigable', async () => {
    render(<BatchTrackingManager />);
    
    // Tab through form fields
    userEvent.tab();
    expect(screen.getByLabelText('Batch Number')).toHaveFocus();
    
    userEvent.tab();
    expect(screen.getByLabelText('Quantity')).toHaveFocus();
    
    // Submit with Enter key
    userEvent.type(screen.getByLabelText('Batch Number'), 'BATCH-001{enter}');
    await waitFor(() => screen.getByText('Batch created successfully'));
  });
  
  test('color-coded status indicators have text labels', () => {
    render(<ProductList products={[{ stock: 5, min_stock: 10 }]} />);
    
    const lowStockBadge = screen.getByText('LOW');
    expect(lowStockBadge).toBeInTheDocument();
    expect(lowStockBadge).toHaveAttribute('aria-label', 'Low stock warning');
  });
});
```

### Test Coverage Requirements

**Minimum Coverage Targets**:
- Overall code coverage: 80%
- Consolidated components: 85%
- Business logic (hooks, utilities): 90%
- API endpoints: 85%
- Critical paths (costing, approval workflow): 95%

**Coverage Exclusions**:
- Type definitions
- Configuration files
- Mock data generators
- Development-only code



## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Component Consolidation**:
- Create BatchTrackingManager.jsx (merge BatchManager + BatchTracking)
- Create SerialTrackingManager.jsx (merge SerialScanner + SerialTracking)
- Create StockAdjustmentManager.jsx (merge StockAdjustmentForm + StockAdjustment)
- Implement shared hooks: useBatchTracking, useSerialTracking, useStockAdjustment

**Database Schema**:
- Add costing_method and approval_threshold to businesses table
- Create product_locations table for multi-location support
- Create stock_transfers table
- Add batch merge/split tracking columns

**Testing**:
- Unit tests for consolidated components
- Property tests for batch/serial operations
- Integration tests for database schema

### Phase 2: Enterprise Features (Weeks 3-4)

**Costing Methods**:
- Implement FIFO calculation logic
- Implement LIFO calculation logic
- Implement WAC calculation logic
- Create useCostingMethod hook
- Add costing method selector to business settings

**Multi-Location Sync**:
- Implement real-time sync with Supabase Realtime
- Create stock transfer workflow
- Add location-wise stock display
- Implement offline queue with IndexedDB

**Approval Workflows**:
- Create approval threshold configuration
- Implement approval notification system
- Build approval queue UI
- Add multi-level approval support

**Testing**:
- Property tests for costing methods (100+ iterations each)
- Integration tests for multi-location sync
- End-to-end tests for approval workflow

### Phase 3: Pakistani Market Features (Weeks 5-6)

**Textile Tracking**:
- Add textile-specific fields to product model
- Implement roll/bale tracking UI
- Create cutting calculator
- Add partial roll tracking

**Garment Variants**:
- Implement size-color matrix component
- Add SKU auto-generation
- Create matrix bulk operations
- Build visual stock indicators

**Pharmacy Compliance**:
- Add drug registration validation
- Implement expiry blocking logic
- Create FBR report generator
- Add prescription capture

**Seasonal Pricing**:
- Integrate with pakistaniSeasons.js
- Implement auto-discount application
- Create seasonal demand forecasting
- Add restock alerts

**Urdu Localization**:
- Add RTL layout support
- Implement language switcher
- Create Urdu translations for all forms
- Add Urdu numeral option

**Testing**:
- Unit tests for Pakistani-specific features
- Property tests for textile calculations
- Integration tests for seasonal pricing

### Phase 4: Mobile Optimization (Weeks 7-8)

**Mobile UI Components**:
- Create mobile batch scanner with camera
- Build touch-optimized stock transfer
- Implement swipeable product cards
- Add pull-to-refresh

**Offline Support**:
- Implement offline queue with IndexedDB
- Add auto-sync on connection restore
- Create offline indicator UI
- Build conflict resolution dialog

**Performance**:
- Implement virtual scrolling for product list
- Add intelligent caching with localStorage
- Optimize API responses with compression
- Create lazy loading for heavy components

**Testing**:
- Mobile responsiveness tests (320px-768px)
- Touch interaction tests
- Offline functionality tests
- Performance tests (<100ms response time)

### Phase 5: Migration & Rollout (Weeks 9-10)

**Data Migration**:
- Run batch data migration scripts
- Run serial data migration scripts
- Verify data integrity
- Create rollback procedures

**Feature Flags**:
- Implement feature flag system
- Deploy with flags disabled
- Gradual rollout to test users
- Monitor error rates and performance

**Documentation**:
- Create user guides for new features
- Write API documentation
- Document migration procedures
- Create troubleshooting guides

**Testing**:
- Backward compatibility tests
- Load testing with production data
- User acceptance testing
- Accessibility compliance verification

### Phase 6: Cleanup & Optimization (Weeks 11-12)

**Code Cleanup**:
- Remove deprecated components
- Consolidate duplicate utilities
- Optimize bundle size
- Update dependencies

**Performance Tuning**:
- Analyze and optimize slow queries
- Implement additional caching
- Optimize image loading
- Reduce API payload sizes

**Final Testing**:
- Full regression test suite
- Performance benchmarking
- Security audit
- Accessibility audit

**Launch**:
- Enable features for all users
- Monitor metrics and error rates
- Collect user feedback
- Plan next iteration

## Success Metrics & Monitoring

### Key Performance Indicators

**Code Quality**:
- Duplicate code reduced from 1,200+ to <100 lines ✓
- Average component size reduced from 400+ to 250 lines ✓
- Test coverage ≥80% ✓

**User Experience**:
- Navigation clicks reduced from 3+ to 1-2 ✓
- Mobile responsiveness 100% (320px-768px) ✓
- Response time <100ms for stock queries ✓

**Feature Completeness**:
- 10+ enterprise features added ✓
- 5+ Pakistani market features integrated ✓
- Zero breaking changes to existing APIs ✓

### Monitoring & Alerts

**Performance Monitoring**:
```javascript
// Track key metrics
analytics.track('inventory_operation', {
  operation: 'batch_create',
  duration_ms: performance.now() - startTime,
  success: true
});

// Alert on slow operations
if (duration > 1000) {
  logger.warn('Slow operation detected', {
    operation: 'batch_create',
    duration_ms: duration,
    product_id: productId
  });
}
```

**Error Tracking**:
```javascript
// Capture and report errors
try {
  await createBatch(batchData);
} catch (error) {
  errorTracker.captureException(error, {
    context: 'batch_creation',
    user_id: userId,
    product_id: productId,
    batch_data: batchData
  });
  throw error;
}
```

**User Analytics**:
- Track feature adoption rates
- Monitor navigation patterns
- Measure time-to-complete for common tasks
- Collect user feedback via in-app surveys

### Success Criteria

The consolidation and enhancement project will be considered successful when:

1. All 24 requirements are implemented and tested
2. Code duplication reduced by 92% (1,200 → <100 lines)
3. Average component size ≤250 lines
4. Navigation requires ≤2 clicks for all operations
5. 10+ enterprise features operational
6. 5+ Pakistani market features integrated
7. 100% mobile responsiveness achieved
8. <100ms response time for 95% of operations
9. Zero data migration issues reported
10. Test coverage ≥80% across all components
11. Zero breaking changes to existing APIs
12. User satisfaction score ≥4.5/5.0

---

## Conclusion

This design provides a comprehensive blueprint for consolidating and enhancing the inventory management system. By merging duplicate components, simplifying navigation, adding enterprise features, integrating Pakistani market capabilities, and optimizing for mobile, the system will become more maintainable, powerful, and user-friendly while maintaining full backward compatibility.

The phased implementation approach ensures controlled rollout with continuous testing and monitoring, minimizing risk while delivering maximum value to users.

