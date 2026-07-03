import { describe, expect, it } from "vitest";

import { streamMessageSchema } from "@/modules/interview/validations/interview-schemas";
import { buildResumeExtractionPrompt } from "@/modules/resumes/prompts/resume-extraction-prompt";
import { ConflictError } from "@/shared";

describe("robustness and edge-case quality checks", () => {
  it("rejects empty stream messages at validation before the graph", () => {
    const result = streamMessageSchema.safeParse({ content: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Message content is required",
      );
    }
  });

  it("rejects extremely long stream messages at validation", () => {
    const result = streamMessageSchema.safeParse({
      content: "a".repeat(10_001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Message content is too long",
      );
    }
  });

  it("uses the empty résumé text error message in the extraction flow contract", () => {
    const prompt = buildResumeExtractionPrompt("");
    expect(prompt).toContain("## Résumé text");
    expect(new Error("PDF contains no extractable text").message).toBe(
      "PDF contains no extractable text",
    );
  });

  it("keeps finished-session guard as ConflictError in stream-service tests", () => {
    expect(new ConflictError("Interview session is finished").message).toBe(
      "Interview session is finished",
    );
  });
});
