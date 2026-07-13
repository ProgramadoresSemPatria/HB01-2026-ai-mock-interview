import { makeTokenUsageService } from "@/factories/token-usage/token-usage-service-factory";
import { createReviewItemsGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/review-items-generator-node";
import { createWeakAnswersGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/weak-answers-generator-node";
import { ReviewItemsGeneratorAdapter } from "@/infrastructure/ai/langgraph/review-items-generator-adapter";
import { WeakAnswersGeneratorAdapter } from "@/infrastructure/ai/langgraph/weak-answers-generator-adapter";
import { MessageRepository } from "@/modules/interview/repository/message-repository";
import { ReviewRepository } from "@/modules/interview/repository/review-repository";
import { SessionRepository } from "@/modules/interview/repository/session-repository";
import { WeakAnswerRepository } from "@/modules/interview/repository/weak-answer-repository";
import { InterviewStreamService } from "@/modules/interview/service/stream-service";
import { ReviewMergeService } from "@/modules/interview/service/review-merge-service";
import { WeakAnswerService } from "@/modules/interview/service/weak-answer-service";
import { ResumeRepository } from "@/modules/resumes/repository/resume-repository";

import { makeInterviewGraph } from "./interview-graph-factory";

export function makeInterviewStreamService(): InterviewStreamService {
  const reviewRepository = new ReviewRepository();
  const weakAnswerRepository = new WeakAnswerRepository();

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
    new WeakAnswersGeneratorAdapter(createWeakAnswersGeneratorNode()),
    new WeakAnswerService(weakAnswerRepository),
    makeTokenUsageService(),
  );
}
