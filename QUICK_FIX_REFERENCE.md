# Quick Fix Reference Card

## 🚨 DEMO STORE 404 FIX (When DB Available)

### One Command Fix
```bash
npx tsx scripts/fix-demo-stores-sql.mjs
```

### Then Clear Cache
```bash
redis-cli FLUSHDB
```

### Test
Visit: https://tenvo.store/store/demo-boutique  
Click product variant → Should show stock (no 404)

---

## ✅ FIXES ALREADY COMPLETE

### Fix #1: Atomic Business Creation
**File:** `lib/actions/basic/business.js`  
**Status:** ✅ Deployed  
**Impact:** No more orphaned businesses

### Fix #2: Cache Drift Eliminated
**File:** `lib/tenancy/resolveStorefrontBusiness.js`  
**Status:** ✅ Deployed  
**Impact:** No stale cross-tenant cache

### Fix #6: Product Cache Invalidation
**File:** `lib/actions/standard/inventory/product.js`  
**Status:** ✅ Already correct  
**Impact:** Cache updates after product edit

---

## 📊 VERIFICATION

```bash
# Auth redirects (16 checks)
bun run verify:auth-redirect-fixes

# Dashboard flow (25 checks)
bun run verify:complete-flow-fixes

# Registration flow (25 checks)
bun run verify:registration-storefront-flow
```

**All should pass:** ✅ All X checks passed!

---

## 🏗️ ARCHITECTURE FACTS

### Businesses Table
- ✅ Has `is_active` (boolean)
- ✅ Has `approval_status` (string)
- ❌ Does NOT have `is_deleted` (by design)
- ❌ Does NOT have `deleted_at` (by design)

**This is CORRECT** - businesses use activation, not soft-delete

### Other Tables
- ✅ `customers` has `is_deleted`
- ✅ `vendors` has `is_deleted`
- ✅ `products` has `is_deleted`
- ✅ `invoices` has `is_deleted`
- ✅ `payments` has `is_deleted`

---

## 🔍 ROOT CAUSE: Demo Store 404

**Problem:**
```
Demo stores created BEFORE Fix #1
→ Business created ✅
→ Custom domain entry NOT created ❌
→ resolveStorefrontBusiness() returns NULL
→ Stock API returns 404 "Store not found"
```

**Solution:**
```sql
-- Add missing custom domain entries
INSERT INTO business_custom_domains (business_id, domain, is_active, is_primary)
SELECT b.id, b.domain, true, true
FROM businesses b
WHERE domain LIKE 'demo-%'
  AND NOT EXISTS (
      SELECT 1 FROM business_custom_domains bcd 
      WHERE bcd.business_id = b.id
  )
```

**Prevention:**
Fix #1 (already deployed) prevents this for ALL NEW registrations

---

## 📚 KEY DOCUMENTS

| Document | Purpose |
|----------|---------|
| `DEMO_STORE_FIX_READY.md` | **Complete guide for demo store fix** |
| `CRITICAL_FIXES_COMPLETE_STATUS.md` | **Overall status of all 6 fixes** |
| `scripts/fix-demo-stores-sql.mjs` | **Fix script (ready to run)** |
| `docs/DASHBOARD_FLOW_AUDIT.md` | Dashboard technical audit (70 pages) |
| `docs/BUSINESS_REGISTRATION_STOREFRONT_AUDIT.md` | Registration audit |

---

## 🎯 NEXT STEPS

1. **Start database** (if not running)
2. **Run demo store fix:** `npx tsx scripts/fix-demo-stores-sql.mjs`
3. **Clear Redis:** `redis-cli FLUSHDB`
4. **Test demo stores** (click variants, check stock)
5. **Verify no 404** in browser console

---

## 🆘 TROUBLESHOOTING

### Database connection refused
```bash
# Check .env has DATABASE_URL
cat .env | findstr DATABASE_URL

# Start PostgreSQL
# Services → PostgreSQL → Start
```

### Stores still 404 after fix
```bash
# Clear cache again
redis-cli FLUSHDB

# Hard refresh browser
Ctrl+Shift+R
```

### Verify fix applied
```sql
SELECT b.domain, bcd.domain as custom, bcd.is_active
FROM businesses b
LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id
WHERE b.domain LIKE 'demo-%';

-- Should show custom domain for each demo store
```

---

## ✨ SUCCESS METRICS

After fix:
- ✅ Demo stores load without "Store not found"
- ✅ Product variants load stock (no 404)
- ✅ "Add to Cart" works
- ✅ Checkout flow works
- ✅ All verification scripts pass

---

**Ready to fix when database is available!**

```bash
npx tsx scripts/fix-demo-stores-sql.mjs
```
