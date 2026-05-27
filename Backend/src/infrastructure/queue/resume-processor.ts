import type { ChatOpenAI } from "@langchain/openai";

import { extractPdfText } from "@/infrastructure/pdf/extract-pdf-text";
import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import { buildResumeExtractionPrompt } from "@/modules/resumes/prompts/resume-extraction-prompt";
import { structuredSummarySchema } from "@/modules/resumes/validations/resume-schemas";
import { logger } from "@/shared";

export type PdfTextExtractor = (buffer: Buffer) => Promise<string>;

export type ResumeProcessorDeps = {
  resumeRepository: ResumeRepository;
  objectStorage: IObjectStorage;
  extractionModel: ChatOpenAI;
  extractText?: PdfTextExtractor; // optional dependency for testing
};

export class ResumeProcessor {
  constructor(private readonly deps: ResumeProcessorDeps) {}

  async process(resumeId: string): Promise<void> {
    const { resumeRepository, objectStorage, extractionModel } = this.deps;
    const extractText = this.deps.extractText ?? extractPdfText;

    const resume = await resumeRepository.findById(resumeId);

    if (!resume) {
      logger.warn(`Resume job skipped: resume ${resumeId} not found`);
      return;
    }

    try {
      const pdfBuffer = await objectStorage.get(resume.pdfUrl);
      const rawText = await extractText(pdfBuffer);

      if (!rawText.trim()) {
        throw new Error("PDF contains no extractable text");
      }

      const structuredModel = extractionModel.withStructuredOutput(
        structuredSummarySchema,
      );
      const structuredSummary = await structuredModel.invoke([
        {
          role: "user",
          content: buildResumeExtractionPrompt(rawText),
        },
      ]);

      await resumeRepository.updateReady(resumeId, structuredSummary, rawText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Resume processing failed";

      await resumeRepository.updateFailed(resumeId, message);
    }
  }
}
