import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  reviewItem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock("@/infrastructure/database", () => ({
  default: mockPrisma,
}));

import { ReviewRepository } from "./review-repository";

const sampleReview = {
  id: "review-id",
  userId: 1,
  sessionId: "session-id",
  topic: "system design",
  description: "Practice scalability patterns",
  priority: "high" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("ReviewRepository", () => {
  const repository = new ReviewRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listByUserId returns reviews for the user ordered by updatedAt desc", async () => {
    const reviews = [sampleReview];
    mockPrisma.reviewItem.findMany.mockResolvedValue(reviews);

    const result = await repository.listByUserId(sampleReview.userId);

    expect(mockPrisma.reviewItem.findMany).toHaveBeenCalledWith({
      where: { userId: sampleReview.userId },
      orderBy: { updatedAt: "desc" },
    });
    expect(result).toEqual(reviews);
  });

  it("findByUserIdAndTopicCaseInsensitive normalizes topic to lowercase", async () => {
    mockPrisma.reviewItem.findFirst.mockResolvedValue(sampleReview);

    const result = await repository.findByUserIdAndTopicCaseInsensitive(
      sampleReview.userId,
      "System Design",
    );

    expect(mockPrisma.reviewItem.findFirst).toHaveBeenCalledWith({
      where: {
        userId: sampleReview.userId,
        topic: "system design",
      },
    });
    expect(result).toEqual(sampleReview);
  });

  it("upsert creates or updates with normalized topic", async () => {
    const params = {
      userId: sampleReview.userId,
      sessionId: sampleReview.sessionId,
      topic: "System Design",
      description: sampleReview.description,
      priority: sampleReview.priority,
    };
    mockPrisma.reviewItem.upsert.mockResolvedValue(sampleReview);

    const result = await repository.upsert(params);

    expect(mockPrisma.reviewItem.upsert).toHaveBeenCalledWith({
      where: {
        userId_topic: {
          userId: params.userId,
          topic: "system design",
        },
      },
      create: {
        userId: params.userId,
        sessionId: params.sessionId,
        topic: "system design",
        description: params.description,
        priority: params.priority,
      },
      update: {
        sessionId: params.sessionId,
        description: params.description,
        priority: params.priority,
      },
    });
    expect(result).toEqual(sampleReview);
  });
});
