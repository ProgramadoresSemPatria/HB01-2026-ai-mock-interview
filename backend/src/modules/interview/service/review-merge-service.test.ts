import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewRepository } from "@/modules/interview/repository/review-repository";
import type { ReviewItemRecord } from "@/modules/interview/types/review-item-record";

import { ReviewMergeService } from "./review-merge-service";

function existingItem(
  overrides: Partial<ReviewItemRecord> = {},
): ReviewItemRecord {
  return {
    id: "item-1",
    userId: 1,
    sessionId: "old-session",
    topic: "communication",
    description: "Old",
    priority: "low",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("ReviewMergeService", () => {
  let reviewRepository: ReviewRepository;
  let service: ReviewMergeService;

  beforeEach(() => {
    reviewRepository = {
      findByUserIdAndTopicCaseInsensitive: vi.fn(),
      findSimilarByUserIdAndTopic: vi.fn(),
      upsert: vi.fn(),
    } as unknown as ReviewRepository;

    service = new ReviewMergeService(reviewRepository);
  });

  it("inserts a new review item when topic does not exist", async () => {
    vi.mocked(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).mockResolvedValue(null);
    vi.mocked(reviewRepository.findSimilarByUserIdAndTopic).mockResolvedValue(
      null,
    );

    await service.upsertItems(1, "session-1", [
      {
        topic: "Communication",
        description: "Be concise",
        priority: "medium",
      },
    ]);

    expect(reviewRepository.upsert).toHaveBeenCalledWith({
      userId: 1,
      sessionId: "session-1",
      topic: "Communication",
      description: "Be concise",
      priority: "medium",
    });
  });

  it("uses max priority when LLM raises priority", async () => {
    vi.mocked(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).mockResolvedValue(existingItem({ topic: "communication", priority: "low" }));

    await service.upsertItems(1, "session-1", [
      {
        topic: "Communication",
        description: "Be concise",
        priority: "high",
      },
    ]);

    expect(reviewRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "high",
        description: "Be concise",
      }),
    );
  });

  it("bumps priority when LLM keeps same priority for existing topic", async () => {
    vi.mocked(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).mockResolvedValue(existingItem({ topic: "communication", priority: "medium" }));

    await service.upsertItems(1, "session-1", [
      {
        topic: "Communication",
        description: "Updated",
        priority: "medium",
      },
    ]);

    expect(reviewRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "high",
      }),
    );
  });

  it("matches existing topics case-insensitively", async () => {
    vi.mocked(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).mockResolvedValue(existingItem({ topic: "system design", priority: "low" }));

    await service.upsertItems(1, "session-1", [
      {
        topic: "System Design",
        description: "Updated",
        priority: "medium",
      },
    ]);

    expect(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).toHaveBeenCalledWith(1, "System Design");
    expect(reviewRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "System Design",
        priority: "medium",
      }),
    );
  });

  it("never decreases priority when LLM sends a lower priority", async () => {
    vi.mocked(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).mockResolvedValue(existingItem({ topic: "communication", priority: "high" }));

    await service.upsertItems(1, "session-1", [
      {
        topic: "Communication",
        description: "Updated",
        priority: "low",
      },
    ]);

    expect(reviewRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "high",
      }),
    );
  });

  it("falls back to similarity lookup when exact normalized topic is missing", async () => {
    vi.mocked(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).mockResolvedValue(null);
    vi.mocked(reviewRepository.findSimilarByUserIdAndTopic).mockResolvedValue(
      existingItem({ topic: "distributed systems", priority: "medium" }),
    );

    await service.upsertItems(1, "session-1", [
      {
        topic: "Distributed System Design",
        description: "Clarify trade-offs",
        priority: "high",
      },
    ]);

    expect(reviewRepository.findSimilarByUserIdAndTopic).toHaveBeenCalledWith(
      1,
      "Distributed System Design",
    );
    expect(reviewRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "high",
      }),
    );
  });
});
