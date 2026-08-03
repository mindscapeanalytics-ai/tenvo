# 📊 ARCHITECTURE DIAGRAMS & DATA FLOW MAPS
## Visual Analysis of Integration Points

---

## 1. MULTI-TENANCY ISOLATION MODEL

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE DATABASE                          │
│                   (PostgreSQL on Neon)                       │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐        ┌────────┐        ┌────────┐
    │Business│        │Business│        │Business│
    │ID: U1  │        │ID: U2  │        │ID: U3  │
    │Tenvo   │        │Acme    │        │Alpha   │
    └───┬────┘        └───┬────┘        └───┬────┘
        │                  │                  │
        ▼                  ▼                  ▼
    Products          Products          Products
    (5,000 rows)     (3,000 rows)      (12,000 rows)
    Filter:          Filter:           Filter:
    business_id=U1   business_id=U2    business_id=U3
    
    Invoices         Invoices          Invoices
    (50 rows)        (200 rows)        (500 rows)
    ├─ U1-INV-001    ├─ U2-INV-001    ├─ U3-INV-001
    ├─ U1-INV-002    ├─ U2-INV-002    ├─ U3-INV-002
    └─ ...           └─ ...           └─ ...
    
    GlAccounts       GlAccounts        GlAccounts
    CustomSettings   CustomSettings    CustomSettings
    Users (Roles)    Users (Roles)     Users (Roles)
    ...              ...               ...
```

**Key Enforcement Points:**
1. Every query: `WHERE business_id = $1`
2. Every update: Verify entity belongs to business first
3. Every schema: `business_id` field mandatory (except User, Session)
4. Every action: `withGuard(businessId)` validates permission

---

## 2. AUTHENTICATION & AUTHORIZATION FLOW

```
┌──────────────────────────────────────────────────────┐
│           USER LOGS IN (better-auth)                │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│     Session Created & Stored (PostgreSQL)           │
│     ├─ session.userId                               │
│     ├─ session.token                                │
│     └─ session.expiresAt                            │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│   Frontend: useSession() → Hydrates AuthContext     │
│   ├─ user.id                                        │
│   ├─ user.email                                     │
│   └─ user.role                                      │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│   Component calls action with businessId            │
│   e.g., createInvoiceAction({ businessId, ... })   │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│        Server Action Executes:                       │
│   1. getServerSession() → Get user from request     │
│   2. withGuard(businessId, { permission })          │
│      ├─ Check user logged in                        │
│      ├─ Check business_users record exists          │
│      ├─ Check role has permission                   │
│      └─ Return { user, role, permissions }          │
│   3. If guard fails → PermissionError               │
│   4. If guard passes → Execute action               │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│   Action Continues:                                 │
│   await prisma.invoices.create({                    │
│     business_id: businessId,  ← Enforced            │
│     ...                                              │
│   })                                                 │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│   Audit Written (async):                            │
│   auditWrite({                                       │
│     businessId,                                     │
│     action: 'create',                              │
│     entityType: 'invoice',                         │
│     userId: user.id                                │
│   })                                                │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│   Result Returned to Frontend:                      │
│   { success: true, data: invoice }                  │
│   or { success: false, error: "..." }              │
└──────────────────────────────────────────────────────┘
```

---

## 3. INVENTORY STOCK FLOW (BROKEN)

```
┌─────────────────────────────────────────────────────────────┐
│  USER: Add 100 units of Product-A to Warehouse-1           │
└────────┬───────────────────────────────────────────────────┘
         │
         ▼
   StockAdjustmentForm.jsx
   └─→ addStockAction({ product_id, quantity: 100, warehouse_id })
         │
         ▼ (SERVER ACTION EXECUTES)
   ┌──────────────────────────────────────────┐
   │ 1. Create inventory_ledger entry:        │
   │    ├─ product_id: P-001                 │
   │    ├─ quantity_change: +100             │
   │    └─ warehouse_id: WH-1                │
   │    ✅ SUCCESS                            │
   │                                          │
   │ 2. Update product_stock_locations:       │
   │    WHERE warehouse_id = WH-1             │
   │    SET quantity += 100                   │
   │    ✅ SUCCESS: quantity now 100          │
   │                                          │
   │ 3. Update products.stock:                │
   │    WHERE id = P-001                      │
   │    SET stock += 100                      │
   │    ✅ SUCCESS: stock now 100             │
   │                                          │
   │ ⚠️ PROBLEM: These 3 updates are NOT     │
   │    in a transaction! If action crashes   │
   │    between steps, data goes out of sync! │
   └──────────────────────────────────────────┘
         │
         ▼
   WHERE'S THE STOCK NOW?
   
   ┌─────────┬─────────┬──────────────────────┐
   │ Source  │ Value   │ Correct?             │
   ├─────────┼─────────┼──────────────────────┤
   │products │ 100     │ ✅ Yes (now)         │
   │         │         │ 🔴 Maybe (tomorrow)  │
   │         │         │    if computed again │
   ├─────────┼─────────┼──────────────────────┤
   │location │ 100     │ ✅ Always correct    │
   │stock    │         │    (source of truth) │
   ├─────────┼─────────┼──────────────────────┤
   │ledger   │ 100     │ ✅ Audit trail       │
   │ (agg)   │         │    (always correct)  │
   └─────────┴─────────┴──────────────────────┘
   
   LATER: Concurrent update adds 50 units to WH-2
   ┌────────────────────────────────────┐
   │ Thread A: products.stock += 50     │
   │ Thread B: products.stock += 100    │
   │                                    │
   │ Race: Who wins? 50? 100? 150?      │
   │ 🔴 UNDEFINED BEHAVIOR              │
   └────────────────────────────────────┘
```

**SOLUTION:**
```
Remove products.stock entirely
Every query for stock:
  SELECT SUM(quantity) 
  FROM product_stock_locations
  WHERE product_id = P-001
  AND business_id = B-001
  
Result is ALWAYS fresh + correct ✅
```

---

## 4. PAYMENT ALLOCATION JUNGLE

```
┌──────────────────────────────────────────────────────────────┐
│  Payment Created: Rs 50,000 received from ACME Corp         │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
    Is this paying for:
    
    A) Invoice INV-001 for Rs 50,000?
       OR
    B) Purchase PO-005 for Rs 50,000?
       OR
    C) Both partially?
       OR
    D) Neither yet (unallocated)?
    
    ┌─────────────────────────────────────────────────┐
    │ Current Schema: Could be ANY of above ⚠️        │
    │                                                 │
    │ payment_allocations:                           │
    │ ├─ id: PA-001                                  │
    │ ├─ payment_id: PAY-001                         │
    │ ├─ invoice_id: NULL  ← COULD BE NULL           │
    │ ├─ purchase_id: NULL ← COULD BE NULL           │
    │ └─ allocated_amount: Rs 50,000                 │
    │                                                 │
    │ Problems:                                       │
    │ 1. No constraint: Both can be NULL             │
    │ 2. No constraint: Both can be populated        │
    │ 3. Orphan allocations possible                 │
    │ 4. Unclear query logic                         │
    └─────────────────────────────────────────────────┘
    
    ▼
    
    SYMPTOMS IN REPORTS:
    
    "Reconcile Customer Payments"
    - ACME owes: Rs 25,000
    - We received: Rs 50,000
    - Missing: Rs 25,000? Or double-counted?
    
    "Outstanding Invoices"
    - INV-001: Rs 50,000 (PAID? Or orphaned allocation?)
    
    "Aged Payables"
    - PO-005: Rs 50,000 (PAID? Or just unallocated?)
```

**SOLUTION:**

Add database constraint:
```sql
ALTER TABLE payment_allocations
ADD CONSTRAINT xor_invoice_or_purchase 
CHECK (
  (invoice_id IS NOT NULL AND purchase_id IS NULL) OR
  (invoice_id IS NULL AND purchase_id IS NOT NULL)
);
```

Every allocation now MUST pick one:
```
┌─ Invoice → Customer (AR)
├─ Purchase → Vendor (AP)
└─ (Never both, never neither)
```

---

## 5. ACTION LAYER ARCHITECTURE

```
┌──────────────────────────────────────────────────────┐
│          FRONTEND (React Components)                 │
│                                                      │
│  <InvoiceForm />  <ProductForm />  <POBuilder />   │
└────────┬─────────────────────────────────────────────┘
         │
         │ Direct imports (tightly coupled)
         │
         ├────────────────────────────────────┬───────────────────┐
         │                                    │                   │
         ▼                                    ▼                   ▼
┌─────────────────────────┐    ┌──────────────────────┐   ┌────────────────────┐
│  lib/api/invoice.js     │    │  lib/api/product.js  │   │  lib/api/stock.js  │
│  (API Wrapper Layer)    │    │                      │   │                    │
│                         │    │                      │   │                    │
│  invoiceAPI.create()    │    │  productAPI.get()    │   │  stockAPI.transfer │
│  invoiceAPI.update()    │    │  productAPI.create() │   │  stockAPI.adjust() │
│  invoiceAPI.delete()    │    │  productAPI.update() │   │                    │
└──────────┬──────────────┘    └──────────┬───────────┘   └──────────┬─────────┘
           │                             │                          │
           │ Calls server action        │ Calls                     │
           │ (with error translation)   │                           │
           │                            ▼                           ▼
           │                 ┌──────────────────────┐    ┌──────────────────────┐
           │                 │ lib/actions/         │    │ lib/actions/         │
           │                 │ standard/inventory/  │    │ standard/inventory/  │
           │                 │ product.js           │    │ stock.js             │
           │                 │                      │    │                      │
           │                 │ getProductsAction    │    │ addStockAction       │
           │                 │ createProductAction  │    │ transferStockAction  │
           │                 └──────────────────────┘    └──────────────────────┘
           │                                                        │
           └────────────────┬───────────────────────────────────────┘
                           │
                           ▼
           ┌───────────────────────────────────────┐
           │   lib/actions/_shared/               │
           │   ├─ tenant.js                       │
           │   │   (assertEntityBelongsToBusiness)│
           │   ├─ audit.js                        │
           │   │   (auditWrite)                   │
           │   ├─ sequences.js                    │
           │   │   (generateDocNumber)            │
           │   ├─ result.js                       │
           │   │   (actionSuccess/Failure)        │
           │   └─ purchaseItems.js                │
           │       (shared logic)                 │
           └───────────────────────────────────────┘
                           │
                           ▼
           ┌───────────────────────────────────────┐
           │   Prisma Client                      │
           │   (ORM - Type-Safe Query Builder)    │
           └───────────────┬───────────────────────┘
                           │
                           ▼
           ┌───────────────────────────────────────┐
           │   PostgreSQL (Neon/Supabase)         │
           │                                      │
           │   78 tables, complex relationships   │
           │   Multi-tenant partitioning via      │
           │   business_id                        │
           └───────────────────────────────────────┘
```

---

## 6. SALES DOCUMENT CREATION (BRANCHING LOGIC)

```
┌──────────────────────────────────────────────────────────────────┐
│  USER: Create Sales Document (Quotation/Order/Challan)          │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
    WHICH FORM DID THEY USE?
    
    ┌────────────────────┐              ┌──────────────────┐
    │ SalesDocumentForm  │              │ QuickAddTemplates│
    │ (main form)        │              │ (quick action)   │
    └─────┬──────────────┘              └────────┬─────────┘
          │                                      │
          ▼                                      ▼
    ┌────────────────────────────┐   ┌────────────────────────────┐
    │ Field Mapping:             │   │ Field Mapping:             │
    │ ├─ items                   │   │ ├─ lineItems               │
    │ ├─ customer_id             │   │ ├─ customer (object)       │
    │ ├─ inv_number              │   │ ├─ quotation_number        │
    │ ├─ ...                     │   │ ├─ ...                     │
    └─────┬────────────────────┬─┘   └───────┬────────────────────┘
          │                    │             │
          │ Different          │ Different   │ Different
          │ names!             │ names!      │ names!
          │                    │             │
          ▼                    ▼             ▼
    createSalesOrderAction  createQuotationAction  createChallanAction
         │                           │                      │
         ├──────────────┬────────────┤                      │
         │              │            │                      │
         ▼              ▼            ▼                      ▼
    Take items   Take items    Take items      All need item mapping!
    Map to       Map to        Map to           │
    items[]      lineItems[]   items            │
                                                │
    PROBLEM: Three separate code paths        │
    ├─ Duplicate item mapping logic      ◄────┘
    ├─ Different error messages
    ├─ Inconsistent validation
    └─ Three places to fix bugs when something breaks
```

**SOLUTION: UNIFIED SALES DOCUMENT API**

```javascript
// lib/api/salesDocuments.js

export const salesDocumentAPI = {
  async create(documentType, payload) {
    // documentType: 'quotation' | 'sales_order' | 'challan'
    
    // Normalize payload
    const normalized = {
      customer_id: payload.customer_id || payload.customer?.id,
      items: (payload.items || payload.lineItems).map(item => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price || item.price),
        tax_percent: Number(item.tax_percent || 0),
        description: item.description
      }))
    };
    
    // Route to correct action
    const actionMap = {
      'quotation': createQuotationAction,
      'sales_order': createSalesOrderAction,
      'challan': createChallanAction
    };
    
    return actionMap[documentType](normalized);
  }
};

// Frontend uses unified API
const invoice = await salesDocumentAPI.create('quotation', formData);
```

---

## 7. ERROR FLOW (CURRENT STATE)

```
┌──────────────────────────────────────┐
│ Frontend calls createInvoiceAction   │
└────────┬─────────────────────────────┘
         │
         ▼
    Does action succeed?
    │
    ├─→ YES ✅
    │    │
    │    ▼
    │   return { success: true, invoice: { ... } }
    │    │
    │    ▼
    │   Frontend: showToast.success('Invoice created')
    │
    └─→ NO ❌
         │
         ▼
    What went wrong?
    
    Possibilities:
    1. Customer not found
    2. Permission denied
    3. Invoice # already used
    4. Item quantity invalid
    5. Tax config missing
    6. Plan limit exceeded
    7. Database connection lost
    8. Validation error on item
    9. Stock insufficient
    10. Warehouse locked
    ... (20+ more scenarios)
    
    ▼
    
    Current handling:
    └─→ throw new Error("Failed to create invoice")
    
    Frontend receives:
    └─→ "Error: Failed to create invoice"
    
    User sees:
    ┌─────────────────────────────────────────┐
    │ ❌ Failed to create invoice             │
    │                                         │
    │ [OK]                                    │
    └─────────────────────────────────────────┘
    
    User's reaction: "WHAT DO I DO NOW??"
    🔴 BAD USER EXPERIENCE
```

**SOLUTION: STRUCTURED ERRORS**

```
┌──────────────────────────────────────┐
│ Frontend calls createInvoiceAction   │
└────────┬─────────────────────────────┘
         │
         ▼
    Does action succeed?
    │
    ├─→ YES ✅
    │    return { success: true, invoice: {...} }
    │
    └─→ NO ❌
         └─→ throw new ValidationError(
              'LINE_ITEM_REQUIRED',
              'Invoice must have at least 1 item',
              { field: 'items', suggestion: 'Add a product line' }
            )
         
         OR throw new PermissionError(
              'sales.create',
              'invoices'
            )
         
         OR throw new ResourceNotFoundError(
              'Customer',
              '12345'
            )
    
    ▼
    
    Frontend catches:
    
    try {
      const invoice = await invoiceAPI.create(data);
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        highlightFormField(error.details.field);
        showToast.error(error.details.suggestion);
      } else if (error.code === 'PERMISSION_DENIED') {
        showToast.error('You need sales.create permission');
      } else if (error.code === 'NOT_FOUND') {
        showToast.error('Customer was deleted. Select another.');
      }
    }
    
    User sees:
    ┌─────────────────────────────────────────┐
    │ Add a product line                      │
    │                                         │
    │ Items field [highlighted in red]        │
    │ [+ Add Row]                             │
    └─────────────────────────────────────────┘
    
    User's reaction: "Oh! I need to add a product"
    ✅ GOOD USER EXPERIENCE
```

---

## 8. DOMAIN-SPECIFIC LOGIC DISTRIBUTION

```
┌─────────────────────────────────────────────────────────────┐
│  Tenvo System (Multi-Domain)                                │
└─────────────────────────────────────────────────────────────┘

Domain Categories:
├─ PHARMACY (Batch + Expiry + Lot Tracking)
├─ RESTAURANT (Tables + Orders + Kitchen Display)
├─ MANUFACTURING (BOM + Production Orders + MRP)
├─ RETAIL (Variants + Discounts + POS)
├─ WHOLESALE (Purchase Orders + Vendors + Bulk)
├─ FMCG (Batch + Serial Expiry + Promotions)
└─ B2B E-COMMERCE (Quotations + Credit Terms)

                           ▼

Each domain needs different logic:

┌──────────────────────────────────────────────────────────────┐
│ WHERE IS DOMAIN LOGIC CURRENTLY?                             │
│                                                              │
│ 1. lib/domainKnowledge.js (Configuration)                   │
│    ├─ getDomainKnowledge(domain)                           │
│    └─ Returns { features: {...}, constraints: {...} }     │
│                                                              │
│ 2. model field domain_data (JSON)                           │
│    ├─ Flexible but untyped                                │
│    └─ No validation ⚠️                                    │
│                                                              │
│ 3. lib/utils/domainHelpers.js (Utilities)                   │
│    ├─ isBatchTrackingEnabled(domain)                       │
│    ├─ isSerialTrackingEnabled(domain)                      │
│    └─ getDomainDefaultTax(domain)                          │
│                                                              │
│ 4. Scattered in Components (Anti-pattern)                   │
│    ├─ if (domain === 'pharmacy') { ... }                   │
│    ├─ if (domain === 'restaurant') { ... }                 │
│    └─ if (domain === 'manufacturing') { ... }              │
│                                                              │
│ PROBLEM: Logic IS in these places, but with SOFT           │
│ CONSTRAINTS (not enforced). Runtime errors possible.        │
└──────────────────────────────────────────────────────────────┘

Example: Batch Tracking

Pharmacy User (domain=pharmacy):
  ├─ Creates Product "Aspirin"
  ├─ Adds batches with expiry dates ✅ EXPECTED
  └─ Add inventory with FEFO rotation ✅ EXPECTED

Restaurant User (domain=restaurant):
  ├─ Creates Product "Biryani (Large)"
  ├─ Tries to add batch tracking → Should fail ❌ (no constraint)
  ├─ Frontend hides batch UI (if domainKnowledge check works)
  ├─ But if frontend crashes or bugs: USER CAN BYPASS
  └─ Orphan batch data created ❌ DATA CORRUPTION

▼

Solution: Move constraints to:
├─ Database: Check constraints, NOT NULL where appropriate
├─ Schema validation: domain_data JSON schema per domain
├─ Action layer: Explicit validation in every action
├─ NOT just frontend hide/show UI
```

---

## 9. QUERY PATTERN: N+1 PROBLEM

```
┌─────────────────────────────────────────────────────────────┐
│  Get All Invoices with Items (BAD PATTERN)                  │
└─────────────────────────────────────────────────────────────┘

const invoices = await prisma.invoices.findMany({
  where: { business_id: businessId }
});
// ✅ Query 1: 50 invoices returned

for (const invoice of invoices) {
  const items = await prisma.invoice_items.findMany({
    where: { invoice_id: invoice.id }
  });
  // 🔴 Query 2-51: One per invoice = 50 queries!
  
  invoice.items = items;
}

// Total: 1 + 50 = 51 Queries ⚠️ SLOW (100-500ms depending on DB latency)

┌──────────────────────────────────────────────────────────────┐
│ vs. GOOD PATTERN (JOIN)                                      │
└──────────────────────────────────────────────────────────────┘

const invoices = await prisma.invoices.findMany({
  where: { business_id: businessId },
  include: {
    invoice_items: {
      select: {
        product_id: true,
        quantity: true,
        unit_price: true
      }
    }
  }
});
// ✅ Query 1: Single JOIN, 50 invoices with items


Result: 2-4 queries instead of 51 ✅ (10-50ms depending on DB latency)
```

---

## 10. CURRENT STATE: INTEGRATION SCORECARD

```
┌─────────────────────────────────────────────────────────────┐
│ INTEGRATION COMPONENT HEALTH SCORECARD                      │
└─────────────────────────────────────────────────────────────┘

Frontend ↔ Server Actions:
  Data Flow:        ████░░░░░░ 7/10
  Error Handling:   ███░░░░░░░ 5/10
  Type Safety:      ████░░░░░░ 6/10
  ────────────────────────────────────
  Overall:         ✅ Works → ⚠️  But Needs TLC

Server Actions ↔ Schema:
  Constraint Validation: █████░░░░░ 8/10
  Transaction Safety:    ███░░░░░░░ 6/10
  Business Logic:        █████░░░░░ 7/10
  ────────────────────────────────────
  Overall:         ✅ Strong foundation

Schema ↔ Database:
  Model Completeness:    ██████░░░░ 9/10
  Relationship Integrity: █████░░░░░ 8/10
  Constraint Enforcement: █████░░░░░ 8/10
  ────────────────────────────────────
  Overall:         ✅ Solid schema design

Multi-Tenancy:
  Isolation:         ██████░░░░ 9/10
  Guard Patterns:    ██████░░░░ 9/10
  Audit Trails:      █████░░░░░ 8/10
  ────────────────────────────────────
  Overall:         ✅ Production-Grade

Inventory Integrity:
  Stock Accuracy:    ██░░░░░░░░ 3/10 🔴 CRITICAL
  Data Consistency:  ███░░░░░░░ 4/10 🔴 CRITICAL
  Concurrency:       ███░░░░░░░ 4/10 🔴 CRITICAL
  ────────────────────────────────────
  Overall:         🔴 Needs Immediate Fix

Error Handling:
  Structured Errors: ██░░░░░░░░ 3/10 🔴
  User Guidance:     ██░░░░░░░░ 2/10 🔴
  Recovery Logic:    █░░░░░░░░░ 1/10 🔴
  ────────────────────────────────────
  Overall:         🔴 Critical Gap

Documentation:
  API Docs:          ░░░░░░░░░░ 0/10 🔴
  Action Docs:       █░░░░░░░░░ 1/10 🔴
  Schema Docs:       ██░░░░░░░░ 3/10 🔴
  ────────────────────────────────────
  Overall:         🔴 Missing

────────────────────────────────────────────────────────────
OVERALL SYSTEM HEALTH SCORE: 6.2/10
────────────────────────────────────────────────────────────
Status: 🟠 PRODUCTION READY but FRAGILE
        ✅ Core works
        ⚠️  Inventory issues urgent
        🔴 Error handling weak
        🔴 Documentation absent
```

---

**Document Purpose:** Provide visual reference for architectural analysis  
**Updated:** April 11, 2026  
**Version:** 1.0
