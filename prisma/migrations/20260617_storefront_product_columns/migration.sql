-- Storefront product columns (align DB with lib/actions/storefront/products.js + StorefrontSyncService)
-- Idempotent: safe to re-run on databases that partially applied lib/db/migrations scripts.

-- slug
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE INDEX IF NOT EXISTS "idx_products_business_slug" ON "products" ("business_id", "slug");

-- Pricing / merchandising
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "compare_price" DECIMAL(12, 2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_new" BOOLEAN DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sales_count" INTEGER DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock_status" VARCHAR(50) DEFAULT 'in_stock';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" JSONB DEFAULT '[]';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "has_variants" BOOLEAN DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3, 2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_count" INTEGER DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "enable_reviews" BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS "idx_products_is_featured" ON "products" ("business_id", "is_featured");
CREATE INDEX IF NOT EXISTS "idx_products_sales_count" ON "products" ("business_id", "sales_count" DESC);

-- Backfill slugs for existing rows
UPDATE "products"
SET "slug" = LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(COALESCE("name", 'product'), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) || '-' || SUBSTR("id"::text, 1, 8)
WHERE "slug" IS NULL OR TRIM("slug") = '';

-- compare_price from mrp when list price > selling price
UPDATE "products"
SET "compare_price" = "mrp"
WHERE "compare_price" IS NULL
  AND "mrp" IS NOT NULL
  AND "price" IS NOT NULL
  AND "mrp" > "price"
  AND "price" > 0;

-- stock_status from headline stock
UPDATE "products"
SET "stock_status" = CASE
  WHEN "stock" IS NULL THEN 'in_stock'
  WHEN "stock" <= 0 THEN 'out_of_stock'
  WHEN "stock" <= 5 THEN 'low_stock'
  ELSE 'in_stock'
END
WHERE "stock_status" IS NULL OR TRIM("stock_status") = '';

-- has_variants from variant rows
UPDATE "products" p
SET "has_variants" = EXISTS (
  SELECT 1 FROM "product_variants" pv
  WHERE pv."product_id" = p."id"
    AND COALESCE(pv."is_deleted", false) = false
);

-- product_specifications (PDP specs tab)
CREATE TABLE IF NOT EXISTS "product_specifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "product_id" UUID NOT NULL,
  "attribute_name" VARCHAR(255) NOT NULL,
  "attribute_value" TEXT,
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_product_specs_product_id" ON "product_specifications" ("product_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_specifications_product_id_fkey'
  ) THEN
    ALTER TABLE "product_specifications"
      ADD CONSTRAINT "product_specifications_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- product_reviews (optional storefront reviews)
CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "product_id" UUID NOT NULL,
  "business_id" UUID,
  "reviewer_name" VARCHAR(255) NOT NULL,
  "reviewer_email" VARCHAR(255),
  "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "title" VARCHAR(255),
  "body" TEXT,
  "is_approved" BOOLEAN DEFAULT false,
  "helpful_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_product_reviews_product_id" ON "product_reviews" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_reviews_approved" ON "product_reviews" ("product_id", "is_approved");

-- product_variants storefront helpers (may predate Prisma on some DBs)
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN DEFAULT false;
