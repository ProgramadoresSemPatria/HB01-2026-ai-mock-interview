-- CreateEnum
CREATE TYPE "InterviewLocale" AS ENUM ('en', 'pt');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "interview_locale" "InterviewLocale";

-- AlterTable (nullable first so existing rows can be backfilled)
ALTER TABLE "interview_sessions" ADD COLUMN "interview_locale" "InterviewLocale";

-- AlterTable (nullable first so existing rows can be backfilled)
ALTER TABLE "review_sessions" ADD COLUMN "interview_locale" "InterviewLocale";

-- Backfill existing session rows to en (user preference remains null)
UPDATE "interview_sessions" SET "interview_locale" = 'en' WHERE "interview_locale" IS NULL;
UPDATE "review_sessions" SET "interview_locale" = 'en' WHERE "interview_locale" IS NULL;

-- Enforce required locale on sessions (DB default matches Prisma @default(en))
ALTER TABLE "interview_sessions" ALTER COLUMN "interview_locale" SET NOT NULL,
ALTER COLUMN "interview_locale" SET DEFAULT 'en';
ALTER TABLE "review_sessions" ALTER COLUMN "interview_locale" SET NOT NULL,
ALTER COLUMN "interview_locale" SET DEFAULT 'en';
