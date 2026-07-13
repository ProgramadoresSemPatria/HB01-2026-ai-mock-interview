import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WeakAnswerRepository } from "@/modules/interview/repository/weak-answer-repository";
import type { WeakAnswerItem } from "@/modules/interview/validations/interview-schemas";

import { WeakAnswerService } from "./weak-answer-service";

function weakItem(overrides: Partial<WeakAnswerItem> = {}): WeakAnswerItem {
  return {
    question: "How would you scale a read-heavy API?",
    userAnswer: "I'd just add more servers.",
    evaluation: "insufficient",
    feedback: "Mention caching, read replicas, and CDN strategies.",
    topic: "System design",
    priority: "high",
    ...overrides,
  };
}

describe("WeakAnswerService", () => {
  let weakAnswerRepository: WeakAnswerRepository;
  let service: WeakAnswerService;

  beforeEach(() => {
    weakAnswerRepository = {
      createMany: vi.fn(),
    } as unknown as WeakAnswerRepository;

    service = new WeakAnswerService(weakAnswerRepository);
  });

  it("persists items evaluated as incorrect, incomplete, or insufficient", async () => {
    const items = [
      weakItem({ evaluation: "incorrect", topic: "Algorithms" }),
      weakItem({ evaluation: "incomplete", topic: "Databases" }),
      weakItem({ evaluation: "insufficient", topic: "System design" }),
    ];

    await service.saveWeakAnswers(1, "session-1", items);

    expect(weakAnswerRepository.createMany).toHaveBeenCalledWith([
      { userId: 1, sessionId: "session-1", ...items[0] },
      { userId: 1, sessionId: "session-1", ...items[1] },
      { userId: 1, sessionId: "session-1", ...items[2] },
    ]);
  });

  it("filters out items evaluated as satisfactory before persisting", async () => {
    const items = [
      weakItem({ evaluation: "satisfactory", topic: "Communication" }),
      weakItem({ evaluation: "incorrect", topic: "Algorithms" }),
    ];

    await service.saveWeakAnswers(1, "session-1", items);

    expect(weakAnswerRepository.createMany).toHaveBeenCalledWith([
      { userId: 1, sessionId: "session-1", ...items[1] },
    ]);
  });

  it("does not call the repository when every item is satisfactory", async () => {
    await service.saveWeakAnswers(1, "session-1", [
      weakItem({ evaluation: "satisfactory" }),
    ]);

    expect(weakAnswerRepository.createMany).not.toHaveBeenCalled();
  });

  it("does not call the repository when there are no items", async () => {
    await service.saveWeakAnswers(1, "session-1", []);

    expect(weakAnswerRepository.createMany).not.toHaveBeenCalled();
  });
});
