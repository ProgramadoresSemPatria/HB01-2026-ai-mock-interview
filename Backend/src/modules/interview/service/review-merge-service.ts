import type { ReviewRepository } from "@/modules/interview/repository/review-repository";
import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import type { ReviewPriority as DbReviewPriority } from "../../../../prisma/generated/client";

export type ReviewItemInput = {
  topic: string;
  description: string;
  priority: ReviewPriority;
};

const RANK: Record<ReviewPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function bump(priority: ReviewPriority): ReviewPriority {
  if (priority === "low") {
    return "medium";
  }
  if (priority === "medium") {
    return "high";
  }
  return "high";
}

function maxPriority(
  a: ReviewPriority,
  b: ReviewPriority,
): ReviewPriority {
  return RANK[a] >= RANK[b] ? a : b;
}

export class ReviewMergeService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async upsertItems(
    userId: number,
    sessionId: string,
    items: ReviewItemInput[],
  ): Promise<void> {
    const llmTopics = new Set(
      items.map((item) => item.topic.toLowerCase()),
    );

    for (const item of items) {
      const existing =
        await this.reviewRepository.findByUserIdAndTopicCaseInsensitive(
          userId,
          item.topic,
        );

      if (!existing) {
        await this.reviewRepository.upsert({
          userId,
          sessionId,
          topic: item.topic,
          description: item.description,
          priority: item.priority as DbReviewPriority,
        });
        continue;
      }

      let priority = maxPriority(
        existing.priority as ReviewPriority,
        item.priority,
      );

      if (
        llmTopics.has(existing.topic.toLowerCase()) &&
        priority === existing.priority
      ) {
        priority = bump(existing.priority as ReviewPriority);
      }

      await this.reviewRepository.upsert({
        userId,
        sessionId,
        topic: item.topic,
        description: item.description,
        priority: priority as DbReviewPriority,
      });
    }
  }
}
