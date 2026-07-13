import type { createWeakAnswersGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/weak-answers-generator-node";
import type {
  IWeakAnswersGenerator,
  WeakAnswersGeneratorOptions,
  WeakAnswersGeneratorParams,
} from "@/modules/interview/protocols/weak-answers-generator";

export class WeakAnswersGeneratorAdapter implements IWeakAnswersGenerator {
  constructor(
    private readonly generateItems: ReturnType<
      typeof createWeakAnswersGeneratorNode
    >,
  ) {}

  async generate(
    params: WeakAnswersGeneratorParams,
    options?: WeakAnswersGeneratorOptions,
  ) {
    return this.generateItems(
      {
        transcript: params.transcript,
        structuredSummary: params.structuredSummary,
        jobDescription: params.jobDescription,
      },
      options?.callbacks ? { callbacks: options.callbacks } : undefined,
    );
  }
}
