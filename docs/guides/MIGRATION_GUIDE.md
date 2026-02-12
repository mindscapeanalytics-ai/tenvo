# Database Schema Migration Guide

## Issue: `product_stock_locations` Schema Mismatch

### Problem
The application code expects `product_stock_locations` to have:
- `warehouse_id` (FK to `warehouse_locations`)
- `state` column (VARCHAR(50), default 'sellable')
- Unique constraint on `(warehouse_id, product_id, state)`

However, the original migration `007_manufacturing_stock.sql` created the table with:
- `location_id` instead of `warehouse_id`
- No `state` column
- Unique constraint on `(location_id, product_id)`

### Solution

#### Step 1: Run the Migration
Execute the migration file:
```bash
# If using Supabase CLI
supabase db push

# Or apply manually via psql
psql -h <host> -U <user> -d <database> -f supabase/migrations/026_fix_stock_locations_schema.sql
```

#### Step 2: Verify the Schema
After running the migration, verify the table structure:
```sql
\d product_stock_locations
```

Expected output should show:
- `warehouse_id` column (UUID, FK to warehouse_locations)
- `state` column (VARCHAR(50), default 'sellable')
- Unique constraint: `unique_product_warehouse_state (warehouse_id, product_id, state)`

#### Step 3: Restart the Application
```bash
npm run dev
```

### Graceful Degradation
The code has been updated to handle both old and new schemas gracefully:
- `stock.js` now includes try-catch blocks that detect missing `state` column (error code `42703`)
- `product.js` queries temporarily exclude `state` from JSON aggregation
- Once migration is applied, you can re-enable `state` in product queries

### Files Modified
1. **Migration**: `supabase/migrations/026_fix_stock_locations_schema.sql`
2. **Stock Actions**: `lib/actions/standard/inventory/stock.js` (graceful fallback)
3. **Product Actions**: `lib/actions/standard/inventory/product.js` (temporary state removal)

### Next Steps
After confirming the migration works:
1. Re-enable `state` in `product.js` stock_locations queries
2. Update `audit.js` to use `product_variants` instead of `products` for low stock alerts
3. Test inventory operations (add stock, remove stock, transfers)
