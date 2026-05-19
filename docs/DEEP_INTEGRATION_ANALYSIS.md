# 🔍 DEEP INTEGRATION ANALYSIS
## Backend → Schema → Actions → Frontend Architecture Review

**Date:** April 11, 2026  
**System:** Tenvo - Enterprise Multi-Tenant, Multi-Domain POS+Inventory+ERP  
**Status:** Comprehensive Analysis Complete  

---

## 📊 EXECUTIVE SUMMARY

### Overall Health Score: **7.5/10** ✅ GOOD (Production-Ready with Improvements Needed)

| Category | Score | Status | Comments |
|----------|-------|--------|----------|
| **Multi-Tenancy Enforcement** | 9/10 | ✅ Strong | business_id on all models, guard patterns implemented |
| **Data Model Completeness** | 8.5/10 | ✅ Strong | 76 models covering 6+ verticals comprehensively |
| **Backend-API Integration** | 7/10 | ⚠️ Needs Work | Mixed patterns, inconsistent error handling |
| **Frontend Coupling** | 6.5/10 | ⚠️ High | Direct API calls, scattered hooks, minimal abstraction |
| **Error Handling** | 6/10 | ⚠️ Weak | Generic errors, missing context, poor user feedback |
| **Inventory Integrity** | 5.5/10 | 🔴 Critical | Stock denormalization, race conditions possible |
| **POS-to-Core Integration** | 6/10 | ⚠️ Needs Work | Circular dependencies, missing validations |
| **Domain-Specific Logic** | 7/10 | ⚠️ Works but loose | Soft constraints via domain_data JSON |
| **Documentation** | 4/10 | 🔴 Weak | Missing API specs, incomplete action docs |
| **API Versioning** | 0/10 | 🔴 Missing | No versioning strategy for backward compatibility |

---

## 🏗️ PART 1: ARCHITECTURE OVERVIEW

### 1.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                 │
│  • Components (JSX/TSX)                                     │
│  • Custom Hooks (useInventory, useBatchTracking, etc.)     │
│  • Context Providers (AuthContext, BusinessContext)        │
└──────────┬──────────────────────────────────────────────────┘
           │
           │ Direct imports + API wrappers
           ├─────────────────────────────────────────────────┐
           │                                                 │
┌──────────▼──────────────────────┐         ┌──────────────────┐
│   lib/api/*.js (API Wrappers)   │         │  React Query    │
│  • productAPI.getAll()          │◄────────┤  • useQuery     │
│  • invoiceAPI.create()          │         │  • useMutation  │
│  • customerAPI.update()         │         └──────────────────┘
└──────────┬──────────────────────┘
           │
           │ Calls server actions
           ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVER ACTIONS (Next.js 'use server')          │
│                                                             │
│  lib/actions/                                              │
│  ├── basic/                 (Auth-only basics)             │
│  │   ├── invoice.js                                       │
│  │   ├── accounting.js                                    │
│  │   └── expense.js                                       │
│  ├── standard/              (Full business logic)         │
│  │   ├── inventory/                                       │
│  │   │   ├── product.js                                  │
│  │   │   ├── stock.js                                    │
│  │   │   ├── warehouse.js                                │
│  │   │   └── variant.js                                  │
│  │   ├── quotation.js                                    │
│  │   ├── purchase.js                                     │
│  │   ├── payroll.js                                      │
│  │   ├── workflow.js                                     │
│  │   ├── pos.js                                          │
│  │   ├── restaurant.js                                   │
│  │   └── report.js                                       │
│  ├── premium/               (Plan-gated features)        │
│  │   ├── manufacturing.js                                │
│  │   ├── automation/                                     │
│  │   │   ├── bulk.js                                    │
│  │   │   ├── inventory_composite.js                     │
│  │   │   └── ...                                        │
│  │   └── ...                                            │
│  └── _shared/               (Utilities)                  │
│      ├── tenant.js          (Multi-tenant guard)        │
│      ├── audit.js           (Audit logging)             │
│      ├── result.js          (Response wrapper)          │
│      ├── sequences.js       (Document numbering)        │
│      └── purchaseItems.js   (Shared logic)             │
└─────────────────────────────────────────────────────────────┘
           │
           │ Prisma client queries
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PRISMA SCHEMA (ORM)                       │
│                                                             │
│  76 Models:                                                 │
│  • Authentication (6): User, Session, Account, TwoFactor   │
│  • Sales (8): Invoices, Quotations, SalesOrders, etc.     │
│  • Purchasing (6): Purchases, Returns (C16), etc.         │
│  • Inventory (13): Products, Batches, Serials, Variants   │
│  • Accounting (10): GLAccounts, Entries, Journals         │
│  • POS (9): Terminals, Sessions, Transactions            │
│  • Restaurant (5): Tables, Orders, Kitchen               │
│  • Manufacturing (5): BOMs, ProductionOrders             │
│  • And 7+ more domains...                                  │
└─────────────────────────────────────────────────────────────┘
           │
           │ SQL queries (PostgreSQL)
           ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL (Neon/Supabase)                   │
│                                                             │
│  • Connection pool (30 max connections)                    │
│  • RLS optional (currently server-side only)              │
│  • Multi-tenant: 1 DB, business_id partition              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Integration Points (Currently Examined)

| Point | Current State | Assessment |
|-------|---------------|-----------|
| Frontend → Server Actions | ✅ Working | lib/api/*.js provides wrappers |
| Server Actions → Schema | ✅ Working | Prisma client enforces model constraints |
| Schema → DB | ✅ Working | Migrations are current |
| Auth → Business Isolation | ✅ Strong | withGuard() enforces permission + business_id |
| Audit → Actions | ✅ Good | auditWrite() fires after commit |
| Error Handling → Frontend | ⚠️ Weak | Generic errors, missing details |
| Domain Logic → Components | ⚠️ Moderate | domain_data JSON but soft constraints |

---

## 🔴 PART 2: CRITICAL ISSUES IDENTIFIED

### **ISSUE #1: INVENTORY STOCK DENORMALIZATION** 🔴 HIGH RISK

**Problem:** Stock quantity is stored in 3 separate places:
1. `products.stock` (aggregate total)
2. `product_stock_locations.*` (warehouse/location breakdown)
3. `inventory_ledger.*` (transaction audit trail)

**Current Code Example:**
```prisma
model products {
  stock  Decimal? @default(0)           // Aggregate (🔴 CAN DRIFT)
  // + product_stock_locations with warehouse splits
  // + inventory_ledger with all transactions
}
```

**Risk Scenario:**
```
1. Transaction A: Add 100 units to Warehouse-1
   - inventory_ledger: +100 ✓
   - product_stock_locations[WH1]: 100 ✓
   - products.stock: 100 ✓
   
2. Concurrent Transaction B: Add 50 units to Warehouse-2
   - inventory_ledger: +50 ✓
   - product_stock_locations[WH2]: 50 ✓
   - products.stock: ??? (Race condition - could be 100, 50, or 150)
```

**Impact:**
- 🔴 Inventory reports show wrong totals
- 🔴 Stock allocation algorithms fail
- 🔴 Multi-location businesses get inconsistent views
- 🔴 Audit reconciliation impossible

**Fix Required:**
```typescript
// SOLUTION: Remove products.stock aggregate
// Compute on-read from: SUM(product_stock_locations.quantity)

export async function getProductStock(productId, businessId) {
  const total = await prisma.product_stock_locations.aggregate({
    where: { product_id: productId, business_id: businessId },
    _sum: { quantity: true }
  });
  return total._sum.quantity || 0;
}

// ENFORCE: No direct writes to products.stock
// ALL stock changes MUST go through inventory_ledger + product_stock_locations
```

**Files to Fix:**
- [ ] lib/actions/standard/inventory/stock.js - addStockAction, transferStockAction
- [ ] lib/actions/standard/inventory/product.js - createProductAction (remove stock init)
- [ ] components/* - Replace any direct stock reads with getProductStock()
- [ ] Database migration to backfill consistency

---

### **ISSUE #2: PAYMENT ALLOCATION AMBIGUITY** 🔴 HIGH RISK

**Problem:** Invoice ↔ Purchase payment linking is unclear

```prisma
model payment_allocations {
  id             String @id
  invoice_id     String? @db.Uuid   // Optional
  purchase_id    String? @db.Uuid   // Optional
  payment_id     String @db.Uuid
  allocated_amount Decimal
  
  // ❌ NO CONSTRAINT: Both could be null or both populated!
}
```

**Risk Scenarios:**
1. **Orphan Allocations:** Both fields null → payment not tied to anything
2. **Double-Allocation:** Same payment allocated to both invoice AND purchase
3. **Unlinked Payments:** Payment exists but no allocation record
4. **Query Ambiguity:** "Show me payments for this invoice" → unclear logic

**Current Frontend Behavior:**
```jsx
// In components, no clear pattern emerges:
const allocation = allocations.find(a => a.invoice_id === invoiceId);  // Partial
const payment = payments.find(p => p.id === allocation?.payment_id);
// But what if allocation has BOTH invoice_id AND purchase_id?
```

**Fix Required:**

**Schema Migration (C19 addition):**
```prisma
model payment_allocations {
  id                String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  payment_id        String @db.Uuid
  
  // CRITICAL: Exactly ONE of these must be populated
  invoice_id        String? @db.Uuid
  purchase_id       String? @db.Uuid
  
  allocated_amount  Decimal @db.Decimal(12, 2)
  created_at        DateTime @default(now())
  
  payment           payments @relation(fields: [payment_id], references: [id], onDelete: Cascade)
  invoice           invoices? @relation(fields: [invoice_id], references: [id], onDelete: SetNull)
  purchase          purchases? @relation(fields: [purchase_id], references: [id], onDelete: SetNull)
  
  // ✅ CONSTRAINT: XOR check (handled in action layer for now)
  @@unique([payment_id, invoice_id])  // One payment → one invoice allocation
  @@unique([payment_id, purchase_id]) // One payment → one purchase allocation
  @@index([payment_id])
  @@index([invoice_id])
  @@index([purchase_id])
}
```

**Action Layer Logic:**
```typescript
// lib/actions/basic/payments.js
export async function createPaymentAllocationAction(params) {
  const { payment_id, invoice_id, purchase_id, allocated_amount, business_id } = params;
  
  // XOR VALIDATION
  const count = [invoice_id, purchase_id].filter(Boolean).length;
  if (count !== 1) {
    throw new Error('Payment must allocate to EXACTLY ONE of: invoice OR purchase');
  }
  
  // Prevent duplicate
  const existing = await prisma.payment_allocations.findFirst({
    where: {
      payment_id,
      OR: [
        { invoice_id, invoice_id: { not: null } },
        { purchase_id, purchase_id: { not: null } }
      ]
    }
  });
  if (existing) throw new Error('Payment already allocated');
  
  return prisma.payment_allocations.create({ data: { ... } });
}
```

---

### **ISSUE #3: POS-TO-INVOICE CIRCULAR DEPENDENCY** 🟠 MEDIUM RISK

**Problem (C18):** POS transactions can link to invoices, but relationship is loose

```prisma
model pos_transactions {
  id           String @id
  business_id  String @db.Uuid
  // ... POS-specific fields ...
  invoice_id   String? @db.Uuid        // C18: Can link back to invoice
  
  invoice      invoices? @relation(fields: [invoice_id], references: [id])
}

model invoices {
  id    String @id
  // ...
  pos_transactions  pos_transactions[]   // C18: Reverse relation
}
```

**Issues:**
1. **Circular Logic:** POS creates sale → Linked to Invoice OR Invoice created separately?
2. **Data Duplication:** Item quantities in both pos_transaction_items AND invoice_items (out of sync risk)
3. **Unclear Ownership:** Who owns the financial record - POS or Invoice?
4. **Missing Validation:** No check that POS items match invoice items
5. **Incomplete Reconciliation:** No audit trail of when/how POS linked to invoice

**Example Scenario:**
```
User creates DIN-001 (Invoice) with 10 × Product-A = Rs 1,000

Then POS records: Sale for 5 × Product-A = Rs 500
Points to same invoice DIN-001

Result: 
- Invoice total: Rs 1,000 (10 units)
- POS recorded: Rs 500 (5 units)
- 💥 INCONSISTENCY: Which is truth?
- 💥 STOCK: Did we deduct 5 or 10 units?
```

**Fix Required:**

**Option A: POS as Primary (Recommended for Retail)**
```typescript
// POS creates the transaction first
// Invoice is GENERATED FROM POS (one-way relationship)
export async function generateInvoiceFromPOS(posTransactionId, businessId) {
  const postx = await prisma.pos_transactions.findUnique({
    where: { id: posTransactionId },
    include: { items: true }
  });
  
  // Create invoice from POS data
  const invoice = await prisma.invoices.create({
    data: {
      business_id: businessId,
      customer_id: postx.customer_id,
      invoice_number: generateDocumentNumber(businessId, 'INV'),
      date: postx.created_at,
      status: 'finalized'  // Immutable
      // ... other invoice fields from POS ...
    }
  });
  
  // Link POS to generated invoice
  await prisma.pos_transactions.update({
    where: { id: posTransactionId },
    data: { invoice_id: invoice.id }
  });
  
  // AUDIT
  await auditWrite({
    businessId,
    action: 'generate_from_pos',
    entityType: 'invoice',
    entityId: invoice.id,
    metadata: { source_pos_tx: posTransactionId }
  });
  
  return invoice;
}
```

**Option B: Invoice as Primary (For B2B/Wholesale)**
```typescript
// Invoice created first
// POS processes payment against existing invoice
export async function recordPOSPaymentForInvoice(invoiceId, amount, businessId) {
  const invoice = await prisma.invoices.findUnique({
    where: { id: invoiceId }
  });
  
  // Validate amount
  if (amount > invoice.grand_total) {
    throw new Error('Payment exceeds invoice amount');
  }
  
  // Record POS transaction (payment only, no items)
  const postx = await prisma.pos_transactions.create({
    data: {
      business_id: businessId,
      invoice_id: invoiceId,
      transaction_type: 'payment',
      amount,
      // ...
    }
  });
  
  return postx;
}
```

**Files to Fix:**
- [ ] lib/actions/standard/pos.js - recordPOSTransactionAction()
- [ ] lib/actions/basic/invoice.js - createInvoiceAction()
- [ ] components/pos/ - Add clear UI showing POS ↔ Invoice relationship
- [ ] Schema migration - Add constraint in C19 to formalize choice

---

### **ISSUE #4: DOMAIN_DATA JSON LACKS TYPE SAFETY** 🟠 MEDIUM RISK

**Problem:** domain_data is generic JSON with no validation

```prisma
model products {
  domain_data Json? @default("{}")   // ❌ NO SCHEMA
}

model invoices {
  domain_data Json? @default("{}")   // ❌ NO SCHEMA
}
// ... 15+ more models with loose domain_data
```

**Risk:**
```javascript
// Frontend stores arbitrary data
product.domain_data = {
  "expiry_date": "2026-12-31",          // Correct for pharmacy
  "batch_trackingg": true,              // 🔴 Typo in key
  "custom_field": { nested: { deep: {} } },  // 🔴 Unbounded depth
  "manufacturing_specs": 12345          // 🔴 Wrong type (should be object)
};

// Backend queries fail mysteriously
if (product.domain_data.batch_tracking) {  // undefined
  // Logic never runs
}

// Restaurant code crashes at runtime
table.domain_data.capacity_seats.toString()  // TypeError: not a number
```

**Fix Required:**

**1. Create JSON Schema Files:**
```javascript
// lib/validation/domainSchemas.js
export const DOMAIN_SCHEMAS = {
  pharmacy: {
    batch_tracking: { type: 'boolean', default: true },
    expiry_tracking: { type: 'boolean', default: true },
    lot_number_format: { type: 'string', pattern: '^[A-Z]{2}\\d{6}$' },
    requires_license: { type: 'boolean' }
  },
  restaurant: {
    table_capacity: { type: 'integer', minimum: 1, maximum: 100 },
    section: { type: 'string', enum: ['main', 'reserved', 'bar', 'patio'] },
    enabled_for_reservations: { type: 'boolean' }
  },
  // ... more domains
};

export function validateDomainData(domain, data) {
  const schema = DOMAIN_SCHEMAS[domain];
  if (!schema) return { valid: true }; // Unknown domain = skip
  
  const errors = [];
  for (const [key, spec] of Object.entries(schema)) {
    const value = data[key];
    if (spec.required && value === undefined) {
      errors.push(`${key} is required for ${domain}`);
    }
    if (value !== undefined && typeof value !== spec.type) {
      errors.push(`${key} must be ${spec.type}, got ${typeof value}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

**2. Enforce Validation in Actions:**
```typescript
export async function updateProductAction(productId, businessId, updates) {
  // Get business to find domain
  const business = await prisma.businesses.findUnique({
    where: { id: businessId },
    select: { domain: true, category: true }
  });
  
  if (updates.domain_data) {
    const { valid, errors } = validateDomainData(business.category, updates.domain_data);
    if (!valid) {
      return actionFailure('INVALID_DOMAIN_DATA', 
        `Domain data validation failed: ${errors.join(', ')}`);
    }
  }
  
  // Proceed with update
  const product = await prisma.products.update({
    where: { id: productId, business_id: businessId },
    data: updates
  });
  
  return actionSuccess({ product });
}
```

---

### **ISSUE #5: BULK OPERATIONS NOT AUDITED FOR MULTI-TENANCY** 🔴 HIGH RISK

**Problem:** lib/actions/premium/automation/bulk.js lacks per-record business_id verification

```javascript
// lib/actions/premium/automation/bulk.js
export async function bulkDeleteAction(entityType, ids, businessId) {
  // 🔴 PROBLEM: Deletes ANY ids matching businessId
  // But what if ids were tampered with in transit?
  
  if (entityType === 'products') {
    await prisma.products.deleteMany({
      where: {
        id: { in: ids },
        business_id: businessId
      }
    });
  }
  
  // ✅ WORKS if ids match businessId
  // 🔴 FAILS if attacker provides unrelated business's ids
  //    (deleteMany with business_id filter will reject, but still slow)
}
```

**Better Pattern:**
```typescript
export async function bulkDeleteProductsAction(ids, businessId) {
  // 1. VERIFY all IDs belong to this business FIRST
  const existing = await prisma.products.findMany({
    where: { business_id: businessId, id: { in: ids } },
    select: { id: true }
  });
  
  const existingIds = new Set(existing.map(p => p.id));
  const invalidIds = ids.filter(id => !existingIds.has(id));
  
  if (invalidIds.length > 0) {
    return actionFailure('PERMISSION_DENIED',
      `Some products do not belong to your business: ${invalidIds.join(', ')}`);
  }
  
  // 2. Check permissions on each
  for (const id of ids) {
    if (!can('inventory.delete')) {
      return actionFailure('PERMISSION_DENIED',
        'You lack permission to delete products');
    }
  }
  
  // 3. Audit each deletion
  for (const id of ids) {
    await auditWrite({
      businessId,
      action: 'delete',
      entityType: 'product',
      entityId: id
    });
  }
  
  // 4. Execute batch delete
  const result = await prisma.products.deleteMany({
    where: { business_id: businessId, id: { in: ids } }
  });
  
  return actionSuccess({ deleted_count: result.count });
}
```

**Files to Audit:**
- [ ] lib/actions/premium/automation/bulk.js
- [ ] lib/actions/premium/automation/*.js (all composite actions)
- [ ] lib/actions/standard/pos.js (bulk transaction records)
- [ ] lib/actions/standard/payroll.js (bulk payroll generation)

---

### **ISSUE #6: NO API VERSIONING STRATEGY** 🔴 HIGH RISK

**Problem:** Frontend components directly call specific action functions with no version compatibility

```javascript
// components/SalesDocumentForm.jsx
import {
  createQuotationAction,      // v1? v2? Unknown
  createSalesOrderAction,     // Breaking changes?
  createChallanAction
} from '@/lib/actions/standard/quotation';

// If we change action signature:
// createQuotationAction({ items, customer_id, ... })  // v1
// → createQuotationAction({ items, customer, ... })   // v2 (breaking!)
// 💥 All existing imports break
```

**Impact:**
- 🔴 Can't deprecate old actions
- 🔴 Can't add new features without breaking existing UI
- 🔴 Mobile apps / third-party integrations have no stability guarantees
- 🔴 No way to track which UI version uses which action version

**Fix Required:**

1. **Create versioned action routes:**
```
lib/actions/
├── v1/
│   ├── invoices/
│   │   ├── createInvoice.js
│   │   └── getInvoices.js
│   └── products/
│
└── v2/
    ├── invoices/
    │   └── createInvoice.js
    └── products/
```

2. **Deprecation Path:**
```typescript
// lib/actions/v1/invoices/createInvoice.js
export async function createInvoiceAction(params) {
  // v1 API - support legacy format
  if (!params.items || !params.customer_id) {
    throw new Error('Missing required fields (v1 format)');
  }
  
  // Log deprecation warning
  console.warn('[DEPRECATED] v1/invoices/createInvoice - Use v2 instead');
  
  // Convert to v2
  const v2Result = await createInvoiceActionV2({
    invoice: params,
    lineItems: params.items
  });
  
  return v2Result;
}

// lib/actions/v2/invoices/createInvoice.js
export async function createInvoiceActionV2(params) {
  // New format
  const { invoice, lineItems } = params;
  // ...
}
```

---

### **ISSUE #7: ERROR HANDLING IS GENERIC & UNHELPFUL** 🟡 MEDIUM RISK

**Current State:**
```javascript
// From lib/api/invoice.js
if (!result.success) throw new Error(result.error);

// Frontend receives:
// Generic message: "Failed to create invoice"
// No action items: Can't tell user what went wrong
// No recovery: Frontend can't retry intelligently
```

**Real-World Scenarios**:
```
User tries to create invoice for customer "ACME Corp"

Current Error Message:
❌ "Error: Failed to create invoice"

But actual problem could be:
1. Customer deleted since list loaded
2. Invoice number sequence exhausted
3. Payment terms invalid
4. Tax config missing
5. Stock insufficient
6. Permission denied
7. Business plan limit reached
8. Database connection timeout

User sees only #1 message 💥
```

**Fix Required:**

**Structured Error Framework:**
```typescript
// lib/errors/BusinessError.js
export class BusinessError extends Error {
  constructor(code, message, details = {}, httpStatus = 400) {
    super(message);
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus;
    this.timestamp = new Date().toISOString();
    this.type = 'BUSINESS_ERROR';
  }
}

export class ValidationError extends BusinessError {
  constructor(message, fields = {}) {
    super('VALIDATION_ERROR', message, fields, 422);
    this.type = 'VALIDATION_ERROR';
  }
}

export class PermissionError extends BusinessError {
  constructor(permission, resource) {
    super('PERMISSION_DENIED',
      `You lack permission: ${permission}`,
      { permission, resource },
      403);
    this.type = 'PERMISSION_ERROR';
  }
}

export class ResourceNotFoundError extends BusinessError {
  constructor(resourceType, id) {
    super('NOT_FOUND',
      `${resourceType} not found: ${id}`,
      { resourceType, id },
      404);
  }
}

export class QuotaExceededError extends BusinessError {
  constructor(limit, used, resourceType) {
    super('QUOTA_EXCEEDED',
      `${resourceType} limit (${limit}) reached. Current usage: ${used}`,
      { limit, used, resourceType },
      429);
  }
}
```

**Usage in Actions:**
```typescript
export async function createInvoiceAction(params) {
  try {
    const { business_id, customer_id, items } = params;
    
    // Validation
    if (!items || items.length === 0) {
      throw new ValidationError('Invoice must have at least 1 item', 
        { items: 'At least 1 item required' });
    }
    
    // Permission check
    const session = await withGuard(business_id, { permission: 'sales.create' });
    if (!session) {
      throw new PermissionError('sales.create', 'invoices');
    }
    
    // Resource check
    const customer = await prisma.customers.findUnique({
      where: { id: customer_id }
    });
    if (!customer) {
      throw new ResourceNotFoundError('Customer', customer_id);
    }
    
    // Plan check
    const business = await prisma.businesses.findUnique({
      where: { id: business_id }
    });
    const invoiceCount = await prisma.invoices.count({
      where: { business_id }
    });
    if (business.plan_tier === 'free' && invoiceCount >= 100) {
      throw new QuotaExceededError(100, invoiceCount, 'invoices');
    }
    
    // Create invoice
    const invoice = await prisma.invoices.create({ data: { ... } });
    
    return actionSuccess({ invoice });
    
  } catch (error) {
    if (error instanceof BusinessError) {
      return actionFailure(error.code, error.message, {
        details: error.details,
        type: error.type,
        timestamp: error.timestamp
      });
    }
    
    // Log unexpected errors
    console.error('Unexpected error in createInvoiceAction:', error);
    return actionFailure('INTERNAL_ERROR',
      'An unexpected error occurred. Please contact support.',
      { originalError: error.message });
  }
}
```

**Frontend Usage:**
```jsx
const handleCreateInvoice = async (formData) => {
  try {
    const result = await invoiceAPI.create(formData);
    showToast.success('Invoice created');
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      highlightFormErrors(error.details);
      showToast.error(`Fix required: ${Object.values(error.details).join(', ')}`);
    } else if (error.code === 'PERMISSION_DENIED') {
      showToast.error('You lack permission to create invoices');
    } else if (error.code === 'QUOTA_EXCEEDED') {
      showToast.error(`You've reached the ${error.details.resourceType} limit. Upgrade your plan.`);
    } else {
      showToast.error(error.message);
    }
  }
};
```

---

## 🟠 PART 3: CONFLICTS & DUPLICATIONS

### **CONFLICT #1: THREE WAYS TO GET WAREHOUSE STOCK** 📦

**Location #1: Direct Product Query**
```javascript
// components/InventoryManager.jsx
const product = await productAPI.getAll(businessId);
const stock = product[0].stock;  // ❌ Aggregate, may be stale
```

**Location #2: StockLocation Model**
```javascript
// lib/api/stock.js
const locations = await getStockLocationsAction(productId);
const stock = locations.reduce(sum);  // ✅ Accurate but aggregated on-read
```

**Location #3: Inventory Ledger**
```javascript
// lib/hooks/useInventoryHistory.js
const ledger = await getInventoryLedgerAction(productId);
const stock = ledger
  .reduce((sum, tx) => sum + tx.quantity_change, 0);  // ✅✅ Most accurate
```

**Question:** Which should frontend use? Currently: **All three!** → Inconsistency

**Fix:** Establish single source of truth
```typescript
// lib/api/inventory.js - SINGLE AUTHORITATIVE SOURCE

export async function getProductStockAsync(productId, businessId, warehouseId = null) {
  // Always compute from product_stock_locations (normalized)
  const query = {
    where: {
      product_id: productId,
      business_id: businessId,
      ...(warehouseId && { warehouse_id: warehouseId })
    }
  };

  const locations = await prisma.product_stock_locations.findMany(query);
  
  return locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.quantity, 0)
    : 0;
}

// Use ONLY this function everywhere
// ✅ Consistent
// ✅ Single source
// ✅ No stale aggregate
```

---

### **CONFLICT #2: TWO WAYS TO CREATE SALES DOCUMENTS** 📄

**Method #1: Via SalesDocumentForm Component**
```jsx
// components/SalesDocumentForm.jsx
const result = await createSalesOrderAction({
  inv_number: generateDocNumber(),
  customer_id,
  items: mappedItems
});
```

**Method #2: Via QuickAddTemplates Component**
```jsx
// components/QuickAddTemplates.jsx
const result = await createQuotationAction({
  quotation_number: autoGenerate(),
  customer_details: customer,
  line_items: items
});
```

**Problem:**
- Inconsistent field naming: `inv_number` vs `quotation_number`
- Different parameter shapes  
- Different item mapping logic
- Hard to maintain UI consistency

**Fix:**
```typescript
// lib/api/salesDocuments.js - UNIFIED API

export const salesDocumentAPI = {
  async create(documentType, payload) {
    // documentType: 'quotation' | 'sales_order' | 'challan'
    // payload: StandardDocumentPayload
    
    const { customer_id, items, ...meta } = payload;
    
    // Normalize items
    const normalizedItems = items.map(item => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      tax_percent: Number(item.tax_percent || 0),
      description: item.description
    }));
    
    switch (documentType) {
      case 'quotation':
        return createQuotationAction({
          customer_id,
          quotation_number: generateDocNumber('QTN'),
          items: normalizedItems
        });
        
      case 'sales_order':
        return createSalesOrderAction({
          customer_id,
          sales_order_number: generateDocNumber('SO'),
          items: normalizedItems
        });
        
      case 'challan':
        return createChallanAction({
          customer_id,
          challan_number: generateDocNumber('CH'),
          items: normalizedItems
        });
        
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }
  }
};

// Frontend now uses ONE unified API
const result = await salesDocumentAPI.create('quotation', {
  customer_id,
  items: formItems
});
```

---

### **CONFLICT #3: INVENTORY ADJUSTMENT IN THREE PLACES** 📊

**Location #1: StockAdjustmentForm Component**
```jsx
// components/StockAdjustmentForm.jsx
const reason = formData.adjustment_reason;
const adjustment = await addStockAction({
  product_id,
  quantity: delta,
  reference: 'manual'
});
```

**Location #2: SmartRestockEngine Component**
```jsx
// components/SmartRestockEngine.jsx
const autoAdjustment = await automatedRestockAction({
  products: needsStock,
  trigger: 'reorder_point_breach'
});
```

**Location #3: POS Terminal Inventory Sync**
```jsx
// components/pos/TerminalInventory.jsx
await syncInventoryFromPOS({
  terminal_id,
  changes: pointOfSaleUpdates
});
```

**Problem:** Three separate code paths, three risk surfaces for bugs

**Fix:** Unified inventory action layer
```typescript
// lib/actions/standard/inventory/_core.js

export async function recordInventoryChangeAction(params) {
  const {
    business_id,
    product_id,
    quantity_change,
    reason,          // 'manual' | 'reorder' | 'pos' | 'transfer' | 'production'
    source_reference, // adjustment_id, pos_transaction_id, etc.
    warehouse_id,
    batch_id,
    user_id,
    approval_required = false
  } = params;

  try {
    // Validate
    if (!business_id || !product_id || quantity_change === undefined) {
      throw new ValidationError('Missing required fields');
    }

    // Check if approval needed (for some reasons)
    if (approval_required && ['reorder', 'adjustment'].includes(reason)) {
      const approval = await createApprovalRequest({
        business_id,
        entity_type: 'inventory_adjustment',
        action_type: 'inventory_change',
        data: params,
        requested_by: user_id
      });
      return actionSuccess({ approval_required: true, approval_id: approval.id });
    }

    // 1. Create ledger entry (immutable audit trail)
    const ledgerEntry = await prisma.inventory_ledger.create({
      data: {
        business_id,
        product_id,
        quantity_change,
        movement_type: reason,
        reference_id: source_reference,
        warehouse_id,
        batch_id,
        created_at: new Date(),
        metadata: { initiated_by: user_id }
      }
    });

    // 2. Update stock location
    await prisma.product_stock_locations.updateMany({
      where: {
        product_id,
        business_id,
        ...(warehouse_id && { warehouse_id })
      },
      data: {
        quantity: { increment: quantity_change }
      }
    });

    // 3. Record stock movement (for logistics)
    await prisma.stock_movements.create({
      data: {
        business_id,
        product_id,
        quantity_change,
        transaction_type: reason,
        reference_id: source_reference,
        warehouse_id,
        unit_cost: (await getProductCost(product_id))?.cost_price || 0
      }
    });

    // 4. Audit
    await auditWrite({
      businessId: business_id,
      action: 'adjust_stock',
      entityType: 'product',
      entityId: product_id,
      metadata: { change: quantity_change, reason, warehouse: warehouse_id }
    });

    return actionSuccess({ ledger_entry: ledgerEntry });

  } catch (error) {
    if (error instanceof ValidationError) {
      return actionFailure(error.code, error.message);
    }
    throw error;
  }
}

// Now all three use the same action
export async function addStockAction(params) {
  return recordInventoryChangeAction({ ...params, reason: 'manual' });
}

export async function automatedRestockAction(params) {
  return recordInventoryChangeAction({ ...params, reason: 'reorder' });
}

export async function syncInventoryFromPOS(params) {
  return recordInventoryChangeAction({ ...params, reason: 'pos' });
}
```

---

## 🟢 PART 4: STRENGTHS & WORKING WELL

### ✅ **What's Working**

1. **Multi-Tenancy Enforcement (9/10)**
   - `business_id` on ALL models
   - Guard patterns in place
   - Composite unique keys enforce isolation
   - No cross-tenant data leakage observed

2. **Audit Trail (8.5/10)**
   - audit_logs table comprehensive
   - auditWrite() async but fire-and-forget safe
   - Tracks action, user, entity, changes

3. **Soft Deletes (8/10)**
   - is_deleted + deleted_at on key entities
   - Prevents accidental data loss
   - Enables recovery

4. **Domain-Specific Data Extensibility (7.5/10)**
   - domain_data JSON provides flexibility
   - Multiple domains (pharmacy, restaurant, manufacturing) supported
   - Can store custom metadata without schema migration

5. **Server Actions Architecture (7/10)**
   - Good separation: Frontend → API → Actions → DB
   - Result wrapper pattern consistent
   - Permission guards in place

6. **Database Connection Pooling (8/10)**
   - Enterprise-grade pool settings (30 max connections)
   - Connection time-out and idle timeout configured
   - Prevents pool exhaustion

---

## 🎯 PART 5: INTEGRATION HEALTH 

### 5.1 Frontend → Server Actions Integration

```
Rating: 7/10 ⚠️  
```

**What Works:**
```jsx
✅ Components import actions directly
✅ API wrappers in lib/api/*.js provide interface
✅ Error handling pattern exists (try/catch)
✅ Async/await makes it readable

import { invoiceAPI } from '@/lib/api/invoice';

try {
  const invoice = await invoiceAPI.create(data, items);
  toast.success('Created');
} catch (e) {
  toast.error(e.message);
}
```

**What Needs Work:**
```jsx
❌ No standardized error response format
❌ API wrappers transform data inconsistently
❌ No request validation before server
❌ Missing loading state management
❌ No retry/backoff for failures
❌ No request deduplication
```

**Fix:**
```typescript
// lib/api/_client.js - Unified API client

export class APIClient {
  constructor() {
    this.requestCache = new Map();
    this.inFlight = new Map();
  }

  async call(actionFn, params, options = {}) {
    const { 
      deduplicate = false, 
      retry = 3, 
      timeout = 30000 
    } = options;

    // 1. Check cache (for safe operations)
    if (deduplicate) {
      const cacheKey = `${actionFn.name}:${JSON.stringify(params)}`;
      if (this.inFlight.has(cacheKey)) {
        return this.inFlight.get(cacheKey);
      }
    }

    // 2. Validate params
    validatePayload(actionFn, params);

    // 3. Execute with retry
    const promise = executeWithRetry(
      () => actionFn(params),
      retry,
      timeout
    );

    if (deduplicate) {
      this.inFlight.set(cacheKey, promise);
      promise.finally(() => this.inFlight.delete(cacheKey));
    }

    return promise;
  }
}

// Frontend usage:
const apiClient = new APIClient();
const invoice = await apiClient.call(
  createInvoiceAction, 
  { customer_id, items }, 
  { deduplicate: true, retry: 3 }
);
```

---

### 5.2 Schema → Action Integration

```
Rating: 8/10 ✅
```

**Strengths:**
- Prisma enforces schema constraints (ForeignKey, Unique)
- Relations properly defined
- Indexes on query filters

**Weaknesses:**
- Some models have both JSON fields AND relations (redundancy)
  ```prisma
  product_batches        product_batches[]   // Table
  batches                Json?               // JSON copy 🔴
  ```
- Check constraints not fully used
  ```prisma
  quantity_change Decimal  // Could be < 0, but should validate
  ```

---

### 5.3 Action → Database Integration

```
Rating: 7.5/10 ⚠️
```

**Transaction Safety:** Actions mostly use Prisma transactions ✅
```typescript
await prisma.$transaction(async (tx) => {
  await tx.invoices.create(...)
  await tx.inventory_ledger.create(...)
});
```

**Connection Pool:** Well-configured (30 connections, 5s timeout) ✅

**N+1 Queries:** Some actions fetch related data inefficiently ⚠️
```typescript
// BAD: N+1
const invoices = await prisma.invoices.findMany(...);
for (const inv of invoices) {
  const items = await prisma.invoice_items.findMany({ 
    where: { invoice_id: inv.id } 
  });  // 🔴 N queries!
}

// GOOD: JOIN
const invoices = await prisma.invoices.findMany({
  include: { invoice_items: true }  // 1 efficient query
});
```

---

## 🔧 PART 6: RECOMMENDED FIXES (Priority Order)

| # | Issue | Impact | Effort | Priority |
|---|-------|--------|--------|----------|
| **1** | Inventory stock denormalization | 🔴 High | 🟡 Medium | 🔴 **P0** |
| **2** | Payment allocation ambiguity | 🔴 High | 🟢 Low | 🔴 **P0** |
| **3** | Bulk operations multi-tenant audit | 🔴 High | 🟡 Medium | 🟠 **P1** |
| **4** | Error handling framework | 🟠 Medium | 🟡 Medium | 🟠 **P1** |
| **5** | Domain_data JSON schema validation | 🟠 Medium | 🟡 Medium | 🟠 **P1** |
| **6** | POS-Invoice circular dependency | 🟠 Medium | 🟠 High | 🟠 **P1** |
| **7** | API versioning strategy | 🟠 Medium | 🟠 High | 🟢 **P2** |
| **8** | N+1 query audit & optimization | 🟡 Low | 🟡 Medium | 🟢 **P2** |
| **9** | API documentation generation | 🟡 Low | 🟢 Low | 🟢 **P3** |

---

## 💻 PART 7: IMPLEMENTATION ROADMAP

### **Phase 1A: Critical Direct Fixes (1-2 weeks)**

**Goal:** Fix inventory & payment bugs immediately

**Tasks:**
- [ ] Add `assertPaymentAllocationXOR()` check to all payment creation
- [ ] Create `getProductStock()` computed function, use everywhere
- [ ] Add database check constraint for payment_allocations
- [ ] Audit bulkDeleteAction for business_id verification

**Deliverables:**
- Unit tests for inventory consistency
- Edge case test suite for payments
- Bulk operation audit report

---

### **Phase 1B: Data Quality (1 week)**

**Goal:** Validate existing data integrity

**Tasks:**
- [ ] Scan database for orphaned payments
- [ ] Reconcile product.stock vs. product_stock_locations totals
- [ ] Find products with domain_data schema violations
- [ ] Report findings

**Deliverables:**
- Data audit report
- Cleanup SQL scripts (if needed)

---

### **Phase 2: Error Handling & Validation (2 weeks)**

**Goal:** Standardize error handling, improve user feedback

**Tasks:**
- [ ] Create `BusinessError` hierarchy
- [ ] Convert top 20 actions to use new error framework
- [ ] Add JSON schema validation for domain_data
- [ ] Update frontend error handling

**Deliverables:**
- Error handling guide
- Schema validation library
- Frontend error UI components

---

### **Phase 3: API Versioning (3 weeks)**

**Goal:** Enable backward compatibility, don't break mobile/third-party apps

**Tasks:**
- [ ] Create `lib/actions/v1/` and `lib/actions/v2/` directories
- [ ] Migrate top 10 actions to v2 with v1 compatibility
- [ ] Document API contract (OpenAPI spec)
- [ ] Deploy deprecation warnings

**Deliverables:**
- API documentation (OpenAPI/Swagger)
- Migration guide for clients
- Deprecation timeline

---

### **Phase 4: Consolidation (2 weeks)**

**Goal:** Reduce redundancy in inventory operations

**Tasks:**
- [ ] Consolidate 3 inventory adjustment code paths
- [ ] Clarify POS-Invoice ownership (pick Option A or B)
- [ ] Remove duplicate component logic
- [ ] Unify stock APIs

**Deliverables:**
- Single inventory ledger pattern
- POS-Invoice design decision doc
- Code consolidation PR

---

## 📋 PART 8: AUDIT CHECKLIST

Use this checklist to verify fixes:

```
INVENTORY INTEGRITY
- [ ] products.stock DEPRECATED (warnings active)
- [ ] All stock reads from product_stock_locations aggregate
- [ ] inventory_ledger captures every stock change
- [ ] Concurrent tests pass (stress test with 100 parallel updates)
- [ ] Database query for totals = actual stock: 100% match

PAYMENT ALLOCATION
- [ ] All payment_allocations have business_id index
- [ ] Payment ↔ Invoice/Purchase check constraint active
- [ ] No orphaned allocations (both invoice_id AND purchase_id null)
- [ ] Query returns correct customer/vendor payment status
- [ ] Accounting reports reconcile to payment allocations

BULK OPERATIONS
- [ ] bulkDeleteAction verifies all IDs belong to business
- [ ] Permission check happens per-record (or batch checked)
- [ ] Audit log entry per record deleted
- [ ] Rate limiting prevents abuse
- [ ] Stress test: 1000-item bulk delete works

ERROR HANDLING
- [ ] All actions return standardized result object
- [ ] BusinessError hierarchy used everywhere
- [ ] 404 vs 403 vs 422 correctly returned
- [ ] Frontend displays actionable error messages
- [ ] User can retry failed operations

DOMAIN_DATA
- [ ] schema.json exists for each domain
- [ ] Validation runs on every domain_data update
- [ ] Old data migrated to conform to schema
- [ ] TypeScript types match schema
- [ ] Tests for each domain schema

API VERSIONING
- [ ] v1/ and v2/ directories contain actions
- [ ] v1 calls v2 internally (no code duplication)
- [ ] Breaking changes documented
- [ ] Deprecation timeline published
- [ ] Mobile app successfully calls both versions

```

---

## 🚀 QUICK WINS (Can Be Done Before Major Refactor)

:
1. **Payment Allocation XOR Check** (1 hour)
   ```typescript
   // Add to payment creation
   if ((invoice_id && purchase_id) || (!invoice_id && !purchase_id)) {
     throw new Error('Allocate to ONE of invoice or purchase');
   }
   ```

2. **Inventory Total Consistency Check** (2 hours)
   ```typescript
   // Run daily health check
   SELECT p.id, p.stock as denormalized,
          SUM(psl.quantity) as actual
   FROM products p
   LEFT JOIN product_stock_locations psl ON p.id = psl.product_id
   GROUP BY p.id
   HAVING p.stock != SUM(psl.quantity);
   ```

3. **Add Audit to Existing Actions** (4 hours)
   - Replace 5 top actions with auditWrite() calls
   - Verify audit logs populate

4. **API Error Response Standardization** (3 hours)
   - Update lib/api/*.js to always return `{ success, data, error, code }`
   - Update frontend to expect standard shape

5. **Domain_Data Warnings** (2 hours)
   - Add console.warn() when unknown domain_data keys accessed
   - Helps spot typos in production

---

## 📞 CONCLUSION

Your system is **production-ready** but with **significant areas for hardening**:

### 🟢 **What to Keep:**
- Multi-tenancy enforcement pattern
- Server actions architecture
- Audit trail approach
- Soft-delete model

### 🔴 **What to Fix (Priority):**
1. Inventory stock denormalization  
2. Payment allocation ambiguity
3. Bulk operation audits
4. Error handling framework
5. Domain_data schema validation

### 🟠 **What to Plan:**
- API versioning (backward compatibility)
- POS-Invoice clarity
- N+1 query cleanup
- API documentation

**Next Steps:**
1. Pick **3 critical issues** from Part 2 → Fix in next sprint
2. Run audit checklist from Part 8 → Verify inventory data
3. Queue Phase 4 consolidation → Reduce future maintenance burden

---

**Document Version:** 1.0  
**Last Updated:** April 11, 2026  
**Reviewed By:** Deep Integration Analysis System  
**Status:** Ready for Implementation
