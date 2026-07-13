import type { WeakAnswerRepository } from "@/modules/interview/repository/weak-answer-repository";
import type { WeakAnswerItem } from "@/modules/interview/validations/interview-schemas";

export class WeakAnswerService {
  constructor(private readonly weakAnswerRepository: WeakAnswerRepository) {}

  async saveWeakAnswers(
    userId: number,
    sessionId: string,
    items: WeakAnswerItem[],
  ): Promise<void> {
    const weakItems = items.filter(
      (item) => item.evaluation !== "satisfactory",
    );

    if (weakItems.length === 0) {
      return;
    }

    await this.weakAnswerRepository.createMany(
      weakItems.map((item) => ({
        userId,
        sessionId,
        question: item.question,
        userAnswer: item.userAnswer,
        evaluation: item.evaluation,
        feedback: item.feedback,
        topic: item.topic,
        priority: item.priority,
      })),
    );
  }
}
