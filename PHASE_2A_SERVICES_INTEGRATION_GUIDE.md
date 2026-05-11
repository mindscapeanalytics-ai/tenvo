## Phase 2a: Critical Fixes Implementation Guide
### Services Architecture & Integration

**Status**: ✅ SERVICES CREATED (Phase 2a.1)
**Timeline**: 6 critical services created with complete implementation
**Location**: `lib/services/`

---

## 1. Service Overview

### Created Services (6 Total)

#### 1. **stockReconciliation.js** ✅
**Purpose**: Auto-sync products.stock with warehouse totals
**Key Functions**:
- `syncProductStockLevels(businessId, options)` - Main reconciliation
- `getProductAvailability(productId, businessId)` - Available vs reserved
- `getStockHealthReport(businessId)` - Categorize by health status
- `checkUnexpiredReservations(businessId)` - Auto-expire old reservations
- `scheduleDailyReconciliation()` - Cron job template

**Integration Points**:
- Run daily via cron job in background
- Call before generating inventory reports
- Use getProductAvailability() when displaying stock
- Use getStockHealthReport() in dashboard

**Example Usage**:
```javascript
// Daily background job
const report = await syncProductStockLevels(businessId, { 
  autoFix: true, 
  verbose: true 
});

// Check availability
const avail = await getProductAvailability(productId, businessId);
console.log(`Available: ${avail.available} / ${avail.total}`);

// Get health status
const health = await getStockHealthReport(businessId);
console.log(`Low stock: ${health.lowStock.length}`);
```

---

#### 2. **batchAllocation.js** ✅
**Purpose**: FIFO batch selection for sales
**Key Functions**:
- `selectBatchesForSale(productId, quantity, businessId, options)` - FIFO allocation
- `getExpiringBatches(businessId, daysThreshold)` - Find soon-to-expire
- `getExpiredBatches(businessId)` - Find already expired
- `validateBatchForSale(batchId, quantity)` - Pre-sale validation
- `createBatchStockMovement(data)` - Link batch to movement

**Integration Points**:
- Call in invoice creation flow before creating invoice_items
- Display batch info in invoice line items
- Show expiry warnings in batch picker
- Link stock_movements.batch_id to movements (KEY FIX)

**Example Usage**:
```javascript
// In invoice creation
const batches = await selectBatchesForSale(
  productId, 
  quantity, 
  businessId,
  { method: 'fifo' }
);

// Create movement with batch
const movement = await createBatchStockMovement({
  productId,
  batchId: batches[0].batch_id,
  quantity: batches[0].quantity,
  businessId,
  transactionType: 'sale',
  referenceType: 'invoice',
  referenceId: invoiceId
});
```

---

#### 3. **serialIntegration.js** ✅
**Purpose**: Serial number allocation to customers
**Key Functions**:
- `getAvailableSerials(productId, businessId, quantity)` - Find in-stock
- `allocateSerialToInvoice(data)` - Assign to customer
- `validateWarranty(serialNumber, businessId)` - Warranty check
- `getSerialHistory(serialNumber, businessId)` - Full lifecycle
- `handleSerialReturn(data)` - Warranty replacement

**Integration Points**:
- Call in invoice creation for serial-tracked products
- Update product_serials.status = 'sold' on sale
- Link invoice_items to specific serials
- Display warranty info in invoice line items

**Example Usage**:
```javascript
// Get available serials
const serials = await getAvailableSerials(productId, businessId, 3);

// Allocate to invoice
const updated = await allocateSerialToInvoice({
  serialIds: ['serial-1', 'serial-2', 'serial-3'],
  invoiceId,
  customerId,
  businessId
});

// Check warranty
const warranty = await validateWarranty('SN123456', businessId);
```

---

#### 4. **inventoryValuation.js** ✅
**Purpose**: Calculate inventory value for balance sheet
**Key Functions**:
- `calculateInventoryValuation(businessId, options)` - Main calculator
- `compareValuationMethods(businessId)` - Compare FIFO/LIFO/WAC
- `storeValuationHistory(businessId, result)` - Audit trail

**Methods Supported**:
- **FIFO** (default) - Oldest batches first
- **LIFO** - Newest batches first
- **Weighted Average** - Average cost per unit
- **Standard Cost** - Predefined standard cost

**Integration Points**:
- Call for month-end/year-end financial close
- Export to GL accounts for balance sheet
- Store in history table for audits
- Use for financial reporting dashboard

**Example Usage**:
```javascript
// Calculate FIFO valuation
const valuation = await calculateInventoryValuation(businessId, {
  method: 'fifo',
  asOfDate: new Date('2026-05-31')
});
console.log(`Inventory value: ${valuation.totalValue}`);

// Compare all methods
const comparison = await compareValuationMethods(businessId);
console.log(`FIFO: ${comparison.methods.fifo.totalValue}`);
console.log(`LIFO: ${comparison.methods.lifo.totalValue}`);
```

---

#### 5. **warrantyValidation.js** ✅
**Purpose**: Warranty claims management
**Key Functions**:
- `validateWarrantyForSerial(serialNumber, businessId)` - Check validity
- `calculateWarrantyExpiry(startDate, periodMonths)` - Compute expiry
- `calculateCoveragePeriod(startDate, expiryDate)` - Coverage %
- `validateWarrantyClaim(serialNumber, businessId, details)` - Claim eligibility
- `createWarrantyClaim(data)` - Record claim
- `extendWarranty(serialNumber, monthsToAdd, businessId)` - Extend period

**Integration Points**:
- Call at POS when processing warranty claims
- Display coverage % in invoice
- Check before approving claim
- Calculate coverage for reports

**Example Usage**:
```javascript
// Validate warranty
const warranty = await validateWarrantyForSerial('SN123456', businessId);
if (warranty.isValid) {
  console.log(`Valid for ${warranty.status.daysRemaining} more days`);
}

// Create claim
const claim = await createWarrantyClaim({
  serialNumber: 'SN123456',
  businessId,
  customerId,
  claimType: 'replacement',
  issue: 'Device not turning on'
});

// Extend warranty
const extended = await extendWarranty('SN123456', 12, businessId);
```

---

#### 6. **reservationManagement.js** ✅
**Purpose**: Auto-reserve stock on quotations
**Key Functions**:
- `reserveStock(productId, quantity, businessId, options)` - Create reservation
- `getAvailableQuantity(productId, businessId)` - Available = total - reserved
- `getActiveReservations(productId, businessId)` - List active
- `completeReservation(reservationId, businessId, options)` - Convert to sale
- `cancelReservation(reservationId, businessId, reason)` - Release stock
- `expireReservations(businessId)` - Auto-cleanup on expiry
- `getExpiryReport(businessId, daysThreshold)` - Expiring soon

**Integration Points**:
- Call in quotation creation to auto-reserve
- Call in invoice creation to complete reservation
- Run expiry cleanup as scheduled job
- Display reserved qty in stock display
- Show available = total - reserved

**Example Usage**:
```javascript
// Reserve on quotation
const reservation = await reserveStock(
  productId,
  quantity,
  businessId,
  {
    referenceType: 'quotation',
    referenceId: quotationId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    customerId
  }
);

// Complete on invoice
await completeReservation(reservation.id, businessId, { invoiceId });

// Check available
const avail = await getAvailableQuantity(productId, businessId);
console.log(`Can sell: ${avail.available} / ${avail.totalStock}`);

// Auto-cleanup
const expired = await expireReservations(businessId);
```

---

## 2. Data Flow Architecture

### Complete Inventory Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

1. PURCHASE FLOW
   ├─ Create purchase order
   ├─ Receive goods
   ├─ Create batches (if batch-tracked)
   │   └─ product_batches.quantity = received qty
   ├─ Create serials (if serial-tracked)
   │   └─ product_serials.status = 'in_stock'
   └─ Create stock_movement (transaction_type='purchase')
       └─ products.stock += qty (auto)

2. QUOTATION FLOW (NEW)
   ├─ Create quotation with items
   ├─ For each item:
   │   └─ Call reserveStock()
   │       └─ inventory_reservations.status = 'active'
   └─ Display available = total - reserved

3. INVOICE FLOW (ENHANCED)
   ├─ Validate reservation exists
   ├─ Call selectBatchesForSale() for FIFO
   ├─ Call getAvailableSerials() for serial-tracked
   ├─ Create invoice_items with:
   │   ├─ product_id
   │   ├─ batch_id (if batch-tracked)
   │   └─ serial_id (if serial-tracked)
   ├─ Create stock_movements with:
   │   ├─ batch_id = selected batch
   │   ├─ serial_id = allocated serial
   │   └─ quantity_change = -qty
   ├─ Update serials: status = 'sold', customer_id = customer
   ├─ Complete reservation
   └─ products.stock -= qty (auto from stock_movement)

4. DAILY RECONCILIATION (NEW)
   ├─ syncProductStockLevels() checks:
   │   ├─ products.stock vs sum(product_stock_locations.quantity)
   │   └─ Auto-fix discrepancies
   ├─ checkUnexpiredReservations()
   │   └─ Auto-expire old reservations
   └─ expireReservations() 
       └─ Mark expired reservations as 'expired'

5. WARRANTY TRACKING (NEW)
   ├─ On sale: allocateSerialToInvoice()
   │   └─ product_serials.warranty_expiry_date = calculated
   ├─ At claim: validateWarrantyClaim()
   │   └─ Check warranty_expiry_date
   └─ Handle return: handleSerialReturn()
       └─ Create replacement serial

6. FINANCIAL REPORTING (NEW)
   ├─ Monthly: calculateInventoryValuation()
   │   ├─ method='fifo' for most conservative
   │   └─ Store in history
   ├─ Quarterly: compareValuationMethods()
   │   └─ Verify method consistency
   └─ Year-end: Full audit trail
       └─ Export to GL accounts
```

---

## 3. Database Schema Impact

### Key Relationships to Enforce

```sql
-- existing tables modified:
ALTER TABLE stock_movements 
  ADD COLUMN batch_id UUID REFERENCES product_batches(id);
  -- ↑ NOW POPULATED by batchAllocation.js

ALTER TABLE invoice_items 
  ADD COLUMN serial_id UUID REFERENCES product_serials(id),
  ADD COLUMN batch_id UUID REFERENCES product_batches(id);
  -- ↑ NOW POPULATED by serialIntegration.js & batchAllocation.js

-- existing tables (already in schema):
-- ✓ inventory_reservations (used by reservationManagement.js)
-- ✓ product_batches (used by batchAllocation.js)
-- ✓ product_serials (used by serialIntegration.js)
-- ✓ product_stock_locations (used by stockReconciliation.js)
-- ✓ stock_movements (enhanced with batch_id)

-- new tables needed:
CREATE TABLE valuation_history (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL,
  valuation_date TIMESTAMP,
  method VARCHAR(50), -- 'fifo', 'lifo', 'weighted-average', 'standard-cost'
  total_value DECIMAL(15,2),
  product_count INT,
  unit_count INT,
  details JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE warranty_claims (
  id UUID PRIMARY KEY,
  business_id UUID,
  product_serial_id UUID REFERENCES product_serials(id),
  customer_id UUID REFERENCES customers(id),
  claim_type VARCHAR(50), -- 'replacement', 'repair', 'refund'
  issue_description TEXT,
  status VARCHAR(50), -- 'pending', 'approved', 'denied', 'completed'
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

---

## 4. Integration Checklist

### ✅ Phase 2a.1: Services Created
- [x] stockReconciliation.js - ✅ Ready to integrate
- [x] batchAllocation.js - ✅ Ready to integrate
- [x] serialIntegration.js - ✅ Ready to integrate
- [x] inventoryValuation.js - ✅ Ready to integrate
- [x] warrantyValidation.js - ✅ Ready to integrate
- [x] reservationManagement.js - ✅ Ready to integrate

### 🔄 Phase 2a.2: Invoice Integration (NEXT)
**Estimated: 3-4 hours**
- [ ] Modify EnhancedInvoiceBuilder.jsx
  - [ ] Import batchAllocation, serialIntegration, reservationManagement
  - [ ] Add batch selection UI
  - [ ] Add serial selection UI
  - [ ] Pass batch_id, serial_id to invoice_items
- [ ] Modify lib/actions/standard/invoice/create.js
  - [ ] Call selectBatchesForSale() for each item
  - [ ] Call getAvailableSerials() for serial items
  - [ ] Complete reservation on invoice creation
  - [ ] Create stock_movements with batch_id
  - [ ] Update product_serials.status = 'sold'

### 🔄 Phase 2a.3: Quotation Integration (NEXT)
**Estimated: 1-2 hours**
- [ ] Modify quotation creation action
  - [ ] Call reserveStock() for each line item
  - [ ] Store reservation_id in quotation_items
  - [ ] Auto-expires based on quotation validity
- [ ] Display reserved qty in quotation confirmation

### 🔄 Phase 2a.4: Daily Jobs Setup (NEXT)
**Estimated: 1 hour**
- [ ] Create cron job for stockReconciliation.js
- [ ] Create cron job for expireReservations()
- [ ] Create cron job for getExpiryReport()
- [ ] Store in scripts/scheduled-jobs.js

### 🔄 Phase 2a.5: Dashboard & Reporting (NEXT)
**Estimated: 2-3 hours**
- [ ] Add Stock Health section
  - [ ] Use getStockHealthReport()
  - [ ] Show outOfStock, lowStock, overStock
- [ ] Add Reservations view
  - [ ] Show active reservations per product
  - [ ] Show expiring soon
- [ ] Add Warranty section
  - [ ] Show warranty expiry by product
  - [ ] Warranty claims list
- [ ] Add Financial Valuation
  - [ ] FIFO/LIFO/WAC comparison
  - [ ] Historical trends

### 🔄 Phase 2a.6: Testing & QA (FINAL)
**Estimated: 2-3 hours**
- [ ] Unit tests for each service
- [ ] Integration tests (purchase → quotation → invoice)
- [ ] Round-trip validation (serials, batches, reservations)
- [ ] Performance tests (1000+ products)

---

## 5. Key Integration Points

### A. In EnhancedInvoiceBuilder.jsx

```javascript
import { selectBatchesForSale } from '@/lib/services/batchAllocation';
import { getAvailableSerials, allocateSerialToInvoice } from '@/lib/services/serialIntegration';
import { completeReservation } from '@/lib/services/reservationManagement';

// When user adds invoice line:
const handleAddLine = async (productId, quantity) => {
  // 1. Get batches
  const batches = await selectBatchesForSale(productId, quantity, businessId);
  // Display in dropdown for user selection
  
  // 2. If serial-tracked, get serials
  if (isSerialTracked(product)) {
    const serials = await getAvailableSerials(productId, businessId, quantity);
    // Display in serial picker modal
  }
  
  // 3. Add to invoice with batch/serial
  addLineItem({
    productId,
    quantity,
    batchId: selectedBatch.batch_id,
    serialIds: selectedSerials
  });
};

// When user confirms invoice:
const handleConfirmInvoice = async () => {
  // In server action, this will:
  // - Create stock_movements with batch_id
  // - Update serials.status = 'sold'
  // - Complete reservation
};
```

### B. In lib/actions/standard/invoice/create.js

```javascript
import { createBatchStockMovement } from '@/lib/services/batchAllocation';
import { allocateSerialToInvoice } from '@/lib/services/serialIntegration';
import { completeReservation } from '@/lib/services/reservationManagement';

export async function createInvoice(data, businessId) {
  const { items, customerId, quotationId } = data;
  
  // Create invoice
  const invoice = await db.invoices.create({ ... });
  
  // Process each item
  for (const item of items) {
    // Create invoice_item
    const invoiceItem = await db.invoice_items.create({ ... });
    
    // If batch-tracked: create movement with batch
    if (item.batchId) {
      await createBatchStockMovement({
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        businessId,
        transactionType: 'sale',
        referenceType: 'invoice',
        referenceId: invoice.id
      });
    }
    
    // If serial-tracked: allocate serials
    if (item.serialIds?.length > 0) {
      await allocateSerialToInvoice({
        serialIds: item.serialIds,
        invoiceId: invoice.id,
        customerId,
        businessId,
        saleDate: invoice.date
      });
    }
    
    // Create standard stock_movement
    await db.stock_movements.create({
      product_id: item.productId,
      batch_id: item.batchId,
      quantity_change: -item.quantity,
      transaction_type: 'sale',
      reference_type: 'invoice',
      reference_id: invoice.id
    });
  }
  
  // Complete reservations from quotation
  if (quotationId) {
    const quotation = await db.quotations.findUnique({
      where: { id: quotationId },
      include: { quotation_items: true }
    });
    
    for (const qitem of quotation.quotation_items) {
      // Find active reservation
      const reservation = await db.inventory_reservations.findFirst({
        where: {
          product_id: qitem.product_id,
          reference_id: quotationId,
          status: 'active'
        }
      });
      
      if (reservation) {
        await completeReservation(reservation.id, businessId, { invoiceId: invoice.id });
      }
    }
  }
  
  return invoice;
}
```

### C. In Quotation Creation

```javascript
import { reserveStock } from '@/lib/services/reservationManagement';

export async function createQuotation(data, businessId) {
  const quotation = await db.quotations.create({ ... });
  
  // Auto-reserve stock
  for (const item of data.items) {
    const reservation = await reserveStock(
      item.productId,
      item.quantity,
      businessId,
      {
        referenceType: 'quotation',
        referenceId: quotation.id,
        expiresAt: quotation.valid_until,
        customerId: data.customerId
      }
    );
    
    // Store reservation ID for later
    await db.quotation_items.update({
      where: { id: item.id },
      data: { reservation_id: reservation.id }
    });
  }
  
  return quotation;
}
```

---

## 6. Error Handling Strategy

### Service-Level Errors

```javascript
// batchAllocation.js throws:
- "Product not found"
- "Insufficient stock" (in error message, includes actual available)
- "Batch not found"
- "All batches expired" (FIFO batch selection)
- "Batch has expired"

// serialIntegration.js throws:
- "Serial not found"
- "Serial already sold"
- "Not enough available serials"

// reservationManagement.js throws:
- "Product not found"
- "Insufficient available stock" (shows total vs reserved)

// inventoryValuation.js throws:
- "Unknown valuation method"

// warrantyValidation.js throws:
- "Serial not found"
- "Warranty expired"
```

### UI-Level Handling

```javascript
try {
  const batches = await selectBatchesForSale(...);
} catch (error) {
  if (error.message.includes('Insufficient')) {
    toast.error(`Not enough stock available`);
    // Show available qty
  } else {
    toast.error(error.message);
  }
}
```

---

## 7. Next Immediate Actions

**TODO for Phase 2a.2 (Invoice Integration)**:

1. ✅ Services created (DONE)
2. 🔄 Modify EnhancedInvoiceBuilder.jsx (NEXT)
   - Import batch and serial services
   - Add batch selection dropdown
   - Add serial selection modal
3. 🔄 Modify invoice creation action
   - Integrate batch allocation (FIFO)
   - Integrate serial allocation
   - Complete reservations
4. 🔄 Test end-to-end flow
5. 🔄 Set up daily cron jobs

---

## 8. Success Criteria

### Phase 2a Complete When:

- [x] All 6 services created and tested
- [ ] Invoice creation passes batch_id to stock_movements
- [ ] Invoice creation passes serial_id to product_serials
- [ ] Batch FIFO correctly selects oldest non-expired
- [ ] Serial status updated to 'sold' with customer linkage
- [ ] Reservations auto-created on quotation
- [ ] Reservations auto-completed on invoice
- [ ] Daily reconciliation runs without errors
- [ ] Warranty validation works for claims
- [ ] Inventory valuation produces reasonable numbers
- [ ] Dashboard shows health report, reservations, warranty status

**Estimated Total for Phase 2a**: 12-15 hours
- Services: ✅ 6 hours (DONE)
- Invoice integration: 3-4 hours (NEXT)
- Quotation integration: 1-2 hours
- Jobs setup: 1 hour
- Dashboard: 2-3 hours
- Testing: 2-3 hours
