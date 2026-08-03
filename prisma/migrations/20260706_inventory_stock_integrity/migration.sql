-- Align stock_movements and product_stock_locations with runtime inventory paths
-- (VariantService adjustments, storefront variant sale audit, FIFO location decrement).

ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "variant_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_variant_id_fkey'
  ) THEN
    ALTER TABLE "stock_movements"
      ADD CONSTRAINT "stock_movements_variant_id_fkey"
      FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_stock_movements_business_variant"
  ON "stock_movements" ("business_id", "variant_id")
  WHERE "variant_id" IS NOT NULL;

ALTER TABLE "product_stock_locations" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(6) DEFAULT NOW();

UPDATE "product_stock_locations"
SET "created_at" = COALESCE("created_at", "updated_at", NOW())
WHERE "created_at" IS NULL;
