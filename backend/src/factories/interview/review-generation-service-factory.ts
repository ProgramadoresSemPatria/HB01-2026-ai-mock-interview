import { makeTokenUsageService } from "@/factories/token-usage/token-usage-service-factory";
import { createReviewItemsGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/review-items-generator-node";
import { ReviewItemsGeneratorAdapter } from "@/infrastructure/ai/langgraph/review-items-generator-adapter";
import * as reviewGenerationQueue from "@/infrastructure/queue/review-generation-queue";
import { MessageRepository } from "@/modules/interview/repository/message-repository";
import { ReviewRepository } from "@/modules/interview/repository/review-repository";
import { SessionRepository } from "@/modules/interview/repository/session-repository";
import { ReviewGenerationService } from "@/modules/interview/service/review-generation-service";
import { ResumeRepository } from "@/modules/resumes/repository/resume-repository";

import { makeReviewMergeService } from "./review-merge-service-factory";

export function makeReviewGenerationService(): ReviewGenerationService {
  const reviewRepository = new ReviewRepository();

  return new ReviewGenerationService(
    new SessionRepository(),
    new MessageRepository(),
    new ResumeRepository(),
    new ReviewItemsGeneratorAdapter(
      createReviewItemsGeneratorNode(),
      reviewRepository,
    ),
    makeReviewMergeService(),
    makeTokenUsageService(),
    reviewGenerationQueue,
  );
}
