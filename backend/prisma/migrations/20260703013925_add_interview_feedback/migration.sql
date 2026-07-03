-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('up', 'down');

-- DropForeignKey
ALTER TABLE "interview_sessions" DROP CONSTRAINT "interview_sessions_resume_id_fkey";

-- DropForeignKey
ALTER TABLE "review_items" DROP CONSTRAINT "review_items_session_id_fkey";

-- CreateTable
CREATE TABLE "interview_feedback" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" "FeedbackRating" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_feedback_user_id_idx" ON "interview_feedback"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_feedback_session_id_user_id_key" ON "interview_feedback"("session_id", "user_id");

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
