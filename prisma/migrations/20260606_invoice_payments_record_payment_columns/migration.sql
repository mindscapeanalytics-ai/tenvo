-- Legacy minimal invoice_payments tables (e.g. created before full 032 / Prisma sync)
-- may omit columns required by InvoicePaymentService.recordPayment INSERT.
-- Fixes: column "payment_method" of relation "invoice_payments" does not exist (42703).

ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "reference_number" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "transaction_id" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "gateway_response" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "payment_date" DATE DEFAULT CURRENT_DATE;

-- Backfill so future NOT NULL constraints (if any) or exports stay sane
UPDATE "invoice_payments" SET "payment_method" = 'cash' WHERE "payment_method" IS NULL;
