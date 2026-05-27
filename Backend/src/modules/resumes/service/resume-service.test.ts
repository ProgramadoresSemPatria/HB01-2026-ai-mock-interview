import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeStatus } from "../../../../prisma/generated/client";
import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";
import type { IResumeQueue } from "@/modules/resumes/protocols/resume-queue";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import {
  BadGatewayError,
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/shared";
import type { Request } from "express";

type UploadedFile = NonNullable<Request["file"]>;

import { ResumeService } from "./resume-service";

const mockRandomUUID = vi.hoisted(() => vi.fn());

vi.mock("node:crypto", () => ({
  randomUUID: mockRandomUUID,
}));

const sampleResume = {
  id: "resume-uuid",
  userId: 42,
  name: "Jane Doe CV.pdf",
  pdfUrl: "users/42/resumes/resume-uuid.pdf",
  structuredSummary: null,
  rawText: null,
  status: ResumeStatus.processing,
  errorMessage: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createPdfFile(
  overrides: Partial<UploadedFile> = {},
): UploadedFile {
  return {
    fieldname: "file",
    originalname: "resume.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    size: 1024,
    buffer: Buffer.from("%PDF-1.4"),
    destination: "",
    filename: "",
    path: "",
    stream: null as never,
    ...overrides,
  };
}

describe("ResumeService", () => {
  let resumeRepository: ResumeRepository;
  let objectStorage: IObjectStorage;
  let resumeQueue: IResumeQueue;
  let service: ResumeService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomUUID.mockReturnValue("resume-uuid");

    resumeRepository = {
      createProcessing: vi.fn(),
      updateFailed: vi.fn(),
      findByIdAndUserId: vi.fn(),
    } as unknown as ResumeRepository;

    objectStorage = {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      delete: vi.fn(),
    };

    resumeQueue = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    service = new ResumeService(resumeRepository, objectStorage, resumeQueue, 5_242_880);
  });

  describe("uploadPdf", () => {
    it("creates a processing resume, uploads to storage, and enqueues a job", async () => {
      vi.mocked(resumeRepository.createProcessing).mockResolvedValue(
        sampleResume,
      );

      const result = await service.uploadPdf(42, createPdfFile());

      expect(resumeRepository.createProcessing).toHaveBeenCalledWith(
        42,
        "resume.pdf",
        "users/42/resumes/resume-uuid.pdf",
        "resume-uuid",
      );
      expect(objectStorage.put).toHaveBeenCalledWith(
        "users/42/resumes/resume-uuid.pdf",
        expect.any(Buffer),
        "application/pdf",
      );
      expect(resumeQueue.add).toHaveBeenCalledWith({ resumeId: "resume-uuid" });
      expect(result).toEqual({
        id: "resume-uuid",
        name: "Jane Doe CV.pdf",
        status: ResumeStatus.processing,
        createdAt: sampleResume.createdAt,
      });
    });

    it("throws BadRequestError when file is missing", async () => {
      await expect(
        service.uploadPdf(42, undefined as unknown as UploadedFile),
      ).rejects.toThrow(BadRequestError);

      expect(resumeRepository.createProcessing).not.toHaveBeenCalled();
    });

    it("throws BadRequestError for non-PDF mimetype", async () => {
      await expect(
        service.uploadPdf(
          42,
          createPdfFile({ mimetype: "text/plain", originalname: "notes.txt" }),
        ),
      ).rejects.toThrow(new BadRequestError("Only PDF files are allowed"));
    });

    it("throws BadRequestError when file exceeds max bytes", async () => {
      await expect(
        service.uploadPdf(
          42,
          createPdfFile({ size: 5_242_881 }),
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("marks resume failed and throws BadGatewayError when storage upload fails", async () => {
      vi.mocked(resumeRepository.createProcessing).mockResolvedValue(
        sampleResume,
      );
      vi.mocked(objectStorage.put).mockRejectedValue(new Error("R2 down"));

      await expect(service.uploadPdf(42, createPdfFile())).rejects.toThrow(
        BadGatewayError,
      );

      expect(resumeRepository.updateFailed).toHaveBeenCalledWith(
        "resume-uuid",
        "Failed to upload PDF to storage",
      );
      expect(resumeQueue.add).not.toHaveBeenCalled();
    });

    it("marks resume failed and throws ServiceUnavailableError when enqueue fails", async () => {
      vi.mocked(resumeRepository.createProcessing).mockResolvedValue(
        sampleResume,
      );
      vi.mocked(resumeQueue.add).mockRejectedValue(new Error("Redis down"));

      await expect(service.uploadPdf(42, createPdfFile())).rejects.toThrow(
        new ServiceUnavailableError("Resume processing is unavailable"),
      );

      expect(resumeRepository.updateFailed).toHaveBeenCalledWith(
        "resume-uuid",
        "Failed to enqueue resume processing",
      );
    });
  });

  describe("getResume", () => {
    it("returns resume detail without sensitive fields", async () => {
      const readyResume = {
        ...sampleResume,
        status: ResumeStatus.ready,
        structuredSummary: {
          personal_info: { name: "Jane", title: "Engineer" },
          skills: ["TypeScript"],
          experiences: [
            {
              company: "Acme",
              role: "Dev",
              highlights: ["Built APIs"],
            },
          ],
          projects: [{ name: "Portfolio" }],
        },
        rawText: "secret text",
        pdfUrl: "users/42/resumes/resume-uuid.pdf",
        errorMessage: "should not leak",
      };

      vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue(
        readyResume,
      );

      const result = await service.getResume(42, "resume-uuid");

      expect(result).toEqual({
        id: "resume-uuid",
        name: "Jane Doe CV.pdf",
        status: ResumeStatus.ready,
        createdAt: sampleResume.createdAt,
        structuredSummary: readyResume.structuredSummary,
      });
      expect(result).not.toHaveProperty("rawText");
      expect(result).not.toHaveProperty("pdfUrl");
      expect(result).not.toHaveProperty("errorMessage");
    });

    it("omits structuredSummary when status is not ready", async () => {
      vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue(
        sampleResume,
      );

      const result = await service.getResume(42, "resume-uuid");

      expect(result).toEqual({
        id: "resume-uuid",
        name: "Jane Doe CV.pdf",
        status: ResumeStatus.processing,
        createdAt: sampleResume.createdAt,
      });
      expect(result).not.toHaveProperty("structuredSummary");
    });

    it("throws NotFoundError when resume is missing or not owned", async () => {
      vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(service.getResume(42, "missing-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
