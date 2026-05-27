import { z } from "zod";

export const interviewLevelSchema = z.enum(["entry", "mid", "senior"]);

export const createSessionSchema = z.object({
  resumeId: z.uuid({ message: "Invalid resume ID" }),
  level: interviewLevelSchema,
});

export const streamMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content is required"),
});

export const reviewPrioritySchema = z.enum(["low", "medium", "high"]);

const reviewItemSchema = z.object({
  topic: z.string().trim().min(1, "Topic is required"),
  description: z.string().trim().min(1, "Description is required"),
  priority: reviewPrioritySchema,
});

export const reviewItemsGeneratorOutputSchema = z.object({
  items: z.array(reviewItemSchema),
});

export type InterviewLevel = z.infer<typeof interviewLevelSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type StreamMessageInput = z.infer<typeof streamMessageSchema>;
export type ReviewPriority = z.infer<typeof reviewPrioritySchema>;
export type ReviewItemsGeneratorOutput = z.infer<
  typeof reviewItemsGeneratorOutputSchema
>;
