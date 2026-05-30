import { beforeEach, describe, expect, it, vi } from "vitest";

import type { createReviewItemsGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/review-items-generator-node";
import { ReviewItemsGeneratorAdapter } from "@/infrastructure/ai/langgraph/review-items-generator-adapter";
import type { ReviewRepository } from "@/modules/interview/repository/review-repository";
import type { ReviewItemRecord } from "@/modules/interview/types/review-item-record";
import type { ReviewItemsGeneratorParams } from "@/modules/interview/protocols/review-items-generator";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

const structuredSummary: StructuredSummary = {
  personal_info: { name: "Jane", title: "Engineer", about: "" },
  skills: ["TypeScript"],
  experiences: [],
  projects: [],
  certifications: [],
};

const baseParams: ReviewItemsGeneratorParams = {
  userId: 42,
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  transcript: "Q: Tell me about yourself.\nA: I build APIs.",
  structuredSummary,
};

describe("ReviewItemsGeneratorAdapter", () => {
  let reviewRepository: ReviewRepository;
  let generateItems: ReturnType<typeof createReviewItemsGeneratorNode>;
  let adapter: ReviewItemsGeneratorAdapter;

  beforeEach(() => {
    reviewRepository = {
      listByUserId: vi.fn(),
    } as unknown as ReviewRepository;

    generateItems = vi.fn();

    adapter = new ReviewItemsGeneratorAdapter(generateItems, reviewRepository);
  });

  it("loads existing items and passes them to the generator", async () => {
    vi.mocked(reviewRepository.listByUserId).mockResolvedValue([
      {
        id: "item-1",
        userId: 42,
        sessionId: "old-session",
        topic: "Communication",
        description: "Be concise",
        priority: "medium",
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies ReviewItemRecord,
    ]);

    const generated = {
      items: [
        {
          topic: "System design",
          description: "Practice trade-offs",
          priority: "high" as const,
        },
      ],
    };
    vi.mocked(generateItems).mockResolvedValue(generated);

    const result = await adapter.generate(baseParams);

    expect(reviewRepository.listByUserId).toHaveBeenCalledWith(42);
    expect(generateItems).toHaveBeenCalledWith({
      transcript: baseParams.transcript,
      structuredSummary: baseParams.structuredSummary,
      existingItems: [
        {
          topic: "Communication",
          description: "Be concise",
          priority: "medium",
        },
      ],
    });
    expect(result).toEqual(generated);
  });

  it("passes an empty existingItems list when the user has no review items", async () => {
    vi.mocked(reviewRepository.listByUserId).mockResolvedValue([]);

    const generated = { items: [] };
    vi.mocked(generateItems).mockResolvedValue(generated);

    const result = await adapter.generate(baseParams);

    expect(reviewRepository.listByUserId).toHaveBeenCalledWith(42);
    expect(generateItems).toHaveBeenCalledWith({
      transcript: baseParams.transcript,
      structuredSummary: baseParams.structuredSummary,
      existingItems: [],
    });
    expect(result).toEqual(generated);
  });
});
