DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'display_name'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'alias'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "display_name" TO "alias";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'display_name'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'alias'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "alias" VARCHAR(120);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'alias'
  ) THEN
    ALTER TABLE "users" ALTER COLUMN "alias" TYPE VARCHAR(120);
  END IF;
END $$;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "bio" VARCHAR(300);
