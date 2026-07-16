import { buildJobDescriptionBlock } from "@/modules/interview/prompts/interviewer-system-prompt";
import { resumeToMarkdown } from "@/modules/resumes/format/resume-to-markdown";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export const PERSONA_SECTION_HEADER = "## Role";
export const TRANSCRIPT_SECTION_HEADER = "## Interview transcript";
export const CANDIDATE_RESUME_SECTION_HEADER = "## Candidate r?sum?";
export const INSTRUCTIONS_SECTION_HEADER = "## Instructions";

export type BuildWeakAnswersGeneratorPromptParams = {
  transcript: string;
  structuredSummary: StructuredSummary;
  jobDescription?: string | null;
};

function buildPersonaBlock(): string {
  return `${PERSONA_SECTION_HEADER}
You are a Tech Lead grading each answer a candidate gave during a mock interview.
Evaluate every question the interviewer asked and the answer the candidate gave for it.`;
}

function buildInstructionsBlock(hasJobDescription: boolean): string {
  const targetRoleClause = hasJobDescription
    ? "\n- When a target role is provided, weigh correctness and depth against those job requirements."
    : "";

  return `${INSTRUCTIONS_SECTION_HEADER}
For every interviewer question paired with a candidate answer in the transcript, evaluate the answer as one of:
- "incorrect": the answer is factually wrong or misses the point of the question.
- "incomplete": the answer is on the right track but leaves out important parts.
- "insufficient": the answer is too shallow, vague, or unsupported to demonstrate competence.
- "satisfactory": the answer adequately demonstrates the candidate's knowledge.

Only emit an item in the output for answers evaluated as "incorrect", "incomplete", or "insufficient".
Do not emit items for "satisfactory" answers.

For each emitted item, include:
- question: the interviewer's question, verbatim from the transcript.
- userAnswer: the candidate's answer, verbatim from the transcript.
- evaluation: one of "incorrect", "incomplete", or "insufficient".
- feedback: specific, actionable guidance on what the candidate should study or improve.
- topic: a short category label for the underlying skill or knowledge area (e.g. "system design", "TypeScript generics").
- priority: "low", "medium", or "high" review priority based on how critical the gap is for the role.${targetRoleClause}`;
}

export function buildWeakAnswersGeneratorPrompt(
  params: BuildWeakAnswersGeneratorPromptParams,
): string {
  const hasJobDescription = Boolean(params.jobDescription);
  const sections = [
    buildPersonaBlock(),
    `${TRANSCRIPT_SECTION_HEADER}
${params.transcript}`,
    `${CANDIDATE_RESUME_SECTION_HEADER}
${resumeToMarkdown(params.structuredSummary)}`,
  ];

  if (params.jobDescription) {
    sections.push(buildJobDescriptionBlock(params.jobDescription));
  }

  sections.push(buildInstructionsBlock(hasJobDescription));

  return sections.join("\n\n");
}
