import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { ChatOpenAI } from "@langchain/openai";

import { createReviewModel } from "@/infrastructure/ai/openai-models";
import {
  buildReviewItemsGeneratorPrompt,
  type ExistingReviewItemForPrompt,
} from "@/modules/interview/prompts/review-items-generator-prompt";
import {
  reviewItemsGeneratorOutputSchema,
  type ReviewItemsGeneratorOutput,
} from "@/modules/interview/validations/interview-schemas";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export type ReviewItemsGeneratorInput = {
  transcript: string;
  existingItems: ExistingReviewItemForPrompt[];
  structuredSummary: StructuredSummary;
};

export type StructuredReviewModel = {
  invoke: (input: unknown) => Promise<unknown>;
};

export type ReviewItemsGeneratorNodeDeps = {
  model?: ChatOpenAI;
  structuredModel?: StructuredReviewModel;
};

export function createReviewItemsGeneratorNode(
  deps: ReviewItemsGeneratorNodeDeps = {},
) {
  const structuredModel =
    deps.structuredModel ??
    (deps.model ?? createReviewModel()).withStructuredOutput(
      reviewItemsGeneratorOutputSchema,
    );

  return async function reviewItemsGeneratorNode(
    input: ReviewItemsGeneratorInput,
  ): Promise<ReviewItemsGeneratorOutput> {
    const promptText = buildReviewItemsGeneratorPrompt({
      transcript: input.transcript,
      existingItems: input.existingItems,
      structuredSummary: input.structuredSummary,
    });

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["human", promptText],
    ]);
    const chain = promptTemplate.pipe(structuredModel);
    const raw = await chain.invoke({});
    return reviewItemsGeneratorOutputSchema.parse(raw);
  };
}
