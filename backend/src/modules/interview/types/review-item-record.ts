import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";

export type ReviewItemRecord = {
  id: string;
  userId: number;
  sessionId: string;
  topic: string;
  description: string;
  priority: ReviewPriority;
  createdAt: Date;
  updatedAt: Date;
};
