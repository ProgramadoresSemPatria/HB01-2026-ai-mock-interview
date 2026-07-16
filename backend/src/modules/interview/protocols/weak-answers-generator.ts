import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { WeakAnswersGeneratorOutput } from "@/modules/interview/validations/interview-schemas";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export type WeakAnswersGeneratorParams = {
  userId: number;
  sessionId: string;
  transcript: string;
  structuredSummary: StructuredSummary;
  jobDescription?: string | null;
};

export type WeakAnswersGeneratorOptions = {
  callbacks?: BaseCallbackHandler[];
};

export interface IWeakAnswersGenerator {
  generate(
    params: WeakAnswersGeneratorParams,
    options?: WeakAnswersGeneratorOptions,
  ): Promise<WeakAnswersGeneratorOutput>;
}
