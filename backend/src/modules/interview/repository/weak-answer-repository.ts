import prisma from "@/infrastructure/database";
import type { WeakAnswerRecord } from "@/modules/interview/types/weak-answer-record";
import type {
  AnswerEvaluation,
  ReviewPriority,
} from "@/modules/interview/validations/interview-schemas";
import type { WeakAnswer as PrismaWeakAnswer } from "../../../../prisma/generated/client";

export type CreateWeakAnswerParams = {
  userId: number;
  sessionId: string;
  question: string;
  userAnswer: string;
  evaluation: AnswerEvaluation;
  feedback: string;
  topic: string;
  priority: ReviewPriority;
};

function toWeakAnswerRecord(row: PrismaWeakAnswer): WeakAnswerRecord {
  return {
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    question: row.question,
    userAnswer: row.userAnswer,
    evaluation: row.evaluation as AnswerEvaluation,
    feedback: row.feedback,
    topic: row.topic,
    priority: row.priority as ReviewPriority,
    createdAt: row.createdAt,
  };
}

export class WeakAnswerRepository {
  async createMany(items: CreateWeakAnswerParams[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await prisma.weakAnswer.createMany({ data: items });
  }

  async listByUserId(userId: number): Promise<WeakAnswerRecord[]> {
    const rows = await prisma.weakAnswer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toWeakAnswerRecord);
  }

  async deleteByIdAndUserId(id: string, userId: number): Promise<boolean> {
    const result = await prisma.weakAnswer.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}
