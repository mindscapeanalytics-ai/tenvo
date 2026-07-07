# Demo Store 404 Fix - Comprehensive Solution

**Issue:** Demo stores (demo-boutique, demo-restaurant, etc.) returning 404 on stock API  
**Error:** `Failed to load resource: 404 /api/storefront/demo-boutique/products/{id}/stock`  
**Root Cause:** `resolveStorefrontBusiness()` returns NULL → "Store not found"

---

## ROOT CAUSE ANALYSIS

When a user clicks a product variant (size/color), the product page calls:
```javascript
POST /api/storefront/demo-boutique/products/{productId}/stock
```

This route does:
```javascript
const business = await resolveStorefrontBusiness('demo-boutique');
if (!business?.id) {
    return NextResponse.json({ message: 'Store not found' }, { status: 404 });
}
```

**Why `resolveStorefrontBusiness()` returns NULL:**

1. ❌ **Missing `business_custom_domains` entry**
2. ❌ **Storefront disabled in `business_settings`**
3. ❌ **Business inactive or deleted**
4. ❌ **Domain doesn't match `businesses.domain`**

---

## DIAGNOSTIC STEPS

### Step 1: Run SQL Diagnostic

```bash
# Connect to your database and run:
psql $DATABASE_URL -f scripts/check-demo-stores.sql
```

OR manually check:

```sql
-- Check if demo stores exist
SELECT id, business_name, domain, is_active, is_deleted
FROM businesses
WHERE domain LIKE '%demo%'
ORDER BY created_at DESC;

-- Check custom domains
SELECT b.domain, bcd.domain as custom_domain, bcd.is_active
FROM business_custom_domains bcd
JOIN businesses b ON b.id = bcd.business_id
WHERE b.domain LIKE '%demo%';
```

### Step 2: Identify the Problem

| Symptom | Cause | Fix |
|---------|-------|-----|
| No rows in Step 1 | Demo stores not created | Run seed script |
| Rows exist but `is_deleted = true` | Deleted | UPDATE businesses SET is_deleted = false |
| No custom domain entries | Missing FK entries | Run Fix #1 below |
| `is_storefront_enabled = false` | Disabled | Run Fix #2 below |

---

## FIX #1: Add Missing Custom Domain Entries

**This is the most likely issue** - demo stores created before Fix #1 don't have `business_custom_domains` entries.

```sql
-- Add custom domain entries for all demo stores
INSERT INTO business_custom_domains (business_id, domain, is_active, is_primary)
SELECT id, domain, true, true
FROM businesses
WHERE (domain LIKE 'demo-%' OR business_name LIKE '%Demo%')
  AND id NOT IN (
      SELECT business_id 
      FROM business_custom_domains 
      WHERE is_active = true
  )
ON CONFLICT (business_id, domain) 
DO UPDATE SET is_active = true, is_primary = true, updated_at = NOW();

-- Verify
SELECT b.business_name, b.domain, bcd.domain as custom_domain, bcd.is_active
FROM businesses b
LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id
WHERE b.domain LIKE 'demo-%'
ORDER BY b.created_at DESC;
```

---

## FIX #2: Enable Storefront if Disabled

```sql
-- Check if storefront is disabled
SELECT b.business_name, b.domain, bs.is_storefront_enabled
FROM businesses b
LEFT JOIN business_settings bs ON bs.business_id = b.id
WHERE b.domain LIKE 'demo-%';

-- Enable storefront for all demo stores
UPDATE business_settings bs
SET is_storefront_enabled = true, updated_at = NOW()
FROM businesses b
WHERE bs.business_id = b.id
  AND b.domain LIKE 'demo-%'
  AND COALESCE(bs.is_storefront_enabled, true) = false;
```

---

## FIX #3: Reactivate Deleted Demo Stores

```sql
-- Check for deleted demo stores
SELECT business_name, domain, is_deleted, deleted_at
FROM businesses
WHERE domain LIKE 'demo-%'
  AND is_deleted = true;

-- Reactivate
UPDATE businesses
SET is_deleted = false, 
    is_active = true,
    deleted_at = NULL,
    updated_at = NOW()
WHERE domain LIKE 'demo-%'
  AND is_deleted = true;
```

---

## FIX #4: Purge Stale Cache

After running SQL fixes, purge Redis cache:

```bash
# If using Redis CLI
redis-cli FLUSHDB

# OR programmatically
node -e "
const redis = require('./lib/cache/redis.js');
(async () => {
  await redis.redisDel('storefront:domain:demo-boutique');
  await redis.redisDel('storefront:domain:demo-restaurant');
  // ... for each demo store
  console.log('Cache purged');
  process.exit(0);
})();
"
```

---

## VERIFICATION

After applying fixes:

### 1. Test Domain Resolution

```bash
# In browser console on demo-boutique page:
fetch('/api/storefront/demo-boutique/products/test-id/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: 1 })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

# Expected: NOT 404
# Should return: { message: 'Product not found' } or actual stock data
```

### 2. Check "Store not found" Error

- Navigate to demo-boutique storefront
- Click a product with variants
- Select size/color
- Check browser console
- **Should NOT see** "Store not found" error

### 3. Verify Stock Check Works

- Add product to cart
- Stock availability should show
- "Only X left in stock" should display

---

## PERMANENT FIX: Update Registration Flow

The root cause is that **old demo stores were created before Fix #1** (storefront init in transaction).

Ensure all future businesses get custom domain entries:

**Already Fixed in:** `lib/actions/basic/business.js` (Lines 403-430)

```javascript
// Inside transaction - already implemented
const storefrontInit = await StorefrontSyncService.initializeStorefront(
    biz.id,
    normalizedDomain,
    tx // Transaction client
);

if (!storefrontInit.success) {
    throw new Error(`Storefront initialization failed`);
}
```

**This ensures:**
- ✅ All NEW businesses get `business_custom_domains` entry
- ✅ Entry created atomically with business
- ✅ No orphaned businesses

**For EXISTING demo stores:**
- ❌ Must run SQL Fix #1 to backfill missing entries

---

## QUICK FIX SCRIPT

Create `scripts/fix-demo-stores.mjs`:

```javascript
#!/usr/bin/env node
import pool from '../lib/db.js';

async function fixDemoStores() {
    const client = await pool.connect();
    
    try {
        console.log('Fixing demo stores...\n');
        
        // 1. Add missing custom domain entries
        const result = await client.query(`
            INSERT INTO business_custom_domains (business_id, domain, is_active, is_primary)
            SELECT id, domain, true, true
            FROM businesses
            WHERE (domain LIKE 'demo-%' OR business_name LIKE '%Demo%')
              AND id NOT IN (
                  SELECT business_id 
                  FROM business_custom_domains 
                  WHERE is_active = true
              )
            ON CONFLICT (business_id, domain) 
            DO UPDATE SET is_active = true, is_primary = true
            RETURNING business_id, domain
        `);
        
        console.log(`✅ Fixed ${result.rows.length} demo stores`);
        result.rows.forEach(row => {
            console.log(`   - ${row.domain}`);
        });
        
        // 2. Enable storefront
        await client.query(`
            UPDATE business_settings bs
            SET is_storefront_enabled = true
            FROM businesses b
            WHERE bs.business_id = b.id
              AND b.domain LIKE 'demo-%'
        `);
        
        console.log('\n✅ Enabled storefront for all demo stores');
        console.log('\n🔄 Please purge Redis cache and refresh browser');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixDemoStores();
```

**Run:**
```bash
node scripts/fix-demo-stores.mjs
```

---

## SUMMARY

**Problem:** Demo stores created before Fix #1 are missing `business_custom_domains` entries

**Solution:** Run SQL Fix #1 to backfill missing entries

**Prevention:** Fix #1 (already implemented) ensures all new businesses get proper entries

**Verification:** Stock API should work after fix + cache purge + browser refresh

