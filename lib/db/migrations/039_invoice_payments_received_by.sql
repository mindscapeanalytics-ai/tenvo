-- Same as prisma/migrations/20260607_invoice_payments_received_by/migration.sql

ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "received_by" TEXT;
