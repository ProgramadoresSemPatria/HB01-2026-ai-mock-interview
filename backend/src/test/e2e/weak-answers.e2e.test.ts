import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import prisma from "@/infrastructure/database";
import { AnswerEvaluation, ReviewPriority } from "../../../prisma/generated/client";
import {
  authHeader,
  seedAuthenticatedUser,
} from "@/test/helpers/auth-helpers";
import { seedReadyResume } from "@/test/helpers/interview-seed-helpers";
import { truncateTables } from "@/test/containers/truncate-tables";

async function authenticate(): Promise<{
  token: string;
  userId: number;
}> {
  const auth = await seedAuthenticatedUser();
  return {
    token: auth.accessToken,
    userId: auth.userId,
  };
}

describe("Weak Answers API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/weak-answers/", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app).get("/api/weak-answers/");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 200 with empty weakAnswers when user has none", async () => {
      const { token } = await authenticate();

      const response = await request(app)
        .get("/api/weak-answers/")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ weakAnswers: [] });
    });

    it("does not return weak answers belonging to another user", async () => {
      const { userId } = await authenticate();
      const resume = await seedReadyResume(userId);

      const session = await prisma.interviewSession.create({
        data: {
          userId,
          resumeId: resume.id,
          level: "entry",
          maxTurns: 5,
        },
      });

      await prisma.weakAnswer.create({
        data: {
          userId,
          sessionId: session.id,
          question: "How would you scale a read-heavy API?",
          userAnswer: "I'd just add more servers.",
          evaluation: AnswerEvaluation.insufficient,
          feedback: "Mention caching, read replicas, and CDN strategies.",
          topic: "System design",
          priority: ReviewPriority.high,
        },
      });

      const other = await seedAuthenticatedUser({
        email: "other@example.com",
        name: "Other User",
      });

      const response = await request(app)
        .get("/api/weak-answers/")
        .set(authHeader(other.accessToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ weakAnswers: [] });
    });

    it("returns 200 with weak answers for the authenticated user", async () => {
      const { token, userId } = await authenticate();
      const resume = await seedReadyResume(userId);

      const session = await prisma.interviewSession.create({
        data: {
          userId,
          resumeId: resume.id,
          level: "entry",
          maxTurns: 5,
        },
      });

      await prisma.weakAnswer.create({
        data: {
          userId,
          sessionId: session.id,
          question: "How would you scale a read-heavy API?",
          userAnswer: "I'd just add more servers.",
          evaluation: AnswerEvaluation.insufficient,
          feedback: "Mention caching, read replicas, and CDN strategies.",
          topic: "System design",
          priority: ReviewPriority.high,
        },
      });

      await prisma.weakAnswer.create({
        data: {
          userId,
          sessionId: session.id,
          question: "What is the difference between let and const?",
          userAnswer: "They're the same thing.",
          evaluation: AnswerEvaluation.incorrect,
          feedback: "const bindings cannot be reassigned; let bindings can.",
          topic: "TypeScript",
          priority: ReviewPriority.medium,
        },
      });

      const response = await request(app)
        .get("/api/weak-answers/")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.weakAnswers).toHaveLength(2);
      expect(response.body.weakAnswers[0]).toMatchObject({
        sessionId: session.id,
        topic: "System design",
        evaluation: "insufficient",
        priority: "high",
      });
      expect(response.body.weakAnswers[1]).toMatchObject({
        topic: "TypeScript",
        evaluation: "incorrect",
        priority: "medium",
      });
    });
  });

  describe("DELETE /api/weak-answers/:id", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app).delete(
        `/api/weak-answers/${randomUUID()}`,
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 204 and removes the item for the owner", async () => {
      const { token, userId } = await authenticate();
      const resume = await seedReadyResume(userId);

      const session = await prisma.interviewSession.create({
        data: {
          userId,
          resumeId: resume.id,
          level: "entry",
          maxTurns: 5,
        },
      });

      const item = await prisma.weakAnswer.create({
        data: {
          userId,
          sessionId: session.id,
          question: "How would you scale a read-heavy API?",
          userAnswer: "I'd just add more servers.",
          evaluation: AnswerEvaluation.insufficient,
          feedback: "Mention caching, read replicas, and CDN strategies.",
          topic: "System design",
          priority: ReviewPriority.high,
        },
      });

      const deleteResponse = await request(app)
        .delete(`/api/weak-answers/${item.id}`)
        .set(authHeader(token));

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      const listResponse = await request(app)
        .get("/api/weak-answers/")
        .set(authHeader(token));

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toEqual({ weakAnswers: [] });

      const stored = await prisma.weakAnswer.findUnique({
        where: { id: item.id },
      });
      expect(stored).toBeNull();
    });

    it("returns 404 when weak answer does not exist", async () => {
      const { token } = await authenticate();

      const response = await request(app)
        .delete(`/api/weak-answers/${randomUUID()}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Weak answer not found" });
    });

    it("returns 404 when weak answer belongs to another user", async () => {
      const { userId } = await authenticate();
      const resume = await seedReadyResume(userId);

      const session = await prisma.interviewSession.create({
        data: {
          userId,
          resumeId: resume.id,
          level: "entry",
          maxTurns: 5,
        },
      });

      const item = await prisma.weakAnswer.create({
        data: {
          userId,
          sessionId: session.id,
          question: "How would you scale a read-heavy API?",
          userAnswer: "I'd just add more servers.",
          evaluation: AnswerEvaluation.insufficient,
          feedback: "Mention caching, read replicas, and CDN strategies.",
          topic: "System design",
          priority: ReviewPriority.high,
        },
      });

      const other = await seedAuthenticatedUser({
        email: "other@example.com",
        name: "Other User",
      });

      const response = await request(app)
        .delete(`/api/weak-answers/${item.id}`)
        .set(authHeader(other.accessToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Weak answer not found" });

      const stored = await prisma.weakAnswer.findUnique({
        where: { id: item.id },
      });
      expect(stored).not.toBeNull();
    });
  });
});
