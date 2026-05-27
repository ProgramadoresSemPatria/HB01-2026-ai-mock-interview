import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeStatus } from "../../../../prisma/generated/client";
import type { ResumeService } from "@/modules/resumes/service/resume-service";
import { NotFoundError } from "@/shared";
import type { NextFunction, Request, Response } from "express";

type UploadedFile = NonNullable<Request["file"]>;

import { ResumesController } from "./resumes-controller";

function createMockResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);

  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function createMockRequest(
  overrides: Partial<Request> = {},
): Request {
  return {
    userId: 42,
    params: {},
    file: undefined,
    ...overrides,
  } as Request;
}

describe("ResumesController", () => {
  let resumeService: ResumeService;
  let controller: ResumesController;
  let res: ReturnType<typeof createMockResponse>;
  let next: NextFunction;

  beforeEach(() => {
    resumeService = {
      uploadPdf: vi.fn(),
      getResume: vi.fn(),
    } as unknown as ResumeService;

    controller = new ResumesController(resumeService);
    res = createMockResponse();
    next = vi.fn();
  });

  describe("upload", () => {
    it("returns 201 with resume preview", async () => {
      const file = {
        originalname: "resume.pdf",
        mimetype: "application/pdf",
        size: 100,
        buffer: Buffer.from("pdf"),
      } as UploadedFile;

      const preview = {
        id: "resume-uuid",
        name: "resume.pdf",
        status: ResumeStatus.processing,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      vi.mocked(resumeService.uploadPdf).mockResolvedValue(preview);

      await controller.upload(
        createMockRequest({ file }),
        res,
        next,
      );

      expect(resumeService.uploadPdf).toHaveBeenCalledWith(42, file);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(preview);
      expect(next).not.toHaveBeenCalled();
    });

    it("delegates errors to next", async () => {
      const error = new Error("upload failed");
      vi.mocked(resumeService.uploadPdf).mockRejectedValue(error);

      await controller.upload(
        createMockRequest({
          file: { originalname: "resume.pdf" } as UploadedFile,
        }),
        res,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("returns 200 with resume detail", async () => {
      const detail = {
        id: "resume-uuid",
        name: "resume.pdf",
        status: ResumeStatus.ready,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        structuredSummary: {
          personal_info: { name: "Jane", title: "Engineer" },
          skills: ["TS"],
          experiences: [],
          projects: [],
        },
      };

      vi.mocked(resumeService.getResume).mockResolvedValue(detail);

      await controller.getById(
        createMockRequest({ params: { id: "resume-uuid" } }),
        res,
        next,
      );

      expect(resumeService.getResume).toHaveBeenCalledWith(42, "resume-uuid");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(detail);
      expect(next).not.toHaveBeenCalled();
    });

    it("delegates NotFoundError to next", async () => {
      const error = new NotFoundError("Resume not found");
      vi.mocked(resumeService.getResume).mockRejectedValue(error);

      await controller.getById(
        createMockRequest({ params: { id: "missing" } }),
        res,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
