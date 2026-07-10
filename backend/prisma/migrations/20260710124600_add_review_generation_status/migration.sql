-- CreateEnum
CREATE TYPE "ReviewGenerationStatus" AS ENUM ('idle', 'pending', 'ready', 'failed');

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN "review_generation_status" "ReviewGenerationStatus" NOT NULL DEFAULT 'idle',
ADD COLUMN "review_generation_error" TEXT;

-- Backfill finished sessions (old sync path already generated review items)
UPDATE "interview_sessions" SET "review_generation_status" = 'ready' WHERE "is_finished" = true;
