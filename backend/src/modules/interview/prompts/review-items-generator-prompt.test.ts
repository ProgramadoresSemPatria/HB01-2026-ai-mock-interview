import { describe, expect, it } from "vitest";

import {
  buildReviewItemsGeneratorPrompt,
  INSTRUCTIONS_SECTION_HEADER,
  LEVEL_SECTION_HEADER,
  REVIEW_LEVEL_BAR,
} from "@/modules/interview/prompts/review-items-generator-prompt";
import {
  buildInterviewLocalePromptBlock,
  LANGUAGE_SECTION_HEADER,
} from "@/shared/interview-locale/interview-locale";

const sampleResumeSummary = {
  personal_info: { name: "Jane", title: "Engineer", about: "" },
  skills: ["TypeScript"],
  experiences: [{ company: "Acme", role: "Dev", highlights: ["APIs"] }],
  projects: [],
  certifications: [],
};

describe("buildReviewItemsGeneratorPrompt interviewLocale", () => {
  const baseParams = {
    transcript: "Human: Tell me about caching.\nAI: How would you invalidate?",
    existingItems: [] as const,
    structuredSummary: sampleResumeSummary,
    level: "entry" as const,
  };

  it.each(["en", "pt"] as const)(
    "ends with the %s locale language block after instructions",
    (interviewLocale) => {
      const prompt = buildReviewItemsGeneratorPrompt({
        ...baseParams,
        existingItems: [],
        interviewLocale,
      });
      const localeBlock = buildInterviewLocalePromptBlock(interviewLocale);

      expect(prompt.endsWith(localeBlock)).toBe(true);
      expect(prompt.indexOf(INSTRUCTIONS_SECTION_HEADER)).toBeLessThan(
        prompt.lastIndexOf(LANGUAGE_SECTION_HEADER),
      );
    },
  );

  it("still ends with locale block when job description is present", () => {
    const prompt = buildReviewItemsGeneratorPrompt({
      ...baseParams,
      existingItems: [],
      interviewLocale: "en",
      jobDescription: "Senior backend engineer",
    });

    expect(prompt.endsWith(buildInterviewLocalePromptBlock("en"))).toBe(true);
  });
});

describe("buildReviewItemsGeneratorPrompt level calibration", () => {
  it.each(["entry", "mid", "senior"] as const)(
    "includes the %s level bar before the instructions",
    (level) => {
      const prompt = buildReviewItemsGeneratorPrompt({
        transcript: "Human: Hi\nAI: Hello",
        existingItems: [],
        structuredSummary: sampleResumeSummary,
        level,
      });

      expect(prompt).toContain(`${LEVEL_SECTION_HEADER}\n${level} — `);
      expect(prompt).toContain(REVIEW_LEVEL_BAR[level]);
      expect(prompt.indexOf(LEVEL_SECTION_HEADER)).toBeLessThan(
        prompt.indexOf(INSTRUCTIONS_SECTION_HEADER),
      );
    },
  );
});
