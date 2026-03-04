-- Child Tables Tenant Isolation Hardening (Phase 2: Strict Enforcement)
-- Date: 2026-03-03
-- Preconditions:
--   1) 20260303_child_tables_business_id_hardening.sql already applied
--   2) Application writes business_id for all covered child tables
-- Outcome:
--   - business_id becomes NOT NULL for all 12 child/junction tables
--   - migration aborts if any null rows remain

BEGIN;

DO $$
DECLARE
  violation_count bigint;
BEGIN
  SELECT (
    COALESCE((SELECT COUNT(*) FROM purchase_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM challan_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM pos_transaction_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM pos_payments WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM pos_refund_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM restaurant_order_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM price_list_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM credit_note_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM campaign_messages WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM segment_customers WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM payroll_items WHERE business_id IS NULL), 0) +
    COALESCE((SELECT COUNT(*) FROM promotion_products WHERE business_id IS NULL), 0)
  ) INTO violation_count;

  IF violation_count > 0 THEN
    RAISE EXCEPTION USING
      MESSAGE = 'Phase-2 tenant hardening blocked: NULL business_id rows detected in child tables',
      DETAIL = format('Total rows with NULL business_id: %s', violation_count),
      HINT = 'Run phase-1 backfill verification query and fix write paths before retrying.';
  END IF;
END $$;

ALTER TABLE purchase_items         ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE challan_items          ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE pos_transaction_items  ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE pos_payments           ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE pos_refund_items       ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE restaurant_order_items ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE price_list_items       ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE credit_note_items      ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE campaign_messages      ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE segment_customers      ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE payroll_items          ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE promotion_products     ALTER COLUMN business_id SET NOT NULL;

COMMIT;

-- Post-check (optional)
-- SELECT 'purchase_items' table_name, COUNT(*) null_count FROM purchase_items WHERE business_id IS NULL
-- UNION ALL SELECT 'challan_items', COUNT(*) FROM challan_items WHERE business_id IS NULL
-- UNION ALL SELECT 'pos_transaction_items', COUNT(*) FROM pos_transaction_items WHERE business_id IS NULL
-- UNION ALL SELECT 'pos_payments', COUNT(*) FROM pos_payments WHERE business_id IS NULL
-- UNION ALL SELECT 'pos_refund_items', COUNT(*) FROM pos_refund_items WHERE business_id IS NULL
-- UNION ALL SELECT 'restaurant_order_items', COUNT(*) FROM restaurant_order_items WHERE business_id IS NULL
-- UNION ALL SELECT 'price_list_items', COUNT(*) FROM price_list_items WHERE business_id IS NULL
-- UNION ALL SELECT 'credit_note_items', COUNT(*) FROM credit_note_items WHERE business_id IS NULL
-- UNION ALL SELECT 'campaign_messages', COUNT(*) FROM campaign_messages WHERE business_id IS NULL
-- UNION ALL SELECT 'segment_customers', COUNT(*) FROM segment_customers WHERE business_id IS NULL
-- UNION ALL SELECT 'payroll_items', COUNT(*) FROM payroll_items WHERE business_id IS NULL
-- UNION ALL SELECT 'promotion_products', COUNT(*) FROM promotion_products WHERE business_id IS NULL;