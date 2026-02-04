-- ============================================
-- Migration 015: Better Auth Integration
-- Creates tables required for Better Auth
-- Updates existing tables to use TEXT for user_id
-- ============================================

-- 1. BETTER AUTH CORE TABLES
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADJUST EXISTING SCHEMA FOR BETTER AUTH COMPATIBILITY
-- We use direct ALTER TABLE commands which are safer for raw execution
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_user_id_fkey;
ALTER TABLE businesses ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE business_users DROP CONSTRAINT IF EXISTS business_users_user_id_fkey;
ALTER TABLE business_users ALTER COLUMN user_id TYPE TEXT;

-- 3. HELPER FOR TRANSITION
COMMENT ON COLUMN businesses.user_id IS 'Was UUID (Supabase Auth), now TEXT (Better Auth)';
COMMENT ON COLUMN business_users.user_id IS 'Was UUID (Supabase Auth), now TEXT (Better Auth)';
