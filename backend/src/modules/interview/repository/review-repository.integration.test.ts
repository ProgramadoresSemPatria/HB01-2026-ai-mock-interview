import { afterAll, afterEach, describe, expect, it } from "vitest";
import prisma from "@/infrastructure/database";
import { ReviewPriority } from "../../../../prisma/generated/client";
import { disconnectDatabase, resetDatabase } from "@/test/integration/helpers";
import { ReviewRepository } from "./review-repository";

async function seedSession() {
  const user = await prisma.user.create({
    data: {
      name: "Review Test User",
      email: "review-test@example.com",
      password: "hashed-password",
    },
  });
  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      name: "Test Resume",
      pdfUrl: "https://example.com/resume.pdf",
      storageKey: "resumes/review-test.pdf",
      status: "ready",
    },
  });
  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      level: "entry",
      maxTurns: 5,
    },
  });

  return { user, resume, session };
}

describe("ReviewRepository (integration)", () => {
  const repository = new ReviewRepository();

  afterEach(() => resetDatabase());
  afterAll(() => disconnectDatabase());

  it("upsert creates a review item with normalized topic", async () => {
    const { user, session } = await seedSession();

    const created = await repository.upsert({
      userId: user.id,
      sessionId: session.id,
      topic: "System Design",
      description: "Practice scalability patterns",
      priority: ReviewPriority.high,
    });

    expect(created).toMatchObject({
      userId: user.id,
      sessionId: session.id,
      topic: "system design",
      description: "Practice scalability patterns",
      priority: ReviewPriority.high,
    });
    expect(created.id).toBeTruthy();
  });

  it("upsert updates an existing item for the same user and topic", async () => {
    const { user, session } = await seedSession();
    const otherSession = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        resumeId: session.resumeId,
        level: "senior",
        maxTurns: 8,
      },
    });

    const created = await repository.upsert({
      userId: user.id,
      sessionId: session.id,
      topic: "Algorithms",
      description: "Review sorting",
      priority: ReviewPriority.medium,
    });

    const updated = await repository.upsert({
      userId: user.id,
      sessionId: otherSession.id,
      topic: "ALGORITHMS",
      description: "Review dynamic programming",
      priority: ReviewPriority.high,
    });

    expect(updated.id).toBe(created.id);
    expect(updated).toMatchObject({
      sessionId: otherSession.id,
      topic: "algorithms",
      description: "Review dynamic programming",
      priority: ReviewPriority.high,
    });

    const stored = await prisma.reviewItem.findMany({
      where: { userId: user.id },
    });
    expect(stored).toHaveLength(1);
  });

  it("listByUserId returns review items for the user ordered by updatedAt desc", async () => {
    const { user, session } = await seedSession();
    const otherSession = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        resumeId: session.resumeId,
        level: "mid",
        maxTurns: 7,
      },
    });

    await repository.upsert({
      userId: user.id,
      sessionId: session.id,
      topic: "databases",
      description: "Indexes and query plans",
      priority: ReviewPriority.low,
    });
    await repository.upsert({
      userId: user.id,
      sessionId: otherSession.id,
      topic: "networking",
      description: "TCP and HTTP fundamentals",
      priority: ReviewPriority.high,
    });

    const forSession = await prisma.reviewItem.findMany({
      where: { sessionId: session.id },
      orderBy: { updatedAt: "desc" },
    });
    const listed = await repository.listByUserId(user.id);

    expect(listed).toHaveLength(2);
    expect(listed[0]!.updatedAt.getTime()).toBeGreaterThanOrEqual(
      listed[1]!.updatedAt.getTime(),
    );
    expect(forSession).toHaveLength(1);
    expect(forSession[0]).toMatchObject({
      sessionId: session.id,
      topic: "databases",
    });
    expect(listed.some((item) => item.sessionId === session.id)).toBe(true);
    expect(listed.some((item) => item.sessionId === otherSession.id)).toBe(
      true,
    );
  });

  it("findByUserIdAndTopicCaseInsensitive returns the same row regardless of topic casing", async () => {
    const { user, session } = await seedSession();

    const created = await repository.upsert({
      userId: user.id,
      sessionId: session.id,
      topic: "System Design",
      description: "Practice scalability patterns",
      priority: ReviewPriority.high,
    });

    const found = await repository.findByUserIdAndTopicCaseInsensitive(
      user.id,
      "SYSTEM DESIGN",
    );

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.topic).toBe("system design");
  });

  // ReviewRepository uses TOPIC_SIMILARITY_THRESHOLD = 0.7 (pg_trgm similarity).
  it("findSimilarByUserIdAndTopic returns a row when the search phrase is similar enough", async () => {
    const { user, session } = await seedSession();

    const created = await repository.upsert({
      userId: user.id,
      sessionId: session.id,
      topic: "database indexing",
      description: "B-tree and composite indexes",
      priority: ReviewPriority.medium,
    });

    const found = await repository.findSimilarByUserIdAndTopic(
      user.id,
      "database index",
    );

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.topic).toBe("database indexing");
  });
});
