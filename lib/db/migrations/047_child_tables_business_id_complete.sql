-- Child tables business_id completion (2026-07-18)
-- Idempotent + table-existence safe (skips tables not yet created on this DB).
--
-- A) Add business_id where the table exists
-- B) Backfill from parents
-- C) FK + indexes
-- D) Soft NOT NULL
-- E) Insert triggers for defense-in-depth

CREATE OR REPLACE FUNCTION tenvo_table_exists(p_table text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = p_table
  );
$$;

-- ---------------------------------------------------------------------------
-- A) New / ensure columns
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('product_specifications'),
      ('cycle_count_items'),
      ('inventory_adjustments'),
      ('bank_statement_lines'),
      ('purchase_items'),
      ('challan_items'),
      ('pos_transaction_items'),
      ('pos_payments'),
      ('pos_refund_items'),
      ('restaurant_order_items'),
      ('price_list_items'),
      ('credit_note_items'),
      ('campaign_messages'),
      ('segment_customers'),
      ('payroll_items'),
      ('promotion_products'),
      ('quotation_items'),
      ('sales_order_items'),
      ('storefront_order_items'),
      ('product_reviews'),
      ('tax_configurations')
    ) AS t(tbl)
  LOOP
    IF tenvo_table_exists(rec.tbl) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS business_id UUID', rec.tbl);
    ELSE
      RAISE NOTICE 'skip ADD COLUMN: table % does not exist', rec.tbl;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- B) Backfill from parents (only when both tables exist)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF tenvo_table_exists('product_specifications') AND tenvo_table_exists('products') THEN
    UPDATE product_specifications ps
    SET business_id = p.business_id
    FROM products p
    WHERE ps.product_id = p.id
      AND ps.business_id IS NULL
      AND p.business_id IS NOT NULL;
  END IF;

  IF tenvo_table_exists('cycle_count_items') AND tenvo_table_exists('cycle_counts') THEN
    UPDATE cycle_count_items cci
    SET business_id = cc.business_id
    FROM cycle_counts cc
    WHERE cci.cycle_count_id = cc.id
      AND cci.business_id IS NULL
      AND cc.business_id IS NOT NULL;
  END IF;

  IF tenvo_table_exists('inventory_adjustments') AND tenvo_table_exists('cycle_counts') THEN
    UPDATE inventory_adjustments ia
    SET business_id = cc.business_id
    FROM cycle_counts cc
    WHERE ia.cycle_count_id = cc.id
      AND ia.business_id IS NULL
      AND cc.business_id IS NOT NULL;
  END IF;

  IF tenvo_table_exists('inventory_adjustments') AND tenvo_table_exists('products') THEN
    UPDATE inventory_adjustments ia
    SET business_id = p.business_id
    FROM products p
    WHERE ia.product_id = p.id
      AND ia.business_id IS NULL
      AND p.business_id IS NOT NULL;
  END IF;

  IF tenvo_table_exists('bank_statement_lines') AND tenvo_table_exists('bank_reconciliation_sessions') THEN
    UPDATE bank_statement_lines bsl
    SET business_id = brs.business_id
    FROM bank_reconciliation_sessions brs
    WHERE bsl.session_id = brs.id
      AND bsl.business_id IS NULL
      AND brs.business_id IS NOT NULL;
  END IF;

  IF tenvo_table_exists('purchase_items') AND tenvo_table_exists('purchases') THEN
    UPDATE purchase_items pi
    SET business_id = p.business_id
    FROM purchases p
    WHERE pi.purchase_id = p.id AND pi.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('challan_items') AND tenvo_table_exists('delivery_challans') THEN
    UPDATE challan_items ci
    SET business_id = dc.business_id
    FROM delivery_challans dc
    WHERE ci.challan_id = dc.id AND ci.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('pos_transaction_items') AND tenvo_table_exists('pos_transactions') THEN
    UPDATE pos_transaction_items pti
    SET business_id = pt.business_id
    FROM pos_transactions pt
    WHERE pti.transaction_id = pt.id AND pti.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('pos_payments') AND tenvo_table_exists('pos_transactions') THEN
    UPDATE pos_payments pp
    SET business_id = pt.business_id
    FROM pos_transactions pt
    WHERE pp.transaction_id = pt.id AND pp.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('pos_refund_items') AND tenvo_table_exists('pos_refunds') THEN
    UPDATE pos_refund_items pri
    SET business_id = pr.business_id
    FROM pos_refunds pr
    WHERE pri.refund_id = pr.id AND pri.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('restaurant_order_items') AND tenvo_table_exists('restaurant_orders') THEN
    UPDATE restaurant_order_items roi
    SET business_id = ro.business_id
    FROM restaurant_orders ro
    WHERE roi.order_id = ro.id AND roi.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('price_list_items') AND tenvo_table_exists('price_lists') THEN
    UPDATE price_list_items pli
    SET business_id = pl.business_id
    FROM price_lists pl
    WHERE pli.price_list_id = pl.id AND pli.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('credit_note_items') AND tenvo_table_exists('credit_notes') THEN
    UPDATE credit_note_items cni
    SET business_id = cn.business_id
    FROM credit_notes cn
    WHERE cni.credit_note_id = cn.id AND cni.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('campaign_messages') AND tenvo_table_exists('campaigns') THEN
    UPDATE campaign_messages cm
    SET business_id = c.business_id
    FROM campaigns c
    WHERE cm.campaign_id = c.id AND cm.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('segment_customers') AND tenvo_table_exists('customer_segments') THEN
    UPDATE segment_customers sc
    SET business_id = cs.business_id
    FROM customer_segments cs
    WHERE sc.segment_id = cs.id AND sc.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('payroll_items') AND tenvo_table_exists('payroll_runs') THEN
    UPDATE payroll_items pi
    SET business_id = pr.business_id
    FROM payroll_runs pr
    WHERE pi.run_id = pr.id AND pi.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('promotion_products') AND tenvo_table_exists('promotions') THEN
    UPDATE promotion_products pp
    SET business_id = p.business_id
    FROM promotions p
    WHERE pp.promotion_id = p.id AND pp.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('quotation_items') AND tenvo_table_exists('quotations') THEN
    UPDATE quotation_items qi
    SET business_id = q.business_id
    FROM quotations q
    WHERE qi.quotation_id = q.id AND qi.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('sales_order_items') AND tenvo_table_exists('sales_orders') THEN
    UPDATE sales_order_items soi
    SET business_id = so.business_id
    FROM sales_orders so
    WHERE soi.sales_order_id = so.id AND soi.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('storefront_order_items') AND tenvo_table_exists('storefront_orders') THEN
    UPDATE storefront_order_items soi
    SET business_id = so.business_id
    FROM storefront_orders so
    WHERE soi.order_id = so.id AND soi.business_id IS NULL;
  END IF;

  IF tenvo_table_exists('product_reviews') AND tenvo_table_exists('products') THEN
    UPDATE product_reviews pr
    SET business_id = p.business_id
    FROM products p
    WHERE pr.product_id = p.id AND pr.business_id IS NULL;
  END IF;
END $$;

-- Drop unbackfillable orphans (only when table exists)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'product_specifications',
    'cycle_count_items',
    'inventory_adjustments',
    'bank_statement_lines',
    'purchase_items',
    'challan_items',
    'pos_transaction_items',
    'pos_payments',
    'pos_refund_items',
    'restaurant_order_items',
    'price_list_items',
    'credit_note_items',
    'campaign_messages',
    'segment_customers',
    'payroll_items',
    'promotion_products',
    'quotation_items',
    'sales_order_items',
    'storefront_order_items',
    'product_reviews',
    'tax_configurations'
  ]
  LOOP
    IF tenvo_table_exists(tbl) THEN
      EXECUTE format('DELETE FROM %I WHERE business_id IS NULL', tbl);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- C) Foreign keys + indexes
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('product_specifications', 'product_specifications_business_id_fkey'),
      ('cycle_count_items', 'cycle_count_items_business_id_fkey'),
      ('inventory_adjustments', 'inventory_adjustments_business_id_fkey'),
      ('bank_statement_lines', 'bank_statement_lines_business_id_fkey'),
      ('purchase_items', 'purchase_items_business_id_fkey'),
      ('challan_items', 'challan_items_business_id_fkey'),
      ('pos_transaction_items', 'pos_transaction_items_business_id_fkey'),
      ('pos_payments', 'pos_payments_business_id_fkey'),
      ('pos_refund_items', 'pos_refund_items_business_id_fkey'),
      ('restaurant_order_items', 'restaurant_order_items_business_id_fkey'),
      ('price_list_items', 'price_list_items_business_id_fkey'),
      ('credit_note_items', 'credit_note_items_business_id_fkey'),
      ('campaign_messages', 'campaign_messages_business_id_fkey'),
      ('segment_customers', 'segment_customers_business_id_fkey'),
      ('payroll_items', 'payroll_items_business_id_fkey'),
      ('promotion_products', 'promotion_products_business_id_fkey'),
      ('quotation_items', 'quotation_items_business_id_fkey'),
      ('sales_order_items', 'sales_order_items_business_id_fkey'),
      ('storefront_order_items', 'storefront_order_items_business_id_fkey'),
      ('product_reviews', 'product_reviews_business_id_fkey'),
      ('tax_configurations', 'tax_configurations_business_id_fkey')
    ) AS t(tbl, conname)
  LOOP
    IF NOT tenvo_table_exists(rec.tbl) THEN
      CONTINUE;
    END IF;
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = rec.conname) THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE NO ACTION',
          rec.tbl, rec.conname
        );
      END IF;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE '% FK skipped: %', rec.conname, SQLERRM;
    END;
  END LOOP;
END $$;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('product_specifications', 'idx_product_specs_business_id'),
      ('cycle_count_items', 'idx_cycle_count_items_business_id'),
      ('inventory_adjustments', 'idx_inventory_adjustments_business_id'),
      ('bank_statement_lines', 'idx_bank_stmt_lines_business_id'),
      ('purchase_items', 'idx_purchase_items_business_id'),
      ('challan_items', 'idx_challan_items_business_id'),
      ('pos_transaction_items', 'idx_pos_tx_items_business_id'),
      ('pos_payments', 'idx_pos_payments_business_id'),
      ('pos_refund_items', 'idx_pos_refund_items_business_id'),
      ('restaurant_order_items', 'idx_restaurant_order_items_business_id'),
      ('price_list_items', 'idx_price_list_items_business_id'),
      ('credit_note_items', 'idx_credit_note_items_business_id'),
      ('campaign_messages', 'idx_campaign_messages_business_id'),
      ('segment_customers', 'idx_segment_customers_business_id'),
      ('payroll_items', 'idx_payroll_items_business_id'),
      ('promotion_products', 'idx_promotion_products_business_id'),
      ('quotation_items', 'idx_quotation_items_business_id'),
      ('sales_order_items', 'idx_sales_order_items_business_id'),
      ('storefront_order_items', 'storefront_order_items_business_id_idx'),
      ('product_reviews', 'idx_product_reviews_business_id'),
      ('tax_configurations', 'idx_tax_configurations_business_id')
    ) AS t(tbl, idx)
  LOOP
    IF tenvo_table_exists(rec.tbl) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (business_id)', rec.idx, rec.tbl);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- D) Soft NOT NULL
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'product_specifications',
    'cycle_count_items',
    'inventory_adjustments',
    'bank_statement_lines',
    'purchase_items',
    'challan_items',
    'pos_transaction_items',
    'pos_payments',
    'pos_refund_items',
    'restaurant_order_items',
    'price_list_items',
    'credit_note_items',
    'campaign_messages',
    'segment_customers',
    'payroll_items',
    'promotion_products',
    'quotation_items',
    'sales_order_items',
    'storefront_order_items',
    'product_reviews',
    'tax_configurations'
  ]
  LOOP
    IF NOT tenvo_table_exists(tbl) THEN
      CONTINUE;
    END IF;
    BEGIN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN business_id SET NOT NULL', tbl);
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE '%.business_id NOT NULL skipped: %', tbl, SQLERRM;
    END;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- E) Insert triggers
-- ---------------------------------------------------------------------------
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
  ELSIF TG_TABLE_NAME = 'quotation_items' THEN
    SELECT business_id INTO NEW.business_id FROM quotations WHERE id = NEW.quotation_id;
  ELSIF TG_TABLE_NAME = 'sales_order_items' THEN
    SELECT business_id INTO NEW.business_id FROM sales_orders WHERE id = NEW.sales_order_id;
  ELSIF TG_TABLE_NAME = 'storefront_order_items' THEN
    SELECT business_id INTO NEW.business_id FROM storefront_orders WHERE id = NEW.order_id;
  ELSIF TG_TABLE_NAME = 'product_reviews' THEN
    SELECT business_id INTO NEW.business_id FROM products WHERE id = NEW.product_id;
  ELSIF TG_TABLE_NAME = 'product_specifications' THEN
    SELECT business_id INTO NEW.business_id FROM products WHERE id = NEW.product_id;
  ELSIF TG_TABLE_NAME = 'cycle_count_items' THEN
    SELECT business_id INTO NEW.business_id FROM cycle_counts WHERE id = NEW.cycle_count_id;
  ELSIF TG_TABLE_NAME = 'inventory_adjustments' THEN
    IF NEW.cycle_count_id IS NOT NULL THEN
      SELECT business_id INTO NEW.business_id FROM cycle_counts WHERE id = NEW.cycle_count_id;
    END IF;
    IF NEW.business_id IS NULL THEN
      SELECT business_id INTO NEW.business_id FROM products WHERE id = NEW.product_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'bank_statement_lines' THEN
    SELECT business_id INTO NEW.business_id FROM bank_reconciliation_sessions WHERE id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('purchase_items', 'trg_set_business_id_purchase_items'),
      ('challan_items', 'trg_set_business_id_challan_items'),
      ('pos_transaction_items', 'trg_set_business_id_pos_transaction_items'),
      ('pos_payments', 'trg_set_business_id_pos_payments'),
      ('pos_refund_items', 'trg_set_business_id_pos_refund_items'),
      ('restaurant_order_items', 'trg_set_business_id_restaurant_order_items'),
      ('price_list_items', 'trg_set_business_id_price_list_items'),
      ('credit_note_items', 'trg_set_business_id_credit_note_items'),
      ('campaign_messages', 'trg_set_business_id_campaign_messages'),
      ('segment_customers', 'trg_set_business_id_segment_customers'),
      ('payroll_items', 'trg_set_business_id_payroll_items'),
      ('promotion_products', 'trg_set_business_id_promotion_products'),
      ('quotation_items', 'trg_set_business_id_quotation_items'),
      ('sales_order_items', 'trg_set_business_id_sales_order_items'),
      ('storefront_order_items', 'trg_set_business_id_storefront_order_items'),
      ('product_reviews', 'trg_set_business_id_product_reviews'),
      ('product_specifications', 'trg_set_business_id_product_specifications'),
      ('cycle_count_items', 'trg_set_business_id_cycle_count_items'),
      ('inventory_adjustments', 'trg_set_business_id_inventory_adjustments'),
      ('bank_statement_lines', 'trg_set_business_id_bank_statement_lines')
    ) AS t(tbl, trg)
  LOOP
    IF tenvo_table_exists(rec.tbl) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', rec.trg, rec.tbl);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_child_business_id()',
        rec.trg, rec.tbl
      );
    END IF;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS tenvo_table_exists(text);
