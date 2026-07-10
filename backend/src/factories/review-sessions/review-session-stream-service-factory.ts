import { makeTokenUsageService } from "@/factories/token-usage/token-usage-service-factory";
import { createReviewSessionEvaluationNode } from "@/infrastructure/ai/langgraph/nodes/review-session-evaluation-node";
import { createReviewSessionQuestionNode } from "@/infrastructure/ai/langgraph/nodes/review-session-question-node";
import type { IReviewSessionEvaluator } from "@/modules/review-sessions/protocols/review-session-evaluator";
import { ReviewSessionRepository } from "@/modules/review-sessions/repository/review-session-repository";
import { ReviewSessionStreamService } from "@/modules/review-sessions/service/review-session-stream-service";

export function makeReviewSessionStreamService(): ReviewSessionStreamService {
  const evaluateNode = createReviewSessionEvaluationNode();
  const evaluator: IReviewSessionEvaluator = {
    evaluate: (input, options) =>
      evaluateNode(
        input,
        options ? { callbacks: options.callbacks } : undefined,
      ),
  };

  return new ReviewSessionStreamService(
    new ReviewSessionRepository(),
    createReviewSessionQuestionNode(),
    evaluator,
    makeTokenUsageService(),
  );
}
