-- Minimal invoice_payments tables may omit received_by (who recorded the payment).
-- Fixes: column "received_by" of relation "invoice_payments" does not exist (42703).
-- Type TEXT matches "user".id (Better Auth / Prisma User uses String @id without UUID native type).

ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS "received_by" TEXT;
