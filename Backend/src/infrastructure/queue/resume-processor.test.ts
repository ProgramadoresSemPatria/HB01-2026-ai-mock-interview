import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeStatus } from "../../../prisma/generated/client";
import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";

import { ResumeProcessor } from "./resume-processor";

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

const structuredSummary = {
  personal_info: { name: "Jane Doe", title: "Engineer" },
  skills: ["TypeScript"],
  experiences: [
    {
      company: "Acme",
      role: "Developer",
      highlights: ["Built APIs"],
    },
  ],
  projects: [{ name: "Portfolio" }],
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

    extractText = vi.fn().mockResolvedValue("Jane Doe\nSoftware Engineer");

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
      rawText: "Jane Doe\nSoftware Engineer",
    });

    await processor.process("resume-uuid");

    expect(objectStorage.get).toHaveBeenCalledWith(sampleResume.pdfUrl);
    expect(extractText).toHaveBeenCalledWith(Buffer.from("pdf-bytes"));
    expect(extractionModel.withStructuredOutput).toHaveBeenCalled();
    expect(structuredModel.invoke).toHaveBeenCalled();
    expect(resumeRepository.updateReady).toHaveBeenCalledWith(
      "resume-uuid",
      structuredSummary,
      "Jane Doe\nSoftware Engineer",
    );
    expect(resumeRepository.updateFailed).not.toHaveBeenCalled();
  });

  it("marks resume failed when processing throws", async () => {
    vi.mocked(resumeRepository.findById).mockResolvedValue(sampleResume);
    extractText.mockRejectedValue(new Error("PDF parse error"));

    await processor.process("resume-uuid");

    expect(resumeRepository.updateFailed).toHaveBeenCalledWith(
      "resume-uuid",
      "PDF parse error",
    );
    expect(resumeRepository.updateReady).not.toHaveBeenCalled();
  });

  it("skips processing when resume is not found", async () => {
    vi.mocked(resumeRepository.findById).mockResolvedValue(null);

    await processor.process("missing-id");

    expect(objectStorage.get).not.toHaveBeenCalled();
    expect(resumeRepository.updateReady).not.toHaveBeenCalled();
    expect(resumeRepository.updateFailed).not.toHaveBeenCalled();
  });
});
