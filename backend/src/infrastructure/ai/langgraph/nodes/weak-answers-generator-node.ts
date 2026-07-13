import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { ChatOpenAI } from "@langchain/openai";

import { createReviewModel } from "@/infrastructure/ai/openai-models";
import { buildWeakAnswersGeneratorPrompt } from "@/modules/interview/prompts/weak-answers-generator-prompt";
import {
  weakAnswersGeneratorOutputSchema,
  type WeakAnswersGeneratorOutput,
} from "@/modules/interview/validations/interview-schemas";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export type WeakAnswersGeneratorInput = {
  transcript: string;
  structuredSummary: StructuredSummary;
  jobDescription?: string | null;
};

export type StructuredWeakAnswersModel = {
  invoke: (input: unknown) => Promise<unknown>;
};

export type WeakAnswersGeneratorNodeDeps = {
  model?: ChatOpenAI;
  structuredModel?: StructuredWeakAnswersModel;
};

export function createWeakAnswersGeneratorNode(
  deps: WeakAnswersGeneratorNodeDeps = {},
) {
  const structuredModel =
    deps.structuredModel ??
    (deps.model ?? createReviewModel()).withStructuredOutput(
      weakAnswersGeneratorOutputSchema,
    );

  return async function weakAnswersGeneratorNode(
    input: WeakAnswersGeneratorInput,
    config?: RunnableConfig,
  ): Promise<WeakAnswersGeneratorOutput> {
    const promptText = buildWeakAnswersGeneratorPrompt({
      transcript: input.transcript,
      structuredSummary: input.structuredSummary,
      jobDescription: input.jobDescription,
    });

    // Pass prompt as a template variable so transcript content is not parsed
    // as LangChain input placeholders (INVALID_PROMPT_INPUT).
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["human", "{prompt}"],
    ]);
    const chain = promptTemplate.pipe(structuredModel);
    const invokeInput = { prompt: promptText };
    const raw = config
      ? await chain.invoke(invokeInput, config)
      : await chain.invoke(invokeInput);
    return weakAnswersGeneratorOutputSchema.parse(raw);
  };
}
