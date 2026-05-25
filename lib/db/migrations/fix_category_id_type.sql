-- Migration: Fix products.category_id type (UUID → INTEGER)
-- product_categories.id is INTEGER (serial), so products.category_id must match.
-- Safe: drops old UUID column, adds INTEGER column.

DO $$
BEGIN
    -- Only run if category_id is currently UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products'
          AND column_name = 'category_id'
          AND data_type = 'uuid'
    ) THEN
        -- Drop old UUID column (no FK constraint was enforced since type was wrong)
        ALTER TABLE products DROP COLUMN category_id;
        -- Add correct INTEGER column matching product_categories.id
        ALTER TABLE products ADD COLUMN category_id INTEGER;
        CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
        RAISE NOTICE 'Converted products.category_id from UUID to INTEGER';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products'
          AND column_name = 'category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id INTEGER;
        CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
        RAISE NOTICE 'Added products.category_id as INTEGER';
    ELSE
        RAISE NOTICE 'products.category_id already correct type, skipping';
    END IF;
END $$;

-- Ensure business_id+slug unique constraint is on product_categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'product_categories'
          AND constraint_name = 'uq_product_categories_biz_slug'
    ) THEN
        ALTER TABLE product_categories
            ADD CONSTRAINT uq_product_categories_biz_slug UNIQUE (business_id, slug);
    END IF;
END $$;

SELECT 'fix_category_id_type migration complete' as status;
