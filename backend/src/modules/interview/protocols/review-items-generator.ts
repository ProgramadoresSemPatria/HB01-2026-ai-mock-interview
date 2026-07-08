import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { ReviewItemsGeneratorOutput } from "@/modules/interview/validations/interview-schemas";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export type ReviewItemsGeneratorParams = {
  userId: number;
  sessionId: string;
  transcript: string;
  structuredSummary: StructuredSummary;
  jobDescription?: string | null;
};

export type ReviewItemsGeneratorOptions = {
  callbacks?: BaseCallbackHandler[];
};

export interface IReviewItemsGenerator {
  generate(
    params: ReviewItemsGeneratorParams,
    options?: ReviewItemsGeneratorOptions,
  ): Promise<ReviewItemsGeneratorOutput>;
}
