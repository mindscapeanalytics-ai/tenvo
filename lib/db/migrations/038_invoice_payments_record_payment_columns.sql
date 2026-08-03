-- Combines prisma/migrations/20260606_invoice_payments_record_payment_columns
-- and 20260607_invoice_payments_received_by (one-shot manual fix).
-- Run in Supabase SQL editor if you use manual SQL instead of prisma migrate deploy.

ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "reference_number" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "transaction_id" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "gateway_response" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "payment_date" DATE DEFAULT CURRENT_DATE;

UPDATE "invoice_payments" SET "payment_method" = 'cash' WHERE "payment_method" IS NULL;

ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "received_by" TEXT;
