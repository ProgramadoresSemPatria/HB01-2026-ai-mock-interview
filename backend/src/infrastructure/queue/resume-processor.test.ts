import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeStatus } from "../../../prisma/generated/client";
import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";
import { buildResumeExtractionPrompt } from "@/modules/resumes/prompts/resume-extraction-prompt";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import {
  structuredSummarySchema,
  type StructuredSummary,
} from "@/modules/resumes/validations/resume-schemas";

import { ResumeProcessor } from "./resume-processor";

const sampleResume = {
  id: "resume-uuid",
  userId: 42,
  name: "Jane Doe CV.pdf",
  pdfUrl: "users/42/resumes/resume-uuid.pdf",
  storageKey: "users/42/resumes/resume-uuid.pdf",
  structuredSummary: null,
  rawText: null,
  status: ResumeStatus.processing,
  errorMessage: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

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

describe("ResumeProcessor", () => {
  let resumeRepository: ResumeRepository;
  let objectStorage: IObjectStorage;
  let structuredModel: { invoke: ReturnType<typeof vi.fn> };
  let extractionModel: { withStructuredOutput: ReturnType<typeof vi.fn> };
  let extractText: ReturnType<typeof vi.fn>;
  let processor: ResumeProcessor;

  beforeEach(() => {
    vi.clearAllMocks();

    resumeRepository = {
      findById: vi.fn(),
      updateReady: vi.fn(),
      updateFailed: vi.fn(),
    } as unknown as ResumeRepository;

    objectStorage = {
      get: vi.fn().mockResolvedValue(Buffer.from("pdf-bytes")),
      put: vi.fn(),
      delete: vi.fn(),
    };

    structuredModel = {
      invoke: vi.fn().mockResolvedValue(structuredSummary),
    };

    extractionModel = {
      withStructuredOutput: vi.fn().mockReturnValue(structuredModel),
    };

    extractText = vi.fn().mockResolvedValue(rawText);

    processor = new ResumeProcessor({
      resumeRepository,
      objectStorage,
      extractionModel: extractionModel as never,
      extractText,
    });
  });

  it("downloads PDF, extracts text, structures with LLM, and marks resume ready", async () => {
    vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
    vi.mocked(resumeRepository.updateReady).mockResolvedValue({
      ...sampleResume,
      status: ResumeStatus.ready,
      structuredSummary,
      rawText,
    });

    const result = await processor.process("resume-uuid");

    expect(objectStorage.get).toHaveBeenCalledWith(sampleResume.storageKey);
    expect(result).toEqual({ status: "ready", resumeId: "resume-uuid" });
    expect(extractText).toHaveBeenCalledWith(Buffer.from("pdf-bytes"));
    expect(extractionModel.withStructuredOutput).toHaveBeenCalledWith(
      structuredSummarySchema,
    );
    expect(structuredModel.invoke).toHaveBeenCalledWith([
      {
        role: "user",
        content: buildResumeExtractionPrompt(rawText),
      },
    ]);
    expect(resumeRepository.updateReady).toHaveBeenCalledWith(
      "resume-uuid",
      structuredSummary,
      rawText,
    );
    expect(resumeRepository.updateFailed).not.toHaveBeenCalled();
  });

  it("marks resume failed when PDF has no extractable text", async () => {
    vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
    extractText.mockResolvedValue("   \n  ");

    const result = await processor.process("resume-uuid");

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

    const result = await processor.process("resume-uuid");

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

  it("skips processing when resume is not found", async () => {
    vi.mocked(resumeRepository.findById).mockResolvedValue(null);

    const result = await processor.process("missing-id");

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
