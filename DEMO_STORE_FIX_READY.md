# Demo Store 404 Fix - Ready to Execute

**Status:** ✅ Fix scripts prepared and ready  
**Issue:** Demo stores showing 404 on stock API  
**Root Cause:** Missing `business_custom_domains` entries (created before Fix #1)  

---

## ARCHITECTURE CLARIFICATION

### Businesses Table Does NOT Have `is_deleted`

**By Design - Correct Architecture:**
- ✅ `businesses` table uses `is_active` (boolean) and `approval_status` for lifecycle
- ✅ Top-level tenant entities should NOT be soft-deleted
- ✅ Other tables (customers, vendors, products, invoices, payments) DO have `is_deleted`

**Why No Soft Delete for Businesses?**
- Businesses are the tenant-level entity (isolation boundary)
- Cascading deletes handle cleanup of related records
- `is_active = false` provides deactivation without data loss
- `approval_status` handles approval workflow

This is **intentional and correct** - no migration needed!

---

## READY TO EXECUTE

### Prerequisites

1. **Database must be running and accessible**
2. **DATABASE_URL must be set in .env file**
3. **Redis recommended (for cache purge after fix)**

### Quick Fix (when DB available)

```bash
# Run the SQL-based fix script
npx tsx scripts/fix-demo-stores-sql.mjs
```

---

## WHAT THE FIX DOES

### Step 1: Find Demo Stores
```sql
SELECT id, business_name, domain, is_active, approval_status
FROM businesses
WHERE domain LIKE 'demo-%' OR business_name LIKE '%Demo%'
```

### Step 2: Activate & Auto-Approve
```sql
UPDATE businesses
SET 
    is_active = true,
    approval_status = 'auto_approved',
    updated_at = NOW()
WHERE (domain LIKE 'demo-%' OR business_name LIKE '%Demo%')
  AND (is_active = false OR approval_status NOT IN ('approved', 'auto_approved'))
```

### Step 3: Add Missing Custom Domains (THE CRITICAL FIX)
```sql
INSERT INTO business_custom_domains (business_id, domain, is_active, is_primary)
SELECT b.id, b.domain, true, true
FROM businesses b
WHERE (b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%')
  AND NOT EXISTS (
      SELECT 1 
      FROM business_custom_domains bcd 
      WHERE bcd.business_id = b.id AND bcd.domain = b.domain
  )
ON CONFLICT (business_id, domain) 
DO UPDATE SET 
    is_active = true,
    is_primary = true,
    updated_at = NOW()
```

### Step 4: Enable Storefront
```sql
-- Create missing settings
INSERT INTO business_settings (business_id, is_storefront_enabled, settings)
SELECT b.id, true, '{"storefront": {"enabled": true}}'::jsonb
FROM businesses b
WHERE (b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%')
  AND NOT EXISTS (
      SELECT 1 FROM business_settings bs WHERE bs.business_id = b.id
  )

-- Enable existing storefronts
UPDATE business_settings bs
SET 
    is_storefront_enabled = true,
    updated_at = NOW()
FROM businesses b
WHERE bs.business_id = b.id
  AND (b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%')
  AND bs.is_storefront_enabled = false
```

### Step 5: Verification
- Check product counts per demo store
- Verify custom domain entries exist
- Verify storefront enabled

---

## AFTER RUNNING THE FIX

### 1. Clear Redis Cache

```bash
redis-cli FLUSHDB
```

Or restart Redis if you don't have CLI access:

```bash
# Windows
net stop redis
net start redis

# Or Docker
docker restart redis
```

### 2. Clear Browser Cache

- Chrome: `Ctrl+Shift+Delete` → Clear cache
- Or use Incognito mode

### 3. Test Demo Stores

Visit these URLs:
- https://tenvo.store/store/demo-boutique
- https://tenvo.store/store/demo-restaurant  
- https://tenvo.store/store/demo-furniture
- https://tenvo.store/store/demo-fitness
- (any other demo-* domains)

### 4. Verify Stock API Works

1. Click any product with variants (size/color)
2. Select a variant
3. Check browser console - should NOT see:
   - ❌ `404 /api/storefront/demo-boutique/products/{id}/stock`
   - ❌ "Store not found" error
4. Verify "Add to Cart" works

---

## TROUBLESHOOTING

### Issue: Database connection refused

**Cause:** DATABASE_URL not set or database not running

**Solution:**
```bash
# Check .env file has DATABASE_URL
cat .env | findstr DATABASE_URL

# Start PostgreSQL (if local)
# Windows: Services → PostgreSQL → Start
# Or Docker: docker start postgres
```

### Issue: Script runs but stores still 404

**Solution:** Clear cache
```bash
redis-cli FLUSHDB
# AND clear browser cache
```

### Issue: "Store not found" persists

**Solution:** Verify fix applied
```sql
-- Check custom domains exist
SELECT b.domain, bcd.domain as custom, bcd.is_active
FROM businesses b
LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id
WHERE b.domain LIKE 'demo-%';

-- Should show custom domain for each demo store
```

---

## TECHNICAL DETAILS

### Why This Happened

Demo stores were created **before** Fix #1 was implemented.

**Old Registration Flow (buggy):**
```javascript
// Business created IN transaction
const biz = await prisma.transaction(async (tx) => {
    return await tx.businesses.create({ ... });
}); // Transaction commits here

// Storefront init OUTSIDE transaction (could fail silently)
try {
    await StorefrontSyncService.initializeStorefront(biz.id, domain);
} catch (err) {
    console.error('Failed'); // Error logged but ignored!
}
```

**Result:**
- ✅ Business created successfully
- ❌ Custom domain entry NOT created (storefront init failed)
- ❌ Stock API returns 404 (can't resolve business from domain)

**New Registration Flow (Fix #1 - already implemented):**
```javascript
const biz = await prisma.transaction(async (tx) => {
    // 1. Create business
    const biz = await tx.businesses.create({ ... });
    
    // 2. Initialize storefront INSIDE transaction
    const init = await StorefrontSyncService.initializeStorefront(
        biz.id, 
        domain, 
        tx // Pass transaction
    );
    
    if (!init.success) {
        throw new Error('Storefront init failed');
        // Entire transaction rolls back
    }
    
    return biz; // Commits atomically
});
```

**Result:**
- ✅ Business + custom domain created atomically
- ✅ If storefront init fails, business creation fails (no orphans)
- ✅ All NEW registrations work correctly

**For EXISTING demo stores:** Must run fix script to backfill missing custom domains

### Stock API Flow

```javascript
// app/api/storefront/[businessDomain]/products/[productId]/stock/route.js

export async function POST(request, { params }) {
    const { businessDomain } = await params;
    
    // 1. Resolve business from domain
    const business = await resolveStorefrontBusiness(businessDomain);
    
    if (!business?.id) {
        // Returns 404 if not found
        return NextResponse.json(
            { message: 'Store not found' }, 
            { status: 404 }
        );
    }
    
    // 2. Check product stock...
}
```

**resolveStorefrontBusiness() flow:**
1. Check Redis cache for domain → business mapping
2. If cache miss, query `business_custom_domains` table
3. If no row found → return NULL
4. Business NULL → Stock API returns 404

**The Fix:** Add missing `business_custom_domains` entries

---

## FILES CREATED

### 1. `scripts/fix-demo-stores-sql.mjs`
- **Purpose:** SQL-based fix script (bypasses Prisma client issues)
- **Usage:** `npx tsx scripts/fix-demo-stores-sql.mjs`
- **Safe:** Idempotent, read-mostly with surgical updates

### 2. `scripts/fix-demo-stores.mjs`
- **Purpose:** Prisma-based fix script (if client works)
- **Usage:** `npm run fix:demo-stores`
- **Note:** May need `npx prisma generate` first

### 3. `package.json`
- **Added:** `"fix:demo-stores": "npx tsx scripts/fix-demo-stores.mjs"`

---

## VERIFICATION CHECKLIST

After running fix and clearing cache:

### Database Checks

```sql
-- 1. All demo stores should have custom domains
SELECT 
    b.domain,
    b.is_active,
    b.approval_status,
    bcd.domain as custom_domain,
    bcd.is_active as domain_active,
    bs.is_storefront_enabled
FROM businesses b
LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id AND bcd.domain = b.domain
LEFT JOIN business_settings bs ON bs.business_id = b.id
WHERE b.domain LIKE 'demo-%'
ORDER BY b.created_at DESC;

-- Expected: Each demo store has custom_domain matching its domain
```

### API Test

```bash
# Test stock API directly (replace with actual product ID)
curl -X POST https://tenvo.store/api/storefront/demo-boutique/products/{PRODUCT_ID}/stock \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'

# Expected: NOT 404
# Should return stock data or "Product not found" (not "Store not found")
```

### Browser Test

1. ✅ Demo stores load without "Store not found" error
2. ✅ Products display correctly
3. ✅ Clicking variants loads stock (no 404 in console)
4. ✅ "Add to Cart" works
5. ✅ Checkout flow works

---

## PREVENTION (Already Implemented)

**Fix #1** (implemented in previous session) ensures ALL NEW businesses get atomic storefront initialization:

**File:** `lib/actions/basic/business.js`

```javascript
const result = await prismaBase.$transaction(async (tx) => {
    // Business creation
    const biz = await tx.businesses.create({ ... });
    
    // Storefront init (INSIDE transaction) ✅
    const storefrontInit = await StorefrontSyncService.initializeStorefront(
        biz.id,
        normalizedDomain,
        tx // Pass transaction
    );
    
    if (!storefrontInit.success) {
        throw new Error('Storefront initialization failed');
        // Rolls back entire transaction
    }
    
    return biz;
});
```

**Result:**
- ✅ No future orphaned businesses
- ✅ Registration either succeeds completely or fails completely
- ✅ No partial states

---

## SUMMARY

**Problem:** Demo stores created before Fix #1 are missing `business_custom_domains` entries  
**Solution:** Run `npx tsx scripts/fix-demo-stores-sql.mjs` when database is available  
**Time:** < 1 minute to fix all demo stores  
**Risk:** None - idempotent SQL with upsert logic  
**Prevention:** Fix #1 already prevents this for new registrations  

**Next Step:** Start your database and run the fix script!

```bash
npx tsx scripts/fix-demo-stores-sql.mjs
```
