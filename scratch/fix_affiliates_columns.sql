-- Add status column to affiliates if it doesn't exist
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Add is_active column if it doesn't exist
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add total_earnings column if it doesn't exist
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- Add payout_details column if it doesn't exist
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS payout_details JSONB DEFAULT '{}';
