# Command Overview Order Count Fix

## Problem Identified

The **Command Overview dashboard** is showing incorrect order counts (2 orders) while the **Sales Performance dashboard** correctly shows unified counts (14 orders).

### Root Cause

**Location:** `lib/actions/basic/dashboard.js` → `getDashboardKPIs()`

The function queries **ONLY the `invoices` table** for order counts:

```sql
(SELECT COUNT(*) FROM period_invoices 
 WHERE status NOT IN ('draft', 'voided')) as invoice_count,
```

This ignores:
- `pos_transactions` (11 orders for Tenvo Boutique Demo)
- `storefront_orders` (2 orders for Tenvo Boutique Demo)

### Correct Pattern

**Location:** `lib/analytics/salesInsights.js` → `SALES_KPI_PERIOD_SQL`

The Sales Performance dashboard uses the correct unified aggregation:

```sql
SELECT
  (
    (SELECT COALESCE(COUNT(i.id), 0) FROM invoices i
     WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
       AND i.date::date BETWEEN $2::date AND $3::date)
    + (SELECT COALESCE(COUNT(pt.id), 0) FROM pos_transactions pt
       WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
         AND pt.created_at::date BETWEEN $2::date AND $3::date)
    + (SELECT COALESCE(COUNT(o.id), 0) FROM storefront_orders o
       WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
         AND o.created_at::date BETWEEN $2::date AND $3::date)
  ) AS order_count,
```

## Impact

### Affected Dashboards

1. **Command Overview (Advanced Mode)** - Uses `getDashboardKPIs()`
   - Shows 2 orders (invoices only)
   - Missing 11 POS transactions
   - Incorrect KPI calculations

2. **Sales Performance Tab** - Uses `getSalesPerformanceAction()` ✅
   - Shows 14 orders correctly
   - Properly aggregates all ledgers

3. **Easy Mode Dashboard** - Uses client-side `periodMetrics` calculation
   - Calculates from `invoices` prop only
   - Also affected by incomplete data

### Data Verification (Tenvo Boutique Demo)

```
Business ID: 71f6fc60-5f57-4769-9644-c3f227118e17

Actual Database:
- storefront_orders: 2 (Rs24,206.13)
- invoices: 8 (Rs0.00 - test data)
- pos_transactions: 11 (Rs175,770.27)
- TOTAL: 21 orders (Rs199,976.40)

Dashboard Display:
- Sales Performance: 14 orders ✅ (likely filtered by period)
- Command Overview: 2 orders ❌ (invoices only)
```

## Solution

### Fix 1: Update `getDashboardKPIs()` Query

Replace single-ledger invoice count with unified aggregation:

```sql
-- CURRENT (WRONG)
(SELECT COUNT(*) FROM period_invoices 
 WHERE status NOT IN ('draft', 'voided')) as invoice_count,

-- FIXED (CORRECT)
(
  (SELECT COUNT(*) FROM period_invoices 
   WHERE status NOT IN ('draft', 'voided'))
  + (SELECT COUNT(*) FROM pos_transactions pt
     WHERE pt.business_id = $1
       AND pt.is_voided = false
       AND LOWER(COALESCE(pt.payment_status, '')) = 'completed'
       AND pt.created_at BETWEEN $2 AND $3)
  + (SELECT COUNT(*) FROM storefront_orders so
     WHERE so.business_id = $1
       AND LOWER(COALESCE(so.status, '')) NOT IN ('cancelled', 'refunded', 'voided')
       AND so.created_at BETWEEN $2 AND $3)
) as total_order_count,
```

### Fix 2: Update Revenue Calculation

The revenue aggregation should also include all three ledgers:

```sql
-- Add to existing revenue CTE
period_pos AS (
    SELECT * FROM pos_transactions
    WHERE business_id = $1
      AND is_voided = false
      AND LOWER(COALESCE(payment_status, '')) = 'completed'
      AND created_at BETWEEN $2 AND $3
),
period_storefront AS (
    SELECT * FROM storefront_orders
    WHERE business_id = $1
      AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'refunded', 'voided')
      AND created_at BETWEEN $2 AND $3
)

-- Then sum all three:
(SELECT COALESCE(SUM(grand_total), 0) FROM period_invoices 
 WHERE status NOT IN ('draft', 'voided'))
+ (SELECT COALESCE(SUM(total_amount), 0) FROM period_pos)
+ (SELECT COALESCE(SUM(total_amount), 0) FROM period_storefront)
as total_revenue,
```

### Fix 3: Import Shared Filter Constants

To maintain consistency, import and use the canonical filter SQL from `salesInsights.js`:

```javascript
import {
    INVOICE_SALE_FILTER,
    POS_SALE_FILTER,
    STOREFRONT_GROSS_SALE_FILTER,
} from '@/lib/analytics/salesInsights';
```

## Testing

After applying fixes, verify:

1. **Command Overview order count** matches Sales Performance
2. **Revenue totals** aggregate all three ledgers
3. **Period comparisons** use consistent date fields:
   - invoices: `date`
   - pos_transactions: `created_at`
   - storefront_orders: `created_at`

## Related Files

- `lib/actions/basic/dashboard.js` - **NEEDS FIX**
- `lib/analytics/salesInsights.js` - **REFERENCE (correct pattern)**
- `lib/actions/dashboard/advancedDashboardSnapshot.js` - Calls `getDashboardKPIs()`
- `app/business/[category]/components/tabs/DomainDashboard.tsx` - Displays the data

## Additional Issues Found

### Invoice Test Data
8 invoices with `total_amount = 0` distort KPIs. Options:
- Filter out zero-amount orders in `INVOICE_SALE_FILTER`
- Update seed data with realistic amounts

### Date Range Label Inconsistency
- "This month" vs "Last 30 Days"
- Should show explicit ranges: "Jul 1-12, 2026"
