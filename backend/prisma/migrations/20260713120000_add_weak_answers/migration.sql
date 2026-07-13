-- CreateEnum
CREATE TYPE "AnswerEvaluation" AS ENUM ('incorrect', 'incomplete', 'insufficient', 'satisfactory');

-- CreateTable
CREATE TABLE "weak_answers" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "user_answer" TEXT NOT NULL,
    "evaluation" "AnswerEvaluation" NOT NULL,
    "feedback" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "priority" "ReviewPriority" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weak_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weak_answers_user_id_idx" ON "weak_answers"("user_id");

-- CreateIndex
CREATE INDEX "weak_answers_session_id_idx" ON "weak_answers"("session_id");

-- AddForeignKey
ALTER TABLE "weak_answers" ADD CONSTRAINT "weak_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weak_answers" ADD CONSTRAINT "weak_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
