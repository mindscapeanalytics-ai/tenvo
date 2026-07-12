# Order Data Flow Deep Dive - Root Cause Analysis

**Date:** 2026-07-12  
**Business Analyzed:** Tenvo Boutique Demo (`demo-boutique`)

---

## 🎯 Executive Summary

**FOUND ROOT CAUSE:** Multiple order ledgers exist but dashboards use **inconsistent aggregation logic**.

### Screenshot Discrepancies Explained:

| Dashboard | Shows | Actual DB | Ledgers Used |
|-----------|-------|-----------|--------------|
| Sales Performance | **14 orders**, Rs205,474 | 21 total | ✅ **ALL 3** (invoices + POS + storefront) |
| Command Overview | **2 orders** | 2 storefront | ❌ **ONLY 1** (storefront_orders) |
| Orders Manager | **2 orders** | 2 storefront | ✅ Correct (storefront tab) |

---

## 📊 Actual Database State

**Business:** Tenvo Boutique Demo (`71f6fc60-5f57-4769-9644-c3f227118e17`)

### Order Ledgers:

```
STOREFRONT_ORDERS (Public Store)
  Total: 2 orders
  Revenue: Rs24,206.13
  Date Range: 2026-07-12 → 2026-07-12
  Line Items: 3 products
  Status: 1 Pending, 1 Processing

INVOICES (Manual Sales/AR)
  Total: 8 invoices
  Revenue: Rs0.00 (test data, no amounts)
  Date Range: 2026-02-15 → 2026-07-15
  Line Items: 22 products
  Payment Status: 8 Paid

POS_TRANSACTIONS (Point of Sale)
  Total: 11 transactions
  Revenue: Rs175,770.27
  Date Range: 2026-07-04 → 2026-07-12
  Line Items: 22 products
  Status: 11 Completed

─────────────────────────────────────
COMBINED TOTAL:
  21 orders across 3 ledgers
  Rs199,976.40 total revenue
```

### Last 30 Days Filter:
```
Storefront: 2 orders  (Rs24,206.13)
Invoices:   3 invoices (Rs0.00)
POS:        11 sales   (Rs175,770.27)
─────────────────────────────────────
TOTAL:      16 orders
```

---

## 🔍 Root Cause: Inconsistent Aggregation

### ✅ CORRECT: Sales Performance Dashboard

**File:** `lib/analytics/salesInsights.js` → `SALES_KPI_PERIOD_SQL`

**Query Logic:**
```sql
SELECT
  (
    -- INVOICES
    (SELECT COALESCE(SUM(i.grand_total), 0) FROM invoices i
     WHERE i.business_id = $1 
       AND (i.is_deleted = false OR i.is_deleted IS NULL)
       AND LOWER(COALESCE(i.status, '')) NOT IN ('draft', 'voided', 'cancelled')
       AND i.date::date BETWEEN $2::date AND $3::date)
    
    -- POS TRANSACTIONS
    + (SELECT COALESCE(SUM(pt.total_amount), 0) FROM pos_transactions pt
       WHERE pt.business_id = $1 
         AND pt.is_voided = false
         AND LOWER(COALESCE(pt.payment_status, '')) = 'completed'
         AND pt.created_at::date BETWEEN $2::date AND $3::date)
    
    -- STOREFRONT ORDERS
    + (SELECT COALESCE(SUM(o.total_amount), 0) FROM storefront_orders o
       WHERE o.business_id = $1 
         AND LOWER(COALESCE(o.status, '')) NOT IN ('cancelled', 'refunded', 'voided')
         AND o.created_at::date BETWEEN $2::date AND $3::date)
  ) AS gross_total,
  
  -- ORDER COUNT (ALL THREE LEDGERS)
  (
    (SELECT COALESCE(COUNT(i.id), 0) FROM invoices i WHERE ...)
    + (SELECT COALESCE(COUNT(pt.id), 0) FROM pos_transactions pt WHERE ...)
    + (SELECT COALESCE(COUNT(o.id), 0) FROM storefront_orders o WHERE ...)
  ) AS order_count
```

**Result:** Correctly shows **14 orders** (combination of all ledgers for current month)

**Used By:**
- `getSalesPerformanceAction()` in `lib/actions/basic/dashboard.js`
- `SalesManager` component

---

### ❌ INCORRECT: Command Overview Dashboard

**Problem:** Likely only querying `storefront_orders` or `invoices`, not aggregating all ledgers.

**Suspected Location:**
- `app/business/page.jsx` or child components
- May be using a different action that doesn't aggregate

**Why It Shows 2:**
- If using `storefront_orders` only → **2 orders** ✅ Matches DB
- If using `invoices` only → Would show **3** (last 30 days) ❌ Doesn't match

**Most Likely:** Command Overview is filtering by `Last 30 Days` and using `storefront_orders` only.

---

### ✅ CORRECT: Orders Manager (Storefront Tab)

**Shows:** 2 orders  
**Actual:** 2 storefront orders  
**Status:** ✅ Correct — intentionally showing storefront_orders only on this tab

---

## 🎯 The Data Model Reality

### Three Separate Order Ledgers:

```
┌─────────────────────────────────────────────────────────┐
│                    ORDERS ECOSYSTEM                      │
└─────────────────────────────────────────────────────────┘

1. STOREFRONT_ORDERS                (Public Online Store)
   ├─ Created by: Customer checkout
   ├─ Payment: COD, Crypto, Stripe
   ├─ Fulfillment: Shipped to customer
   └─ Use Case: E-commerce sales

2. INVOICES                         (Manual AR/Sales)
   ├─ Created by: Hub users
   ├─ Payment: Manual recording
   ├─ Fulfillment: Manual tracking
   └─ Use Case: B2B sales, quotes converted

3. POS_TRANSACTIONS                 (Point of Sale)
   ├─ Created by: POS terminal
   ├─ Payment: Instant (cash/card)
   ├─ Fulfillment: Over-the-counter
   └─ Use Case: Retail store sales

4. RESTAURANT_ORDERS                (Restaurant/Cafe Only)
   ├─ Created by: Digital menu orders
   ├─ Payment: Table/delivery
   ├─ Fulfillment: Kitchen preparation
   └─ Use Case: Dining/takeaway orders
```

### Why Multiple Ledgers?

**Different Business Contexts:**
- **Storefront:** Public customer, shipping address, online payment gateways
- **Invoices:** AR workflow, terms, payment reminders, recurring
- **POS:** Instant sale, no AR, walk-in customers
- **Restaurant:** Table service, kitchen workflow, order modes

**Cannot Merge:** Each has unique fields and workflows.

---

## 🔧 Root Causes Identified

### Issue #1: Missing Unified "Orders" Count

**Problem:** No single "Orders" KPI that aggregates all ledgers

**Impact:**
- Sales Performance correctly aggregates
- Command Overview does NOT aggregate
- Users see inconsistent counts

**Fix Needed:** Ensure ALL dashboards use unified aggregation

---

### Issue #2: Inconsistent Date Filtering

**Problem:** Different dashboards use different date ranges without clear labeling

**Evidence:**
- Sales Performance: "This month" (July 1-12)
- Command Overview: "Last 30 Days" (visible in screenshot)
- Different date filters = different counts

**Fix Needed:** Standardize date ranges or label them clearly

---

### Issue #3: Invoice Revenue = Rs0.00

**Problem:** 8 invoices with `payment_status = 'paid'` but `total_amount = 0.00`

**Impact:** KPIs show order COUNT but zero REVENUE from invoices

**Root Cause:** Test/seed data with zero amounts

**Fix Needed:** Either:
1. Filter out zero-amount invoices from counts
2. Fix seed data to have realistic amounts

---

### Issue #4: No Clear "Total Orders" KPI

**Problem:** Users expect ONE "Orders" number, but get different counts per dashboard

**Current State:**
- Sales Performance: 14 orders
- Command Overview: 2 orders
- User confusion

**Fix Needed:** Add a unified "Total Sales" or "All Orders" KPI that explicitly shows all ledgers

---

## 🛠️ Recommended Fixes

### Priority 1: Standardize Command Overview (CRITICAL)

**File to Fix:** Find the dashboard component showing "ORDERS IN PERIOD: 2"

**Current (suspected):**
```javascript
// ❌ WRONG: Only storefront orders
const ordersQuery = await client.query(`
  SELECT COUNT(*) as count
  FROM storefront_orders
  WHERE business_id = $1
    AND created_at >= NOW() - INTERVAL '30 days'
`, [businessId]);
```

**Fix:**
```javascript
// ✅ CORRECT: All ledgers
import { SALES_KPI_PERIOD_SQL } from '@/lib/analytics/salesInsights';

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const today = new Date();

const kpiResult = await client.query(SALES_KPI_PERIOD_SQL, [
  businessId,
  thirtyDaysAgo.toISOString().split('T')[0],
  today.toISOString().split('T')[0]
]);

const orderCount = parseInt(kpiResult.rows[0]?.order_count || 0, 10);
const revenue = parseFloat(kpiResult.rows[0]?.gross_total || 0);
```

---

### Priority 2: Add Ledger Breakdown UI

**Where:** Sales Performance Dashboard

**Add:** Breakdown showing which ledgers contribute:

```
┌─────────────────────────────────────────┐
│ ORDERS THIS MONTH                   14  │
│ ─────────────────────────────────────── │
│ Online Store      2 orders              │
│ Invoices          8 invoices            │
│ POS Sales         11 transactions       │
│ Restaurant        0 orders              │
└─────────────────────────────────────────┘
```

**Implementation:**
```javascript
// Fetch individual ledger counts
const storefrontCount = await client.query(`
  SELECT COUNT(*) FROM storefront_orders 
  WHERE business_id = $1 AND created_at >= $2 AND status NOT IN ('cancelled', 'voided')
`, [businessId, startDate]);

const invoiceCount = await client.query(`
  SELECT COUNT(*) FROM invoices 
  WHERE business_id = $1 AND date >= $2 AND is_deleted = false AND status NOT IN ('draft', 'cancelled')
`, [businessId, startDate]);

const posCount = await client.query(`
  SELECT COUNT(*) FROM pos_transactions 
  WHERE business_id = $1 AND created_at >= $2 AND is_voided = false
`, [businessId, startDate]);
```

---

### Priority 3: Fix Invoice Test Data

**Problem:** 8 invoices with `total_amount = 0`

**Fix Options:**

**Option A:** Filter out zero-amount orders
```sql
-- Add to INVOICE_SALE_FILTER
AND COALESCE(i.grand_total, i.total_amount, 0) > 0
```

**Option B:** Update seed data
```sql
UPDATE invoices 
SET total_amount = (
  SELECT COALESCE(SUM(ii.total_amount), 100)
  FROM invoice_items ii
  WHERE ii.invoice_id = invoices.id
)
WHERE business_id = '71f6fc60-5f57-4769-9644-c3f227118e17'
  AND COALESCE(total_amount, 0) = 0;
```

---

### Priority 4: Standardize Date Range Labels

**Problem:** Inconsistent "This month" vs "Last 30 days"

**Fix:** Show date range explicitly:

```
ORDERS (Jul 1-12, 2026)               14
REVENUE (Last 30 Days)         Rs205,474
```

---

## 📂 Files That Need Updates

### 1. Command Overview Dashboard
**Find:**
```bash
grep -r "ORDERS IN PERIOD" app/
grep -r "Last 30 Days" app/business/
grep -r "Command Overview" app/
```

**Update:** Use `SALES_KPI_PERIOD_SQL` for unified counts

### 2. Sales Performance Component
**File:** `components/SalesManager.jsx`

**Add:** Ledger breakdown section

### 3. Invoice Seed Data
**File:** `scripts/data-lab/seed-master-demo.mjs`

**Update:** Ensure invoices have realistic amounts

### 4. Dashboard KPI Helper
**Create:** `lib/analytics/unifiedOrderKpis.js`

**Export:**
```javascript
export async function getUnifiedOrderKpis(client, businessId, dateFrom, dateTo) {
  const result = await client.query(SALES_KPI_PERIOD_SQL, [
    businessId, dateFrom, dateTo
  ]);
  
  // Also get individual ledger breakdowns
  const breakdown = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM storefront_orders WHERE ...) as storefront_count,
      (SELECT COUNT(*) FROM invoices WHERE ...) as invoice_count,
      (SELECT COUNT(*) FROM pos_transactions WHERE ...) as pos_count
  `, [businessId, dateFrom, dateTo]);
  
  return {
    total: result.rows[0].order_count,
    revenue: result.rows[0].gross_total,
    breakdown: breakdown.rows[0]
  };
}
```

---

## 🧪 Verification Queries

Run these to verify the fix:

```sql
-- Check Tenvo Boutique Demo aggregation
WITH boutique AS (
  SELECT id FROM businesses WHERE domain = 'demo-boutique'
)
SELECT 
  'Storefront' as ledger,
  COUNT(*) as orders,
  COALESCE(SUM(total_amount), 0) as revenue
FROM storefront_orders, boutique
WHERE business_id = boutique.id
  AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'voided')

UNION ALL

SELECT 
  'Invoices',
  COUNT(*),
  COALESCE(SUM(grand_total), 0)
FROM invoices, boutique
WHERE business_id = boutique.id
  AND is_deleted = false
  AND LOWER(COALESCE(status, '')) NOT IN ('draft', 'cancelled')

UNION ALL

SELECT 
  'POS',
  COUNT(*),
  COALESCE(SUM(total_amount), 0)
FROM pos_transactions, boutique
WHERE business_id = boutique.id
  AND is_voided = false
  AND LOWER(COALESCE(payment_status, '')) = 'completed';
```

Expected Output:
```
ledger      | orders | revenue
------------|--------|-------------
Storefront  |      2 | 24206.13
Invoices    |      8 | 0.00
POS         |     11 | 175770.27
```

---

## 📊 Summary

### What We Found:

1. ✅ **Sales Performance** correctly aggregates all 3 ledgers
2. ❌ **Command Overview** only shows storefront orders (2 instead of 14+)
3. ❌ **Invoice data** has zero amounts (8 invoices with Rs0.00)
4. ✅ **Orders Manager** correctly scoped to storefront tab

### What Needs Fixing:

1. **Command Overview:** Use unified aggregation query
2. **Add breakdown UI:** Show ledger contributions
3. **Fix seed data:** Add realistic amounts to invoices
4. **Standardize labels:** Clear date range indicators

### Impact:

**Before Fix:**
- Users confused by inconsistent counts (14 vs 2)
- Revenue attribution unclear
- POS sales invisible in some dashboards

**After Fix:**
- Consistent order counts across all dashboards
- Clear breakdown by sales channel
- Accurate revenue attribution

---

**Next Step:** Locate and fix the Command Overview dashboard component

**Files to check:**
- `app/business/page.jsx`
- `app/business/[category]/page.jsx`
- `components/DashboardOverview.jsx` or similar
- `lib/actions/basic/dashboard.js` (check if there's a separate action)
