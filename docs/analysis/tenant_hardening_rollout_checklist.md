# Tenant Hardening Rollout Checklist (Child Tables `business_id`)

## Scope
- Phase 1 migration: `prisma/migrations/20260303_child_tables_business_id_hardening.sql`
- Phase 2 migration: `prisma/migrations/20260303_child_tables_business_id_enforce_not_null.sql`
- Covered tables (12):
  - `purchase_items`, `challan_items`, `pos_transaction_items`, `pos_payments`, `pos_refund_items`, `restaurant_order_items`
  - `price_list_items`, `credit_note_items`, `campaign_messages`, `segment_customers`, `payroll_items`, `promotion_products`

## 1) Precheck (before Phase 2)
Run this query and confirm all counts are `0`:

```sql
SELECT 'purchase_items' table_name, COUNT(*) null_count FROM purchase_items WHERE business_id IS NULL
UNION ALL SELECT 'challan_items', COUNT(*) FROM challan_items WHERE business_id IS NULL
UNION ALL SELECT 'pos_transaction_items', COUNT(*) FROM pos_transaction_items WHERE business_id IS NULL
UNION ALL SELECT 'pos_payments', COUNT(*) FROM pos_payments WHERE business_id IS NULL
UNION ALL SELECT 'pos_refund_items', COUNT(*) FROM pos_refund_items WHERE business_id IS NULL
UNION ALL SELECT 'restaurant_order_items', COUNT(*) FROM restaurant_order_items WHERE business_id IS NULL
UNION ALL SELECT 'price_list_items', COUNT(*) FROM price_list_items WHERE business_id IS NULL
UNION ALL SELECT 'credit_note_items', COUNT(*) FROM credit_note_items WHERE business_id IS NULL
UNION ALL SELECT 'campaign_messages', COUNT(*) FROM campaign_messages WHERE business_id IS NULL
UNION ALL SELECT 'segment_customers', COUNT(*) FROM segment_customers WHERE business_id IS NULL
UNION ALL SELECT 'payroll_items', COUNT(*) FROM payroll_items WHERE business_id IS NULL
UNION ALL SELECT 'promotion_products', COUNT(*) FROM promotion_products WHERE business_id IS NULL;
```

If any table returns non-zero:
- Re-run parent-based backfill from phase 1 for the affected table(s).
- Verify app write paths include `business_id` for child inserts.
- Retry precheck.

## 2) Apply sequence
1. Apply phase 1 migration in target environment (if not already applied).
2. Run precheck query above.
3. Apply phase 2 migration.

## 3) Postcheck
- Re-run the same null-count query (must remain `0`).
- Validate constraints:

```sql
SELECT c.relname AS table_name, a.attname AS column_name, a.attnotnull
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND a.attname = 'business_id'
  AND c.relname IN (
    'purchase_items','challan_items','pos_transaction_items','pos_payments','pos_refund_items','restaurant_order_items',
    'price_list_items','credit_note_items','campaign_messages','segment_customers','payroll_items','promotion_products'
  )
ORDER BY c.relname;
```

Expected: `attnotnull = true` for all 12 rows.

## 4) Rollback strategy
If phase 2 must be reverted quickly:

```sql
ALTER TABLE purchase_items         ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE challan_items          ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE pos_transaction_items  ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE pos_payments           ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE pos_refund_items       ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE restaurant_order_items ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE price_list_items       ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE credit_note_items      ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE campaign_messages      ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE segment_customers      ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE payroll_items          ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE promotion_products     ALTER COLUMN business_id DROP NOT NULL;
```

Note: rollback here only relaxes strictness. Keep phase-1 backfill/FKs/indexes intact.