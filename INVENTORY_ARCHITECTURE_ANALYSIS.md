# Inventory System Architecture & Gap Analysis

**Date:** May 12, 2026  
**Status:** Comprehensive Analysis In Progress  
**Purpose:** Understand UI wiring, schema relationships, page connections, and identify gaps

---

## 📊 SYSTEM OVERVIEW

### Entry Point: Dashboard Page
**Location:** `app/business/[category]/page.js`

```
Dashboard (page.js)
├── Category-based routing: /business/[domain]
├── Tabs: 
│   ├── Dashboard (default)
│   ├── Inventory
│   ├── Invoices
│   ├── Purchases
│   ├── Finance
│   ├── Manufacturing
│   └── More (expandable)
└── Data flows from BusinessContext
```

---

## 🎯 INVENTORY MANAGER ARCHITECTURE

### Main Component
**Location:** `components/InventoryManager.jsx` (800+ lines)

### Component Hierarchy
```
InventoryManager (Root)
│
├─ State Management
│  ├── products[] - Local product cache
│  ├── loading - Boolean
│  ├── error - Error messages
│  └── showExcelImport - Boolean
│
├─ Child Components (Tabs)
│  │
│  ├─ Tab 1: Products Table
│  │  ├── DataTable (sortable, filterable)
│  │  ├── ExcelImportModal (Phase 1 ✅)
│  │  ├── ExcelModeModal (legacy)
│  │  ├── ProductForm (create/edit)
│  │  └── ProductDetailsDialog (view)
│  │
│  ├─ Tab 2: Batch Tracking
│  │  └── BatchManager
│  │      ├── View batches
│  │      ├── Create batch
│  │      ├── Update batch
│  │      ├── Track expiry
│  │      └── Batch reservations
│  │
│  ├─ Tab 3: Serial Numbers
│  │  ├── SerialScanner
│  │  ├── Serial tracking
│  │  ├── Warranty management
│  │  └── Serial movement history
│  │
│  ├─ Tab 4: Multi-Location
│  │  └── MultiLocationInventory
│  │      ├── Stock by warehouse
│  │      ├── Stock transfers
│  │      ├── Warehouse view
│  │      └── Transfer status
│  │
│  ├─ Tab 5: Variants & Sizing
│  │  ├── VariantMatrixEditor
│  │  ├── VariantManager
│  │  ├── Size/Color matrix
│  │  └── Variant stock tracking
│  │
│  ├─ Tab 6: Stock Management
│  │  ├── StockAdjustmentManager
│  │  ├── StockTransferForm
│  │  ├── StockReservation
│  │  └── AutoReorderManager
│  │
│  ├─ Tab 7: Pricing & Discounts
│  │  ├── PriceListManager
│  │  ├── DiscountSchemeManager
│  │  └── Promotion integration
│  │
│  ├─ Tab 8: Intelligence
│  │  ├── SmartRestockEngine (AI restock suggestions)
│  │  ├── DemandForecast (AI demand prediction)
│  │  ├── BusyGrid (visualization)
│  │  └── AdvancedInventoryFeatures
│  │
│  └─ Tab 9: Advanced
│      ├── BarcodeScanner
│      ├── CustomParametersManager
│      ├── Manufacturing integration
│      └── Quotation/Order management
│
└─ Action Handlers
   ├── handleAddProduct
   ├── handleDeleteProduct
   ├── handleExcelImport (Phase 1 ✅)
   └── handleUpdate callbacks
```

---

## 📦 DATABASE SCHEMA - INVENTORY MODELS

### Core Product Model
```
products
├── id (UUID)
├── business_id (FK) → businesses
├── sku (unique per business) ⭐ KEY FIELD
├── barcode (optional)
├── name
├── description
├── category (indexed)
├── brand (indexed)
├── price (Decimal)
├── cost_price (Decimal)
├── mrp (MRP)
├── stock (Decimal) ⭐ KEY FIELD
├── min_stock (reorder point)
├── min_stock_level (alternative)
├── max_stock
├── reorder_point
├── reorder_quantity
├── unit (pcs, kg, etc.)
├── hsn_code / sac_code (tax related)
├── tax_percent
├── image_url
├── is_active (soft delete via is_deleted)
├── domain_data (JSON) ⭐ Custom fields
├── batches (JSON - legacy)
├── serial_numbers (JSON - legacy)
├── variants (JSON - legacy)
├── is_deleted / deleted_at
├── created_at
├── updated_at
└── Relations
    ├── → product_batches[] (proper model)
    ├── → product_serials[] (proper model)
    ├── → product_variants[] (proper model)
    ├── → product_stock_locations[]
    └── → invoices, purchases, sales_orders
```

### Product Batches (Batch Tracking)
```
product_batches
├── id (UUID)
├── business_id (FK)
├── product_id (FK) → products ⭐ REQUIRED
├── warehouse_id (FK, optional) → warehouse_locations
├── batch_number ⭐ KEY FIELD
├── manufacturing_date
├── expiry_date ⭐ TRACKED (expiry warnings)
├── quantity (batch size)
├── reserved_quantity (allocated)
├── cost_price
├── mrp
├── notes
├── is_active
├── is_deleted / deleted_at
├── domain_data (JSON)
├── created_at / updated_at
└── Unique: (business_id, product_id, batch_number)
```

### Product Serials (Serial Tracking)
```
product_serials
├── id (UUID)
├── business_id (FK)
├── product_id (FK) → products ⭐ REQUIRED
├── variant_id (optional)
├── serial_number ⭐ UNIQUE
├── imei (optional)
├── mac_address (optional)
├── status (in_stock, sold, returned) ⭐ KEY FIELD
├── purchase_date
├── sale_date
├── warranty_expiry_date ⭐ TRACKED
├── warranty_period_months
├── warranty_start_date
├── warranty_end_date
├── invoice_id (sales reference)
├── customer_id (current owner)
├── batch_id (FK, optional)
├── warehouse_id (current location)
├── notes
├── is_deleted / deleted_at
└── Unique: (business_id, serial_number)
```

### Product Variants (Size/Color Matrix)
```
product_variants
├── id (UUID)
├── business_id (FK)
├── product_id (FK) → products ⭐ REQUIRED
├── variant_sku ⭐ UNIQUE
├── variant_name
├── size / color / pattern / material
├── custom_attributes (JSON)
├── price
├── cost_price
├── mrp
├── stock (variant-specific)
├── min_stock
├── image_url
├── is_active
├── is_deleted / deleted_at
└── Relations → product_serials
```

### Multi-Location Inventory
```
product_stock_locations
├── id (UUID)
├── business_id (FK)
├── product_id (FK) → products ⭐
├── warehouse_id (FK) → warehouse_locations ⭐
├── quantity (stock at location)
├── state (sellable, reserved, damaged)
├── updated_at
└── Unique: (product_id, warehouse_id, state)
```

### Stock Movements (Audit Trail)
```
stock_movements
├── id (UUID)
├── business_id (FK)
├── product_id (FK)
├── warehouse_id (optional)
├── transaction_type (purchase, sale, transfer, adjustment)
├── quantity_change (can be negative)
├── reference_type (invoice, purchase, transfer)
├── reference_id (FK to source document)
├── batch_id (optional - links to batch if batch tracking)
├── unit_cost
├── notes
├── domain_data (JSON)
├── created_at (audit trail)
└── Indexes: (business_id, product_id, created_at DESC)
```

### Stock Transfers
```
stock_transfers
├── id (UUID)
├── business_id (FK)
├── transfer_number (unique per business)
├── product_id (FK)
├── batch_id (optional)
├── from_warehouse_id (FK) → warehouse_locations ⭐
├── to_warehouse_id (FK) → warehouse_locations ⭐
├── quantity
├── status (pending, completed, cancelled)
├── transfer_date
├── actual_arrival_date
├── notes
└── created_at / updated_at
```

### Warehouse Locations
```
warehouse_locations
├── id (UUID)
├── business_id (FK)
├── name (e.g., "Main Store", "Warehouse A")
├── address / city / type
├── is_active
├── is_primary (default warehouse)
├── code (warehouse code)
├── contact_person / phone / email
├── created_at / updated_at
└── Relations
    ├── ← product_batches
    ├── ← product_serials
    ├── ← product_stock_locations
    ├── ← stock_transfers (from/to)
    └── ← production_orders
```

### Inventory Ledger (Complete Audit)
```
inventory_ledger
├── id (UUID)
├── business_id (FK)
├── warehouse_id (optional)
├── product_id (FK)
├── transaction_type (matched to stock_movements)
├── reference_type / reference_id
├── quantity_change
├── running_balance ⭐ CALCULATED
├── unit_cost
├── total_value ⭐ VALUATION
├── batch_number (audit trail)
├── serial_number (audit trail)
├── notes
└── created_at (immutable audit log)
```

### Inventory Reservations (Pre-allocation)
```
inventory_reservations
├── id (UUID)
├── business_id (FK)
├── product_id (FK)
├── batch_id (optional)
├── quantity (reserved)
├── expires_at (reservation validity)
├── status (active, completed, cancelled, expired)
├── reference (e.g., "order_123")
├── created_at / updated_at
└── Purpose: Hold stock for pending orders
```

---

## 🔗 DATA FLOW & RELATIONSHIPS

### Inventory Data Ingestion
```
User Input
├── Excel Import (Phase 1 ✅)
│  └── ExcelImportModal → excelImportService
│      ├── Parse .xlsx/.xls/.csv
│      ├── Validate 20+ rules
│      ├── Detect duplicates
│      └── Transform → products[]
│
├── CSV/Text Mode (legacy)
│  └── ExcelModeModal → BulkOperationsPanel
│
├── Manual Entry
│  └── ProductForm
│      ├── Single product
│      └── With batch/serial data
│
└── Quick Add
   └── SmartQuickAddModal
       └── Template-based creation
```

### Stock Flow (Movement Tracking)
```
Purchase Order
  ↓
purchase → purchase_items (product links)
  ↓
Received (marks product.stock += quantity)
  ↓
stock_movements created (for audit)
  ↓
inventory_ledger entry created
  ↓
product_batches updated (if batch tracking)
  ↓
product_serials created (if serial tracking)
  ↓
product_stock_locations updated (by warehouse)
```

### Sales Flow (Deduction Tracking)
```
Sales Order / Invoice
  ↓
sales_order_items / invoice_items
  ↓
Products matched by SKU/product_id
  ↓
Fulfillment (marks product.stock -= quantity)
  ↓
Batch/Serial picked (if tracked)
  ↓
Delivery Challan generated
  ↓
Stock movements created
  ↓
inventory_ledger records sale
  ↓
product_stock_locations decremented
```

### Multi-Location Flow
```
Product → product_stock_locations[]
           {warehouse_A: 100 units}
           {warehouse_B: 50 units}
           {warehouse_C: 25 units}
           
Stock Transfer Request
  ↓
stock_transfers record created
  ↓
warehouse_A.stock -= quantity
warehouse_B.stock += quantity
  ↓
stock_movements created (from/to)
  ↓
inventory_ledger updated
```

---

## 🛠️ API LAYER

### Product API (`lib/api/product.js`)
```javascript
productAPI.getAll(businessId)          // Fetch all products
productAPI.create(productData)          // Create product
productAPI.update(id, updates)          // Update product
productAPI.delete(id, businessId)       // Delete product
productAPI.upsertIntegrated(params)     // Composite create/update
```

### Stock API (`lib/api/stock.js`)
```javascript
stockAPI.getRecentAdjustments(businessId)      // Last N stock changes
stockAPI.getReservations(businessId, status)   // Reserved stock
stockAPI.expireOverdueReservations(businessId) // Auto-expire old reserves
stockAPI.reserve(data)                         // Create reservation
stockAPI.release(data)                         // Release reservation
```

### Batch API (`lib/api/batch.js`)
```javascript
batchAPI.create(batchData)              // Create batch
batchAPI.getByProduct(productId, businessId)   // Get product batches
batchAPI.update(batchId, businessId, updates)  // Update batch
batchAPI.delete(batchId, businessId)    // Delete batch
batchAPI.getExpiring(businessId, daysThreshold) // Expiry alerts
```

### Serial API (`lib/api/serial.js`)
```javascript
// Similar pattern - create, read, update, delete operations
```

### Warehouse API (`lib/api/warehouse.js`)
```javascript
// Multi-location management
```

---

## 📋 INTEGRATION POINTS

### Connected to Sales/Invoices
```
Invoice Creation (EnhancedInvoiceBuilder)
  ↓
Select Product from InventoryManager
  ↓
Fetch product.price, product.stock
  ↓
Add to invoice_items (creates link)
  ↓
On Invoice Confirmed
  → Reduce product.stock
  → Create stock_movement
  → Create inventory_ledger entry
  → Update product_stock_locations
```

### Connected to Purchases
```
Purchase Order Creation
  ↓
Select Products + Quantities
  ↓
Add to purchase_items
  ↓
On PO Confirmed
  → Increase product.stock
  → Create stock_movement
  → Create batch (if batch tracking)
```

### Connected to Manufacturing
```
Production Order (BOM)
  ↓
Bill of Materials lists materials (products)
  ↓
On Production Start
  → Reserve materials
  → Create stock_movements
  → Track batch for output
  
On Production Complete
  → Create finished goods batch
  → Increase product.stock (output product)
  → Decrease product.stock (raw materials)
```

### Connected to Quotations/Sales Orders
```
Quotation → quotation_items (product links)
Sales Order → sales_order_items (product links)
            (can link to specific batches/serials)
```

---

## 🔍 IDENTIFIED GAPS & ISSUES

### CRITICAL GAPS

#### 1. ❌ Stock Calculation Logic Missing
**Issue:** Product table has both:
- `stock` (Decimal) - Sum of all locations
- `product_stock_locations` (proper model) - Per-location breakdown

**Problem:** 
- Product.stock can get out of sync with sum of product_stock_locations
- No automatic recalculation after stock movements
- Inventory reports may show incorrect totals

**Impact:** 
- Users see wrong stock levels
- Overselling possible
- Audit trail becomes unreliable

**Fix Required:**
```javascript
// Need: Stock calculation microservice
calculateProductStock(productId, businessId) {
  // SUM(product_stock_locations.quantity)
  // WHERE product_id = productId
  // VALIDATE against product.stock
  // ALERT if mismatch > threshold
}

// Need: Sync handler
syncStockLevels(businessId) {
  // For each product:
  //   1. Calculate sum from locations
  //   2. Update product.stock
  //   3. Log discrepancies in audit
}
```

#### 2. ❌ Batch Tracking Not Wired to Stock Movements
**Issue:**
- `product_batches` table exists ✅
- `BatchManager` component exists ✅
- But: When stock moves, batch allocation is NOT automatic

**Problem:**
- Can't track which batch was sold
- Batch expiry warnings don't link to actual sales
- FIFO (First In First Out) not implemented
- Batch serial numbers not validated

**Impact:**
- Can't prove which batch went where
- Expiry reports are just warnings, not enforced
- Regulatory issues (pharma/food requires batch traceability)

**Fix Required:**
```javascript
// Need: When creating stock_movement
function createStockMovementWithBatch(productId, quantity, batchId) {
  // 1. Validate batch quantity >= movement quantity
  // 2. Create stock_movement linking batch
  // 3. Update batch.quantity
  // 4. Create audit trail
  // 5. Warn if batch expired
}

// Need: FIFO batch selection
function selectBatchForSale(productId, quantity) {
  // 1. Get non-expired batches (ORDER BY expiry_date ASC)
  // 2. Pick oldest first
  // 3. Allocate quantity
  // 4. Return selected batches
}
```

#### 3. ❌ Serial Number Not Validated During Sales
**Issue:**
- `product_serials` model exists ✅
- Serial Scanner component exists ✅
- But: SerialScanner not integrated with invoice creation

**Problem:**
- Can't select specific serial number when issuing invoice
- Serial status (in_stock, sold, returned) not updated on sale
- Warranty dates not validated
- Can't do serial-level recalls

**Impact:**
- Can't track warranty claims to exact serial
- Can't do product recalls by serial
- Warranty validation impossible

**Fix Required:**
```javascript
// Need: Serial selection in invoice builder
function selectSerialForInvoice(productId, quantity) {
  // 1. Find serials with status='in_stock'
  // 2. Filter by warranty_expiry_date > today
  // 3. Allow user to pick specific serials
  // 4. On sale, mark status='sold'
  // 5. Update customer_id & sale_date
}
```

#### 4. ❌ Reservation Logic Not Connected to Sales
**Issue:**
- `inventory_reservations` table exists ✅
- `StockReservation` component exists ✅
- But: When creating quotation, no automatic reservation
- When confirming sale, reservation not released

**Problem:**
- Sales order quantity not held when pending
- Quotations can be fulfilled even if stock runs out
- Overselling possible
- No "committed" vs "actual" stock separation

**Impact:**
- Users see free stock but can't fulfill orders
- Quotation promises not honored
- Revenue at risk

**Fix Required:**
```javascript
// Need: Auto-reserve on quotation
function createQuotationWithReservation(quotation) {
  // 1. For each quotation_item
  // 2. Reserve quantity (inventory_reservations)
  // 3. Set expiry = quotation.valid_until
  // 4. On sale, mark reservation.status = 'completed'
  // 5. Auto-expire on valid_until
}
```

#### 5. ❌ Inventory Valuation Missing
**Issue:**
- `inventory_ledger` has `unit_cost` and `total_value` fields ✅
- But: These are not calculated or updated during stock movements

**Problem:**
- No FIFO/LIFO/Weighted Average valuation
- Can't calculate COGS (Cost of Goods Sold)
- Financial reports show wrong inventory value
- Tax calculations affected

**Impact:**
- Balance sheet incorrect
- Profit/loss statement wrong
- Tax compliance at risk

**Fix Required:**
```javascript
// Need: Valuation calculation
function calculateInventoryValuation(businessId, method='weighted_average') {
  // 1. For each product
  // 2. Calculate COGS using:
  //    - FIFO: oldest cost first
  //    - LIFO: newest cost first  
  //    - Weighted Average: (total_cost / total_qty)
  // 3. Store in inventory_ledger.total_value
  // 4. Sum for balance sheet
}
```

---

### HIGH PRIORITY GAPS

#### 6. ⚠️ Stock Adjustment Workflow Incomplete
**Issue:**
- `StockAdjustmentManager` component exists
- But: No validation or approval workflow

**Problem:**
- Anyone can adjust stock without reason
- No audit trail for adjustments
- Can't dispute incorrect adjustments

**Fix:**
```javascript
// Need: Reason required + optional approval
function createStockAdjustment(productId, quantity, reason, approverRequired=false) {
  // 1. Require: reason (damaged, shrinkage, miscount, etc.)
  // 2. If approverRequired, create approval_requests record
  // 3. On approval, create stock_movement
  // 4. Log who approved & when
}
```

#### 7. ⚠️ Minimum Stock Alerts Not Working
**Issue:**
- `products.min_stock` field exists ✅
- `SmartRestockEngine` component exists ✅
- But: No automatic reorder trigger

**Problem:**
- Stock drops below min but nothing happens
- Users must manually check
- Stockouts possible

**Fix:**
```javascript
// Need: Automated trigger
function checkMinStockLevels(businessId) {
  // 1. Find products where stock < min_stock
  // 2. Auto-create purchase order OR alert
  // 3. Send notification to procurement
  // 4. Log alert in audit trail
}
```

#### 8. ⚠️ Barcode Scanning Not Validated
**Issue:**
- `BarcodeScanner` component exists
- But: No validation that scanned barcode matches selected product

**Problem:**
- Operator could scan wrong item
- Inventory discrepancies grow
- Can't trust barcode data

**Fix:**
```javascript
// Need: Validation after scan
function validateBarcodeMatch(scannedBarcode, expectedProductId) {
  // 1. Find product by barcode
  // 2. Verify == expectedProductId
  // 3. If mismatch, alert operator
  // 4. Log scan event
}
```

---

### MEDIUM PRIORITY GAPS

#### 9. ⚠️ Variant Stock Not Summed to Parent
**Issue:**
- `product_variants` has independent stock field
- Parent `products.stock` doesn't include variant stock

**Problem:**
- Total stock incorrect when variants exist
- Can't see variant allocation
- Stock reports inaccurate

**Fix:**
```javascript
// Need: Aggregate calculation
function calculateVariantStockTotal(productId) {
  // 1. SUM(product_variants.stock)
  // 2. Add to parent product.stock
  // 3. Use in availability calculations
}
```

#### 10. ⚠️ Warehouse Transfer Lacks Tracking
**Issue:**
- `stock_transfers` table exists ✅
- `StockTransferForm` component exists ✅
- But: In-transit stock not reserved
- No goods received note (GRN) workflow

**Problem:**
- Stock appears in "from" warehouse until marked received
- In-transit time not tracked
- Can't optimize logistics

**Fix:**
```javascript
// Need: Two-step confirmation
function createStockTransfer(data) {
  // STEP 1: Pending - reduce from_warehouse
  // STEP 2: Received - increase to_warehouse
  // STEP 3: Track time in transit
  // STEP 4: Alert if overdue arrival
}
```

---

### INTEGRATION ISSUES

#### 11. 🔗 Invoice ↔ Inventory Not Fully Connected
**Current:** 
- Creating invoice doesn't reduce stock
- Deleting invoice doesn't restore stock
- Invoice quantities not validated against stock

**Fix:**
```javascript
// In EnhancedInvoiceBuilder.jsx
function handleConfirmInvoice(invoice) {
  // 1. For each invoice_item
  // 2. Validate product.stock >= quantity
  // 3. Create stock_movement (invoice reference)
  // 4. Update product.stock
  // 5. If serial/batch, allocate specific items
  // 6. Create inventory_ledger entry
}
```

#### 12. 🔗 Purchase ↔ Inventory Not Fully Connected
**Current:**
- Creating purchase doesn't reserve stock
- Receiving goods requires manual stock entry
- PO batches not auto-created

**Fix:**
```javascript
// Need: Receiving workflow
function receivePurchaseOrder(purchaseId, receivedItems) {
  // 1. For each purchase_item
  // 2. Verify received_qty <= order_qty
  // 3. Create product_batches (for batch tracked items)
  // 4. Create product_serials (for serial tracked items)
  // 5. Create stock_movements
  // 6. Update product.stock
}
```

---

## 📐 ARCHITECTURE ISSUES

### Issue 13: JSON vs Relational Model Hybrid
**Problem:**
```
products.batches (JSON array - OBSOLETE)
products.serial_numbers (JSON array - OBSOLETE)
products.variants (JSON array - OBSOLETE)
↓
CONFLICTS WITH:
product_batches (proper relational model)
product_serials (proper relational model)
product_variants (proper relational model)
```

**Impact:**
- Code reads from both JSON and relational
- Data can diverge
- Queries inconsistent
- Causes sync bugs

**Fix:**
```sql
-- MIGRATION PLAN
-- 1. Move all batches from products.batches → product_batches
-- 2. Move all serials from products.serial_numbers → product_serials
-- 3. Move all variants from products.variants → product_variants
-- 4. Remove JSON columns from products
-- 5. Update all queries to use relations
-- 6. Run data migration script
-- 7. Validate against audit trail
-- 8. Delete old columns after validation period
```

### Issue 14: Missing Domain Data Integration
**Problem:**
- Every model has `domain_data` (JSON) field ✅
- But: No schema definition for what goes in each
- UI components don't leverage domain data
- Reporting can't filter by custom fields

**Impact:**
- Custom fields not validated
- Can't enforce required domain fields
- Data quality degrades

**Fix:**
```javascript
// Need: Domain schema definitions
const domainSchemas = {
  'retail-shop': {
    products: {
      shelf_location: 'string',
      restock_frequency: 'enum',
      supplier_code: 'string'
    },
    batches: {
      quality_check_date: 'date',
      inspector_name: 'string'
    }
  },
  'pharmacy': {
    products: {
      drug_license: 'string',
      storage_condition: 'enum'
    },
    serials: {
      manufacturer_code: 'string'
    }
  }
  // ... more domains
};

// Need: Validation function
function validateDomainData(entity, domain, category) {
  const schema = domainSchemas[domain][entity];
  // Validate against schema
}
```

---

## 🧪 TESTING GAPS

### Missing Test Coverage
1. **Stock calculation accuracy** - Need automated reconciliation tests
2. **Batch expiry tracking** - Need alert automation tests
3. **Serial validation** - Need serial-to-product matching tests
4. **Multi-location consistency** - Need cross-warehouse sync tests
5. **Valuation calculations** - Need FIFO/LIFO/WAM tests
6. **Concurrency** - Need parallel update testing

---

## 📋 PHASE 2 FIXES ROADMAP

### Priority 1 (Critical - Market Readiness)
1. ✅ **Stock Calculation Fix** - Auto-sync product.stock with locations sum
2. ✅ **Batch-Stock Link** - Wire batch_id to stock_movements
3. ✅ **Serial Sales Integration** - Serial selection in invoices
4. ✅ **Reservation Workflow** - Auto-reserve on quotation

### Priority 2 (High - Data Integrity)
5. ⚠️ **Valuation Engine** - FIFO/LIFO/WAM calculations
6. ⚠️ **Min Stock Alerts** - Automated triggers
7. ⚠️ **Approval Workflow** - For stock adjustments
8. ⚠️ **Variant Aggregation** - Sum variant stock to parent

### Priority 3 (Medium - UX)
9. ⚠️ **Transfer Tracking** - Two-step confirm for warehouse transfers
10. ⚠️ **Barcode Validation** - Verify scanned barcode matches
11. ⚠️ **Invoice-Stock Sync** - Full two-way sync
12. ⚠️ **Purchase-Stock Sync** - Full receiving workflow

### Priority 4 (Optimization)
13. ⚠️ **Data Cleanup** - Migrate JSON to relational
14. ⚠️ **Domain Schema** - Enforce domain_data validation
15. ⚠️ **Performance** - Optimize inventory queries
16. ⚠️ **Caching** - Redis caching for stock levels

---

## 📊 SUCCESS CRITERIA

### Before Deployment
- [ ] Stock calculation tests pass (100% accuracy)
- [ ] Batch tracking tests pass
- [ ] Serial tracking tests pass
- [ ] Multi-location tests pass
- [ ] Round-trip export/import verified (Phase 1 ✅)
- [ ] All integrations connected

### After Deployment  
- [ ] Stock discrepancies < 0.1%
- [ ] Users report no overselling
- [ ] Batch recalls traceable
- [ ] Warranty claims validated
- [ ] Financial reports reconcile
- [ ] No data corruption

---

## 🎯 NEXT IMMEDIATE ACTIONS

1. **Fix Stock Calculation** (2-3 hours)
   - Create stock sync service
   - Validate all existing stock levels
   - Add automated daily reconciliation

2. **Wire Batch Tracking** (3-4 hours)
   - Update stock_movement creation
   - Add batch selection to invoice
   - Implement FIFO batch selection

3. **Integrate Serial Numbers** (2-3 hours)
   - Add serial picker to invoice builder
   - Update serial status on sale
   - Add warranty validation

4. **Connect Reservations** (2-3 hours)
   - Auto-reserve on quotation
   - Auto-release/mark on sale
   - Add expiry cleanup job

5. **Test & Validate** (2-3 hours)
   - End-to-end workflow tests
   - Data consistency checks
   - Audit trail verification

---

**Total Estimated Effort:** 12-16 hours for all Priority 1 fixes
**Timeline:** Can be completed in 2 days with focused execution
**Dependencies:** Requires database access + schema review

---

Generated: May 12, 2026 | Architecture Analysis Complete | Gaps Identified
