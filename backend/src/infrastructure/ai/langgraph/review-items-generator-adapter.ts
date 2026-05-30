import type { createReviewItemsGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/review-items-generator-node";
import type {
  IReviewItemsGenerator,
  ReviewItemsGeneratorParams,
} from "@/modules/interview/protocols/review-items-generator";
import type { ReviewRepository } from "@/modules/interview/repository/review-repository";

export class ReviewItemsGeneratorAdapter implements IReviewItemsGenerator {
  constructor(
    private readonly generateItems: ReturnType<
      typeof createReviewItemsGeneratorNode
    >,
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async generate(params: ReviewItemsGeneratorParams) {
    const existingItems = await this.reviewRepository.listByUserId(
      params.userId,
    );

    return this.generateItems({
      transcript: params.transcript,
      structuredSummary: params.structuredSummary,
      existingItems: existingItems.map((item) => ({
        topic: item.topic,
        description: item.description,
        priority: item.priority,
      })),
    });
  }
}
