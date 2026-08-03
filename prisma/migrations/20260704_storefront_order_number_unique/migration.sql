-- Fix storefront order_number uniqueness: per-tenant composite, not global.
-- Global unique (storefront_orders_order_number_key) caused collisions when
-- Business A and Business B both reached ORD-YYYYMMDD-0001 on the same day.

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

CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_id
    ON storefront_orders (business_id);

CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_customer_email
    ON storefront_orders (business_id, lower(customer_email));
