import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WeakAnswerRepository } from "@/modules/interview/repository/weak-answer-repository";
import type { WeakAnswerRecord } from "@/modules/interview/types/weak-answer-record";
import { NotFoundError } from "@/shared";

import { WeakAnswersService } from "./weak-answers-service";

const baseDate = new Date("2026-01-01T00:00:00.000Z");

function createWeakAnswer(
  overrides: Partial<
    Pick<WeakAnswerRecord, "id" | "topic" | "priority" | "createdAt">
  > = {},
): WeakAnswerRecord {
  return {
    id: overrides.id ?? "weak-answer-id",
    userId: 1,
    sessionId: "session-id",
    question: "How would you scale a read-heavy API?",
    userAnswer: "I'd just add more servers.",
    evaluation: "insufficient",
    feedback: "Mention caching, read replicas, and CDN strategies.",
    topic: overrides.topic ?? "topic",
    priority: overrides.priority ?? "medium",
    createdAt: overrides.createdAt ?? baseDate,
  };
}

describe("WeakAnswersService", () => {
  let weakAnswerRepository: WeakAnswerRepository;
  let service: WeakAnswersService;

  beforeEach(() => {
    weakAnswerRepository = {
      listByUserId: vi.fn(),
      deleteByIdAndUserId: vi.fn(),
    } as unknown as WeakAnswerRepository;
    service = new WeakAnswersService(weakAnswerRepository);
  });

  it("returns items sorted by priority desc then createdAt desc", async () => {
    vi.mocked(weakAnswerRepository.listByUserId).mockResolvedValue([
      createWeakAnswer({
        id: "low-old",
        topic: "low topic",
        priority: "low",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      createWeakAnswer({
        id: "high-new",
        topic: "high topic",
        priority: "high",
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      }),
      createWeakAnswer({
        id: "medium-mid",
        topic: "medium topic",
        priority: "medium",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
      createWeakAnswer({
        id: "high-old",
        topic: "high older",
        priority: "high",
        createdAt: new Date("2026-01-01T12:00:00.000Z"),
      }),
    ]);

    const result = await service.listForUser(1);

    expect(weakAnswerRepository.listByUserId).toHaveBeenCalledWith(1);
    expect(result.map((item) => item.id)).toEqual([
      "high-new",
      "high-old",
      "medium-mid",
      "low-old",
    ]);
    expect(result[0]).toMatchObject({
      priority: "high",
      createdAt: "2026-01-03T00:00:00.000Z",
    });
  });

  it("returns empty array when user has no weak answers", async () => {
    vi.mocked(weakAnswerRepository.listByUserId).mockResolvedValue([]);

    const result = await service.listForUser(42);

    expect(result).toEqual([]);
  });

  describe("deleteForUser", () => {
    it("deletes the weak answer when it belongs to the user", async () => {
      vi.mocked(weakAnswerRepository.deleteByIdAndUserId).mockResolvedValue(
        true,
      );

      await service.deleteForUser(1, "weak-answer-id");

      expect(weakAnswerRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
        "weak-answer-id",
        1,
      );
    });

    it("throws NotFoundError when the weak answer is missing or not owned", async () => {
      vi.mocked(weakAnswerRepository.deleteByIdAndUserId).mockResolvedValue(
        false,
      );

      await expect(
        service.deleteForUser(1, "missing-id"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
