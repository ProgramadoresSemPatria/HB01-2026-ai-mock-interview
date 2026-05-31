import { AIMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";
import { describe, expect, it, vi } from "vitest";

import {
  CLOSING_EVALUATE_HEADER,
  CLOSING_FEEDBACK_CTA,
  CLOSING_FORMAT_HEADER,
} from "@/modules/interview/prompts/closing-feedback-prompt";
import { CONDUCT_SECTION_HEADER } from "@/modules/interview/prompts/interviewer-system-prompt";

import { createInitialInterviewState } from "../interview-state";
import { createInterviewerNode } from "./interviewer-node";

const sampleResumeSummary = {
  personal_info: { name: "Heno", title: "Engineer", about: "" },
  skills: ["TypeScript"],
  experiences: [
    { company: "Acme", role: "Dev", highlights: ["APIs"] },
  ],
  projects: [],
  certifications: [],
};

function createMockModel(content = "Model output") {
  const invoke = vi.fn().mockResolvedValue(new AIMessage({ content }));
  return {
    invoke,
    model: { invoke } as unknown as ChatOpenAI,
  };
}

describe("createInterviewerNode", () => {
  const baseState = createInitialInterviewState({
    turnCount: 2,
    maxTurns: 7,
    level: "mid",
    userId: 1,
    resumeSummary: sampleResumeSummary,
  });

  it("invokes with interviewer system prompt when runReview is false", async () => {
    const { invoke, model } = createMockModel("Next question?");
    const node = createInterviewerNode({ model });

    await node({ ...baseState, runReview: false });

    const messages = invoke.mock.calls[0]?.[0] as Array<{ content: string }>;
    const systemContent = messages[0]?.content ?? "";

    expect(systemContent).toContain(CONDUCT_SECTION_HEADER);
    expect(systemContent).not.toContain(CLOSING_EVALUATE_HEADER);
  });

  it("invokes with closing feedback prompt when runReview is true", async () => {
    const { invoke, model } = createMockModel(
      "## What you did well\n\n- Good depth",
    );
    const node = createInterviewerNode({ model });

    await node({ ...baseState, runReview: true });

    const messages = invoke.mock.calls[0]?.[0] as Array<{ content: string }>;
    const systemContent = messages[0]?.content ?? "";

    expect(systemContent).toContain(CLOSING_EVALUATE_HEADER);
    expect(systemContent).toContain(CLOSING_FORMAT_HEADER);
    expect(systemContent).not.toContain(CONDUCT_SECTION_HEADER);
  });

  it("appends closing CTA to AI message when runReview is true", async () => {
    const model = createMockModel("Session feedback body");
    const node = createInterviewerNode({ model });

    const result = await node({ ...baseState, runReview: true });

    expect(result.messages[0]?.content).toContain("Session feedback body");
    expect(result.messages[0]?.content).toContain(CLOSING_FEEDBACK_CTA);
  });

  it("does not append closing CTA when runReview is false", async () => {
    const model = createMockModel("What trade-offs did you consider?");
    const node = createInterviewerNode({ model });

    const result = await node({ ...baseState, runReview: false });

    expect(result.messages[0]?.content).toBe(
      "What trade-offs did you consider?",
    );
    expect(result.messages[0]?.content).not.toContain(CLOSING_FEEDBACK_CTA);
  });
});
