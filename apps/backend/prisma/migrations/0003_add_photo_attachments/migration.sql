ALTER TABLE "dive_spots"
ADD COLUMN IF NOT EXISTS "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "dive_spots"
SET "photo_urls" = ARRAY[]::TEXT[]
WHERE "photo_urls" IS NULL;

ALTER TABLE "dive_spots"
ALTER COLUMN "photo_urls" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "dive_spots"
ALTER COLUMN "photo_urls" SET NOT NULL;
