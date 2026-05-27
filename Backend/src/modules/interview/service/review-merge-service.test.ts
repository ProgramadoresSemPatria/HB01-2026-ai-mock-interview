import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewRepository } from "@/modules/interview/repository/review-repository";

import { ReviewMergeService } from "./review-merge-service";

describe("ReviewMergeService", () => {
  let reviewRepository: ReviewRepository;
  let service: ReviewMergeService;

  beforeEach(() => {
    reviewRepository = {
      findByUserIdAndTopicCaseInsensitive: vi.fn(),
      upsert: vi.fn(),
    } as unknown as ReviewRepository;

    service = new ReviewMergeService(reviewRepository);
  });

  it("inserts a new review item when topic does not exist", async () => {
    vi.mocked(
      reviewRepository.findByUserIdAndTopicCaseInsensitive,
    ).mockResolvedValue(null);

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
    ).mockResolvedValue({
      id: "item-1",
      userId: 1,
      sessionId: "old-session",
      topic: "communication",
      description: "Old",
      priority: "low",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
    ).mockResolvedValue({
      id: "item-1",
      userId: 1,
      sessionId: "old-session",
      topic: "communication",
      description: "Old",
      priority: "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
    ).mockResolvedValue({
      id: "item-1",
      userId: 1,
      sessionId: "old-session",
      topic: "system design",
      description: "Old",
      priority: "low",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
    ).mockResolvedValue({
      id: "item-1",
      userId: 1,
      sessionId: "old-session",
      topic: "communication",
      description: "Old",
      priority: "high",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
});
