import { describe, expect, it } from "vitest";

import {
  appendClosingFeedbackCta,
  buildClosingFeedbackPrompt,
  CLOSING_FEEDBACK_CTA,
  CLOSING_FORMAT_HEADER,
  CLOSING_SECURITY_HEADER,
  closingFeedbackCtaStreamSuffix,
} from "@/modules/interview/prompts/closing-feedback-prompt";
import {
  buildInterviewLocalePromptBlock,
  getClosingFeedbackCopy,
  LANGUAGE_SECTION_HEADER,
} from "@/shared/interview-locale/interview-locale";

const sampleResumeSummary = {
  personal_info: { name: "Jane", title: "Engineer", about: "" },
  skills: ["TypeScript"],
  experiences: [{ company: "Acme", role: "Dev", highlights: ["APIs"] }],
  projects: [],
  certifications: [],
};

describe("buildClosingFeedbackPrompt interviewLocale", () => {
  const baseParams = {
    level: "mid" as const,
    resumeSummary: sampleResumeSummary,
  };

  it("ends with the locale language block for en and uses English closing copy", () => {
    const copy = getClosingFeedbackCopy("en");
    const prompt = buildClosingFeedbackPrompt({
      ...baseParams,
      interviewLocale: "en",
    });

    expect(prompt.endsWith(buildInterviewLocalePromptBlock("en"))).toBe(true);
    expect(prompt).toContain(copy.wentWellHeader);
    expect(prompt).toContain(copy.workOnHeader);
    expect(prompt).toContain(copy.replyInstruction);
    expect(prompt).toContain(CLOSING_FORMAT_HEADER);
    expect(prompt).not.toContain(getClosingFeedbackCopy("pt").wentWellHeader);
    expect(prompt).not.toContain("Reply in Portuguese.");
    expect(prompt.lastIndexOf(LANGUAGE_SECTION_HEADER)).toBeGreaterThan(
      prompt.indexOf(CLOSING_SECURITY_HEADER),
    );
  });

  it("ends with the locale language block for pt and uses Portuguese closing copy", () => {
    const copy = getClosingFeedbackCopy("pt");
    const prompt = buildClosingFeedbackPrompt({
      ...baseParams,
      interviewLocale: "pt",
    });

    expect(prompt.endsWith(buildInterviewLocalePromptBlock("pt"))).toBe(true);
    expect(prompt).toContain(copy.wentWellHeader);
    expect(prompt).toContain(copy.workOnHeader);
    expect(prompt).toContain(copy.replyInstruction);
    expect(copy.cta).toBe(CLOSING_FEEDBACK_CTA);
    expect(prompt).not.toContain(getClosingFeedbackCopy("en").wentWellHeader);
    expect(prompt).not.toContain("Reply in English.");
  });

  it("does not hardcode Portuguese-only format when locale is en", () => {
    const prompt = buildClosingFeedbackPrompt({
      ...baseParams,
      interviewLocale: "en",
    });

    expect(prompt).not.toMatch(/Reply in Portuguese\./);
    expect(prompt).toContain("## What went well");
    expect(prompt).toContain("## What to work on");
  });
});

describe("closing feedback CTA helpers", () => {
  it("appendClosingFeedbackCta uses localized CTA", () => {
    const enCta = getClosingFeedbackCopy("en").cta;
    const ptCta = getClosingFeedbackCopy("pt").cta;

    expect(appendClosingFeedbackCta("body", "en")).toBe(`body\n\n${enCta}`);
    expect(appendClosingFeedbackCta("body", "pt")).toBe(`body\n\n${ptCta}`);
    expect(appendClosingFeedbackCta(`body\n\n${enCta}`, "en")).toBe(
      `body\n\n${enCta}`,
    );
  });

  it("closingFeedbackCtaStreamSuffix uses localized CTA", () => {
    expect(closingFeedbackCtaStreamSuffix("en")).toBe(
      `\n\n${getClosingFeedbackCopy("en").cta}`,
    );
    expect(closingFeedbackCtaStreamSuffix("pt")).toBe(
      `\n\n${getClosingFeedbackCopy("pt").cta}`,
    );
  });
});
