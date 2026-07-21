import { beforeEach, describe, expect, it, vi } from "vitest";

import type { createWeakAnswersGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/weak-answers-generator-node";
import { WeakAnswersGeneratorAdapter } from "@/infrastructure/ai/langgraph/weak-answers-generator-adapter";
import type { WeakAnswersGeneratorParams } from "@/modules/interview/protocols/weak-answers-generator";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

const structuredSummary: StructuredSummary = {
  personal_info: { name: "Jane", title: "Engineer", about: "" },
  skills: ["TypeScript"],
  experiences: [],
  projects: [],
  certifications: [],
};

const baseParams: WeakAnswersGeneratorParams = {
  userId: 42,
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  transcript: "ai: Tell me about yourself.\nhuman: I build APIs.",
  structuredSummary,
};

describe("WeakAnswersGeneratorAdapter", () => {
  let generateItems: ReturnType<typeof createWeakAnswersGeneratorNode>;
  let adapter: WeakAnswersGeneratorAdapter;

  beforeEach(() => {
    generateItems = vi.fn();
    adapter = new WeakAnswersGeneratorAdapter(generateItems);
  });

  it("delegates to the generator node with transcript, resume, and job description", async () => {
    const generated = {
      items: [
        {
          question: "Tell me about yourself.",
          userAnswer: "I build APIs.",
          evaluation: "insufficient" as const,
          feedback: "Give more concrete examples.",
          topic: "Communication",
          priority: "medium" as const,
        },
      ],
    };
    vi.mocked(generateItems).mockResolvedValue(generated);

    const result = await adapter.generate({
      ...baseParams,
      jobDescription: "Backend Engineer",
    });

    expect(generateItems).toHaveBeenCalledWith(
      {
        transcript: baseParams.transcript,
        structuredSummary: baseParams.structuredSummary,
        jobDescription: "Backend Engineer",
      },
      undefined,
    );
    expect(result).toEqual(generated);
  });

  it("forwards callbacks when provided", async () => {
    vi.mocked(generateItems).mockResolvedValue({ items: [] });
    const callback = {} as never;

    await adapter.generate(baseParams, { callbacks: [callback] });

    expect(generateItems).toHaveBeenCalledWith(
      expect.objectContaining({ transcript: baseParams.transcript }),
      { callbacks: [callback] },
    );
  });
});
