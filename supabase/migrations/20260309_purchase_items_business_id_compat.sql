-- Migration: Ensure purchase_items.business_id exists and is backfilled
-- Date: 2026-03-09
-- Purpose:
-- 1) Normalize legacy databases where purchase_items was created without business_id
-- 2) Backfill business_id from purchases
-- 3) Add index and FK for tenant safety

ALTER TABLE purchase_items
ADD COLUMN IF NOT EXISTS business_id UUID;

-- Backfill from purchases for rows created before this column existed
UPDATE purchase_items pi
SET business_id = p.business_id
FROM purchases p
WHERE pi.purchase_id = p.id
  AND pi.business_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_items_business_id
ON purchase_items (business_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'purchase_items_business_id_fkey'
    ) THEN
        ALTER TABLE purchase_items
        ADD CONSTRAINT purchase_items_business_id_fkey
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE;
    END IF;
END $$;
