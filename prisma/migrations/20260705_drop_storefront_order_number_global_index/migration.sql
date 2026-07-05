-- Drop orphan global unique index on storefront_orders.order_number.
-- Migrations 20260613 / 20260704 removed the CONSTRAINT but some databases
-- still have the standalone UNIQUE INDEX storefront_orders_order_number_key,
-- which blocks ORD-YYYYMMDD-0001 from being used by more than one tenant per day.

DROP INDEX IF EXISTS storefront_orders_order_number_key;

-- Idempotent: keep per-tenant composite uniqueness (business_id + order_number).
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
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_order
    ON storefront_orders (business_id, order_number);
