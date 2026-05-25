-- ============================================================
-- Migration: Add storefront-specific columns to products table
-- Safe: uses IF NOT EXISTS checks so it can be run multiple times
-- ============================================================

-- slug: URL-friendly identifier generated from name
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='slug') THEN
    ALTER TABLE products ADD COLUMN slug TEXT;
    -- Auto-generate slugs from existing product names (lowercase, spaces → hyphens)
    UPDATE products SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTR(id::text, 1, 8)
    WHERE slug IS NULL OR slug = '';
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(business_id, slug);
    RAISE NOTICE 'Added slug column to products';
  END IF;
END $$;

-- compare_price: original/crossed-out price for showing discounts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='compare_price') THEN
    ALTER TABLE products ADD COLUMN compare_price DECIMAL(12,2);
    RAISE NOTICE 'Added compare_price column to products';
  END IF;
END $$;

-- is_featured: flag for homepage featured products section
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_featured') THEN
    ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(business_id, is_featured);
    RAISE NOTICE 'Added is_featured column to products';
  END IF;
END $$;

-- is_new: flag for "New Arrival" badge on product card
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_new') THEN
    ALTER TABLE products ADD COLUMN is_new BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_new column to products';
  END IF;
END $$;

-- sales_count: total units sold, used for popularity sorting
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sales_count') THEN
    ALTER TABLE products ADD COLUMN sales_count INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(business_id, sales_count DESC);
    RAISE NOTICE 'Added sales_count column to products';
  END IF;
END $$;

-- stock_status: 'in_stock' | 'out_of_stock' | 'low_stock' | 'on_backorder'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_status') THEN
    ALTER TABLE products ADD COLUMN stock_status VARCHAR(50) DEFAULT 'in_stock';
    RAISE NOTICE 'Added stock_status column to products';
  END IF;
END $$;

-- images: additional product images as JSON array
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
    ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]';
    RAISE NOTICE 'Added images column to products';
  END IF;
END $$;

-- has_variants: computed shortcut, true if product has variant rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='has_variants') THEN
    ALTER TABLE products ADD COLUMN has_variants BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added has_variants column to products';
  END IF;
END $$;

-- rating: average customer rating (0-5)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='rating') THEN
    ALTER TABLE products ADD COLUMN rating DECIMAL(3,2);
    RAISE NOTICE 'Added rating column to products';
  END IF;
END $$;

-- review_count: total number of approved reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='review_count') THEN
    ALTER TABLE products ADD COLUMN review_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added review_count column to products';
  END IF;
END $$;

-- enable_reviews: whether reviews are enabled for this product
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='enable_reviews') THEN
    ALTER TABLE products ADD COLUMN enable_reviews BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added enable_reviews column to products';
  END IF;
END $$;

-- product_reviews table (optional, graceful skip if exists)
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  business_id UUID,
  reviewer_name VARCHAR(255) NOT NULL,
  reviewer_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  body TEXT,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(product_id, is_approved);

-- Ensure product_variants has the storefront columns needed
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_variants' AND column_name='is_active') THEN
    ALTER TABLE product_variants ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to product_variants';
  END IF;
END $$;

-- product_specifications table
CREATE TABLE IF NOT EXISTS product_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  attribute_name VARCHAR(255) NOT NULL,
  attribute_value TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON product_specifications(product_id);

SELECT 'Storefront product columns migration complete' as status;
