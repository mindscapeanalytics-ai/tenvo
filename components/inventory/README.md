# Consolidated Inventory Components

Enterprise-grade inventory management components for multi-tenant, multi-domain ERP+POS system.

## Overview

This directory contains three consolidated components that replace 6+ legacy components, reducing code duplication by ~1,200 lines while adding enterprise features.

## Components

### 1. BatchTrackingManager (638 lines)
**Replaces:** `BatchManager.jsx`, `BatchTracking.jsx`

**Features:**
- FEFO (First Expiry First Out) batch sorting
- Batch merge with weighted average cost calculation
- Batch split with quantity preservation
- Expiry status tracking (healthy/caution/warning/critical/expired)
- Multi-location warehouse support
- Real-time statistics dashboard
- Pakistani textile tracking fields (ready for integration)

**Usage:**
```jsx
import { BatchTrackingManager } from '@/components/inventory';

<BatchTrackingManager
  businessId={businessId}
  productId={productId}
  warehouseId={warehouseId}
  product={product}
  category={category}
/>
```

**Props:**
- `businessId` (string, required): Business ID
- `productId` (string, required): Product ID
- `warehouseId` (string, optional): Warehouse ID for location-specific batches
- `product` (object, optional): Product object with name, sku
- `category` (string, optional): Product category for domain-specific fields

### 2. SerialTrackingManager (468 lines)
**Replaces:** `SerialScanner.jsx`, `SerialTracking.jsx`

**Features:**
- Individual unit tracking (IMEI, chassis, MAC address)
- Warranty management with expiry alerts
- Bulk serial registration via textarea
- Status management (available/sold/returned/defective/under_repair)
- Search and filter by serial number, IMEI, or MAC
- Real-time warranty countdown
- Statistics dashboard

**Usage:**
```jsx
import { SerialTrackingManager } from '@/components/inventory';

<SerialTrackingManager
  businessId={businessId}
  productId={productId}
  warehouseId={warehouseId}
  product={product}
/>
```

**Props:**
- `businessId` (string, required): Business ID
- `productId` (string, required): Product ID
- `warehouseId` (string, optional): Warehouse ID
- `product` (object, optional): Product object with name, sku

### 3. StockAdjustmentManager (529 lines)
**Replaces:** `StockAdjustment.jsx`, `StockAdjustmentForm.jsx`

**Features:**
- Manual stock corrections with 9 reason codes
- Approval workflow for high-value adjustments
- Multi-level authorization support
- Enhanced audit trail with IP tracking
- Location-specific adjustments
- Pending approvals queue with review UI
- Automatic approval threshold detection

**Usage:**
```jsx
import { StockAdjustmentManager } from '@/components/inventory';

<StockAdjustmentManager
  businessId={businessId}
  products={products}
  warehouses={warehouses}
  approvalThreshold={10000}
  currency="PKR"
  onAdjustmentComplete={handleRefresh}
/>
```

**Props:**
- `businessId` (string, required): Business ID
- `products` (array, required): Array of product objects
- `warehouses` (array, required): Array of warehouse objects
- `approvalThreshold` (number, optional): Threshold amount requiring approval (default: 10000)
- `currency` (string, optional): Currency code (default: 'PKR')
- `onAdjustmentComplete` (function, optional): Callback after adjustment

### 4. AuditTrailViewer (NEW - Task 5.5)
**Purpose:** Enhanced audit trail viewer for stock adjustments

**Features:**
- Filterable table with all adjustment details
- Display columns: timestamp, user, action, before_value, after_value, reason, IP address
- Date range, user, product, and transaction type filters
- Export to PDF and Excel formats
- Comprehensive audit information display
- Mobile responsive design
- Real-time statistics dashboard

**Usage:**
```jsx
import { AuditTrailViewer } from '@/components/inventory';

<AuditTrailViewer
  businessId={businessId}
  productId={productId}
  warehouseId={warehouseId}
  currency="PKR"
/>
```

**Props:**
- `businessId` (string, required): Business ID
- `productId` (string, optional): Filter by specific product
- `warehouseId` (string, optional): Filter by warehouse location
- `currency` (string, optional): Currency symbol (default: 'PKR')

**Requirements Validated:**
- 6.1: Records user ID, timestamp, and IP address for every transaction
- 6.2: Records before and after values for all adjustments
- 6.3: Records reason codes and notes
- 6.5: Provides search by date range, user, product, and transaction type
- 6.6: Generates audit trail reports in PDF and Excel formats

## Custom Hooks

All components use enterprise-grade custom hooks:

### useBatchTracking
- FEFO sorting logic
- Batch merge/split operations
- Expiry status calculation
- Multi-location support

### useSerialTracking
- Serial CRUD operations
- Warranty management
- Bulk registration
- Search and statistics

### useStockAdjustment
- Adjustment creation with approval workflow
- Approval/rejection with notifications
- Audit trail management
- Statistics calculation

## Database Schema

Components require the following database extensions (migration: `020_enterprise_inventory_features.sql`):

**Extended Tables:**
- `businesses`: costing_method, approval_threshold_amount, multi_location_enabled
- `product_batches`: parent_batch_id, is_merged, is_split, warehouse_id, available_quantity, reserved_quantity
- `product_serials`: warranty_start_date, warranty_end_date, warranty_period_months, warehouse_id, imei, mac_address

**New Tables:**
- `warehouses`: Multi-location support
- `product_locations`: Product stock by location
- `stock_transfers`: Inter-location transfers
- `stock_adjustments`: Adjustment history with approval workflow

## Reason Codes

### Stock Adjustment Reasons
1. **counting_error** 🔢 - Counting Error
2. **damage** 💔 - Damage / Spoilage
3. **theft** 🚨 - Theft / Loss
4. **expiry** ⏰ - Expired Stock
5. **sample** 🧪 - Sample / Testing
6. **write_off** 📝 - Write-Off
7. **found** 🔍 - Found Stock
8. **opening** 📊 - Opening Balance
9. **other** 📋 - Other

## Expiry Status Levels

Batch expiry status is calculated based on days until expiry:

- **healthy** (green): >90 days
- **caution** (blue): 31-90 days
- **warning** (yellow): 8-30 days
- **critical** (orange): 1-7 days
- **expired** (red): ≤0 days

## Serial Status Types

- **available**: In stock, ready for sale
- **sold**: Sold to customer
- **returned**: Returned by customer
- **defective**: Defective unit
- **under_repair**: Currently being repaired

## Approval Workflow

Stock adjustments exceeding the approval threshold follow this workflow:

1. **Submission**: User creates adjustment with reason
2. **Pending**: Adjustment awaits approval
3. **Review**: Approver reviews details and adds comment
4. **Decision**: Approve (stock updated) or Reject (no change)
5. **Notification**: Requester notified of decision

## Pakistani Market Features (Ready for Integration)

### Textile Tracking (Task 3.8)
- Roll number, length (yards), width (inches), weight (kg)
- Fabric type (Cotton Lawn, Khaddar, Silk, Chiffon, Linen)
- Finish status (kora, finished, dyed, printed)
- Area calculation: (length × width) / 1296 square yards

### Garment Matrix (Phase 3)
- Size-color matrix with SKU auto-generation
- Bulk operations across variants
- Visual stock indicators

### Pharmacy FBR Compliance (Phase 3)
- Drug registration number validation
- Expiry blocking for medicines
- Prescription capture for controlled substances
- 90-day expiry alerts

## Performance Considerations

- **Lazy Loading**: Components use React.lazy() for code splitting
- **Optimistic Updates**: UI updates immediately, syncs with backend
- **Debounced Search**: Search queries debounced to reduce API calls
- **Pagination**: Large lists paginated (50 items per page)
- **Real-time Sync**: Supabase Realtime for multi-location updates

## Mobile Responsiveness

All components are mobile-first with:
- Responsive grid layouts (1 column on mobile, 2-4 on desktop)
- Touch-friendly buttons and inputs
- Swipe gestures for dialogs
- Compact forms for small screens

## Testing

### Unit Tests (TODO)
- Component rendering
- Form validation
- State management
- Error handling

### Property Tests (TODO)
- Batch merge weighted average (Property 20)
- Batch split preservation (Property 21)
- FEFO sorting correctness (Property 19)
- Approval threshold enforcement (Property 15)

## Migration Guide

### From BatchManager/BatchTracking
```jsx
// Old
<BatchManager product={product} businessId={businessId} />
<BatchTracking batches={batches} onUpdate={handleUpdate} />

// New
<BatchTrackingManager
  businessId={businessId}
  productId={product.id}
  product={product}
/>
```

### From SerialScanner/SerialTracking
```jsx
// Old
<SerialScanner mode="register" product={product} />
<SerialTracking serials={serials} />

// New
<SerialTrackingManager
  businessId={businessId}
  productId={product.id}
  product={product}
/>
```

### From StockAdjustment/StockAdjustmentForm
```jsx
// Old
<StockAdjustment adjustments={adjustments} products={products} />
<StockAdjustmentForm onSave={handleSave} />

// New
<StockAdjustmentManager
  businessId={businessId}
  products={products}
  warehouses={warehouses}
  onAdjustmentComplete={handleRefresh}
/>
```

## Future Enhancements

### Phase 2 (Weeks 3-4)
- FIFO/LIFO/WAC costing methods
- Multi-location real-time sync
- Cycle counting workflows

### Phase 3 (Weeks 5-6)
- Pakistani textile roll/bale tracking
- Garment lot tracking with size-color matrix
- Pharmacy FBR compliance
- Seasonal inventory adjustments
- Urdu localization with RTL support

### Phase 4 (Weeks 7-8)
- UnifiedActionPanel with keyboard shortcuts
- ProductEntryHub with multiple modes
- Navigation simplification (3+ clicks → 1-2 clicks)

## Support

For issues or questions:
1. Check the spec: `.kiro/specs/inventory-system-consolidation/`
2. Review the design document for architecture details
3. Check the tasks file for implementation status

## License

Proprietary - Financial Hub ERP+POS System
