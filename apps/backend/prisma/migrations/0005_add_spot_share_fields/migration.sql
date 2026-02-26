ALTER TABLE "dive_spots"
ADD COLUMN IF NOT EXISTS "share_url" TEXT,
ADD COLUMN IF NOT EXISTS "shareable_access_info" BOOLEAN;
