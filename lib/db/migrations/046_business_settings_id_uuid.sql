-- Mirror of prisma/migrations/20260711_business_settings_id_uuid
-- Align business_settings.id integer/serial → UUID for Prisma create() on registration.
-- Safe / idempotent for manual apply when Prisma migrate history is behind.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  id_type text;
  pk_name text;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'business_settings'
    AND column_name = 'id';

  IF id_type IS NULL THEN
    RAISE NOTICE 'business_settings.id missing; skip';
    RETURN;
  END IF;

  IF id_type IN ('integer', 'bigint', 'smallint') THEN
    SELECT c.conname INTO pk_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'business_settings'
      AND c.contype = 'p'
    LIMIT 1;

    IF pk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE business_settings DROP CONSTRAINT %I', pk_name);
    END IF;

    ALTER TABLE business_settings ALTER COLUMN id DROP DEFAULT;

    ALTER TABLE business_settings
      ALTER COLUMN id TYPE UUID USING gen_random_uuid();

    ALTER TABLE business_settings
      ALTER COLUMN id SET DEFAULT gen_random_uuid();

    ALTER TABLE business_settings
      ADD CONSTRAINT business_settings_pkey PRIMARY KEY (id);

    DROP SEQUENCE IF EXISTS business_settings_id_seq CASCADE;

    RAISE NOTICE 'business_settings.id converted integer → uuid';
  ELSIF id_type = 'uuid' THEN
    ALTER TABLE business_settings
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS is_storefront_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_settings_business_id_key'
  ) THEN
    BEGIN
      ALTER TABLE business_settings
        ADD CONSTRAINT business_settings_business_id_key UNIQUE (business_id);
    EXCEPTION WHEN duplicate_object OR unique_violation THEN
      NULL;
    END;
  END IF;
END $$;
