-- Migration: Add email verification table
-- Created: May 22, 2026

-- Create email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

-- Constraint: Only one pending verification per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verifications_pending 
ON email_verifications(user_id) 
WHERE verified_at IS NULL;

-- Add emailVerified column to user table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user' 
        AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE "user" ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_email_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_verifications_updated_at ON email_verifications;
CREATE TRIGGER trigger_email_verifications_updated_at
    BEFORE UPDATE ON email_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_email_verifications_updated_at();

-- Add comment for documentation
COMMENT ON TABLE email_verifications IS 'Stores email verification tokens for user registration';
