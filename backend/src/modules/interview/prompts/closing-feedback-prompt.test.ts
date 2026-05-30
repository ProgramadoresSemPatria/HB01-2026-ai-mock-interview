import { describe, expect, it } from "vitest";

import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

import {
  buildClosingFeedbackPrompt,
  CLOSING_GUARDRAILS_HEADER,
  CLOSING_RESUME_HEADER,
} from "./closing-feedback-prompt";

const sampleSummary: StructuredSummary = {
  personal_info: {
    name: "Alex",
    title: "Backend Engineer",
    about: "",
  },
  skills: ["TypeScript"],
  experiences: [
    {
      company: "Acme",
      role: "Engineer",
      highlights: ["Built APIs"],
    },
  ],
  projects: [],
  certifications: [],
};

const LEVEL_INSTRUCTION_CASES = [
  [
    "entry" as const,
    "The candidate completed an entry-level mock interview. Tailor feedback to fundamentals, learning mindset, and clear communication.",
  ],
  [
    "mid" as const,
    "The candidate completed a mid-level mock interview. Tailor feedback to ownership, trade-offs, and practical experience.",
  ],
  [
    "senior" as const,
    "The candidate completed a senior-level mock interview. Tailor feedback to system design, leadership, and strategic impact.",
  ],
] as const;

describe("buildClosingFeedbackPrompt", () => {
  it("includes the security guardrails section", () => {
    const prompt = buildClosingFeedbackPrompt({
      level: "mid",
      resumeSummary: sampleSummary,
    });

    expect(prompt).toContain(CLOSING_GUARDRAILS_HEADER);
  });

  it.each(LEVEL_INSTRUCTION_CASES)(
    "includes level-specific instructions for %s",
    (level, expectedInstruction) => {
      const prompt = buildClosingFeedbackPrompt({
        level,
        resumeSummary: sampleSummary,
      });

      expect(prompt).toContain(expectedInstruction);
    },
  );

  it("renders résumé as markdown summary", () => {
    const prompt = buildClosingFeedbackPrompt({
      level: "mid",
      resumeSummary: sampleSummary,
    });

    expect(prompt).toContain(CLOSING_RESUME_HEADER);
    expect(prompt).toContain("**Name:** Alex");
    expect(prompt).toContain("**Title:** Backend Engineer");
    expect(prompt).not.toContain(JSON.stringify(sampleSummary, null, 2));
  });
});
