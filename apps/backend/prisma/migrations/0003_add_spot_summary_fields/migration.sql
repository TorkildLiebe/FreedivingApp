ALTER TABLE "dive_spots"
ADD COLUMN "average_visibility_meters" DOUBLE PRECISION,
ADD COLUMN "average_rating" DOUBLE PRECISION,
ADD COLUMN "report_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "latest_report_at" TIMESTAMP(3);
