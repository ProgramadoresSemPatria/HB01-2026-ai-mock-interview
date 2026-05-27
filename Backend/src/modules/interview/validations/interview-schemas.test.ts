import { describe, expect, it } from "vitest";

import {
  createSessionSchema,
  reviewItemsGeneratorOutputSchema,
  streamMessageSchema,
} from "./interview-schemas";

const validResumeId = "550e8400-e29b-41d4-a716-446655440000";

describe("createSessionSchema", () => {
  it("accepts a valid resumeId and level", () => {
    const result = createSessionSchema.safeParse({
      resumeId: validResumeId,
      level: "mid",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ resumeId: validResumeId, level: "mid" });
    }
  });

  it.each(["entry", "mid", "senior"] as const)(
    "accepts level %s",
    (level) => {
      const result = createSessionSchema.safeParse({
        resumeId: validResumeId,
        level,
      });

      expect(result.success).toBe(true);
    },
  );

  it("rejects invalid resumeId", () => {
    const result = createSessionSchema.safeParse({
      resumeId: "not-a-uuid",
      level: "entry",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid level", () => {
    const result = createSessionSchema.safeParse({
      resumeId: validResumeId,
      level: "staff",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(createSessionSchema.safeParse({ resumeId: validResumeId }).success).toBe(
      false,
    );
    expect(createSessionSchema.safeParse({ level: "entry" }).success).toBe(false);
  });
});

describe("streamMessageSchema", () => {
  it("accepts non-empty content", () => {
    const result = streamMessageSchema.safeParse({
      content: "I would use a hash map for O(1) lookups.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe(
        "I would use a hash map for O(1) lookups.",
      );
    }
  });

  it("trims surrounding whitespace from content", () => {
    const result = streamMessageSchema.safeParse({
      content: "  Hello interviewer  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("Hello interviewer");
    }
  });

  it("rejects empty content", () => {
    const result = streamMessageSchema.safeParse({ content: "" });

    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only content", () => {
    const result = streamMessageSchema.safeParse({ content: "   " });

    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = streamMessageSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("reviewItemsGeneratorOutputSchema", () => {
  const validOutput = {
    items: [
      {
        topic: "System design trade-offs",
        description: "Candidate struggled to compare caching strategies.",
        priority: "high" as const,
      },
      {
        topic: "Concurrency",
        description: "Needs practice explaining race conditions.",
        priority: "medium" as const,
      },
    ],
  };

  it("accepts a valid items array", () => {
    const result = reviewItemsGeneratorOutputSchema.safeParse(validOutput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validOutput);
    }
  });

  it("accepts an empty items array", () => {
    const result = reviewItemsGeneratorOutputSchema.safeParse({ items: [] });

    expect(result.success).toBe(true);
  });

  it("rejects invalid priority", () => {
    const result = reviewItemsGeneratorOutputSchema.safeParse({
      items: [
        {
          topic: "Testing",
          description: "Improve unit test coverage.",
          priority: "critical",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects item with empty topic", () => {
    const result = reviewItemsGeneratorOutputSchema.safeParse({
      items: [
        {
          topic: "  ",
          description: "Needs improvement.",
          priority: "low",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing items field", () => {
    const result = reviewItemsGeneratorOutputSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
