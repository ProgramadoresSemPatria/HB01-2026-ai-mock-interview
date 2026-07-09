import { afterAll, afterEach, describe, expect, it } from "vitest";
import prisma from "@/infrastructure/database";
import { ReviewRepository } from "@/modules/interview/repository/review-repository";
import { disconnectDatabase, resetDatabase } from "@/test/integration/helpers";
import { ReviewPriority } from "../../../../prisma/generated/client";
import { ReviewSessionRepository } from "./review-session-repository";

async function seedReviewItems() {
  const user = await prisma.user.create({
    data: {
      name: "Review Session Test User",
      email: `review-session-${crypto.randomUUID()}@example.com`,
      password: "hashed-password",
    },
  });
  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      name: "Test Resume",
      pdfUrl: "https://example.com/resume.pdf",
      storageKey: "resumes/review-session-test.pdf",
      status: "ready",
    },
  });
  const interviewSession = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      level: "entry",
      interviewLocale: "en",
      maxTurns: 5,
    },
  });

  const reviewRepository = new ReviewRepository();
  const first = await reviewRepository.upsert({
    userId: user.id,
    sessionId: interviewSession.id,
    topic: "System Design",
    description: "Practice scalability patterns",
    priority: ReviewPriority.high,
  });
  const second = await reviewRepository.upsert({
    userId: user.id,
    sessionId: interviewSession.id,
    topic: "Algorithms",
    description: "Review dynamic programming",
    priority: ReviewPriority.medium,
  });

  return { user, first, second };
}

describe("ReviewSessionRepository (integration)", () => {
  const repository = new ReviewSessionRepository();

  afterEach(() => resetDatabase());
  afterAll(() => disconnectDatabase());

  it("create snapshots topic, description, and currentPriority with order by input index", async () => {
    const { user, first, second } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: second.id,
          topic: second.topic,
          description: second.description,
          currentPriority: second.priority,
        },
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
      ],
      "en",
    );

    expect(created).toMatchObject({
      userId: user.id,
      status: "in_progress",
      interviewLocale: "en",
      evaluatedAt: null,
      completedAt: null,
    });
    expect(created.items).toHaveLength(2);
    expect(created.items[0]).toMatchObject({
      reviewItemId: second.id,
      order: 0,
      topic: "algorithms",
      description: "Review dynamic programming",
      currentPriority: ReviewPriority.medium,
      turns: [],
      pendingQuestion: null,
      suggestedStatus: null,
      suggestedPriority: null,
      confirmedStatus: null,
      confirmedPriority: null,
      confirmedAt: null,
    });
    expect(created.items[1]).toMatchObject({
      reviewItemId: first.id,
      order: 1,
      topic: "system design",
      description: "Practice scalability patterns",
      currentPriority: ReviewPriority.high,
    });
  });

  it("create persists interviewLocale from params", async () => {
    const { user, first } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
      ],
      "pt",
    );

    expect(created.interviewLocale).toBe("pt");

    const found = await repository.findByIdAndUserId(created.id, user.id);
    expect(found?.interviewLocale).toBe("pt");
  });

  it("findByIdAndUserId returns the session with ordered items or null", async () => {
    const { user, first } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
      ],
      "en",
    );

    const found = await repository.findByIdAndUserId(created.id, user.id);
    const notFound = await repository.findByIdAndUserId(
      created.id,
      user.id + 999,
    );

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.items).toHaveLength(1);
    expect(found!.items[0]!.reviewItemId).toBe(first.id);
    expect(notFound).toBeNull();
  });

  it("appendTurn appends to the item turns JSON array", async () => {
    const { user, first } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
      ],
      "en",
    );
    const itemId = created.items[0]!.id;

    await repository.setPendingQuestion(itemId, "What is sharding?");
    await repository.appendTurn(itemId, {
      question: "What is sharding?",
      answer: "Splitting data across nodes",
    });

    const found = await repository.findByIdAndUserId(created.id, user.id);

    expect(found!.items[0]!.turns).toEqual([
      {
        question: "What is sharding?",
        answer: "Splitting data across nodes",
      },
    ]);
    expect(found!.items[0]!.pendingQuestion).toBeNull();
  });

  it("setPendingQuestion sets and clears the pending question", async () => {
    const { user, first } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
      ],
      "en",
    );
    const itemId = created.items[0]!.id;

    await repository.setPendingQuestion(itemId, "Next question?");
    let found = await repository.findByIdAndUserId(created.id, user.id);
    expect(found!.items[0]!.pendingQuestion).toBe("Next question?");

    await repository.setPendingQuestion(itemId, null);
    found = await repository.findByIdAndUserId(created.id, user.id);
    expect(found!.items[0]!.pendingQuestion).toBeNull();
  });

  it("saveSuggestions persists suggested status and priority", async () => {
    const { user, first } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
      ],
      "en",
    );
    const itemId = created.items[0]!.id;

    await repository.saveSuggestions(itemId, {
      status: "active",
      priority: ReviewPriority.low,
    });

    let found = await repository.findByIdAndUserId(created.id, user.id);
    expect(found!.items[0]).toMatchObject({
      suggestedStatus: "active",
      suggestedPriority: ReviewPriority.low,
    });

    await repository.saveSuggestions(itemId, null);
    found = await repository.findByIdAndUserId(created.id, user.id);
    expect(found!.items[0]).toMatchObject({
      suggestedStatus: null,
      suggestedPriority: null,
    });
  });

  it("markPendingReview sets status and overwrites interviewLocale", async () => {
    const { user, first } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
      ],
      "en",
    );
    expect(created.interviewLocale).toBe("en");
    expect(created.status).toBe("in_progress");

    await repository.markPendingReview(created.id, "pt");

    const found = await repository.findByIdAndUserId(created.id, user.id);
    expect(found!.status).toBe("pending_review");
    expect(found!.interviewLocale).toBe("pt");
    expect(found!.evaluatedAt).toBeInstanceOf(Date);
  });

  it("transitions session status from in_progress to pending_review to completed", async () => {
    const { user, first, second } = await seedReviewItems();

    const created = await repository.create(
      user.id,
      [
        {
          reviewItemId: first.id,
          topic: first.topic,
          description: first.description,
          currentPriority: first.priority,
        },
        {
          reviewItemId: second.id,
          topic: second.topic,
          description: second.description,
          currentPriority: second.priority,
        },
      ],
      "en",
    );

    expect(created.status).toBe("in_progress");

    await repository.markPendingReview(created.id, "en");
    let found = await repository.findByIdAndUserId(created.id, user.id);
    expect(found!.status).toBe("pending_review");
    expect(found!.evaluatedAt).toBeInstanceOf(Date);

    await repository.confirmItem(created.items[0]!.id, {
      status: "active",
      priority: ReviewPriority.high,
    });
    const notYetCompleted = await repository.markCompletedIfAllConfirmed(
      created.id,
    );
    found = await repository.findByIdAndUserId(created.id, user.id);

    expect(notYetCompleted).toBe(false);
    expect(found!.status).toBe("pending_review");
    expect(found!.completedAt).toBeNull();

    await repository.confirmItem(created.items[1]!.id, {
      status: "learned",
      priority: null,
    });
    const completed = await repository.markCompletedIfAllConfirmed(created.id);
    found = await repository.findByIdAndUserId(created.id, user.id);

    expect(completed).toBe(true);
    expect(found!.status).toBe("completed");
    expect(found!.completedAt).toBeInstanceOf(Date);
    expect(found!.items[0]).toMatchObject({
      confirmedStatus: "active",
      confirmedPriority: ReviewPriority.high,
      confirmedAt: expect.any(Date),
    });
    expect(found!.items[1]).toMatchObject({
      confirmedStatus: "learned",
      confirmedPriority: null,
      confirmedAt: expect.any(Date),
    });
  });
});
