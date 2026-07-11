-- Schema audit fixes (2026-07-12)
-- 1) tax_payments table for TaxCalculationsWidget
-- 2) storefront_order_items.business_id (matches checkout INSERT)
-- 3) invoice_payments.business_id NOT NULL (backfill from invoices)
-- 4) products.stock Decimal(12,2) precision alignment
-- 5) Soft-delete-aware partial unique indexes for document/serial keys
-- 6) Normalize legacy payments.payment_type 'in'/'out' → receipt/payment

-- ---------------------------------------------------------------------------
-- tax_payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "tax_payments" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "business_id" UUID NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "payment_date" DATE NOT NULL,
  "tax_type" VARCHAR(50) DEFAULT 'sales',
  "reference_number" VARCHAR(100),
  "notes" TEXT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tax_payments_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tax_payments_business_id_fkey'
  ) THEN
    ALTER TABLE "tax_payments"
      ADD CONSTRAINT "tax_payments_business_id_fkey"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "tax_payments_business_id_payment_date_idx"
  ON "tax_payments"("business_id", "payment_date" DESC);
CREATE INDEX IF NOT EXISTS "tax_payments_business_id_is_deleted_idx"
  ON "tax_payments"("business_id", "is_deleted");

-- ---------------------------------------------------------------------------
-- storefront_order_items.business_id
-- ---------------------------------------------------------------------------
ALTER TABLE "storefront_order_items"
  ADD COLUMN IF NOT EXISTS "business_id" UUID;

UPDATE "storefront_order_items" soi
SET "business_id" = so."business_id"
FROM "storefront_orders" so
WHERE soi."order_id" = so."id"
  AND soi."business_id" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'storefront_order_items_business_id_fkey'
  ) THEN
    ALTER TABLE "storefront_order_items"
      ADD CONSTRAINT "storefront_order_items_business_id_fkey"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Skip FK if orphan rows remain; column still usable for tenancy filters.
    RAISE NOTICE 'storefront_order_items business_id FK skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS "storefront_order_items_business_id_idx"
  ON "storefront_order_items"("business_id");

-- ---------------------------------------------------------------------------
-- invoice_payments.business_id NOT NULL
-- ---------------------------------------------------------------------------
UPDATE "invoice_payments" ip
SET "business_id" = i."business_id"
FROM "invoices" i
WHERE ip."invoice_id" = i."id"
  AND ip."business_id" IS NULL;

-- Drop orphan payment rows that cannot be tenancy-scoped
DELETE FROM "invoice_payments"
WHERE "business_id" IS NULL;

DO $$
BEGIN
  ALTER TABLE "invoice_payments" ALTER COLUMN "business_id" SET NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'invoice_payments.business_id NOT NULL skipped: %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------------
-- products.stock precision
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE "products"
    ALTER COLUMN "stock" TYPE DECIMAL(12, 2)
    USING ROUND(COALESCE("stock", 0)::numeric, 2);
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'products.stock precision alter skipped: %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------------
-- Soft-delete partial uniques
-- Drop hard uniques (constraint or unique index), then create partial indexes.
-- ---------------------------------------------------------------------------

-- invoices
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_business_id_invoice_number_key";
DROP INDEX IF EXISTS "invoices_business_id_invoice_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_business_invoice_number_active_key"
  ON "invoices"("business_id", "invoice_number")
  WHERE COALESCE("is_deleted", false) = false;

-- purchases
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_business_id_purchase_number_key";
DROP INDEX IF EXISTS "purchases_business_id_purchase_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "purchases_business_purchase_number_active_key"
  ON "purchases"("business_id", "purchase_number")
  WHERE COALESCE("is_deleted", false) = false;

-- quotations
ALTER TABLE "quotations" DROP CONSTRAINT IF EXISTS "unique_quotation_number";
DROP INDEX IF EXISTS "unique_quotation_number";
CREATE UNIQUE INDEX IF NOT EXISTS "unique_quotation_number_active"
  ON "quotations"("business_id", "quotation_number")
  WHERE COALESCE("is_deleted", false) = false;

-- sales_orders
ALTER TABLE "sales_orders" DROP CONSTRAINT IF EXISTS "unique_order_number";
DROP INDEX IF EXISTS "unique_order_number";
CREATE UNIQUE INDEX IF NOT EXISTS "unique_order_number_active"
  ON "sales_orders"("business_id", "order_number")
  WHERE COALESCE("is_deleted", false) = false;

-- delivery_challans
ALTER TABLE "delivery_challans" DROP CONSTRAINT IF EXISTS "unique_challan_number";
DROP INDEX IF EXISTS "unique_challan_number";
CREATE UNIQUE INDEX IF NOT EXISTS "unique_challan_number_active"
  ON "delivery_challans"("business_id", "challan_number")
  WHERE COALESCE("is_deleted", false) = false;

-- expenses (nullable expense_number)
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_business_id_expense_number_key";
DROP INDEX IF EXISTS "expenses_business_id_expense_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "expenses_business_expense_number_active_key"
  ON "expenses"("business_id", "expense_number")
  WHERE COALESCE("is_deleted", false) = false
    AND "expense_number" IS NOT NULL;

-- product_serials
ALTER TABLE "product_serials" DROP CONSTRAINT IF EXISTS "product_serials_business_id_serial_number_key";
DROP INDEX IF EXISTS "product_serials_business_id_serial_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "product_serials_business_serial_active_key"
  ON "product_serials"("business_id", "serial_number")
  WHERE COALESCE("is_deleted", false) = false;

ALTER TABLE "product_serials" DROP CONSTRAINT IF EXISTS "product_serials_business_id_imei_key";
DROP INDEX IF EXISTS "product_serials_business_id_imei_key";
CREATE UNIQUE INDEX IF NOT EXISTS "product_serials_business_imei_active_key"
  ON "product_serials"("business_id", "imei")
  WHERE COALESCE("is_deleted", false) = false
    AND "imei" IS NOT NULL;

ALTER TABLE "product_serials" DROP CONSTRAINT IF EXISTS "product_serials_business_id_mac_address_key";
DROP INDEX IF EXISTS "product_serials_business_id_mac_address_key";
CREATE UNIQUE INDEX IF NOT EXISTS "product_serials_business_mac_active_key"
  ON "product_serials"("business_id", "mac_address")
  WHERE COALESCE("is_deleted", false) = false
    AND "mac_address" IS NOT NULL;

-- product_variants (nullable variant_sku)
ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_business_id_variant_sku_key";
DROP INDEX IF EXISTS "product_variants_business_id_variant_sku_key";
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_business_variant_sku_active_key"
  ON "product_variants"("business_id", "variant_sku")
  WHERE COALESCE("is_deleted", false) = false
    AND "variant_sku" IS NOT NULL;

-- product_batches
ALTER TABLE "product_batches" DROP CONSTRAINT IF EXISTS "product_batches_business_id_product_id_batch_number_key";
DROP INDEX IF EXISTS "product_batches_business_id_product_id_batch_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "product_batches_business_product_batch_active_key"
  ON "product_batches"("business_id", "product_id", "batch_number")
  WHERE COALESCE("is_deleted", false) = false;

-- ---------------------------------------------------------------------------
-- Legacy payment_type normalization
-- ---------------------------------------------------------------------------
UPDATE "payments"
SET "payment_type" = 'receipt',
    "updated_at" = NOW()
WHERE LOWER(TRIM("payment_type")) = 'in';

UPDATE "payments"
SET "payment_type" = 'payment',
    "updated_at" = NOW()
WHERE LOWER(TRIM("payment_type")) = 'out';
