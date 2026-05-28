import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeStatus } from "../../../../prisma/generated/client";

const mockPrisma = vi.hoisted(() => ({
  resume: {
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/infrastructure/database", () => ({
  default: mockPrisma,
}));

import { ResumeRepository } from "./resume-repository";

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

const structuredSummary = {
  personal_info: { name: "Jane Doe", title: "Engineer", about: "" },
  skills: ["TypeScript", "Node.js"],
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

describe("ResumeRepository", () => {
  const repository = new ResumeRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("createProcessing inserts a processing resume for the user", async () => {
    mockPrisma.resume.create.mockResolvedValue(sampleResume);

    const result = await repository.createProcessing(
      sampleResume.userId,
      sampleResume.name,
      sampleResume.pdfUrl,
      sampleResume.storageKey,
    );

    expect(mockPrisma.resume.create).toHaveBeenCalledWith({
      data: {
        userId: sampleResume.userId,
        name: sampleResume.name,
        pdfUrl: sampleResume.pdfUrl,
        storageKey: sampleResume.storageKey,
        status: ResumeStatus.processing,
      },
    });
    expect(result).toEqual(sampleResume);
  });

  it("createProcessing accepts an optional id", async () => {
    mockPrisma.resume.create.mockResolvedValue(sampleResume);

    await repository.createProcessing(
      sampleResume.userId,
      sampleResume.name,
      sampleResume.pdfUrl,
      sampleResume.storageKey,
      sampleResume.id,
    );

    expect(mockPrisma.resume.create).toHaveBeenCalledWith({
      data: {
        id: sampleResume.id,
        userId: sampleResume.userId,
        name: sampleResume.name,
        pdfUrl: sampleResume.pdfUrl,
        storageKey: sampleResume.storageKey,
        status: ResumeStatus.processing,
      },
    });
  });

  it("findById loads a resume by id", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue(sampleResume);

    const result = await repository.findById(sampleResume.id);

    expect(mockPrisma.resume.findUnique).toHaveBeenCalledWith({
      where: { id: sampleResume.id },
    });
    expect(result).toEqual(sampleResume);
  });

  it("updateReady rejects invalid structured summary before persisting", async () => {
    await expect(
      repository.updateReady(sampleResume.id, { personal_info: { name: "Jane" } }, "text"),
    ).rejects.toThrow();

    expect(mockPrisma.resume.update).not.toHaveBeenCalled();
  });

  it("updateReady sets structured summary, raw text, and ready status", async () => {
    const rawText = "Jane Doe\nSoftware Engineer";
    const readyResume = {
      ...sampleResume,
      structuredSummary,
      rawText,
      status: ResumeStatus.ready,
      errorMessage: null,
    };
    mockPrisma.resume.update.mockResolvedValue(readyResume);

    const result = await repository.updateReady(
      sampleResume.id,
      structuredSummary,
      rawText,
    );

    expect(mockPrisma.resume.update).toHaveBeenCalledWith({
      where: { id: sampleResume.id },
      data: {
        structuredSummary,
        rawText,
        status: ResumeStatus.ready,
        errorMessage: null,
      },
    });
    expect(result).toEqual(readyResume);
  });

  it("updateFailed sets failed status and error message", async () => {
    const errorMessage = "PDF extraction failed";
    const failedResume = {
      ...sampleResume,
      status: ResumeStatus.failed,
      errorMessage,
    };
    mockPrisma.resume.update.mockResolvedValue(failedResume);

    const result = await repository.updateFailed(sampleResume.id, errorMessage);

    expect(mockPrisma.resume.update).toHaveBeenCalledWith({
      where: { id: sampleResume.id },
      data: {
        status: ResumeStatus.failed,
        errorMessage,
      },
    });
    expect(result).toEqual(failedResume);
  });

  it("findByIdAndUserId filters by id and userId", async () => {
    mockPrisma.resume.findFirst.mockResolvedValue(sampleResume);

    const result = await repository.findByIdAndUserId(
      sampleResume.id,
      sampleResume.userId,
    );

    expect(mockPrisma.resume.findFirst).toHaveBeenCalledWith({
      where: { id: sampleResume.id, userId: sampleResume.userId },
    });
    expect(result).toEqual(sampleResume);
  });

  it("findByIdAndUserId returns null when resume is not owned", async () => {
    mockPrisma.resume.findFirst.mockResolvedValue(null);

    const result = await repository.findByIdAndUserId(sampleResume.id, 999);

    expect(mockPrisma.resume.findFirst).toHaveBeenCalledWith({
      where: { id: sampleResume.id, userId: 999 },
    });
    expect(result).toBeNull();
  });
});
