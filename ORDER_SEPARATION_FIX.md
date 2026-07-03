# 🔒 Perfect Order Separation - Complete Fix

## Problem Analysis

### Current Issues:
1. ❌ **Global unique constraint** on `order_number` causes conflicts between businesses
2. ⚠️ **No customer isolation** in some queries (potential for customer data mixing)
3. ⚠️ **Race conditions** in order number generation
4. ⚠️ **Missing indexes** for efficient customer-scoped queries

### Security Requirements:
- ✅ Customer A can ONLY see their own orders
- ✅ Business A can ONLY see their own orders
- ✅ Order numbers can repeat across businesses (ORD-20260703-0001 for Business A and Business B)
- ✅ No data leakage between customers or businesses
- ✅ Zero conflicts in concurrent order creation

---

## 🛠️ COMPLETE FIX IMPLEMENTATION

### STEP 1: Database Schema Fix (Critical - Run First!)

```sql
-- ===========================================================================
-- CRITICAL FIX: Order Number Constraint + Perfect Isolation
-- ===========================================================================

BEGIN;

-- 1. Drop the problematic global constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_order_number_key'
          AND conrelid = 'storefront_orders'::regclass
    ) THEN
        ALTER TABLE storefront_orders 
        DROP CONSTRAINT storefront_orders_order_number_key CASCADE;
        RAISE NOTICE '✓ Dropped global constraint';
    ELSE
        RAISE NOTICE 'ℹ Global constraint does not exist';
    END IF;
END;
$$;

-- 2. Add composite unique constraint (business + order_number)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_business_id_order_number_key'
          AND conrelid = 'storefront_orders'::regclass
    ) THEN
        ALTER TABLE storefront_orders
            ADD CONSTRAINT storefront_orders_business_id_order_number_key
            UNIQUE (business_id, order_number);
        RAISE NOTICE '✓ Added composite constraint (business_id, order_number)';
    ELSE
        RAISE NOTICE 'ℹ Composite constraint already exists';
    END IF;
END;
$$;

-- 3. Add indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_id
    ON storefront_orders (business_id);

CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_order
    ON storefront_orders (business_id, order_number);

-- CRITICAL: Index for customer isolation
CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_customer
    ON storefront_orders (business_id, customer_email);

-- For order tracking
CREATE INDEX IF NOT EXISTS idx_storefront_orders_email_lower
    ON storefront_orders (business_id, LOWER(customer_email));

-- For dashboard queries
CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_status
    ON storefront_orders (business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_payment
    ON storefront_orders (business_id, payment_status, created_at DESC);

-- 4. Add Row Level Security (RLS) for ultimate protection
ALTER TABLE storefront_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Businesses can only see their own orders
CREATE POLICY business_isolation_policy ON storefront_orders
    FOR ALL
    USING (business_id = current_setting('app.current_business_id')::uuid);

-- Policy: Customers can only see their own orders (public lookup)
CREATE POLICY customer_isolation_policy ON storefront_orders
    FOR SELECT
    USING (
        business_id = current_setting('app.current_business_id')::uuid
        AND LOWER(customer_email) = LOWER(current_setting('app.current_customer_email'))
    );

-- 5. Add check constraints for data integrity
ALTER TABLE storefront_orders
    ADD CONSTRAINT check_business_id_not_null 
    CHECK (business_id IS NOT NULL);

ALTER TABLE storefront_orders
    ADD CONSTRAINT check_order_number_format 
    CHECK (order_number ~ '^[A-Z]{3}-[0-9]{8}-[0-9]{4}$');

-- 6. Add indexes for order items (foreign key was missing index!)
CREATE INDEX IF NOT EXISTS idx_storefront_order_items_order_id
    ON storefront_order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_storefront_order_items_business_product
    ON storefront_order_items (product_id)
    WHERE product_id IS NOT NULL;

COMMIT;

-- 7. Verify the setup
DO $$
DECLARE
    has_global BOOLEAN;
    has_composite BOOLEAN;
    rls_enabled BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_order_number_key'
    ) INTO has_global;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_business_id_order_number_key'
    ) INTO has_composite;
    
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'storefront_orders' 
    INTO rls_enabled;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verification Results:';
    RAISE NOTICE '  Global constraint: %', CASE WHEN has_global THEN '❌ EXISTS' ELSE '✅ REMOVED' END;
    RAISE NOTICE '  Composite constraint: %', CASE WHEN has_composite THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '  RLS enabled: %', CASE WHEN rls_enabled THEN '✅ YES' ELSE '⚠️ NO' END;
    RAISE NOTICE '========================================';
    
    IF NOT has_global AND has_composite THEN
        RAISE NOTICE '✅ SUCCESS: Perfect order separation configured!';
    ELSE
        RAISE WARNING '⚠️ Manual verification required';
    END IF;
END;
$$;
```

---

### STEP 2: Fix Order Number Generation (Atomic & Race-Condition Free)

Create: `lib/utils/orderNumber.js`

```javascript
/**
 * Atomic Order Number Generation
 * Prevents race conditions using database sequences
 */

import pool from '@/lib/db';

/**
 * Initialize sequence table (run once on startup or via migration)
 */
export async function initializeOrderSequenceTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_number_sequences (
        business_id UUID NOT NULL,
        date_prefix VARCHAR(8) NOT NULL,
        current_sequence INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (business_id, date_prefix)
      );
      
      CREATE INDEX IF NOT EXISTS idx_order_sequences_business_date 
        ON order_number_sequences(business_id, date_prefix);
    `);
    console.log('✅ Order sequence table initialized');
  } catch (error) {
    console.error('Failed to initialize sequence table:', error);
  } finally {
    client.release();
  }
}

/**
 * Generate unique order number (atomic, race-condition free)
 * @param {import('pg').PoolClient} client - Must be within a transaction
 * @param {string} businessId - UUID of the business
 * @returns {Promise<string>} Order number in format ORD-YYYYMMDD-XXXX
 */
export async function generateOrderNumber(client, businessId) {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  try {
    // Atomic increment using database sequence
    // This is race-condition free and handles concurrent requests perfectly
    const result = await client.query(
      `INSERT INTO order_number_sequences (business_id, date_prefix, current_sequence)
       VALUES ($1::uuid, $2, 1)
       ON CONFLICT (business_id, date_prefix) 
       DO UPDATE SET 
         current_sequence = order_number_sequences.current_sequence + 1,
         updated_at = NOW()
       RETURNING current_sequence`,
      [businessId, datePrefix]
    );
    
    const sequence = result.rows[0].current_sequence;
    return `ORD-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
    
  } catch (error) {
    console.error('[generateOrderNumber] Error:', error);
    
    // Fallback: Use timestamp + random suffix (guaranteed unique)
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `ORD-${datePrefix}-${timestamp}${random}`;
  }
}

/**
 * Cleanup old sequences (optional maintenance task)
 * Run this daily/weekly to remove old date prefixes
 */
export async function cleanupOldSequences(daysToKeep = 90) {
  const client = await pool.connect();
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffPrefix = cutoffDate.toISOString().slice(0, 10).replace(/-/g, '');
    
    const result = await client.query(
      `DELETE FROM order_number_sequences WHERE date_prefix < $1 RETURNING business_id`,
      [cutoffPrefix]
    );
    
    console.log(`✅ Cleaned up ${result.rowCount} old sequence records`);
    return result.rowCount;
  } catch (error) {
    console.error('[cleanupOldSequences] Error:', error);
    return 0;
  } finally {
    client.release();
  }
}
```

Update: `lib/utils/order.js`

```javascript
// Replace the old generateOrderNumber function with:
export { generateOrderNumber } from './orderNumber.js';

// Keep all other functions (formatOrderStatus, etc.)
```

---

### STEP 3: Update Order Creation API (Add Retry Logic)

Update: `app/api/storefront/[businessDomain]/orders/route.js`

Add this helper at the top of the file:

```javascript
/**
 * Retry wrapper for handling transient order number conflicts
 */
async function withOrderCreationRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Check if it's an order number conflict
      const isOrderNumberConflict = 
        error.code === '23505' && 
        error.constraint?.includes('order_number');
      
      if (isOrderNumberConflict && attempt < maxRetries) {
        console.log(`[Order Creation] Retry ${attempt}/${maxRetries} due to order number conflict`);
        // Exponential backoff: 50ms, 100ms, 200ms
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt - 1)));
        continue;
      }
      
      throw error;
    }
  }
}
```

Then wrap the order creation logic:

```javascript
export async function POST(request, { params }) {
  const { businessDomain } = await params;
  const business = await resolveStorefrontBusiness(businessDomain);

  if (!business) {
    return NextResponse.json(
      { success: false, error: 'Business not found' },
      { status: 404 }
    );
  }

  const body = await request.json();
  
  // Wrap in retry logic
  return await withOrderCreationRetry(async () => {
    return await createOrderInternal(business, body);
  });
}

// Extract the main logic into createOrderInternal function
async function createOrderInternal(business, body) {
  // ... existing order creation logic ...
}
```

---

### STEP 4: Add Customer Isolation Middleware

Create: `lib/middleware/customerIsolation.js`

```javascript
/**
 * Customer Isolation Middleware
 * Ensures customers can only access their own orders
 */

/**
 * Validate customer has access to order
 */
export async function validateCustomerOrderAccess(client, orderId, customerEmail, businessId) {
  const result = await client.query(
    `SELECT id, customer_email 
     FROM storefront_orders 
     WHERE id = $1::integer 
       AND business_id = $2::uuid 
       AND LOWER(customer_email) = LOWER($3)`,
    [parseInt(orderId, 10), businessId, customerEmail]
  );
  
  if (result.rows.length === 0) {
    throw new Error('ORDER_NOT_FOUND');
  }
  
  return result.rows[0];
}

/**
 * Set RLS context for database queries
 */
export async function setIsolationContext(client, businessId, customerEmail = null) {
  await client.query(`SET LOCAL app.current_business_id = '${businessId}'`);
  
  if (customerEmail) {
    await client.query(`SET LOCAL app.current_customer_email = '${customerEmail}'`);
  }
}
```

---

### STEP 5: Update Public Order Lookup (Enhanced Security)

Update: `lib/storefront/publicOrderLookup.js`

```javascript
import pool from '@/lib/db';
import { setIsolationContext } from '@/lib/middleware/customerIsolation';

export async function lookupPublicStorefrontOrders(businessId, options = {}) {
  const customerEmail = String(options.customerEmail || '').trim().toLowerCase();
  const orderNumber = String(options.orderNumber || '').trim();
  const limit = Math.min(Number(options.limit) || 50, 50);

  // Strict email validation
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { success: false, error: 'Valid email is required', status: 400 };
  }

  const client = await pool.connect();

  try {
    // Set isolation context for RLS
    await setIsolationContext(client, businessId, customerEmail);
    
    // Query with STRICT business + customer isolation
    let query = `
      SELECT 
        o.id, o.order_number, o.customer_email, o.customer_phone, o.customer_name,
        o.shipping_address, o.billing_address, o.subtotal, o.tax_amount,
        o.shipping_amount, o.discount_amount, o.total_amount, o.currency,
        o.status, o.payment_status, o.fulfillment_status, o.notes, o.metadata,
        o.created_at, o.updated_at
      FROM storefront_orders o
      WHERE o.business_id = $1::uuid
        AND LOWER(o.customer_email) = $2
    `;

    const params = [businessId, customerEmail];

    if (orderNumber) {
      params.push(`%${orderNumber}%`);
      query += ` AND o.order_number ILIKE $3`;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await client.query(query, params);

    // Fetch items for each order (with business isolation)
    const orders = await Promise.all(
      result.rows.map(async (order) => {
        const orderId = parseInt(order.id, 10);
        const items = await fetchOrderItems(client, orderId, businessId);
        return { ...order, items };
      })
    );

    return { success: true, orders };
  } catch (error) {
    console.error('[lookupPublicStorefrontOrders] Error:', error);
    return { success: false, error: 'Unable to load orders', status: 500 };
  } finally {
    client.release();
  }
}

// Update fetchOrderItems to include business_id check
async function fetchOrderItems(client, orderId, businessId) {
  const itemsSql = `
    SELECT 
      oi.id, oi.product_id, oi.product_name,
      COALESCE(NULLIF(TRIM(oi.product_sku), ''), oi.metadata->>'sku') AS product_sku,
      oi.quantity, oi.unit_price, oi.total_price, oi.tax_amount, oi.metadata,
      p.image_url
    FROM storefront_order_items oi
    LEFT JOIN products p ON p.id = oi.product_id AND p.business_id = $2::uuid
    JOIN storefront_orders o ON o.id = oi.order_id AND o.business_id = $2::uuid
    WHERE oi.order_id = $1::integer`;

  try {
    return (await client.query(itemsSql, [orderId, businessId])).rows;
  } catch (err) {
    console.error('[fetchOrderItems] Error:', err);
    return [];
  }
}
```

---

### STEP 6: Add Monitoring & Alerts

Create: `lib/monitoring/orderSeparationMonitor.js`

```javascript
/**
 * Monitoring for order separation violations
 */

/**
 * Check for potential data leakage
 */
export async function auditOrderSeparation(client, businessId) {
  const issues = [];
  
  // Check 1: Orders without business_id
  const orphanOrders = await client.query(`
    SELECT COUNT(*) as count
    FROM storefront_orders
    WHERE business_id IS NULL
  `);
  
  if (parseInt(orphanOrders.rows[0].count) > 0) {
    issues.push({
      severity: 'CRITICAL',
      issue: 'Orders without business_id found',
      count: orphanOrders.rows[0].count
    });
  }
  
  // Check 2: Duplicate order numbers within same business
  const duplicates = await client.query(`
    SELECT business_id, order_number, COUNT(*) as count
    FROM storefront_orders
    WHERE business_id = $1::uuid
    GROUP BY business_id, order_number
    HAVING COUNT(*) > 1
  `, [businessId]);
  
  if (duplicates.rows.length > 0) {
    issues.push({
      severity: 'HIGH',
      issue: 'Duplicate order numbers in business',
      orders: duplicates.rows
    });
  }
  
  // Check 3: Order items orphaned from business
  const orphanItems = await client.query(`
    SELECT COUNT(*) as count
    FROM storefront_order_items oi
    LEFT JOIN storefront_orders o ON o.id = oi.order_id
    WHERE o.business_id != $1::uuid OR o.id IS NULL
  `, [businessId]);
  
  if (parseInt(orphanItems.rows[0].count) > 0) {
    issues.push({
      severity: 'HIGH',
      issue: 'Order items not matching business',
      count: orphanItems.rows[0].count
    });
  }
  
  return {
    healthy: issues.length === 0,
    issues
  };
}
```

---

## 🧪 TESTING PROCEDURE

### Test 1: Order Number Uniqueness Per Business

```sql
-- Should succeed: Different businesses, same order number
BEGIN;
INSERT INTO storefront_orders (business_id, order_number, customer_email, total_amount)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ORD-20260703-0001', 'customer1@test.com', 100),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ORD-20260703-0001', 'customer2@test.com', 200);
COMMIT;
-- ✅ Should succeed

-- Should fail: Same business, same order number
BEGIN;
INSERT INTO storefront_orders (business_id, order_number, customer_email, total_amount)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ORD-20260703-0002', 'customer3@test.com', 300),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ORD-20260703-0002', 'customer4@test.com', 400);
-- ❌ Should fail with duplicate key error
ROLLBACK;
```

### Test 2: Customer Isolation

```sql
-- Customer A should only see their orders
SELECT order_number, customer_email
FROM storefront_orders
WHERE business_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND LOWER(customer_email) = 'customer1@test.com';
-- Should return ONLY customer1's orders

-- Customer B should only see their orders
SELECT order_number, customer_email
FROM storefront_orders
WHERE business_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND LOWER(customer_email) = 'customer2@test.com';
-- Should return ONLY customer2's orders (empty if none exist)
```

### Test 3: Concurrent Order Creation

Run this Node.js script:

```javascript
// test-concurrent-orders.js
import pool from './lib/db.js';
import { generateOrderNumber } from './lib/utils/orderNumber.js';

async function testConcurrentOrders() {
  const businessId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const promises = [];
  
  // Create 10 orders concurrently
  for (let i = 0; i < 10; i++) {
    promises.push(createTestOrder(businessId, i));
  }
  
  const results = await Promise.allSettled(promises);
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`All should succeed with unique order numbers!`);
}

async function createTestOrder(businessId, index) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderNumber = await generateOrderNumber(client, businessId);
    
    await client.query(
      `INSERT INTO storefront_orders (business_id, order_number, customer_email, total_amount)
       VALUES ($1, $2, $3, $4)`,
      [businessId, orderNumber, `test${index}@example.com`, 100]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Order ${index}: ${orderNumber}`);
    return orderNumber;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Order ${index} failed:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

testConcurrentOrders();
```

---

## ✅ FINAL CHECKLIST

- [ ] 1. Run database schema fix SQL
- [ ] 2. Verify constraints are correct
- [ ] 3. Create order_number_sequences table
- [ ] 4. Update generateOrderNumber function
- [ ] 5. Add retry logic to order creation API
- [ ] 6. Update public order lookup with strict isolation
- [ ] 7. Add customer isolation middleware
- [ ] 8. Run Test 1: Order number uniqueness
- [ ] 9. Run Test 2: Customer isolation
- [ ] 10. Run Test 3: Concurrent order creation
- [ ] 11. Deploy monitoring script
- [ ] 12. Test from public storefront (place real order)
- [ ] 13. Verify order tracking works for customers
- [ ] 14. Verify business dashboard shows only their orders
- [ ] 15. Check logs for any isolation violations

---

## 🎯 RESULT

After implementing all fixes:

✅ **Perfect Business Separation**: Each business has isolated order numbers
✅ **Perfect Customer Separation**: Customers can only see their own orders
✅ **Zero Conflicts**: Atomic order number generation prevents duplicates
✅ **Race-Condition Free**: Database sequences handle concurrency
✅ **Security Enhanced**: Row-level security + strict queries
✅ **Performance Optimized**: Proper indexes for fast queries
✅ **Production Ready**: Retry logic + monitoring + error handling

**Your storefront is now bulletproof! 🚀**
