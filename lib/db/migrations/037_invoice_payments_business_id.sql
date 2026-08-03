-- Add invoice_payments.business_id when missing (same as Prisma 20260605_invoice_payments_add_business_id).
-- Fixes Record Invoice Payment: column "business_id" of relation "invoice_payments" does not exist

ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS business_id UUID;

UPDATE invoice_payments ip
SET business_id = i.business_id
FROM invoices i
WHERE ip.invoice_id = i.id
  AND ip.business_id IS NULL
  AND i.business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_payments_business_invoice ON invoice_payments(business_id, invoice_id);
