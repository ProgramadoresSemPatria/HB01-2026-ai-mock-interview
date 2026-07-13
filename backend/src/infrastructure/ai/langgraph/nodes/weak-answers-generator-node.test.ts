import { HumanMessage } from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { describe, expect, it, vi } from "vitest";

import {
  PERSONA_SECTION_HEADER,
  TRANSCRIPT_SECTION_HEADER,
} from "@/modules/interview/prompts/weak-answers-generator-prompt";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

import {
  createWeakAnswersGeneratorNode,
  type StructuredWeakAnswersModel,
  type WeakAnswersGeneratorInput,
} from "./weak-answers-generator-node";

const structuredSummary: StructuredSummary = {
  personal_info: { name: "Jane", title: "Engineer", about: "" },
  skills: ["TypeScript"],
  experiences: [],
  projects: [],
  certifications: [],
};

const baseInput: WeakAnswersGeneratorInput = {
  transcript: "ai: Tell me about yourself.\nhuman: I build APIs.",
  structuredSummary,
};

function humanMessageContentFromInvokeArg(input: unknown): string {
  if (
    typeof input === "object" &&
    input !== null &&
    "toChatMessages" in input &&
    typeof input.toChatMessages === "function"
  ) {
    const messages = input.toChatMessages() as HumanMessage[];
    return String(messages[0]?.content ?? "");
  }

  if (Array.isArray(input)) {
    return String((input[0] as HumanMessage | undefined)?.content ?? "");
  }

  return "";
}

describe("createWeakAnswersGeneratorNode", () => {
  it("invokes structuredModel via ChatPromptTemplate with rendered prompt content", async () => {
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
    const invoke = vi.fn().mockResolvedValue(generated);
    const node = createWeakAnswersGeneratorNode({
      structuredModel: RunnableLambda.from(
        invoke,
      ) as unknown as StructuredWeakAnswersModel,
    });

    const result = await node(baseInput);

    expect(invoke).toHaveBeenCalledOnce();
    const content = humanMessageContentFromInvokeArg(invoke.mock.calls[0]?.[0]);
    expect(content).toContain(TRANSCRIPT_SECTION_HEADER);
    expect(content).toContain(baseInput.transcript);
    expect(content).toContain(PERSONA_SECTION_HEADER);
    expect(content).toContain("grading each answer");
    expect(result).toEqual(generated);
  });

  it("propagates rejected structuredModel.invoke errors with the original message", async () => {
    const failure = new Error("OpenAI request failed after retries");
    const invoke = vi.fn().mockRejectedValue(failure);
    const node = createWeakAnswersGeneratorNode({
      structuredModel: RunnableLambda.from(
        invoke,
      ) as unknown as StructuredWeakAnswersModel,
    });

    await expect(node(baseInput)).rejects.toBe(failure);
    expect(failure.message).toBe("OpenAI request failed after retries");
  });

  it("throws when the model returns a satisfactory-only payload that fails schema shape", async () => {
    const invoke = vi.fn().mockResolvedValue({ items: [{ evaluation: "satisfactory" }] });
    const node = createWeakAnswersGeneratorNode({
      structuredModel: RunnableLambda.from(
        invoke,
      ) as unknown as StructuredWeakAnswersModel,
    });

    await expect(node(baseInput)).rejects.toBeDefined();
  });
});
