-- Migration: Add FK constraint on referrals.business_id → businesses.id
-- This makes the Prisma relation bidirectional and allows joining business names
-- in the partner dashboard referrals ledger.

ALTER TABLE referrals
  ADD CONSTRAINT fk_referrals_business_id
  FOREIGN KEY (business_id)
  REFERENCES businesses(id)
  ON DELETE CASCADE;
