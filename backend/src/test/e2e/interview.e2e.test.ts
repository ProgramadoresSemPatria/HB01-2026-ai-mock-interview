import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const interviewGraphMock = vi.hoisted(() => {
  function createMockStream() {
    return (async function* () {
      yield { content: "Hello " };
      yield { content: "candidate" };
      return { content: "Hello candidate" };
    })();
  }

  return {
    streamMessages: vi.fn(() => createMockStream()),
  };
});

vi.mock("@/factories/interview/interview-graph-factory", () => ({
  makeInterviewGraph: () => interviewGraphMock,
}));

import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import prisma from "@/infrastructure/database";
import { MessageRole, ResumeStatus } from "../../../prisma/generated/client";
import {
  authHeader,
  createSignupPayload,
  loginUser,
  signUpUser,
} from "@/test/helpers/auth-helpers";
import {
  sampleStructuredSummary,
  seedFailedResume,
  seedProcessingResume,
  seedReadyResume,
} from "@/test/helpers/interview-seed-helpers";
import { truncateTables } from "@/test/containers/truncate-tables";

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

describe("Interview API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    interviewGraphMock.streamMessages.mockClear();
    await truncateTables();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/interview/sessions", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/interview/sessions")
        .send({ resumeId: randomUUID(), level: "entry" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 422 when payload is invalid", async () => {
      const { token } = await authenticate(app);

      const response = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: "not-a-uuid", level: "junior" });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("returns 201 when session is created for a ready resume", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const response = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(String));
    });

    it("returns 400 when resume is still processing", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedProcessingResume(userId);

      const reloaded = await prisma.resume.findUnique({
        where: { id: resume.id },
      });
      expect(reloaded?.status).toBe(ResumeStatus.processing);

      const response = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Resume is still being processed",
      });
    });

    it("returns 400 when resume processing failed", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedFailedResume(userId);

      const reloaded = await prisma.resume.findUnique({
        where: { id: resume.id },
      });
      expect(reloaded?.status).toBe(ResumeStatus.failed);
      expect(reloaded?.errorMessage).toBe("PDF extraction failed");

      const response = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Resume processing failed" });
    });

    it("returns 404 when resume does not exist or belongs to another user", async () => {
      const { token, userId } = await authenticate(app);

      const missingResumeResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: randomUUID(), level: "entry" });

      expect(missingResumeResponse.status).toBe(404);
      expect(missingResumeResponse.body).toEqual({ message: "Not Found" });

      const resume = await seedReadyResume(userId);

      await request(app)
        .post("/api/auth/signup")
        .send(
          createSignupPayload({
            email: "other-resume@example.com",
            name: "Other Resume User",
          }),
        );
      const otherLogin = await loginUser(app, {
        email: "other-resume@example.com",
      });
      const otherToken = otherLogin.body.accessToken as string;

      const otherUserResumeResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(otherToken))
        .send({ resumeId: resume.id, level: "entry" });

      expect(otherUserResumeResponse.status).toBe(404);
      expect(otherUserResumeResponse.body).toEqual({ message: "Not Found" });
    });
  });

  describe("GET /api/interview/sessions", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app).get("/api/interview/sessions");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 200 with the user's sessions", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const createResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "mid" });

      const response = await request(app)
        .get("/api/interview/sessions")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.sessions[0]).toMatchObject({
        id: createResponse.body.id,
        resumeId: resume.id,
        level: "mid",
        turnCount: 0,
        maxTurns: 7,
        isFinished: false,
      });
      expect(response.body.sessions[0].createdAt).toEqual(expect.any(String));
    });
  });

  describe("GET /api/interview/sessions/:id/messages", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app).get(
        `/api/interview/sessions/${randomUUID()}/messages`,
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 200 with session messages", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const createResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      const sessionId = createResponse.body.id as string;

      await prisma.interviewMessage.createMany({
        data: [
          {
            sessionId,
            userId,
            role: MessageRole.human,
            content: "Tell me about yourself",
          },
          {
            sessionId,
            userId,
            role: MessageRole.ai,
            content: "Great question.",
          },
        ],
      });

      const response = await request(app)
        .get(`/api/interview/sessions/${sessionId}/messages`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(2);
      expect(response.body.messages[0]).toMatchObject({
        role: "human",
        content: "Tell me about yourself",
      });
      expect(response.body.messages[1]).toMatchObject({
        role: "ai",
        content: "Great question.",
      });
    });

    it("returns 404 for a session that does not belong to the user", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const createResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      const sessionId = createResponse.body.id as string;

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
        .get(`/api/interview/sessions/${sessionId}/messages`)
        .set(authHeader(otherToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Not Found" });
    });

    it("returns 404 when session does not exist", async () => {
      const { token } = await authenticate(app);

      const response = await request(app)
        .get(`/api/interview/sessions/${randomUUID()}/messages`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Not Found" });
    });
  });

  describe("POST /api/interview/sessions/:sessionId/stream", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .post(`/api/interview/sessions/${randomUUID()}/stream`)
        .send({ content: "Hello interviewer" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 409 when interview session is finished", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const createResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      const sessionId = createResponse.body.id as string;

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { isFinished: true },
      });

      const response = await request(app)
        .post(`/api/interview/sessions/${sessionId}/stream`)
        .set(authHeader(token))
        .send({ content: "Hello interviewer" });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        message: "Interview session is finished",
      });
      expect(interviewGraphMock.streamMessages).not.toHaveBeenCalled();
    });

    it("returns SSE headers and streams mocked graph tokens", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const createResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      const sessionId = createResponse.body.id as string;

      const response = await request(app)
        .post(`/api/interview/sessions/${sessionId}/stream`)
        .set(authHeader(token))
        .send({ content: "Hello interviewer" });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.headers["cache-control"]).toBe("no-cache");
      expect(response.text).toContain("event: token");
      expect(response.text).toContain("event: meta");
      expect(response.text).toContain("data: [DONE]");
      expect(interviewGraphMock.streamMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          resumeSummary: sampleStructuredSummary,
          runReview: false,
        }),
        { threadId: sessionId },
      );
    });

    it("returns 404 when session does not exist or belongs to another user", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const createResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      const sessionId = createResponse.body.id as string;

      const missingSessionResponse = await request(app)
        .post(`/api/interview/sessions/${randomUUID()}/stream`)
        .set(authHeader(token))
        .send({ content: "Hello interviewer" });

      expect(missingSessionResponse.status).toBe(404);
      expect(missingSessionResponse.body).toEqual({ message: "Not Found" });

      await request(app)
        .post("/api/auth/signup")
        .send(
          createSignupPayload({
            email: "stream-other@example.com",
            name: "Stream Other User",
          }),
        );
      const otherLogin = await loginUser(app, {
        email: "stream-other@example.com",
      });
      const otherToken = otherLogin.body.accessToken as string;

      const otherUserResponse = await request(app)
        .post(`/api/interview/sessions/${sessionId}/stream`)
        .set(authHeader(otherToken))
        .send({ content: "Hello interviewer" });

      expect(otherUserResponse.status).toBe(404);
      expect(otherUserResponse.body).toEqual({ message: "Not Found" });
      expect(interviewGraphMock.streamMessages).not.toHaveBeenCalled();
    });

    it("returns 422 when stream payload is invalid", async () => {
      const { token, userId } = await authenticate(app);
      const resume = await seedReadyResume(userId);

      const createResponse = await request(app)
        .post("/api/interview/sessions")
        .set(authHeader(token))
        .send({ resumeId: resume.id, level: "entry" });

      const sessionId = createResponse.body.id as string;

      const response = await request(app)
        .post(`/api/interview/sessions/${sessionId}/stream`)
        .set(authHeader(token))
        .send({ content: "" });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
      expect(interviewGraphMock.streamMessages).not.toHaveBeenCalled();
    });
  });
});
