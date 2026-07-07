import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const reviewSessionAiMock = vi.hoisted(() => ({
  streamQuestion: vi.fn(),
  evaluate: vi.fn(),
}));

vi.mock("@/config/env", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/env")>();
  return {
    ...mod,
    env: {
      ...mod.env,
      REVIEW_SESSION_QUESTION_COUNT: 1,
    },
  };
});

vi.mock(
  "@/infrastructure/ai/langgraph/nodes/review-session-question-node",
  () => ({
    createReviewSessionQuestionNode: () => ({
      streamQuestion: (
        ...args: Parameters<typeof reviewSessionAiMock.streamQuestion>
      ) => reviewSessionAiMock.streamQuestion(...args),
    }),
  }),
);

vi.mock(
  "@/infrastructure/ai/langgraph/nodes/review-session-evaluation-node",
  () => ({
    createReviewSessionEvaluationNode: () =>
      (
        input: Parameters<typeof reviewSessionAiMock.evaluate>[0],
        config?: Parameters<typeof reviewSessionAiMock.evaluate>[1],
      ) => reviewSessionAiMock.evaluate(input, config),
  }),
);

import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import prisma from "@/infrastructure/database";
import { ReviewPriority } from "../../../prisma/generated/client";
import {
  authHeader,
  createSignupPayload,
  loginUser,
  signUpUser,
} from "@/test/helpers/auth-helpers";
import { seedReadyResume } from "@/test/helpers/interview-seed-helpers";
import { truncateTables } from "@/test/containers/truncate-tables";

type ReviewSessionQuestionInput = {
  topic: string;
  description: string;
  turns: Array<{ question: string; answer: string }>;
};

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

async function createOtherUserToken(app: Express): Promise<string> {
  await request(app)
    .post("/api/auth/signup")
    .send(
      createSignupPayload({
        email: "review-session-other@example.com",
        name: "Review Session Other User",
      }),
    );
  const otherLogin = await loginUser(app, {
    email: "review-session-other@example.com",
  });
  return otherLogin.body.accessToken as string;
}

async function seedReviewItem(
  userId: number,
  overrides: {
    topic: string;
    description: string;
    priority: (typeof ReviewPriority)[keyof typeof ReviewPriority];
    status?: "active" | "learned";
    learnedAt?: Date | null;
  },
) {
  const resume = await seedReadyResume(userId);
  const session = await prisma.interviewSession.create({
    data: {
      userId,
      resumeId: resume.id,
      level: "entry",
      maxTurns: 5,
    },
  });

  return prisma.reviewItem.create({
    data: {
      userId,
      sessionId: session.id,
      topic: overrides.topic,
      description: overrides.description,
      priority: overrides.priority,
      status: overrides.status ?? "active",
      learnedAt: overrides.learnedAt ?? null,
    },
  });
}

function configureReviewSessionAiMocks(): void {
  reviewSessionAiMock.streamQuestion.mockImplementation(
    (input: ReviewSessionQuestionInput) => {
      const content = `Question about ${input.topic}?`;
      return (async function* () {
        yield { content: "Question about " };
        yield { content: `${input.topic}?` };
        return { content };
      })();
    },
  );

  reviewSessionAiMock.evaluate.mockImplementation(
    async (input: ReviewSessionQuestionInput) => {
      if (input.topic === "System Design") {
        return { status: "active", priority: "medium" };
      }
      if (input.topic === "TypeScript") {
        return { status: "learned" };
      }
      return { status: "active", priority: "high" };
    },
  );
}

async function streamReviewSessionTurn(
  app: Express,
  token: string,
  sessionId: string,
  body: { answer?: string } = {},
) {
  return request(app)
    .post(`/api/review-sessions/${sessionId}/stream`)
    .set(authHeader(token))
    .send(body);
}

async function runStreamThroughEvaluation(
  app: Express,
  token: string,
  sessionId: string,
  itemCount: number,
) {
  const firstQuestion = await streamReviewSessionTurn(app, token, sessionId);
  expect(firstQuestion.status).toBe(200);
  expect(firstQuestion.headers["content-type"]).toContain("text/event-stream");
  expect(firstQuestion.text).toContain("event: token");
  expect(firstQuestion.text).toContain("event: meta");
  expect(firstQuestion.text).toContain("data: [DONE]");

  for (let index = 0; index < itemCount; index += 1) {
    const response = await streamReviewSessionTurn(app, token, sessionId, {
      answer: `Answer ${index + 1} for review session item.`,
    });
    expect(response.status).toBe(200);

    if (index === itemCount - 1) {
      expect(response.text).toContain("event: meta");
      expect(response.text).toContain("pending_review");
      expect(response.text).toContain("data: [DONE]");
    } else {
      expect(response.text).toContain("event: token");
    }
  }
}

describe("Review Sessions API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    reviewSessionAiMock.streamQuestion.mockReset();
    reviewSessionAiMock.evaluate.mockReset();
    configureReviewSessionAiMocks();
    await truncateTables();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/review-sessions/", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/review-sessions/")
        .send({ reviewItemIds: [randomUUID()] });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 201 when creating a session with active owned review items", async () => {
      const { token, userId } = await authenticate(app);
      const itemOne = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });
      const itemTwo = await seedReviewItem(userId, {
        topic: "TypeScript",
        description: "Review generics and utility types.",
        priority: ReviewPriority.medium,
      });

      const response = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [itemOne.id, itemTwo.id] });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: "in_progress",
        items: expect.arrayContaining([
          expect.objectContaining({
            reviewItemId: itemOne.id,
            topic: "System Design",
            currentPriority: "high",
          }),
          expect.objectContaining({
            reviewItemId: itemTwo.id,
            topic: "TypeScript",
            currentPriority: "medium",
          }),
        ]),
      });
      expect(response.body.items).toHaveLength(2);
    });

    it("returns 404 when any review item is missing, not owned, or not active", async () => {
      const { token, userId } = await authenticate(app);
      const activeItem = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });
      const learnedItem = await seedReviewItem(userId, {
        topic: "TypeScript",
        description: "Already learned topic.",
        priority: ReviewPriority.low,
        status: "learned",
        learnedAt: new Date("2026-06-01T12:00:00.000Z"),
      });

      const missingResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [activeItem.id, randomUUID()] });

      expect(missingResponse.status).toBe(404);
      expect(missingResponse.body).toEqual({ message: "Review item not found" });

      const learnedResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [learnedItem.id] });

      expect(learnedResponse.status).toBe(404);
      expect(learnedResponse.body).toEqual({ message: "Review item not found" });

      const otherToken = await createOtherUserToken(app);
      const crossUserResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(otherToken))
        .send({ reviewItemIds: [activeItem.id] });

      expect(crossUserResponse.status).toBe(404);
      expect(crossUserResponse.body).toEqual({ message: "Review item not found" });
    });
  });

  describe("GET /api/review-sessions/:id", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app).get(
        `/api/review-sessions/${randomUUID()}`,
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 404 when session does not exist or belongs to another user", async () => {
      const { token, userId } = await authenticate(app);
      const item = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });

      const createResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [item.id] });

      const sessionId = createResponse.body.id as string;
      const otherToken = await createOtherUserToken(app);

      const missingResponse = await request(app)
        .get(`/api/review-sessions/${randomUUID()}`)
        .set(authHeader(token));

      expect(missingResponse.status).toBe(404);
      expect(missingResponse.body).toEqual({
        message: "Review session not found",
      });

      const crossUserResponse = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(otherToken));

      expect(crossUserResponse.status).toBe(404);
      expect(crossUserResponse.body).toEqual({
        message: "Review session not found",
      });
    });
  });

  describe("POST /api/review-sessions/:id/stream", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .post(`/api/review-sessions/${randomUUID()}/stream`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 404 when session does not exist or belongs to another user", async () => {
      const { token, userId } = await authenticate(app);
      const item = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });

      const createResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [item.id] });

      const sessionId = createResponse.body.id as string;
      const otherToken = await createOtherUserToken(app);

      const missingResponse = await streamReviewSessionTurn(
        app,
        token,
        randomUUID(),
      );

      expect(missingResponse.status).toBe(404);
      expect(missingResponse.body).toEqual({
        message: "Review session not found",
      });

      const crossUserResponse = await streamReviewSessionTurn(
        app,
        otherToken,
        sessionId,
      );

      expect(crossUserResponse.status).toBe(404);
      expect(crossUserResponse.body).toEqual({
        message: "Review session not found",
      });
      expect(reviewSessionAiMock.streamQuestion).not.toHaveBeenCalled();
    });

    it("returns 400 when answer is required but omitted", async () => {
      const { token, userId } = await authenticate(app);
      const item = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });

      const createResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [item.id] });

      const sessionId = createResponse.body.id as string;

      const firstStream = await streamReviewSessionTurn(app, token, sessionId);
      expect(firstStream.status).toBe(200);

      const response = await streamReviewSessionTurn(app, token, sessionId);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Answer is required" });
    });

    it("returns 409 when session is pending review or completed", async () => {
      const { token, userId } = await authenticate(app);
      const itemOne = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });
      const itemTwo = await seedReviewItem(userId, {
        topic: "TypeScript",
        description: "Review generics and utility types.",
        priority: ReviewPriority.medium,
      });

      const createResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [itemOne.id, itemTwo.id] });

      const sessionId = createResponse.body.id as string;
      await runStreamThroughEvaluation(app, token, sessionId, 2);

      const pendingReviewResponse = await streamReviewSessionTurn(
        app,
        token,
        sessionId,
        { answer: "Too late" },
      );

      expect(pendingReviewResponse.status).toBe(409);
      expect(pendingReviewResponse.body).toEqual({
        message: "Review session is not accepting answers",
      });

      const report = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(token));

      const sessionItemId = report.body.items[0].id as string;

      await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "accept" })
        .expect(200);

      await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${report.body.items[1].id}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "override", status: "learned" })
        .expect(200);

      const completedResponse = await streamReviewSessionTurn(
        app,
        token,
        sessionId,
        { answer: "After completion" },
      );

      expect(completedResponse.status).toBe(409);
      expect(completedResponse.body).toEqual({
        message: "Review session is not accepting answers",
      });
    });
  });

  describe("POST /api/review-sessions/:id/items/:itemId/confirm", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .post(
          `/api/review-sessions/${randomUUID()}/items/${randomUUID()}/confirm`,
        )
        .send({ action: "accept" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 404 when session or item does not belong to the user", async () => {
      const { token, userId } = await authenticate(app);
      const item = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });

      const createResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [item.id] });

      const sessionId = createResponse.body.id as string;
      await runStreamThroughEvaluation(app, token, sessionId, 1);

      const report = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(token));

      const sessionItemId = report.body.items[0].id as string;
      const otherToken = await createOtherUserToken(app);

      const missingSessionResponse = await request(app)
        .post(
          `/api/review-sessions/${randomUUID()}/items/${sessionItemId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "accept" });

      expect(missingSessionResponse.status).toBe(404);
      expect(missingSessionResponse.body).toEqual({
        message: "Review session not found",
      });

      const crossUserResponse = await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemId}/confirm`,
        )
        .set(authHeader(otherToken))
        .send({ action: "accept" });

      expect(crossUserResponse.status).toBe(404);
      expect(crossUserResponse.body).toEqual({
        message: "Review session not found",
      });
    });

    it("returns 400 when accepting without a suggestion and 409 when confirming twice", async () => {
      const { token, userId } = await authenticate(app);
      const item = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });

      const createResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [item.id] });

      const sessionId = createResponse.body.id as string;
      const beforeEvaluation = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(token));

      const sessionItemId = beforeEvaluation.body.items[0].id as string;

      const acceptWithoutSuggestion = await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "accept" });

      expect(acceptWithoutSuggestion.status).toBe(400);
      expect(acceptWithoutSuggestion.body).toEqual({
        message: "No suggestion to accept",
      });

      await runStreamThroughEvaluation(app, token, sessionId, 1);

      await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "accept" })
        .expect(200);

      const duplicateConfirm = await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "accept" });

      expect(duplicateConfirm.status).toBe(409);
      expect(duplicateConfirm.body).toEqual({
        message: "Review session item already confirmed",
      });
    });
  });

  describe("full review session lifecycle", () => {
    it("streams through all items, exposes suggestions in the report, and applies only confirmed changes to review items", async () => {
      const { token, userId } = await authenticate(app);
      const itemOne = await seedReviewItem(userId, {
        topic: "System Design",
        description: "Practice scalability trade-offs.",
        priority: ReviewPriority.high,
      });
      const itemTwo = await seedReviewItem(userId, {
        topic: "TypeScript",
        description: "Review generics and utility types.",
        priority: ReviewPriority.medium,
      });
      const itemThree = await seedReviewItem(userId, {
        topic: "REST APIs",
        description: "Practice REST semantics.",
        priority: ReviewPriority.low,
      });

      const createResponse = await request(app)
        .post("/api/review-sessions/")
        .set(authHeader(token))
        .send({ reviewItemIds: [itemOne.id, itemTwo.id, itemThree.id] });

      const sessionId = createResponse.body.id as string;

      const beforeEvaluation = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(token));

      expect(beforeEvaluation.status).toBe(200);
      expect(beforeEvaluation.body).toMatchObject({
        status: "in_progress",
      });
      expect(beforeEvaluation.body.items).toHaveLength(3);
      expect(
        beforeEvaluation.body.items.every(
          (item: { suggestedStatus: string | null }) => item.suggestedStatus === null,
        ),
      ).toBe(true);

      await runStreamThroughEvaluation(app, token, sessionId, 3);

      const afterEvaluation = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(token));

      expect(afterEvaluation.status).toBe(200);
      expect(afterEvaluation.body.status).toBe("pending_review");
      expect(afterEvaluation.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reviewItemId: itemOne.id,
            suggestedStatus: "active",
            suggestedPriority: "medium",
            confirmedStatus: null,
          }),
          expect.objectContaining({
            reviewItemId: itemTwo.id,
            suggestedStatus: "learned",
            suggestedPriority: null,
            confirmedStatus: null,
          }),
          expect.objectContaining({
            reviewItemId: itemThree.id,
            suggestedStatus: "active",
            suggestedPriority: "high",
            confirmedStatus: null,
          }),
        ]),
      );

      const reviewItemsBeforeConfirm = await request(app)
        .get("/api/review-items/")
        .query({ status: "all" })
        .set(authHeader(token));

      expect(reviewItemsBeforeConfirm.body.reviewItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            status: "active",
            priority: "high",
          }),
          expect.objectContaining({
            id: itemTwo.id,
            status: "active",
            priority: "medium",
          }),
          expect.objectContaining({
            id: itemThree.id,
            status: "active",
            priority: "low",
          }),
        ]),
      );

      const sessionItemOneId = afterEvaluation.body.items.find(
        (item: { reviewItemId: string }) => item.reviewItemId === itemOne.id,
      ).id as string;
      const sessionItemTwoId = afterEvaluation.body.items.find(
        (item: { reviewItemId: string }) => item.reviewItemId === itemTwo.id,
      ).id as string;
      const sessionItemThreeId = afterEvaluation.body.items.find(
        (item: { reviewItemId: string }) => item.reviewItemId === itemThree.id,
      ).id as string;

      const acceptResponse = await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemOneId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "accept" });

      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body).toMatchObject({
        id: itemOne.id,
        status: "active",
        priority: "medium",
      });

      const overrideActiveResponse = await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemTwoId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "override", status: "active", priority: "low" });

      expect(overrideActiveResponse.status).toBe(200);
      expect(overrideActiveResponse.body).toMatchObject({
        id: itemTwo.id,
        status: "active",
        priority: "low",
      });

      const midSessionReport = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(token));

      expect(midSessionReport.body.status).toBe("pending_review");
      expect(midSessionReport.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: sessionItemOneId,
            confirmedStatus: "active",
            confirmedPriority: "medium",
          }),
          expect.objectContaining({
            id: sessionItemTwoId,
            confirmedStatus: "active",
            confirmedPriority: "low",
          }),
          expect.objectContaining({
            id: sessionItemThreeId,
            confirmedStatus: null,
          }),
        ]),
      );

      const markLearnedResponse = await request(app)
        .post(
          `/api/review-sessions/${sessionId}/items/${sessionItemThreeId}/confirm`,
        )
        .set(authHeader(token))
        .send({ action: "override", status: "learned" });

      expect(markLearnedResponse.status).toBe(200);
      expect(markLearnedResponse.body).toMatchObject({
        id: itemThree.id,
        status: "learned",
        learnedAt: expect.any(String),
      });

      const completedSession = await request(app)
        .get(`/api/review-sessions/${sessionId}`)
        .set(authHeader(token));

      expect(completedSession.body.status).toBe("completed");

      const activeItems = await request(app)
        .get("/api/review-items/")
        .query({ status: "active" })
        .set(authHeader(token));

      expect(activeItems.body.reviewItems).toHaveLength(2);
      expect(activeItems.body.reviewItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            priority: "medium",
            status: "active",
          }),
          expect.objectContaining({
            id: itemTwo.id,
            priority: "low",
            status: "active",
          }),
        ]),
      );

      const learnedItems = await request(app)
        .get("/api/review-items/")
        .query({ status: "learned" })
        .set(authHeader(token));

      expect(learnedItems.body.reviewItems).toHaveLength(1);
      expect(learnedItems.body.reviewItems[0]).toMatchObject({
        id: itemThree.id,
        status: "learned",
        learnedAt: expect.any(String),
      });
    });
  });
});
