import type { ReviewRepository } from "@/modules/interview/repository/review-repository";
import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import type { ReviewItemResponse } from "@/modules/review-items/validations/review-items-schemas";
import type { ReviewItem } from "../../../../prisma/generated/client";

const PRIORITY_RANK: Record<ReviewPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function toResponse(item: ReviewItem): ReviewItemResponse {
  return {
    id: item.id,
    sessionId: item.sessionId,
    topic: item.topic,
    description: item.description,
    priority: item.priority as ReviewPriority,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function compareReviewItems(a: ReviewItem, b: ReviewItem): number {
  const priorityDiff =
    PRIORITY_RANK[b.priority as ReviewPriority] -
    PRIORITY_RANK[a.priority as ReviewPriority];

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

export class ReviewItemsService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async listForUser(userId: number): Promise<ReviewItemResponse[]> {
    const items = await this.reviewRepository.listByUserId(userId);
    return [...items].sort(compareReviewItems).map(toResponse);
  }
}
