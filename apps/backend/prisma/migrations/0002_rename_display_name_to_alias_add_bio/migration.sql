-- Rename display_name to alias and add bio column to users table
ALTER TABLE "users" RENAME COLUMN "display_name" TO "alias";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "alias" TYPE VARCHAR(120),
ADD COLUMN "bio" VARCHAR(300);
