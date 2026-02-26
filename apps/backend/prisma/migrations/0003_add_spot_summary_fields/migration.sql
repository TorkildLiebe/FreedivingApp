ALTER TABLE "dive_spots"
ADD COLUMN IF NOT EXISTS "average_visibility_meters" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "average_rating" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "report_count" INTEGER,
ADD COLUMN IF NOT EXISTS "latest_report_at" TIMESTAMP(3);

UPDATE "dive_spots"
SET "report_count" = 0
WHERE "report_count" IS NULL;

ALTER TABLE "dive_spots"
ALTER COLUMN "report_count" SET DEFAULT 0;

ALTER TABLE "dive_spots"
ALTER COLUMN "report_count" SET NOT NULL;
