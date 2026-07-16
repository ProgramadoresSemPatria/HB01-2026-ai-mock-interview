import type { WeakAnswerRepository } from "@/modules/interview/repository/weak-answer-repository";
import type { WeakAnswerRecord } from "@/modules/interview/types/weak-answer-record";
import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import type { WeakAnswerResponse } from "@/modules/weak-answers/validations/weak-answers-schemas";
import { NotFoundError } from "@/shared";

const PRIORITY_RANK: Record<ReviewPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function toResponse(item: WeakAnswerRecord): WeakAnswerResponse {
  return {
    id: item.id,
    sessionId: item.sessionId,
    question: item.question,
    userAnswer: item.userAnswer,
    evaluation: item.evaluation,
    feedback: item.feedback,
    topic: item.topic,
    priority: item.priority,
    createdAt: item.createdAt.toISOString(),
  };
}

function compareWeakAnswers(a: WeakAnswerRecord, b: WeakAnswerRecord): number {
  const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return b.createdAt.getTime() - a.createdAt.getTime();
}

export class WeakAnswersService {
  constructor(private readonly weakAnswerRepository: WeakAnswerRepository) {}

  async listForUser(userId: number): Promise<WeakAnswerResponse[]> {
    const items = await this.weakAnswerRepository.listByUserId(userId);
    return [...items].sort(compareWeakAnswers).map(toResponse);
  }

  async deleteForUser(userId: number, id: string): Promise<void> {
    const deleted = await this.weakAnswerRepository.deleteByIdAndUserId(
      id,
      userId,
    );

    if (!deleted) {
      throw new NotFoundError("Weak answer not found");
    }
  }
}
