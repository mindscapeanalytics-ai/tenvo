-- Add missing columns to affiliates table that exist in schema but not in DB
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS payout_details JSONB DEFAULT '{}';
