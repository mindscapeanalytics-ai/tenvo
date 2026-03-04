-- Child Tables Tenant Isolation Hardening
-- Date: 2026-03-03
-- Strategy:
--   1) Add nullable business_id to child/junction tables (non-breaking)
--   2) Backfill from parent headers
--   3) Add indexes for tenant-scoped query performance
--   4) Add insert triggers to auto-derive business_id when omitted
--   5) Provide verification queries for rollout checks

BEGIN;

-- 1) Add columns (non-breaking)
ALTER TABLE purchase_items          ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE challan_items           ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE pos_transaction_items   ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE pos_payments            ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE pos_refund_items        ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE restaurant_order_items  ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE price_list_items        ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE credit_note_items       ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE campaign_messages       ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE segment_customers       ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE payroll_items           ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE promotion_products      ADD COLUMN IF NOT EXISTS business_id UUID;

-- 2) Backfill from parent records
UPDATE purchase_items pi
SET business_id = p.business_id
FROM purchases p
WHERE pi.purchase_id = p.id
  AND pi.business_id IS NULL;

UPDATE challan_items ci
SET business_id = dc.business_id
FROM delivery_challans dc
WHERE ci.challan_id = dc.id
  AND ci.business_id IS NULL;

UPDATE pos_transaction_items pti
SET business_id = pt.business_id
FROM pos_transactions pt
WHERE pti.transaction_id = pt.id
  AND pti.business_id IS NULL;

UPDATE pos_payments pp
SET business_id = pt.business_id
FROM pos_transactions pt
WHERE pp.transaction_id = pt.id
  AND pp.business_id IS NULL;

UPDATE pos_refund_items pri
SET business_id = pr.business_id
FROM pos_refunds pr
WHERE pri.refund_id = pr.id
  AND pri.business_id IS NULL;

UPDATE restaurant_order_items roi
SET business_id = ro.business_id
FROM restaurant_orders ro
WHERE roi.order_id = ro.id
  AND roi.business_id IS NULL;

UPDATE price_list_items pli
SET business_id = pl.business_id
FROM price_lists pl
WHERE pli.price_list_id = pl.id
  AND pli.business_id IS NULL;

UPDATE credit_note_items cni
SET business_id = cn.business_id
FROM credit_notes cn
WHERE cni.credit_note_id = cn.id
  AND cni.business_id IS NULL;

UPDATE campaign_messages cm
SET business_id = c.business_id
FROM campaigns c
WHERE cm.campaign_id = c.id
  AND cm.business_id IS NULL;

UPDATE segment_customers sc
SET business_id = cs.business_id
FROM customer_segments cs
WHERE sc.segment_id = cs.id
  AND sc.business_id IS NULL;

UPDATE payroll_items pi
SET business_id = pr.business_id
FROM payroll_runs pr
WHERE pi.run_id = pr.id
  AND pi.business_id IS NULL;

UPDATE promotion_products pp
SET business_id = p.business_id
FROM promotions p
WHERE pp.promotion_id = p.id
  AND pp.business_id IS NULL;

-- 3) Add tenant indexes
CREATE INDEX IF NOT EXISTS idx_purchase_items_business_id         ON purchase_items(business_id);
CREATE INDEX IF NOT EXISTS idx_challan_items_business_id          ON challan_items(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_tx_items_business_id           ON pos_transaction_items(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_payments_business_id           ON pos_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_refund_items_business_id       ON pos_refund_items(business_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_business_id ON restaurant_order_items(business_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_business_id       ON price_list_items(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_note_items_business_id      ON credit_note_items(business_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_business_id      ON campaign_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_segment_customers_business_id      ON segment_customers(business_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_business_id          ON payroll_items(business_id);
CREATE INDEX IF NOT EXISTS idx_promotion_products_business_id     ON promotion_products(business_id);

-- 4) Foreign keys to businesses (idempotent via DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_items_business_id_fkey') THEN
    ALTER TABLE purchase_items
      ADD CONSTRAINT purchase_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'challan_items_business_id_fkey') THEN
    ALTER TABLE challan_items
      ADD CONSTRAINT challan_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_transaction_items_business_id_fkey') THEN
    ALTER TABLE pos_transaction_items
      ADD CONSTRAINT pos_transaction_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_payments_business_id_fkey') THEN
    ALTER TABLE pos_payments
      ADD CONSTRAINT pos_payments_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_refund_items_business_id_fkey') THEN
    ALTER TABLE pos_refund_items
      ADD CONSTRAINT pos_refund_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_order_items_business_id_fkey') THEN
    ALTER TABLE restaurant_order_items
      ADD CONSTRAINT restaurant_order_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_list_items_business_id_fkey') THEN
    ALTER TABLE price_list_items
      ADD CONSTRAINT price_list_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_note_items_business_id_fkey') THEN
    ALTER TABLE credit_note_items
      ADD CONSTRAINT credit_note_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_messages_business_id_fkey') THEN
    ALTER TABLE campaign_messages
      ADD CONSTRAINT campaign_messages_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'segment_customers_business_id_fkey') THEN
    ALTER TABLE segment_customers
      ADD CONSTRAINT segment_customers_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payroll_items_business_id_fkey') THEN
    ALTER TABLE payroll_items
      ADD CONSTRAINT payroll_items_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotion_products_business_id_fkey') THEN
    ALTER TABLE promotion_products
      ADD CONSTRAINT promotion_products_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5) Auto-derive business_id triggers on insert (defense-in-depth)
CREATE OR REPLACE FUNCTION set_child_business_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.business_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'purchase_items' THEN
    SELECT business_id INTO NEW.business_id FROM purchases WHERE id = NEW.purchase_id;
  ELSIF TG_TABLE_NAME = 'challan_items' THEN
    SELECT business_id INTO NEW.business_id FROM delivery_challans WHERE id = NEW.challan_id;
  ELSIF TG_TABLE_NAME = 'pos_transaction_items' THEN
    SELECT business_id INTO NEW.business_id FROM pos_transactions WHERE id = NEW.transaction_id;
  ELSIF TG_TABLE_NAME = 'pos_payments' THEN
    SELECT business_id INTO NEW.business_id FROM pos_transactions WHERE id = NEW.transaction_id;
  ELSIF TG_TABLE_NAME = 'pos_refund_items' THEN
    SELECT business_id INTO NEW.business_id FROM pos_refunds WHERE id = NEW.refund_id;
  ELSIF TG_TABLE_NAME = 'restaurant_order_items' THEN
    SELECT business_id INTO NEW.business_id FROM restaurant_orders WHERE id = NEW.order_id;
  ELSIF TG_TABLE_NAME = 'price_list_items' THEN
    SELECT business_id INTO NEW.business_id FROM price_lists WHERE id = NEW.price_list_id;
  ELSIF TG_TABLE_NAME = 'credit_note_items' THEN
    SELECT business_id INTO NEW.business_id FROM credit_notes WHERE id = NEW.credit_note_id;
  ELSIF TG_TABLE_NAME = 'campaign_messages' THEN
    SELECT business_id INTO NEW.business_id FROM campaigns WHERE id = NEW.campaign_id;
  ELSIF TG_TABLE_NAME = 'segment_customers' THEN
    SELECT business_id INTO NEW.business_id FROM customer_segments WHERE id = NEW.segment_id;
  ELSIF TG_TABLE_NAME = 'payroll_items' THEN
    SELECT business_id INTO NEW.business_id FROM payroll_runs WHERE id = NEW.run_id;
  ELSIF TG_TABLE_NAME = 'promotion_products' THEN
    SELECT business_id INTO NEW.business_id FROM promotions WHERE id = NEW.promotion_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_business_id_purchase_items ON purchase_items;
CREATE TRIGGER trg_set_business_id_purchase_items BEFORE INSERT ON purchase_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_challan_items ON challan_items;
CREATE TRIGGER trg_set_business_id_challan_items BEFORE INSERT ON challan_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_pos_transaction_items ON pos_transaction_items;
CREATE TRIGGER trg_set_business_id_pos_transaction_items BEFORE INSERT ON pos_transaction_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_pos_payments ON pos_payments;
CREATE TRIGGER trg_set_business_id_pos_payments BEFORE INSERT ON pos_payments
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_pos_refund_items ON pos_refund_items;
CREATE TRIGGER trg_set_business_id_pos_refund_items BEFORE INSERT ON pos_refund_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_restaurant_order_items ON restaurant_order_items;
CREATE TRIGGER trg_set_business_id_restaurant_order_items BEFORE INSERT ON restaurant_order_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_price_list_items ON price_list_items;
CREATE TRIGGER trg_set_business_id_price_list_items BEFORE INSERT ON price_list_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_credit_note_items ON credit_note_items;
CREATE TRIGGER trg_set_business_id_credit_note_items BEFORE INSERT ON credit_note_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_campaign_messages ON campaign_messages;
CREATE TRIGGER trg_set_business_id_campaign_messages BEFORE INSERT ON campaign_messages
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_segment_customers ON segment_customers;
CREATE TRIGGER trg_set_business_id_segment_customers BEFORE INSERT ON segment_customers
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_payroll_items ON payroll_items;
CREATE TRIGGER trg_set_business_id_payroll_items BEFORE INSERT ON payroll_items
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

DROP TRIGGER IF EXISTS trg_set_business_id_promotion_products ON promotion_products;
CREATE TRIGGER trg_set_business_id_promotion_products BEFORE INSERT ON promotion_products
FOR EACH ROW EXECUTE FUNCTION set_child_business_id();

COMMIT;

-- Verification (run manually post deploy)
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
