import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import { resumeToMarkdown } from "@/modules/resumes/format/resume-to-markdown";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export const PERSONA_SECTION_HEADER = "## Role";
export const TRANSCRIPT_SECTION_HEADER = "## Interview transcript";
export const EXISTING_ITEMS_SECTION_HEADER = "## Existing review items";
export const CANDIDATE_RESUME_SECTION_HEADER = "## Candidate r?sum?";
export const INSTRUCTIONS_SECTION_HEADER = "## Instructions";

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

function buildPersonaBlock(): string {
  return `${PERSONA_SECTION_HEADER}
You are a Tech Lead reviewing an interview to identify learning gaps.
Focus on what the candidate demonstrated ? and what they did not ? relative to the role and curriculum.`;
}

function buildInstructionsBlock(): string {
  return `${INSTRUCTIONS_SECTION_HEADER}
Identify gaps and weaknesses from the interview. Emit one item per distinct topic.

- New topic (not in existing list): create with an appropriate priority.
- Existing topic match: reuse the exact topic string, update the description, and raise priority
  if the interview reinforces the gap (low to medium or high; medium to high; never lower an existing priority).
- No duplicate topics in a single response.`;
}

export function buildReviewItemsGeneratorPrompt(
  params: BuildReviewItemsGeneratorPromptParams,
): string {
  return [
    buildPersonaBlock(),
    `${TRANSCRIPT_SECTION_HEADER}
${params.transcript}`,
    buildExistingItemsBlock(params.existingItems),
    `${CANDIDATE_RESUME_SECTION_HEADER}
${resumeToMarkdown(params.structuredSummary)}`,
    buildInstructionsBlock(),
  ].join("\n\n");
}
