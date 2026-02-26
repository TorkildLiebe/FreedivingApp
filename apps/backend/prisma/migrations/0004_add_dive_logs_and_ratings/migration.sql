CREATE TABLE IF NOT EXISTS "dive_logs" (
  "id" UUID NOT NULL,
  "spot_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "visibility_meters" DOUBLE PRECISION NOT NULL,
  "current_strength" INTEGER NOT NULL,
  "notes" VARCHAR(500),
  "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  "dived_at" TIMESTAMP(3) NOT NULL,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dive_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "spot_ratings" (
  "id" UUID NOT NULL,
  "spot_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "spot_ratings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dive_logs_spot_id_is_deleted_dived_at_idx"
ON "dive_logs"("spot_id", "is_deleted", "dived_at");

CREATE INDEX IF NOT EXISTS "dive_logs_author_id_is_deleted_created_at_idx"
ON "dive_logs"("author_id", "is_deleted", "created_at");

CREATE INDEX IF NOT EXISTS "spot_ratings_spot_id_idx"
ON "spot_ratings"("spot_id");

CREATE UNIQUE INDEX IF NOT EXISTS "spot_ratings_user_id_spot_id_key"
ON "spot_ratings"("user_id", "spot_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dive_logs_spot_id_fkey'
      AND conrelid = 'dive_logs'::regclass
  ) THEN
    ALTER TABLE "dive_logs"
    ADD CONSTRAINT "dive_logs_spot_id_fkey"
    FOREIGN KEY ("spot_id") REFERENCES "dive_spots"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dive_logs_author_id_fkey'
      AND conrelid = 'dive_logs'::regclass
  ) THEN
    ALTER TABLE "dive_logs"
    ADD CONSTRAINT "dive_logs_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'spot_ratings_spot_id_fkey'
      AND conrelid = 'spot_ratings'::regclass
  ) THEN
    ALTER TABLE "spot_ratings"
    ADD CONSTRAINT "spot_ratings_spot_id_fkey"
    FOREIGN KEY ("spot_id") REFERENCES "dive_spots"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'spot_ratings_user_id_fkey'
      AND conrelid = 'spot_ratings'::regclass
  ) THEN
    ALTER TABLE "spot_ratings"
    ADD CONSTRAINT "spot_ratings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
