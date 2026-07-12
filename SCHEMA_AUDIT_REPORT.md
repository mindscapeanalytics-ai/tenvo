# Schema Wiring Audit Report

**Date:** 2026-07-12  
**Total Issues Found:** 73

## Executive Summary

The audit identified transaction safety issues, missing soft-delete filters, and some column reference problems. All critical migrations are present.

---

## ✅ Migrations Status

All critical migrations are present:
- ✓ `20260602_storefront_order_items_sku_variant` - Adds product_sku and variant_id columns
- ✓ `20260606_invoice_payments_record_payment_columns` - Adds payment_method, received_by
- ✓ `20260607_invoice_payments_received_by` - Ensures received_by column exists
- ✓ `20260711_business_settings_id_uuid` - Fixes business_settings.id as UUID
- ✓ `20260704_storefront_order_number_unique` - Per-tenant order number uniqueness
- ✓ `20260705_drop_storefront_order_number_global_index` - Removes conflicting global index

---

## 🔴 Critical Issues (Priority 1)

### 1. Transaction Issues (2 files)

**Problem:** Try-catch blocks that retry INSERT queries without using PostgreSQL SAVEPOINTs. When the first query fails, the transaction is aborted and all subsequent queries are ignored.

#### Files Affected:
1. `app/api/storefront/[businessDomain]/newsletter/subscribe/route.js:24`
2. `lib/storefront/storefrontAnalytics.js:38`

**Fix:** Use SAVEPOINT before risky queries, ROLLBACK TO SAVEPOINT on error, RELEASE SAVEPOINT on success.

**Example Fix:**
```javascript
// BEFORE (BROKEN)
try {
  await client.query('INSERT INTO table ...');
} catch (err) {
  await client.query('INSERT INTO table ...'); // ❌ FAILS - transaction aborted
}

// AFTER (FIXED)
await client.query('SAVEPOINT before_insert');
try {
  await client.query('INSERT INTO table ...');
  await client.query('RELEASE SAVEPOINT before_insert');
} catch (err) {
  await client.query('ROLLBACK TO SAVEPOINT before_insert');
  await client.query('INSERT INTO table ...'); // ✅ WORKS
  await client.query('RELEASE SAVEPOINT before_insert');
}
```

---

## ⚠️ High Priority Issues (Priority 2)

### 2. Soft Delete Filter Issues (70 files)

**Problem:** Queries on soft-delete tables without `is_deleted = false` filters may return deleted records.

#### Tables Affected:
- **products** - 63 instances missing filter
- **product_variants** - 3 instances missing filter
- **invoice_payments** - 2 instances missing filter
- **product_serials** - 2 instances missing filter

**Fix Pattern:**
```sql
-- BEFORE
SELECT * FROM products WHERE business_id = $1

-- AFTER
SELECT * FROM products WHERE business_id = $1 AND is_deleted = false
```

**Note:** Some queries intentionally include deleted records (admin audit, restore features). Review each case.

---

## 🟡 Medium Priority Issues

### 3. Extra Column Reference (1 file)

**File:** `lib/actions/premium/automation/inventory_composite.js:279`

**Issue:** SQL query construction may reference non-existent columns due to dynamic field interpolation.

**Fix:** Validate field names against schema whitelist before constructing SQL.

---

## 📋 Detailed Findings by Category

### Transaction Safety Issues

| File | Line | Issue |
|------|------|-------|
| `app/api/storefront/[businessDomain]/newsletter/subscribe/route.js` | 24 | Missing SAVEPOINT |
| `lib/storefront/storefrontAnalytics.js` | 38 | Missing SAVEPOINT |

### Soft Delete Issues - Products (Top 10)

| File | Line | Context |
|------|------|---------|
| `app/api/storefront/[businessDomain]/products/[productId]/stock/route.js` | 60 | Stock check |
| `app/api/v1/inventory/cycle-counts/route.js` | 56 | Cycle count |
| `app/api/v1/inventory/cycle-counts/route.js` | 77 | Cycle count |
| `lib/services/InventoryService.js` | Multiple | Stock operations |
| `lib/actions/standard/inventory_composite.js` | Multiple | Composite actions |

*...and 58 more product query locations*

### Soft Delete Issues - Product Variants

| File | Line | Context |
|------|------|---------|
| `app/api/storefront/[businessDomain]/orders/route.js` | 318 | Variant lookup in checkout |
| `lib/services/VariantService.js` | 158 | Variant operations |
| `lib/storefront/storefrontOrderStock.js` | 283 | Stock resolution |

### Soft Delete Issues - Invoice Payments

| File | Line | Context |
|------|------|---------|
| `lib/actions/standard/invoice-bulk.js` | 163 | Bulk invoice operations |
| `lib/services/InvoicePaymentService.js` | 300 | Payment calculations |

### Soft Delete Issues - Product Serials

| File | Line | Context |
|------|------|---------|
| `lib/actions/stock_clean.js` | 659 | Serial cleanup |
| `lib/actions/stock_clean.js` | 787 | Serial reconciliation |

---

## 🎯 Recommended Fix Order

### Phase 1: Critical Transaction Fixes (Same Day)
1. ✅ Fix `app/api/storefront/[businessDomain]/orders/route.js` - **COMPLETED**
2. Fix `app/api/storefront/[businessDomain]/newsletter/subscribe/route.js`
3. Fix `lib/storefront/storefrontAnalytics.js`

### Phase 2: High-Traffic Soft Delete Filters (Week 1)
1. Fix storefront product queries (public-facing)
2. Fix checkout variant lookups
3. Fix inventory service queries

### Phase 3: Admin & Background Soft Delete Filters (Week 2)
1. Fix admin invoice payment queries
2. Fix cycle count queries
3. Fix bulk operations

### Phase 4: Cleanup & Validation (Week 3)
1. Fix dynamic column reference in `inventory_composite.js`
2. Add schema validation helpers
3. Add integration tests for soft-delete filtering
4. Re-run audit to verify all fixes

---

## 🛠️ Implementation Helpers

### Helper Function for Soft Delete Filtering

```javascript
// lib/utils/softDeleteHelpers.js
export const SOFT_DELETE_TABLES = [
  'products',
  'product_variants',
  'invoice_payments',
  'product_serials',
  'customers',
  'invoices',
  'purchases'
];

export function addSoftDeleteFilter(table, alias = null) {
  if (SOFT_DELETE_TABLES.includes(table)) {
    const prefix = alias ? `${alias}.` : '';
    return `AND COALESCE(${prefix}is_deleted, false) = false`;
  }
  return '';
}

// Usage:
const query = `
  SELECT * FROM products p
  WHERE p.business_id = $1
  ${addSoftDeleteFilter('products', 'p')}
`;
```

### Transaction Savepoint Helper

```javascript
// lib/db/transactionHelpers.js
export async function withSavepoint(client, savepointName, operation) {
  await client.query(`SAVEPOINT ${savepointName}`);
  try {
    const result = await operation();
    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
    return result;
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    throw error;
  }
}

// Usage:
await withSavepoint(client, 'before_insert', async () => {
  return await client.query('INSERT INTO ...');
});
```

---

## 📊 Schema Column Reference Guide

### storefront_orders
✅ All columns properly defined:
- `id`, `business_id`, `order_number`, `customer_email`, `customer_phone`, `customer_name`
- `shipping_address` (JSONB), `billing_address` (JSONB)
- `subtotal`, `tax_amount`, `shipping_amount`, `discount_amount`, `total_amount`
- `currency`, `status`, `payment_status`, `fulfillment_status`
- `notes`, `metadata` (JSONB), `created_at`, `updated_at`

### storefront_order_items
✅ All columns properly defined:
- `id`, `order_id`, `business_id`, `product_id`, `product_name`
- `product_sku` ✅ (added by migration `20260602`)
- `variant_id` ✅ (added by migration `20260602`)
- `quantity`, `unit_price`, `tax_amount`, `total_price`
- `metadata` (JSONB)

### products
✅ All columns including soft-delete:
- Standard: `id`, `business_id`, `name`, `sku`, `barcode`, `price`, `stock`
- Soft delete: `is_deleted`, `deleted_at` ⚠️ (requires filtering)
- Images: `image_url`, `images` (JSONB array)
- Variants: `has_variants`, `variants` (JSONB)
- Extended: 50+ columns including domain_data, ratings, etc.

### product_variants
✅ All columns including soft-delete:
- Standard: `id`, `business_id`, `product_id`, `variant_sku`, `variant_name`
- Attributes: `size`, `color`, `pattern`, `material`, `custom_attributes`
- Pricing: `price`, `cost_price`, `mrp`, `stock`
- Soft delete: `is_deleted`, `deleted_at` ⚠️ (requires filtering)

### invoice_payments
✅ All columns properly defined (migration `20260606`, `20260607`):
- Core: `id`, `business_id`, `invoice_id`, `amount`
- Payment: `payment_method` ✅, `payment_date`, `reference_number`
- Tracking: `transaction_id`, `gateway_response`, `notes`
- User: `received_by` ✅ (TEXT, user.id compatible)
- Soft delete: `is_deleted`, `deleted_at`, `deleted_by` (TEXT) ⚠️

---

## ✅ Verification Commands

```bash
# Re-run audit after fixes
node scripts/audit-schema-wiring.mjs

# Check specific table columns
psql -d your_database -c "\d+ storefront_order_items"

# Verify migrations applied
psql -d your_database -c "SELECT * FROM _prisma_migrations ORDER BY applied_at DESC LIMIT 10"

# Test transaction recovery
npm run test:integration -- --grep "transaction savepoint"
```

---

## 📚 Related Documentation

- `docs/DATA_INTEGRITY_AND_FORMS.md` - Tenant isolation and form safety
- `docs/DATABASE_MIGRATIONS.md` - Migration best practices
- `docs/AUDIT.md` - Data integrity audit results
- `AGENTS.md` - Schema facts and soft-delete rules

---

## 🎓 Lessons Learned

1. **Always use SAVEPOINTs** for try-catch SQL retry patterns
2. **Default to soft-delete filters** on all queries (whitelist exceptions)
3. **Validate column references** before dynamic SQL construction
4. **Test transaction recovery** in integration tests
5. **Run schema audits** before major releases

---

**Status:** 1 critical fix completed (storefront orders), 72 issues remaining  
**Next Action:** Fix newsletter and analytics transaction handling  
**Owner:** Development Team  
**Review Date:** 2026-07-19
