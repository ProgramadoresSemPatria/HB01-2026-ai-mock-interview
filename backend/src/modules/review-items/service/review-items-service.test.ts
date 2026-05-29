import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewRepository } from "@/modules/interview/repository/review-repository";

import { ReviewItemsService } from "./review-items-service";

const baseDate = new Date("2026-01-01T00:00:00.000Z");

function createReviewItem(
  overrides: Partial<{
    id: string;
    topic: string;
    priority: "low" | "medium" | "high";
    updatedAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? "review-id",
    userId: 1,
    sessionId: "session-id",
    topic: overrides.topic ?? "topic",
    description: "description",
    priority: overrides.priority ?? "medium",
    createdAt: baseDate,
    updatedAt: overrides.updatedAt ?? baseDate,
  };
}

describe("ReviewItemsService", () => {
  let reviewRepository: ReviewRepository;
  let service: ReviewItemsService;

  beforeEach(() => {
    reviewRepository = {
      listByUserId: vi.fn(),
    } as unknown as ReviewRepository;
    service = new ReviewItemsService(reviewRepository);
  });

  it("returns items sorted by priority desc then updatedAt desc", async () => {
    vi.mocked(reviewRepository.listByUserId).mockResolvedValue([
      createReviewItem({
        id: "low-old",
        topic: "low topic",
        priority: "low",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      createReviewItem({
        id: "high-new",
        topic: "high topic",
        priority: "high",
        updatedAt: new Date("2026-01-03T00:00:00.000Z"),
      }),
      createReviewItem({
        id: "medium-mid",
        topic: "medium topic",
        priority: "medium",
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
      createReviewItem({
        id: "high-old",
        topic: "high older",
        priority: "high",
        updatedAt: new Date("2026-01-01T12:00:00.000Z"),
      }),
    ]);

    const result = await service.listForUser(1);

    expect(reviewRepository.listByUserId).toHaveBeenCalledWith(1);
    expect(result.map((item) => item.id)).toEqual([
      "high-new",
      "high-old",
      "medium-mid",
      "low-old",
    ]);
    expect(result[0]).toMatchObject({
      priority: "high",
      createdAt: baseDate.toISOString(),
      updatedAt: "2026-01-03T00:00:00.000Z",
    });
  });

  it("returns empty array when user has no review items", async () => {
    vi.mocked(reviewRepository.listByUserId).mockResolvedValue([]);

    const result = await service.listForUser(42);

    expect(result).toEqual([]);
  });
});
