-- Legacy invoice_payments tables sometimes omitted business_id; InvoicePaymentService INSERT requires it.
-- Fixes: column "business_id" of relation "invoice_payments" does not exist (42703).

ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "business_id" UUID;

UPDATE "invoice_payments" AS ip
SET "business_id" = i."business_id"
FROM "invoices" AS i
WHERE ip."invoice_id" = i."id"
  AND ip."business_id" IS NULL
  AND i."business_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "invoice_payments_business_id_invoice_id_idx" ON "invoice_payments"("business_id", "invoice_id");
