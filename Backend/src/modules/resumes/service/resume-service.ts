import { randomUUID } from "node:crypto";

import type { Resume } from "../../../../prisma/generated/client";
import { ResumeStatus } from "../../../../prisma/generated/client";
import { env } from "@/config/env";
import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";
import type { IResumeQueue } from "@/modules/resumes/protocols/resume-queue";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";
import {
  BadGatewayError,
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/shared";
const PDF_MIME_TYPE = "application/pdf";

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
    private readonly maxBytes: number = env.RESUME_MAX_BYTES,
  ) {}

  async uploadPdf(
    userId: number,
    file: Express.Multer.File,
  ): Promise<ResumePreview> {
    this.validatePdfFile(file);

    const resumeId = randomUUID();
    const pdfKey = `users/${userId}/resumes/${resumeId}.pdf`;

    const resume = await this.resumeRepository.createProcessing(
      userId,
      file.originalname,
      pdfKey,
      resumeId,
    );

    try {
      await this.objectStorage.put(pdfKey, file.buffer, PDF_MIME_TYPE);
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

function toResumePreview(resume: Resume): ResumePreview {
  return {
    id: resume.id,
    name: resume.name,
    status: resume.status,
    createdAt: resume.createdAt,
  };
}

function toResumeDetail(resume: Resume): ResumeDetail {
  const preview = toResumePreview(resume);

  if (resume.status !== ResumeStatus.ready || resume.structuredSummary === null) {
    return preview;
  }

  return {
    ...preview,
    structuredSummary: resume.structuredSummary as StructuredSummary,
  };
}
