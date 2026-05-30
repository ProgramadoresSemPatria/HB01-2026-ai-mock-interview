import { createReviewItemsGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/review-items-generator-node";
import { ReviewItemsGeneratorAdapter } from "@/infrastructure/ai/langgraph/review-items-generator-adapter";
import { MessageRepository } from "@/modules/interview/repository/message-repository";
import { ReviewRepository } from "@/modules/interview/repository/review-repository";
import { SessionRepository } from "@/modules/interview/repository/session-repository";
import { InterviewStreamService } from "@/modules/interview/service/stream-service";
import { ReviewMergeService } from "@/modules/interview/service/review-merge-service";
import { ResumeRepository } from "@/modules/resumes/repository/resume-repository";

import { makeInterviewGraph } from "./interview-graph-factory";

export function makeInterviewStreamService(): InterviewStreamService {
  const reviewRepository = new ReviewRepository();

  return new InterviewStreamService(
    new SessionRepository(),
    new MessageRepository(),
    new ResumeRepository(),
    makeInterviewGraph(),
    new ReviewMergeService(reviewRepository),
    new ReviewItemsGeneratorAdapter(
      createReviewItemsGeneratorNode(),
      reviewRepository,
    ),
  );
}
