import { randomUUID } from "node:crypto";

import type { ChatOpenAI } from "@langchain/openai";

import {
  RESUME_STATUS,
  type ResumeRecord,
  type ResumeStatus,
} from "@/modules/resumes/types/resume-record";
import { env } from "@/config/env";
import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";
import type { IResumeQueue } from "@/modules/resumes/protocols/resume-queue";
import { buildResumeExtractionPrompt } from "@/modules/resumes/prompts/resume-extraction-prompt";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import {
  structuredSummarySchema,
  type StructuredSummary,
} from "@/modules/resumes/validations/resume-schemas";
import {
  BadGatewayError,
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/shared";

const PDF_MIME_TYPE = "application/pdf";

export type PdfTextExtractor = (buffer: Buffer) => Promise<string>;

export type ResumeProcessResult =
  | { status: "ready"; resumeId: string }
  | { status: "failed"; resumeId: string; error: string; cause?: unknown }
  | { status: "skipped"; resumeId: string; reason: "not_found" };

export type ResumePreview = {
  id: string;
  name: string;
  status: ResumeStatus;
  createdAt: Date;
};

export type ResumeDetail = ResumePreview & {
  structuredSummary?: StructuredSummary;
};

export class ResumeService {
  constructor(
    private readonly resumeRepository: ResumeRepository,
    private readonly objectStorage: IObjectStorage,
    private readonly resumeQueue: IResumeQueue,
    private readonly extractionModel: ChatOpenAI,
    private readonly extractText: PdfTextExtractor,
    private readonly maxBytes: number = env.RESUME_MAX_BYTES,
  ) {}

  async uploadPdf(
    userId: number,
    file: Express.Multer.File,
  ): Promise<ResumePreview> {
    this.validatePdfFile(file);

    const resumeId = randomUUID();
    const storageKey = `users/${userId}/resumes/${resumeId}.pdf`;
    const pdfUrl = storageKey;

    const resume = await this.resumeRepository.createProcessing(
      userId,
      file.originalname,
      pdfUrl,
      storageKey,
      resumeId,
    );

    try {
      await this.objectStorage.put(storageKey, file.buffer, PDF_MIME_TYPE);
    } catch {
      await this.resumeRepository.updateFailed(
        resume.id,
        "Failed to upload PDF to storage",
      );
      throw new BadGatewayError("Failed to upload PDF");
    }

    try {
      await this.resumeQueue.add({ resumeId: resume.id });
    } catch {
      await this.resumeRepository.updateFailed(
        resume.id,
        "Failed to enqueue resume processing",
      );
      throw new ServiceUnavailableError("Resume processing is unavailable");
    }

    return toResumePreview(resume);
  }

  async getResume(userId: number, id: string): Promise<ResumeDetail> {
    const resume = await this.resumeRepository.findByIdAndUserId(id, userId);

    if (!resume) {
      throw new NotFoundError("Resume not found");
    }

    return toResumeDetail(resume);
  }

  async process(resumeId: string): Promise<ResumeProcessResult> {
    const resume = await this.resumeRepository.findById(resumeId);

    if (!resume) {
      return { status: "skipped", resumeId, reason: "not_found" };
    }

    try {
      const pdfBuffer = await this.objectStorage.get(resume.storageKey);
      const rawText = await this.extractText(pdfBuffer);

      if (!rawText.trim()) {
        throw new Error("PDF contains no extractable text");
      }

      const structuredModel = this.extractionModel.withStructuredOutput(
        structuredSummarySchema,
      );
      const structuredSummary = await structuredModel.invoke([
        {
          role: "user",
          content: buildResumeExtractionPrompt(rawText),
        },
      ]);

      await this.resumeRepository.updateReady(
        resumeId,
        structuredSummary,
        rawText,
      );
      return { status: "ready", resumeId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Resume processing failed";

      await this.resumeRepository.updateFailed(resumeId, message);
      return { status: "failed", resumeId, error: message, cause: error };
    }
  }

  private validatePdfFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestError("PDF file is required");
    }

    if (file.mimetype !== PDF_MIME_TYPE) {
      throw new BadRequestError("Only PDF files are allowed");
    }

    if (file.size > this.maxBytes) {
      throw new BadRequestError(
        `PDF file must be at most ${this.maxBytes} bytes`,
      );
    }
  }
}

function toResumePreview(resume: ResumeRecord): ResumePreview {
  return {
    id: resume.id,
    name: resume.name,
    status: resume.status,
    createdAt: resume.createdAt,
  };
}

function toResumeDetail(resume: ResumeRecord): ResumeDetail {
  const preview = toResumePreview(resume);

  if (resume.status !== RESUME_STATUS.ready || resume.structuredSummary === null) {
    return preview;
  }

  return {
    ...preview,
    structuredSummary: resume.structuredSummary as StructuredSummary,
  };
}
