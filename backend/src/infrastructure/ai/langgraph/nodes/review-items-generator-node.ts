import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { RunnableConfig } from "@langchain/core/runnables";
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
  jobDescription?: string | null;
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
    config?: RunnableConfig,
  ): Promise<ReviewItemsGeneratorOutput> {
    const promptText = buildReviewItemsGeneratorPrompt({
      transcript: input.transcript,
      existingItems: input.existingItems,
      structuredSummary: input.structuredSummary,
      jobDescription: input.jobDescription,
    });

    // Pass prompt as a template variable so JSON braces in existing items are not
    // parsed as LangChain input placeholders (INVALID_PROMPT_INPUT).
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["human", "{prompt}"],
    ]);
    const chain = promptTemplate.pipe(structuredModel);
    const invokeInput = { prompt: promptText };
    const raw = config
      ? await chain.invoke(invokeInput, config)
      : await chain.invoke(invokeInput);
    return reviewItemsGeneratorOutputSchema.parse(raw);
  };
}
