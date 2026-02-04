-- Add version column to boms table
ALTER TABLE boms ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE boms ADD COLUMN IF NOT EXISTS notes TEXT;
