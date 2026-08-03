-- Align inventory_reservations with lib/services/reservationManagement.js (customer, notes, lifecycle timestamps).

ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "customer_id" UUID;
ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ(6);
ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "idx_inventory_reservations_customer_id" ON "inventory_reservations" ("customer_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_customer_id_fkey'
  ) THEN
    ALTER TABLE "inventory_reservations"
      ADD CONSTRAINT "inventory_reservations_customer_id_fkey"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
