import { z } from "zod";

export const interviewLocaleSchema = z.enum(["en", "pt"]);

export type InterviewLocale = z.infer<typeof interviewLocaleSchema>;

export const LANGUAGE_SECTION_HEADER = "## Language";

const INTERVIEW_LOCALE_PROMPT: Record<InterviewLocale, string> = {
  en: "Conduct and write all user-facing output in English only.",
  pt: "Conduct and write all user-facing output in Portuguese only.",
};

export type ClosingFeedbackCopy = {
  wentWellHeader: string;
  workOnHeader: string;
  cta: string;
  replyInstruction: string;
};

const CLOSING_FEEDBACK_COPY: Record<InterviewLocale, ClosingFeedbackCopy> = {
  en: {
    wentWellHeader: "## What went well",
    workOnHeader: "## What to work on",
    cta: "Your review items are being generated and will be available shortly",
    replyInstruction: "Reply in English.",
  },
  pt: {
    wentWellHeader: "## O que você fez bem",
    workOnHeader: "## O que precisa trabalhar",
    cta: "Seus itens estão sendo gerados, estarão disponíveis em breve",
    replyInstruction: "Reply in Portuguese.",
  },
};

export function buildInterviewLocalePromptBlock(
  locale: InterviewLocale,
): string {
  return `${LANGUAGE_SECTION_HEADER}
${INTERVIEW_LOCALE_PROMPT[locale]}`;
}

export function getClosingFeedbackCopy(
  locale: InterviewLocale,
): ClosingFeedbackCopy {
  return CLOSING_FEEDBACK_COPY[locale];
}
