import type { ReviewSessionTurn } from "@/modules/review-sessions/protocols/review-session-question-generator";

export const PERSONA_SECTION_HEADER = "## Role";
export const TOPIC_SECTION_HEADER = "## Topic";
export const DESCRIPTION_SECTION_HEADER = "## Description";
export const PRIOR_TURNS_SECTION_HEADER = "## Prior Q&A for this topic";
export const INSTRUCTIONS_SECTION_HEADER = "## Instructions";

export type BuildReviewSessionQuestionPromptParams = {
  topic: string;
  description: string;
  turns: ReviewSessionTurn[];
};

function buildPersonaBlock(): string {
  return `${PERSONA_SECTION_HEADER}
You are probing a candidate's understanding of exactly one topic from their review list.`;
}

function buildPriorTurnsBlock(turns: ReviewSessionTurn[]): string | null {
  if (turns.length === 0) {
    return null;
  }

  const lines = turns.flatMap((turn, index) => [
    `Q${index + 1}: ${turn.question}`,
    `A${index + 1}: ${turn.answer}`,
  ]);

  return `${PRIOR_TURNS_SECTION_HEADER}
${lines.join("\n")}`;
}

function buildInstructionsBlock(): string {
  return `${INSTRUCTIONS_SECTION_HEADER}
Ask exactly one focused question. No preamble, introduction, or explanation before the question.`;
}

export function buildReviewSessionQuestionPrompt(
  params: BuildReviewSessionQuestionPromptParams,
): string {
  const sections = [
    buildPersonaBlock(),
    `${TOPIC_SECTION_HEADER}
${params.topic}`,
    `${DESCRIPTION_SECTION_HEADER}
${params.description}`,
  ];

  const priorTurns = buildPriorTurnsBlock(params.turns);
  if (priorTurns) {
    sections.push(priorTurns);
  }

  sections.push(buildInstructionsBlock());

  return sections.join("\n\n");
}
