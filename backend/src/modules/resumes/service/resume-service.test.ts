import { HumanMessage } from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESUME_STATUS } from "@/modules/resumes/types/resume-record";
import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";
import type { IResumeQueue } from "@/modules/resumes/protocols/resume-queue";
import {
  buildResumeExtractionPrompt,
  PERSONA_SECTION_HEADER,
  RESUME_TEXT_SECTION_HEADER,
} from "@/modules/resumes/prompts/resume-extraction-prompt";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import {
  structuredSummarySchema,
  type StructuredSummary,
} from "@/modules/resumes/validations/resume-schemas";
import type { TokenUsageService } from "@/modules/token-usage/service/token-usage-service";
import {
  BadGatewayError,
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  TokenLimitExceededError,
} from "@/shared";
import type { Request } from "express";

type UploadedFile = NonNullable<Request["file"]>;

import { ResumeService } from "./resume-service";

const mockRandomUUID = vi.hoisted(() => vi.fn());

vi.mock("node:crypto", () => ({
  randomUUID: mockRandomUUID,
}));

vi.mock("@/modules/token-usage/callbacks/token-usage-callback", () => ({
  createUsageCaptureCallback: vi.fn(() => ({
    callback: {},
    getUsage: () => undefined,
  })),
}));

const sampleResume = {
  id: "resume-uuid",
  userId: 42,
  name: "Jane Doe CV.pdf",
  pdfUrl: "users/42/resumes/resume-uuid.pdf",
  storageKey: "users/42/resumes/resume-uuid.pdf",
  structuredSummary: null,
  rawText: null,
  status: RESUME_STATUS.processing,
  errorMessage: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createPdfFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
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

const rawText = "Jane Doe\nSoftware Engineer";

const structuredSummary: StructuredSummary = {
  personal_info: { name: "Jane Doe", title: "Engineer", about: "" },
  skills: ["TypeScript"],
  experiences: [
    {
      company: "Acme",
      role: "Developer",
      highlights: ["Built APIs"],
    },
  ],
  projects: [
    {
      name: "Portfolio",
      description: "",
      technologies: [],
      highlights: [],
    },
  ],
  certifications: [],
};

describe("ResumeService", () => {
  let resumeRepository: ResumeRepository;
  let objectStorage: IObjectStorage;
  let resumeQueue: IResumeQueue;
  let structuredModelInvoke: ReturnType<typeof vi.fn>;
  let extractionModel: { withStructuredOutput: ReturnType<typeof vi.fn> };
  let extractText: ReturnType<typeof vi.fn>;
  let tokenUsageService: TokenUsageService;
  let service: ResumeService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomUUID.mockReturnValue("resume-uuid");

    resumeRepository = {
      createProcessing: vi.fn(),
      updateFailed: vi.fn(),
      findById: vi.fn(),
      findByIdAndUserId: vi.fn(),
      updateReady: vi.fn(),
      findAllByUserId: vi.fn(),
      deleteByIdAndUserId: vi.fn(),
    } as unknown as ResumeRepository;

    objectStorage = {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(Buffer.from("pdf-bytes")),
      delete: vi.fn(),
    };

    resumeQueue = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    structuredModelInvoke = vi.fn().mockResolvedValue(structuredSummary);
    const structuredModel = RunnableLambda.from(structuredModelInvoke);

    extractionModel = {
      withStructuredOutput: vi.fn().mockReturnValue(structuredModel),
    };

    extractText = vi.fn().mockResolvedValue(rawText);

    tokenUsageService = {
      assertWithinLimit: vi.fn().mockResolvedValue(undefined),
      recordUsage: vi.fn().mockResolvedValue(undefined),
      getUsage: vi.fn(),
    } as unknown as TokenUsageService;

    service = new ResumeService(
      resumeRepository,
      objectStorage,
      resumeQueue,
      extractionModel as never,
      extractText,
      tokenUsageService,
      5_242_880,
    );
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
        status: RESUME_STATUS.processing,
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
        service.uploadPdf(42, createPdfFile({ size: 5_242_881 })),
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
        status: RESUME_STATUS.ready,
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
        storageKey: "users/42/resumes/resume-uuid.pdf",
        errorMessage: "should not leak",
      };

      vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue(
        readyResume,
      );

      const result = await service.getResume(42, "resume-uuid");

      expect(result).toEqual({
        id: "resume-uuid",
        name: "Jane Doe CV.pdf",
        status: RESUME_STATUS.ready,
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
        status: RESUME_STATUS.processing,
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

  describe("listResumes", () => {
    it("returns a list of resume previews for the user", async () => {
      vi.mocked(resumeRepository.findAllByUserId).mockResolvedValue([
        sampleResume,
      ]);

      const result = await service.listResumes(42);

      expect(resumeRepository.findAllByUserId).toHaveBeenCalledWith(42);
      expect(result).toEqual([
        {
          id: "resume-uuid",
          name: "Jane Doe CV.pdf",
          status: RESUME_STATUS.processing,
          createdAt: sampleResume.createdAt,
        },
      ]);
    });
  });

  describe("deleteResume", () => {
    it("deletes the resume and clears object storage when found", async () => {
      vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue(
        sampleResume,
      );

      await service.deleteResume(42, "resume-uuid");

      expect(resumeRepository.findByIdAndUserId).toHaveBeenCalledWith(
        "resume-uuid",
        42,
      );
      expect(resumeRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
        "resume-uuid",
        42,
      );
      expect(objectStorage.delete).toHaveBeenCalledWith(
        sampleResume.storageKey,
      );
    });

    it("throws NotFoundError if resume to delete is not found", async () => {
      vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(service.deleteResume(42, "missing-id")).rejects.toThrow(
        NotFoundError,
      );

      expect(resumeRepository.deleteByIdAndUserId).not.toHaveBeenCalled();
      expect(objectStorage.delete).not.toHaveBeenCalled();
    });
  });

  describe("process", () => {
    it("downloads PDF, extracts text, structures with LLM, and marks resume ready", async () => {
      vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
      vi.mocked(resumeRepository.updateReady).mockResolvedValue({
        ...sampleResume,
        status: RESUME_STATUS.ready,
        structuredSummary,
        rawText,
      });

      const result = await service.process("resume-uuid");

      expect(objectStorage.get).toHaveBeenCalledWith(sampleResume.storageKey);
      expect(result).toEqual({ status: "ready", resumeId: "resume-uuid" });
      expect(extractText).toHaveBeenCalledWith(Buffer.from("pdf-bytes"));
      expect(extractionModel.withStructuredOutput).toHaveBeenCalledWith(
        structuredSummarySchema,
      );
      expect(structuredModelInvoke).toHaveBeenCalledOnce();
      const invokeArg = structuredModelInvoke.mock.calls[0]?.[0];
      const messages =
        invokeArg &&
        typeof invokeArg === "object" &&
        "toChatMessages" in invokeArg &&
        typeof invokeArg.toChatMessages === "function"
          ? invokeArg.toChatMessages()
          : invokeArg &&
              typeof invokeArg === "object" &&
              "messages" in invokeArg
            ? (invokeArg as { messages: HumanMessage[] }).messages
            : (invokeArg as HumanMessage[]);
      expect(messages[0]).toBeInstanceOf(HumanMessage);
      const promptContent = messages[0]?.content as string;
      expect(promptContent).toBe(buildResumeExtractionPrompt(rawText));
      expect(promptContent).toContain(PERSONA_SECTION_HEADER);
      expect(promptContent).toContain(RESUME_TEXT_SECTION_HEADER);
      expect(promptContent).toContain(rawText);
      expect(resumeRepository.updateReady).toHaveBeenCalledWith(
        "resume-uuid",
        structuredSummary,
        rawText,
      );
      expect(resumeRepository.updateFailed).not.toHaveBeenCalled();
      expect(tokenUsageService.assertWithinLimit).toHaveBeenCalledWith(
        sampleResume.userId,
      );
      expect(tokenUsageService.recordUsage).toHaveBeenCalledWith(
        sampleResume.userId,
        undefined,
      );
    });

    it("marks resume failed when monthly token limit is reached", async () => {
      vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
      vi.mocked(tokenUsageService.assertWithinLimit).mockRejectedValue(
        new TokenLimitExceededError(),
      );

      const result = await service.process("resume-uuid");

      expect(result).toEqual({
        status: "failed",
        resumeId: "resume-uuid",
        error:
          "Monthly token usage limit reached. Your quota resets at the start of next month.",
        cause: expect.any(TokenLimitExceededError),
      });
      expect(objectStorage.get).not.toHaveBeenCalled();
      expect(resumeRepository.updateFailed).toHaveBeenCalledWith(
        "resume-uuid",
        "Monthly token usage limit reached. Your quota resets at the start of next month.",
      );
    });

    it("marks resume failed when PDF has no extractable text", async () => {
      vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
      extractText.mockResolvedValue("   \n  ");

      const result = await service.process("resume-uuid");

      expect(result).toEqual({
        status: "failed",
        resumeId: "resume-uuid",
        error: "PDF contains no extractable text",
        cause: expect.any(Error),
      });
      expect(extractionModel.withStructuredOutput).not.toHaveBeenCalled();
      expect(resumeRepository.updateFailed).toHaveBeenCalledWith(
        "resume-uuid",
        "PDF contains no extractable text",
      );
      expect(resumeRepository.updateReady).not.toHaveBeenCalled();
    });

    it("marks resume failed when processing throws", async () => {
      vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
      extractText.mockRejectedValue(new Error("PDF parse error"));

      const result = await service.process("resume-uuid");

      expect(result).toEqual({
        status: "failed",
        resumeId: "resume-uuid",
        error: "PDF parse error",
        cause: expect.any(Error),
      });
      expect(resumeRepository.updateFailed).toHaveBeenCalledWith(
        "resume-uuid",
        "PDF parse error",
      );
      expect(resumeRepository.updateReady).not.toHaveBeenCalled();
    });

    it("marks resume failed with clean error message when structured extraction exhausts retries", async () => {
      vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
      const retryExhaustedError = new Error("429 Rate limit exceeded");
      retryExhaustedError.stack =
        "Error: 429 Rate limit exceeded\n    at OpenAI.makeRequest (internal.js:42:11)";
      structuredModelInvoke.mockRejectedValue(retryExhaustedError);

      const result = await service.process("resume-uuid");

      expect(result).toEqual({
        status: "failed",
        resumeId: "resume-uuid",
        error: "429 Rate limit exceeded",
        cause: retryExhaustedError,
      });
      expect(resumeRepository.updateFailed).toHaveBeenCalledWith(
        "resume-uuid",
        "429 Rate limit exceeded",
      );
      const storedErrorMessage = vi.mocked(resumeRepository.updateFailed).mock
        .calls[0]?.[1];
      expect(storedErrorMessage).not.toContain("at OpenAI.makeRequest");
      expect(storedErrorMessage).not.toContain("\n");
      expect(resumeRepository.updateReady).not.toHaveBeenCalled();
    });

    it("skips processing when resume is not found", async () => {
      vi.mocked(resumeRepository.findById).mockResolvedValue(null);

      const result = await service.process("missing-id");

      expect(result).toEqual({
        status: "skipped",
        resumeId: "missing-id",
        reason: "not_found",
      });
      expect(objectStorage.get).not.toHaveBeenCalled();
      expect(resumeRepository.updateReady).not.toHaveBeenCalled();
      expect(resumeRepository.updateFailed).not.toHaveBeenCalled();
    });
  });
});
