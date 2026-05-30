import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import { resumeToMarkdown } from "@/modules/resumes/format/resume-to-markdown";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export const TRANSCRIPT_SECTION_HEADER = "## Interview transcript";
export const EXISTING_ITEMS_SECTION_HEADER = "## Existing review items";
export const STRUCTURED_SUMMARY_SECTION_HEADER = "## Candidate structured summary";
export const REVIEW_INSTRUCTIONS_SECTION_HEADER = "## Review generation instructions";

export type ExistingReviewItemForPrompt = {
  topic: string;
  description: string;
  priority: ReviewPriority;
};

export type BuildReviewItemsGeneratorPromptParams = {
  transcript: string;
  existingItems: ExistingReviewItemForPrompt[];
  structuredSummary: StructuredSummary;
};

function buildExistingItemsBlock(
  existingItems: ExistingReviewItemForPrompt[],
): string {
  if (existingItems.length === 0) {
    return `${EXISTING_ITEMS_SECTION_HEADER}
(none)`;
  }

  return `${EXISTING_ITEMS_SECTION_HEADER}
${JSON.stringify(existingItems, null, 2)}`;
}

function buildInstructionsBlock(): string {
  return `${REVIEW_INSTRUCTIONS_SECTION_HEADER}
- Identify gaps and weaknesses from the interview; emit one object per distinct topic.
- For topics not in the existing list, return a new topic, description, and appropriate priority.
- When a weakness matches an existing item, reuse the exact topic string from the list, update the description, and raise priority when the interview reinforces the gap (low→medium or high, medium→high; keep high if already high).
- Do not emit duplicate topics in one response.
- Do not lower priority for an existing topic.`;
}

export function buildReviewItemsGeneratorPrompt(
  params: BuildReviewItemsGeneratorPromptParams,
): string {
  return [
    `${TRANSCRIPT_SECTION_HEADER}
${params.transcript}`,
    buildExistingItemsBlock(params.existingItems),
    `${STRUCTURED_SUMMARY_SECTION_HEADER}
${resumeToMarkdown(params.structuredSummary)}`,
    buildInstructionsBlock(),
  ].join("\n\n");
}
