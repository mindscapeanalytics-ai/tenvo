-- Migration: Add FK constraint on referrals.business_id → businesses.id
-- Idempotent: constraint may already exist on environments that applied it manually.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_referrals_business_id'
  ) THEN
    ALTER TABLE referrals
      ADD CONSTRAINT fk_referrals_business_id
      FOREIGN KEY (business_id)
      REFERENCES businesses(id)
      ON DELETE CASCADE;
  END IF;
END $$;
