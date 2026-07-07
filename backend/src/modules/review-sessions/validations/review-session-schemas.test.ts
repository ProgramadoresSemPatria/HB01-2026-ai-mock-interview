import { describe, expect, it } from "vitest";

import {
  applyReviewSessionSchema,
  createReviewSessionSchema,
  reviewItemStatusSchema,
  reviewSessionEvaluationOutputSchema,
  reviewSessionStatusSchema,
  reviewSessionStreamBodySchema,
} from "./review-session-schemas";

const reviewItemId1 = "550e8400-e29b-41d4-a716-446655440001";

describe("reviewItemStatusSchema", () => {
  it.each(["active", "learned"] as const)("accepts %s", (status) => {
    expect(reviewItemStatusSchema.parse(status)).toBe(status);
  });

  it("rejects unknown status values", () => {
    expect(() => reviewItemStatusSchema.parse("pending")).toThrow();
  });
});

describe("reviewSessionStatusSchema", () => {
  it.each(["in_progress", "pending_review", "completed"] as const)(
    "accepts %s",
    (status) => {
      expect(reviewSessionStatusSchema.parse(status)).toBe(status);
    },
  );

  it("rejects unknown status values", () => {
    expect(() => reviewSessionStatusSchema.parse("cancelled")).toThrow();
  });
});

describe("createReviewSessionSchema", () => {
  it("accepts a single valid review item id", () => {
    const result = createReviewSessionSchema.safeParse({
      reviewItemIds: [reviewItemId1],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviewItemIds).toEqual([reviewItemId1]);
    }
  });

  it("accepts up to 10 unique review item ids", () => {
    const reviewItemIds = Array.from({ length: 10 }, (_, index) =>
      `550e8400-e29b-41d4-a716-4466554400${String(index).padStart(2, "0")}`,
    );

    const result = createReviewSessionSchema.safeParse({ reviewItemIds });

    expect(result.success).toBe(true);
  });

  it("rejects an empty reviewItemIds array", () => {
    const result = createReviewSessionSchema.safeParse({ reviewItemIds: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Select at least one review item",
      );
    }
  });

  it("rejects more than 10 review item ids", () => {
    const reviewItemIds = Array.from({ length: 11 }, (_, index) =>
      `550e8400-e29b-41d4-a716-44665544${String(index).padStart(4, "0")}`,
    );

    const result = createReviewSessionSchema.safeParse({ reviewItemIds });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Select at most 10 review items per session",
      );
    }
  });

  it("rejects duplicate review item ids", () => {
    const result = createReviewSessionSchema.safeParse({
      reviewItemIds: [reviewItemId1, reviewItemId1],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Duplicate item IDs");
    }
  });

  it("rejects invalid uuid values", () => {
    const result = createReviewSessionSchema.safeParse({
      reviewItemIds: ["not-a-uuid"],
    });

    expect(result.success).toBe(false);
  });
});

describe("reviewSessionStreamBodySchema", () => {
  it("accepts an empty body for the first stream call", () => {
    const result = reviewSessionStreamBodySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.answer).toBeUndefined();
    }
  });

  it("accepts a non-empty trimmed answer", () => {
    const result = reviewSessionStreamBodySchema.safeParse({
      answer: "  I would use a hash map for O(1) lookups.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.answer).toBe(
        "I would use a hash map for O(1) lookups.",
      );
    }
  });

  it("rejects empty answer strings", () => {
    const result = reviewSessionStreamBodySchema.safeParse({ answer: "" });

    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only answer strings", () => {
    const result = reviewSessionStreamBodySchema.safeParse({ answer: "   " });

    expect(result.success).toBe(false);
  });

  it("rejects answers longer than 4000 characters", () => {
    const result = reviewSessionStreamBodySchema.safeParse({
      answer: "x".repeat(4_001),
    });

    expect(result.success).toBe(false);
  });
});

const sessionItemId1 = "550e8400-e29b-41d4-a716-446655440010";
const sessionItemId2 = "550e8400-e29b-41d4-a716-446655440011";

describe("applyReviewSessionSchema", () => {
  it("accepts active items with priority and learned items without priority", () => {
    const result = applyReviewSessionSchema.safeParse({
      items: [
        {
          reviewSessionItemId: sessionItemId1,
          status: "active",
          priority: "high",
        },
        {
          reviewSessionItemId: sessionItemId2,
          status: "learned",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects active items without priority", () => {
    const result = applyReviewSessionSchema.safeParse({
      items: [
        {
          reviewSessionItemId: sessionItemId1,
          status: "active",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Priority is required when status is active",
      );
    }
  });

  it("rejects duplicate reviewSessionItemId values", () => {
    const result = applyReviewSessionSchema.safeParse({
      items: [
        {
          reviewSessionItemId: sessionItemId1,
          status: "active",
          priority: "low",
        },
        {
          reviewSessionItemId: sessionItemId1,
          status: "learned",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Duplicate item IDs");
    }
  });

  it("rejects an empty items array", () => {
    const result = applyReviewSessionSchema.safeParse({ items: [] });

    expect(result.success).toBe(false);
  });
});

describe("reviewSessionEvaluationOutputSchema", () => {
  it("accepts learned status without priority", () => {
    expect(
      reviewSessionEvaluationOutputSchema.parse({ status: "learned" }),
    ).toEqual({ status: "learned" });
  });

  it("accepts active status with priority", () => {
    expect(
      reviewSessionEvaluationOutputSchema.parse({
        status: "active",
        priority: "medium",
      }),
    ).toEqual({ status: "active", priority: "medium" });
  });

  it("rejects active status without priority", () => {
    expect(() =>
      reviewSessionEvaluationOutputSchema.parse({ status: "active" }),
    ).toThrow();
  });

  it("rejects invalid priority values", () => {
    expect(() =>
      reviewSessionEvaluationOutputSchema.parse({
        status: "active",
        priority: "urgent",
      }),
    ).toThrow();
  });

  it("rejects unknown status values", () => {
    expect(() =>
      reviewSessionEvaluationOutputSchema.parse({
        status: "pending",
        priority: "low",
      }),
    ).toThrow();
  });
});
