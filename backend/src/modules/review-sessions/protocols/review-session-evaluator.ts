import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";

import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import type { ReviewSessionEvaluationOutput } from "@/modules/review-sessions/validations/review-session-schemas";

export type ReviewSessionTurn = {
  question: string;
  answer: string;
};

export type ReviewSessionEvaluationInput = {
  topic: string;
  description: string;
  currentPriority: ReviewPriority;
  turns: ReviewSessionTurn[];
};

export type ReviewSessionEvaluatorOptions = {
  callbacks?: BaseCallbackHandler[];
};

export interface IReviewSessionEvaluator {
  evaluate(
    input: ReviewSessionEvaluationInput,
    options?: ReviewSessionEvaluatorOptions,
  ): Promise<ReviewSessionEvaluationOutput>;
}
