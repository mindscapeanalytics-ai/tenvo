-- =============================================================================
-- Migration: Schema integrity fixes (2026-06-13)
-- Covers:
--   1. storefront_orders: replace global unique on order_number with
--      per-tenant (business_id, order_number) unique + add business_id index
--   2. storefront_order_items: add index on order_id (FK was unindexed)
--   3. payment_transactions: add indexes on business_id, order_id,
--      stripe_payment_intent_id
--   4. purchase_returns.created_by: change from UUID to TEXT so Better Auth
--      string user ids can be stored without a cast error
--   5. platform_feature_flag_overrides.created_by: same TEXT fix
-- =============================================================================

-- 1. storefront_orders
-- Drop the global unique constraint first, then add the per-tenant one.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_order_number_key'
          AND conrelid = 'storefront_orders'::regclass
    ) THEN
        ALTER TABLE storefront_orders DROP CONSTRAINT storefront_orders_order_number_key;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_business_id_order_number_key'
          AND conrelid = 'storefront_orders'::regclass
    ) THEN
        ALTER TABLE storefront_orders
            ADD CONSTRAINT storefront_orders_business_id_order_number_key
            UNIQUE (business_id, order_number);
    END IF;
END;
$$;

-- Index on business_id for tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_id
    ON storefront_orders (business_id);

-- 2. storefront_order_items — index the FK
CREATE INDEX IF NOT EXISTS idx_storefront_order_items_order_id
    ON storefront_order_items (order_id);

-- 3. payment_transactions — add query-critical indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_business_id
    ON payment_transactions (business_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id
    ON payment_transactions (order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_pi
    ON payment_transactions (stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;

-- 4. purchase_returns.created_by: UUID → TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'purchase_returns'
          AND column_name = 'created_by'
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE purchase_returns
            ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
    END IF;
END;
$$;

-- 5. platform_feature_flag_overrides.created_by: UUID → TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'platform_feature_flag_overrides'
          AND column_name = 'created_by'
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE platform_feature_flag_overrides
            ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
    END IF;
END;
$$;
