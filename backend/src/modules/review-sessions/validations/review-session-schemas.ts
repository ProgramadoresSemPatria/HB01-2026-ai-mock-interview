import { z } from "zod";

import { reviewPrioritySchema } from "@/modules/interview/validations/interview-schemas";

export const reviewItemStatusSchema = z.enum(["active", "learned"]);

export const reviewSessionStatusSchema = z.enum([
  "in_progress",
  "pending_review",
  "completed",
]);

export const createReviewSessionSchema = z.object({
  reviewItemIds: z
    .array(z.uuid())
    .min(1, "Select at least one review item")
    .max(10, "Select at most 10 review items per session")
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate item IDs"),
});

export const reviewSessionStreamBodySchema = z.object({
  answer: z.string().trim().min(1).max(4_000).optional(),
});

export const confirmReviewSessionItemSchema = z.union([
  z.object({ action: z.literal("accept") }),
  z.discriminatedUnion("status", [
    z.object({
      action: z.literal("override"),
      status: z.literal("active"),
      priority: reviewPrioritySchema,
    }),
    z
      .object({
        action: z.literal("override"),
        status: z.literal("learned"),
      })
      .strict(),
  ]),
]);

export const reviewSessionEvaluationOutputSchema = z.discriminatedUnion(
  "status",
  [
    z.object({ status: z.literal("learned") }),
    z.object({ status: z.literal("active"), priority: reviewPrioritySchema }),
  ],
);

export type ReviewSessionEvaluationOutput = z.infer<
  typeof reviewSessionEvaluationOutputSchema
>;
export type CreateReviewSessionInput = z.infer<
  typeof createReviewSessionSchema
>;
export type ReviewSessionStreamBodyInput = z.infer<
  typeof reviewSessionStreamBodySchema
>;
export type ConfirmReviewSessionItemInput = z.infer<
  typeof confirmReviewSessionItemSchema
>;
