-- inventory_reservations.batch_id / warehouse_id → canonical Prisma relations

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_batch_id_fkey'
  ) THEN
    ALTER TABLE "inventory_reservations"
      ADD CONSTRAINT "inventory_reservations_batch_id_fkey"
      FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_warehouse_id_fkey'
  ) THEN
    ALTER TABLE "inventory_reservations"
      ADD CONSTRAINT "inventory_reservations_warehouse_id_fkey"
      FOREIGN KEY ("warehouse_id") REFERENCES "warehouse_locations"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_inventory_reservations_batch_id"
  ON "inventory_reservations" ("batch_id")
  WHERE "batch_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_inventory_reservations_warehouse_id"
  ON "inventory_reservations" ("warehouse_id")
  WHERE "warehouse_id" IS NOT NULL;
