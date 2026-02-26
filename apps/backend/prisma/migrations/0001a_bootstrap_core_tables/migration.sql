CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID NOT NULL,
  "external_id" TEXT NOT NULL,
  "email" TEXT,
  "display_name" TEXT,
  "avatar_url" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "preferred_language" TEXT NOT NULL DEFAULT 'no',
  "favorite_spot_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_external_id_key"
ON "users"("external_id");

CREATE TABLE IF NOT EXISTS "dive_spots" (
  "id" UUID NOT NULL,
  "title" VARCHAR(80) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "center_lat" DOUBLE PRECISION NOT NULL,
  "center_lon" DOUBLE PRECISION NOT NULL,
  "created_by_id" UUID NOT NULL,
  "access_info" VARCHAR(1000),
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dive_spots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dive_spots_is_deleted_center_lat_center_lon_idx"
ON "dive_spots"("is_deleted", "center_lat", "center_lon");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dive_spots_created_by_id_fkey'
      AND conrelid = 'dive_spots'::regclass
  ) THEN
    ALTER TABLE "dive_spots"
    ADD CONSTRAINT "dive_spots_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "parking_locations" (
  "id" UUID NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lon" DOUBLE PRECISION NOT NULL,
  "label" VARCHAR(100),
  "spot_id" UUID NOT NULL,
  CONSTRAINT "parking_locations_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'parking_locations_spot_id_fkey'
      AND conrelid = 'parking_locations'::regclass
  ) THEN
    ALTER TABLE "parking_locations"
    ADD CONSTRAINT "parking_locations_spot_id_fkey"
    FOREIGN KEY ("spot_id") REFERENCES "dive_spots"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
