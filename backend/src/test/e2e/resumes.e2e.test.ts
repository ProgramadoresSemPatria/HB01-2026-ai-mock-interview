import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const storageMock = vi.hoisted(() => ({
  put: vi.fn(async () => undefined),
  get: vi.fn(async () => Buffer.from("%PDF-1.4")),
}));

const resumeQueueMock = vi.hoisted(() => ({
  add: vi.fn(async () => undefined),
}));

vi.mock("@/infrastructure/storage/r2-client", () => ({
  createR2ObjectStorage: () => storageMock,
}));

vi.mock("@/infrastructure/queue/resume-queue", () => ({
  add: resumeQueueMock.add,
}));

import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import { env } from "@/config/env";
import prisma from "@/infrastructure/database";
import { ResumeStatus } from "../../../prisma/generated/client";
import {
  authHeader,
  createSignupPayload,
  loginUser,
  signUpUser,
} from "@/test/helpers/auth-helpers";
import {
  sampleStructuredSummary,
  seedReadyResume,
} from "@/test/helpers/interview-seed-helpers";
import { truncateTables } from "@/test/containers/truncate-tables";

const minimalPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");

async function authenticate(app: Express): Promise<{
  token: string;
  userId: number;
}> {
  const { response: signUpResponse } = await signUpUser(app);
  const loginResponse = await loginUser(app);
  return {
    token: loginResponse.body.accessToken as string,
    userId: signUpResponse.body.user.id as number,
  };
}

describe("Resumes API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    storageMock.put.mockClear();
    resumeQueueMock.add.mockClear();
    await truncateTables();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/resumes/", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/resumes/")
        .attach("file", minimalPdfBuffer, {
          filename: "resume.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 201 and uploads PDF with mocked storage and queue", async () => {
      const { token } = await authenticate(app);

      const response = await request(app)
        .post("/api/resumes/")
        .set(authHeader(token))
        .attach("file", minimalPdfBuffer, {
          filename: "my-resume.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: "my-resume.pdf",
        status: ResumeStatus.processing,
      });
      expect(response.body.createdAt).toEqual(expect.any(String));
      expect(storageMock.put).toHaveBeenCalledTimes(1);
      expect(resumeQueueMock.add).toHaveBeenCalledWith({
        resumeId: response.body.id,
      });
    });

    it("returns 400 when no PDF file is attached", async () => {
      const { token } = await authenticate(app);

      const response = await request(app)
        .post("/api/resumes/")
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "PDF file is required",
      });
      expect(storageMock.put).not.toHaveBeenCalled();
      expect(resumeQueueMock.add).not.toHaveBeenCalled();
    });

    it("returns 400 when file is not a PDF", async () => {
      const { token } = await authenticate(app);

      const response = await request(app)
        .post("/api/resumes/")
        .set(authHeader(token))
        .attach("file", minimalPdfBuffer, {
          filename: "resume.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Only PDF files are allowed",
      });
      expect(storageMock.put).not.toHaveBeenCalled();
      expect(resumeQueueMock.add).not.toHaveBeenCalled();
    });

    it("returns 400 when PDF exceeds maximum allowed size", async () => {
      const { token } = await authenticate(app);
      const oversizedPdf = Buffer.concat([
        minimalPdfBuffer,
        Buffer.alloc(env.RESUME_MAX_BYTES),
      ]);

      const response = await request(app)
        .post("/api/resumes/")
        .set(authHeader(token))
        .attach("file", oversizedPdf, {
          filename: "large-resume.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(
        new RegExp(
          `PDF file (must be at most ${env.RESUME_MAX_BYTES} bytes|exceeds maximum allowed size)`,
        ),
      );
      expect(storageMock.put).not.toHaveBeenCalled();
      expect(resumeQueueMock.add).not.toHaveBeenCalled();
    });

    it("returns 502 when object storage upload fails", async () => {
      storageMock.put.mockRejectedValueOnce(new Error("R2 down"));
      const { token, userId } = await authenticate(app);

      const response = await request(app)
        .post("/api/resumes/")
        .set(authHeader(token))
        .attach("file", minimalPdfBuffer, {
          filename: "resume.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(502);
      expect(response.body).toEqual({ message: "Failed to upload PDF" });
      expect(resumeQueueMock.add).not.toHaveBeenCalled();

      const resume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      expect(resume?.status).toBe(ResumeStatus.failed);
      expect(resume?.errorMessage).toBe("Failed to upload PDF to storage");
    });

    it("returns 503 when resume queue is unavailable", async () => {
      resumeQueueMock.add.mockRejectedValueOnce(new Error("Redis down"));
      const { token, userId } = await authenticate(app);

      const response = await request(app)
        .post("/api/resumes/")
        .set(authHeader(token))
        .attach("file", minimalPdfBuffer, {
          filename: "resume.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        message: "Resume processing is unavailable",
      });
      expect(storageMock.put).toHaveBeenCalledTimes(1);

      const resume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      expect(resume?.status).toBe(ResumeStatus.failed);
      expect(resume?.errorMessage).toBe("Failed to enqueue resume processing");
    });
  });

  describe("GET /api/resumes/:id", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app).get(`/api/resumes/${randomUUID()}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 200 with resume detail for the owner", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const response = await request(app)
        .get(`/api/resumes/${resume.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: resume.id,
        name: "resume.pdf",
        status: ResumeStatus.ready,
        structuredSummary: sampleStructuredSummary,
      });
    });

    it("returns 404 when resume does not exist", async () => {
      const { token } = await authenticate(app);

      const response = await request(app)
        .get(`/api/resumes/${randomUUID()}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Resume not found" });
    });

    it("returns 404 when resume belongs to another user", async () => {
      const { userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      await request(app)
        .post("/api/auth/signup")
        .send(
          createSignupPayload({
            email: "other@example.com",
            name: "Other User",
          }),
        );
      const otherLogin = await loginUser(app, { email: "other@example.com" });
      const otherToken = otherLogin.body.accessToken as string;

      const response = await request(app)
        .get(`/api/resumes/${resume.id}`)
        .set(authHeader(otherToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Resume not found" });
    });
  });
});
