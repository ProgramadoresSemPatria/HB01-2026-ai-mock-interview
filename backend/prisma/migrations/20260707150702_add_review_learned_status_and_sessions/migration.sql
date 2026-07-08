-- CreateEnum
CREATE TYPE "ReviewItemStatus" AS ENUM ('active', 'learned');

-- CreateEnum
CREATE TYPE "ReviewSessionStatus" AS ENUM ('in_progress', 'pending_review', 'completed');

-- AlterTable
ALTER TABLE "review_items" ADD COLUMN     "learned_at" TIMESTAMP(3),
ADD COLUMN     "status" "ReviewItemStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "review_sessions" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "ReviewSessionStatus" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluated_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "review_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_session_items" (
    "id" TEXT NOT NULL,
    "review_session_id" TEXT NOT NULL,
    "review_item_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "turns" JSONB NOT NULL DEFAULT '[]',
    "current_priority" "ReviewPriority" NOT NULL,
    "pending_question" TEXT,
    "suggested_status" "ReviewItemStatus",
    "suggested_priority" "ReviewPriority",
    "confirmed_status" "ReviewItemStatus",
    "confirmed_priority" "ReviewPriority",
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_sessions_user_id_idx" ON "review_sessions"("user_id");

-- CreateIndex
CREATE INDEX "review_session_items_review_session_id_idx" ON "review_session_items"("review_session_id");

-- CreateIndex
CREATE INDEX "review_session_items_review_item_id_idx" ON "review_session_items"("review_item_id");

-- CreateIndex
CREATE INDEX "review_items_user_id_status_idx" ON "review_items"("user_id", "status");

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_session_items" ADD CONSTRAINT "review_session_items_review_session_id_fkey" FOREIGN KEY ("review_session_id") REFERENCES "review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_session_items" ADD CONSTRAINT "review_session_items_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;