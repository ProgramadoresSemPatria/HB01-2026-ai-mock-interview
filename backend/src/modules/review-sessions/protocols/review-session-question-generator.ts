import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";

import type { LlmUsage } from "@/modules/token-usage/types/llm-usage";

export type ReviewSessionTurn = {
  question: string;
  answer: string;
};

export type ReviewSessionQuestionGeneratorInput = {
  topic: string;
  description: string;
  turns: ReviewSessionTurn[];
};

export type ReviewSessionQuestionGeneratorOptions = {
  callbacks?: BaseCallbackHandler[];
};

export type ReviewSessionQuestionStreamToken = {
  content: string;
};

export type ReviewSessionQuestionStreamResult = {
  content: string;
  usage?: LlmUsage;
};

export interface IReviewSessionQuestionGenerator {
  streamQuestion(
    input: ReviewSessionQuestionGeneratorInput,
    options?: ReviewSessionQuestionGeneratorOptions,
  ): AsyncGenerator<
    ReviewSessionQuestionStreamToken,
    ReviewSessionQuestionStreamResult
  >;
}
