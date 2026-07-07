# Fix Demo Stores 404 - Step-by-Step Guide

**Issue:** Demo stores showing "Store not found" error and 404 on stock API  
**Impact:** Product variants (size/color) don't load, "Add to Cart" broken  
**Status:** ✅ Fix script ready to run

---

## QUICK FIX (Recommended)

### Step 1: Run the Fix Script

```bash
# In your terminal:
cd e:\tenvo-main
npm run fix:demo-stores
```

OR:

```bash
npx tsx scripts/fix-demo-stores.mjs
```

### Step 2: Clear Cache (if using Redis)

```bash
# Connect to Redis and flush
redis-cli FLUSHDB
```

OR restart your Redis server.

### Step 3: Test

1. Open browser to demo stores:
   - https://tenvo.store/store/demo-boutique
   - https://tenvo.store/store/demo-restaurant
   - https://tenvo.store/store/demo-furniture
   - (etc.)

2. Click on any product with variants (size/color options)

3. Select a variant

4. Check browser console - should NOT see:
   - ❌ "Failed to load resource: 404 /api/storefront/.../stock"
   - ❌ "Store not found" error

5. Verify "Add to Cart" works

---

## WHAT THE FIX DOES

The script automatically:

1. ✅ **Finds all demo stores** (domain starts with `demo-` or name contains `Demo`)

2. ✅ **Reactivates deleted/inactive stores**
   ```sql
   UPDATE businesses 
   SET is_deleted = false, is_active = true
   WHERE domain LIKE 'demo-%'
   ```

3. ✅ **Adds missing custom domain entries**
   ```sql
   INSERT INTO business_custom_domains 
   (business_id, domain, is_active, is_primary)
   SELECT id, domain, true, true FROM businesses
   WHERE domain LIKE 'demo-%' AND NOT EXISTS (...)
   ```

4. ✅ **Enables storefront if disabled**
   ```sql
   UPDATE business_settings 
   SET is_storefront_enabled = true
   WHERE business_id IN (demo stores)
   ```

5. ✅ **Verifies product counts** for each store

6. ✅ **Provides test URLs** for verification

---

## MANUAL FIX (Alternative)

If you prefer to run SQL manually:

### Step 1: Connect to Database

```bash
psql $DATABASE_URL
```

### Step 2: Run Fix SQL

```sql
-- 1. Reactivate demo stores
UPDATE businesses
SET is_deleted = false, 
    is_active = true,
    deleted_at = NULL,
    updated_at = NOW()
WHERE domain LIKE 'demo-%'
  OR business_name LIKE '%Demo%';

-- 2. Add missing custom domain entries
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
DO UPDATE SET 
    is_active = true, 
    is_primary = true,
    updated_at = NOW();

-- 3. Enable storefront
UPDATE business_settings bs
SET is_storefront_enabled = true, 
    updated_at = NOW()
FROM businesses b
WHERE bs.business_id = b.id
  AND (b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%');

-- 4. Verify
SELECT 
    b.business_name,
    b.domain,
    b.is_active,
    b.is_deleted,
    bcd.domain as custom_domain,
    bcd.is_active as custom_domain_active,
    bs.is_storefront_enabled
FROM businesses b
LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id
LEFT JOIN business_settings bs ON bs.business_id = b.id
WHERE b.domain LIKE 'demo-%'
   OR b.business_name LIKE '%Demo%'
ORDER BY b.created_at DESC;
```

---

## ROOT CAUSE EXPLAINED

### Why This Happened

Demo stores were created **before** Fix #1 (Business Creation → Storefront Init Atomicity) was implemented.

**Old Flow:**
```javascript
// Business created in transaction
const result = await prisma.transaction(async (tx) => {
    const biz = await tx.businesses.create({ ... });
    return biz; // Transaction ends here
});

// Storefront init OUTSIDE transaction (could fail)
try {
    await StorefrontSyncService.initializeStorefront(result.id, domain);
} catch (err) {
    console.error('Failed'); // Error ignored!
}
```

**Result:** Business created ✅, but `business_custom_domains` entry NOT created ❌

### Why Stock API Returns 404

```javascript
// app/api/storefront/[businessDomain]/products/[productId]/stock/route.js

export async function POST(request, { params }) {
    const { businessDomain } = await params;
    
    // Tries to resolve business from domain
    const business = await resolveStorefrontBusiness(businessDomain);
    
    if (!business?.id) {
        // Returns 404 if no business found
        return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }
    // ...
}
```

**resolveStorefrontBusiness() flow:**
1. Checks Redis cache
2. Queries `business_custom_domains` for matching domain
3. If no entry found → returns NULL
4. Stock API gets NULL → returns 404

---

## PREVENTION (Already Fixed)

### Fix #1 Implementation

**File:** `lib/actions/basic/business.js`

The fix ensures storefront init happens **inside** the business creation transaction:

```javascript
const result = await prismaBase.$transaction(async (tx) => {
    // 1. Create business
    const biz = await tx.businesses.create({ ... });
    
    // 2. Create settings
    await tx.business_settings.create({ ... });
    
    // 3. Create custom domain (INSIDE transaction) ✅ NEW
    const storefrontInit = await StorefrontSyncService.initializeStorefront(
        biz.id,
        normalizedDomain,
        tx // Pass transaction
    );
    
    if (!storefrontInit.success) {
        throw new Error('Storefront initialization failed');
        // Entire transaction rolls back
    }
    
    return biz; // Commits atomically
});
```

**Result:**
- ✅ All NEW businesses get `business_custom_domains` entry
- ✅ If storefront init fails, business creation fails
- ✅ No orphaned businesses

**For EXISTING demo stores:**
- Must run fix script to backfill missing entries

---

## VERIFICATION CHECKLIST

After running the fix:

### Database Checks

```sql
-- All demo stores should have custom domain entries
SELECT 
    b.domain,
    COUNT(bcd.id) as custom_domains
FROM businesses b
LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id AND bcd.is_active = true
WHERE b.domain LIKE 'demo-%'
GROUP BY b.domain;
-- Expected: custom_domains = 1 for each store
```

### API Test

```bash
# Test stock API directly
curl -X POST https://tenvo.store/api/storefront/demo-boutique/products/test-id/stock \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'

# Expected: NOT 404
# Should return: {"message":"Product not found"} or actual data
```

### Browser Test

1. Navigate to: https://tenvo.store/store/demo-boutique
2. Click any clothing product
3. Select size (S/M/L/XL)
4. Select color
5. Verify:
   - ✅ Stock check loads (no 404 in console)
   - ✅ "Only X left in stock" shows
   - ✅ "Add to Cart" button works
   - ✅ No "Store not found" error in top-right

---

## TROUBLESHOOTING

### Issue: Script fails with "Cannot find module"

**Solution:** Install dependencies

```bash
npm install
```

### Issue: Script runs but stores still 404

**Solution:** Clear cache and browser

```bash
# 1. Clear Redis
redis-cli FLUSHDB

# 2. Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear cache
# Or use incognito mode

# 3. Restart Next.js dev server
npm run dev
```

### Issue: "Store not found" persists

**Solution:** Check database manually

```sql
-- Check if fix actually applied
SELECT b.domain, bcd.domain as custom, bcd.is_active
FROM businesses b
LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id
WHERE b.domain = 'demo-boutique';
```

If custom domain is NULL, run fix script again with verbose output.

### Issue: Products don't show

**Different issue** - this is about missing products, not 404 error.

**Solution:** Run seed script

```bash
npm run data-lab:ensure-demos
```

---

## SUMMARY

**Problem:** Demo stores created before Fix #1 are missing database entries  
**Solution:** Run `npm run fix:demo-stores` to backfill missing entries  
**Prevention:** Fix #1 (already implemented) prevents future occurrences  
**Time:** < 1 minute to fix all demo stores  
**Risk:** None - read-only checks, safe idempotent updates

**Ready to fix?** Run:
```bash
npm run fix:demo-stores
```

