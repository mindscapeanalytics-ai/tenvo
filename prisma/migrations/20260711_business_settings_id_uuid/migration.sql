-- Align business_settings.id with Prisma (UUID).
-- Live drift: legacy SERIAL/integer PK while schema expects @db.Uuid.
-- Symptom on registration: Invalid business_settings.create() —
--   "Expected a string in column 'id', got number: 44"
-- (INSERT RETURNING id yields nextval integer; Prisma client expects UUID string.)

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
    -- Drop PK (name may vary on legacy DBs)
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

    -- Fresh UUIDs for every row (no FKs reference business_settings.id; business_id is the tenant key)
    ALTER TABLE business_settings
      ALTER COLUMN id TYPE UUID USING gen_random_uuid();

    ALTER TABLE business_settings
      ALTER COLUMN id SET DEFAULT gen_random_uuid();

    ALTER TABLE business_settings
      ADD CONSTRAINT business_settings_pkey PRIMARY KEY (id);

    DROP SEQUENCE IF EXISTS business_settings_id_seq CASCADE;

    RAISE NOTICE 'business_settings.id converted integer → uuid';
  ELSE
    RAISE NOTICE 'business_settings.id already %; ensure UUID default', id_type;
    -- Ensure default exists when already UUID
    IF id_type = 'uuid' THEN
      ALTER TABLE business_settings
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
  END IF;
END $$;

-- Ensure columns Prisma / registration rely on
ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS is_storefront_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- business_id must remain UUID + unique (tenant 1:1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_settings_business_id_key'
  ) THEN
    BEGIN
      ALTER TABLE business_settings
        ADD CONSTRAINT business_settings_business_id_key UNIQUE (business_id);
    EXCEPTION WHEN duplicate_object OR unique_violation THEN
      RAISE NOTICE 'business_settings.business_id unique already satisfied';
    END;
  END IF;
END $$;
