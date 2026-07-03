import type { ReviewRepository } from "@/modules/interview/repository/review-repository";
import type { ReviewItemRecord } from "@/modules/interview/types/review-item-record";
import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import type { ReviewItemResponse } from "@/modules/review-items/validations/review-items-schemas";
import { NotFoundError } from "@/shared";

const PRIORITY_RANK: Record<ReviewPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function toResponse(item: ReviewItemRecord): ReviewItemResponse {
  return {
    id: item.id,
    sessionId: item.sessionId,
    topic: item.topic,
    description: item.description,
    priority: item.priority,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function compareReviewItems(a: ReviewItemRecord, b: ReviewItemRecord): number {
  const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];

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

  async deleteForUser(userId: number, id: string): Promise<void> {
    const deleted = await this.reviewRepository.deleteByIdAndUserId(id, userId);

    if (!deleted) {
      throw new NotFoundError("Review item not found");
    }
  }
}
