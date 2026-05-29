import { reviewPrioritySchema } from "@/modules/interview/validations/interview-schemas";
import { z } from "zod";

export const reviewItemResponseSchema = z.object({
  id: z.uuid(),
  sessionId: z.uuid(),
  topic: z.string(),
  description: z.string(),
  priority: reviewPrioritySchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const listReviewItemsResponseSchema = z.object({
  reviewItems: z.array(reviewItemResponseSchema),
});

export type ReviewItemResponse = z.infer<typeof reviewItemResponseSchema>;
export type ListReviewItemsResponse = z.infer<
  typeof listReviewItemsResponseSchema
>;
