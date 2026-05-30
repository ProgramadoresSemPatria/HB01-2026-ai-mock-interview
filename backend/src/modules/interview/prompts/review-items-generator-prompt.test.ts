import { describe, expect, it } from "vitest";

import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

import {
  buildReviewItemsGeneratorPrompt,
  EXISTING_ITEMS_SECTION_HEADER,
  REVIEW_INSTRUCTIONS_SECTION_HEADER,
  STRUCTURED_SUMMARY_SECTION_HEADER,
  TRANSCRIPT_SECTION_HEADER,
  type ExistingReviewItemForPrompt,
} from "./review-items-generator-prompt";

const sampleSummary: StructuredSummary = {
  personal_info: {
    name: "Alex",
    title: "Backend Engineer",
    about: "",
  },
  skills: ["TypeScript", "PostgreSQL"],
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

const sampleTranscript =
  "Interviewer: Tell me about yourself.\nCandidate: I build APIs.";

const sampleExistingItems: ExistingReviewItemForPrompt[] = [
  {
    topic: "System design",
    description: "Limited depth on scalability trade-offs",
    priority: "medium",
  },
];

describe("buildReviewItemsGeneratorPrompt", () => {
  it("places transcript, existing items, structured summary, then instructions", () => {
    const prompt = buildReviewItemsGeneratorPrompt({
      transcript: sampleTranscript,
      existingItems: [],
      structuredSummary: sampleSummary,
    });

    const transcriptIndex = prompt.indexOf(TRANSCRIPT_SECTION_HEADER);
    const existingIndex = prompt.indexOf(EXISTING_ITEMS_SECTION_HEADER);
    const summaryIndex = prompt.indexOf(STRUCTURED_SUMMARY_SECTION_HEADER);
    const instructionsIndex = prompt.indexOf(REVIEW_INSTRUCTIONS_SECTION_HEADER);

    expect(transcriptIndex).toBeGreaterThanOrEqual(0);
    expect(existingIndex).toBeGreaterThan(transcriptIndex);
    expect(summaryIndex).toBeGreaterThan(existingIndex);
    expect(instructionsIndex).toBeGreaterThan(summaryIndex);
  });

  it("renders (none) when existingItems is empty", () => {
    const prompt = buildReviewItemsGeneratorPrompt({
      transcript: sampleTranscript,
      existingItems: [],
      structuredSummary: sampleSummary,
    });

    expect(prompt).toContain(`${EXISTING_ITEMS_SECTION_HEADER}\n(none)`);
  });

  it("serializes non-empty existingItems as JSON in the prompt", () => {
    const prompt = buildReviewItemsGeneratorPrompt({
      transcript: sampleTranscript,
      existingItems: sampleExistingItems,
      structuredSummary: sampleSummary,
    });

    expect(prompt).toContain(
      `${EXISTING_ITEMS_SECTION_HEADER}\n${JSON.stringify(sampleExistingItems, null, 2)}`,
    );
    expect(prompt).not.toContain(`${EXISTING_ITEMS_SECTION_HEADER}\n(none)`);
  });

  it("embeds transcript and structured summary as markdown", () => {
    const prompt = buildReviewItemsGeneratorPrompt({
      transcript: sampleTranscript,
      existingItems: [],
      structuredSummary: sampleSummary,
    });

    expect(prompt).toContain(sampleTranscript);
    expect(prompt).toContain("**Name:** Alex");
    expect(prompt).toContain("**Title:** Backend Engineer");
    expect(prompt).not.toContain(JSON.stringify(sampleSummary, null, 2));
  });
});
